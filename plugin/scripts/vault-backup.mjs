#!/usr/bin/env node
/**
 * Claudia — the rotating vault archive pass.
 *
 * Takes a compressed snapshot of ~/.claudia/ into ~/.claudia-backups/, then prunes
 * the set down to the tiered ladder in `src/backup.mjs`. Runs at SessionEnd (after
 * `save-session` and `build-dashboard`, so it captures the distilled state) and on a
 * launchd interval (`scripts/install-backup-timer.sh`), which is what covers the
 * hours Claude Code was never open and the edits the person made by hand.
 *
 * Local only, like everything else the plugin writes: this compresses files into a
 * sibling directory on the person's own machine and uploads nothing (ADR-0004).
 *
 * The archives live *beside* the vault rather than inside it, which keeps them out of
 * `/export`'s copy, out of `/migrate`'s rewrite, and out of their own next snapshot.
 *
 * Deletion outranks backup. `/forget` calls `--purge` before it deletes, so the
 * archive set can never quietly hold what the person asked to destroy.
 *
 * Usage:
 *   node scripts/vault-backup.mjs [vaultDir] [--dest <dir>] [--quiet] [--detach] [--dry-run]
 *   node scripts/vault-backup.mjs --list
 *   node scripts/vault-backup.mjs --verify
 *   node scripts/vault-backup.mjs --restore <stamp|latest> [--to <dir>]
 *   node scripts/vault-backup.mjs --purge --yes
 *
 * Opt-out: `{ "backups": false }` in ~/.claudia/config.json (ADR-0028) — no new
 * snapshot is taken. Existing archives stay readable and purgeable; refusing to make
 * more copies is not the same as destroying the ones already made, and only the
 * person decides the second one (that is `/forget`'s job, with its confirmation).
 *
 * Benign layer: under `--quiet` it FAILS SILENT and always exits 0, so a broken
 * backup can never take a session down with it. Run by hand, it is loud and its exit
 * code means something. `--detach` goes further and hands the work to a background
 * child, so the hook returns in the time it takes to fork rather than waiting on the
 * archive — the two triggers are kept from colliding by a lock on the archive
 * directory, not by luck.
 */
import { promises as fs, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseConfig } from "../src/config.mjs";
import {
  ARCHIVE_SUFFIX,
  MANIFEST_SUFFIX,
  PIN_SUFFIX,
  RETENTION,
  archiveName,
  checkVault,
  humanBytes,
  isIgnored,
  manifestText,
  parseArchiveName,
  parseManifest,
  selectRetention,
  digestOfText,
} from "../src/backup.mjs";

/** The default archive directory: a sibling of the vault, not a child of it. */
const DEFAULT_DEST = path.join(os.homedir(), ".claudia-backups");

/** Paths `tar` must not pull in — the same noise the digest ignores. */
const TAR_EXCLUDES = [".DS_Store", "._*", ".git"];

/**
 * `tar` on macOS lives at a fixed path; launchd hands a job a minimal PATH, so
 * resolve it rather than trusting the environment.
 */
const TAR = ["/usr/bin/tar", "/bin/tar"].find((p) => existsSync(p)) ?? "tar";

/**
 * Recursively list the vault's real files with their size and content hash.
 * Directories are descended, everything that is not a regular file (symlink, socket)
 * is skipped, and an unreadable directory yields nothing rather than throwing.
 *
 * @param {string} dir
 * @param {string} [base]
 * @returns {Promise<import("../src/backup.mjs").ManifestEntry[]>}
 */
async function scan(dir, base = dir) {
  /** @type {import("../src/backup.mjs").ManifestEntry[]} */
  const out = [];
  /** @type {import("node:fs").Dirent[]} */
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(base, abs).split(path.sep).join("/");
    if (isIgnored(rel)) continue;
    if (e.isDirectory()) out.push(...(await scan(abs, base)));
    else if (e.isFile()) {
      const buf = await fs.readFile(abs);
      out.push({ rel, size: buf.byteLength, sha256: createHash("sha256").update(buf).digest("hex") });
    }
  }
  return out;
}

/**
 * Every archive in `dest`, newest first, with its pin state. Files that are not ours
 * are ignored — the prune pass must never reach outside the naming scheme.
 *
 * @param {string} dest
 * @returns {Promise<import("../src/backup.mjs").ArchiveRef[]>}
 */
async function listArchives(dest) {
  /** @type {string[]} */
  let names = [];
  try {
    names = await fs.readdir(dest);
  } catch {
    return [];
  }
  const present = new Set(names);
  return names
    .map((n) => parseArchiveName(n))
    .filter(/** @returns {a is import("../src/backup.mjs").ArchiveRef} */ (a) => a !== null)
    .map((a) => ({ ...a, pinned: present.has(a.name + PIN_SUFFIX) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * The manifest of an archive, if it is readable.
 *
 * @param {string} dest
 * @param {string} name
 * @returns {Promise<import("../src/backup.mjs").VaultSnapshot | null>}
 */
async function readManifest(dest, name) {
  const text = await fs.readFile(path.join(dest, name + MANIFEST_SUFFIX), "utf8").catch(() => null);
  return parseManifest(text);
}

/**
 * Append one line to the archive directory's log, keeping only the last 500 so a
 * job running every hour cannot grow a file forever. Never throws: the log is a
 * courtesy, not part of the guarantee.
 *
 * @param {string} dest
 * @param {string} line
 * @returns {Promise<void>}
 */
async function logLine(dest, line) {
  const file = path.join(dest, "log.txt");
  try {
    // A refusal is logged before the archive directory would otherwise be created —
    // and "it refused, here is why" is exactly the line worth having.
    await fs.mkdir(dest, { recursive: true, mode: 0o700 });
    const now = new Date();
    const stamped = `${now.toISOString()}  ${line}`;
    const existing = (await fs.readFile(file, "utf8").catch(() => "")).split("\n").filter(Boolean);
    existing.push(stamped);
    await fs.writeFile(file, existing.slice(-500).join("\n") + "\n", { mode: 0o600 });
  } catch {
    /* a log that cannot be written is not worth failing a backup over */
  }
}

/**
 * Run `tar`, returning its result. Split out so the tests can see exactly what is
 * invoked, and so a missing `tar` is one error message rather than a stack trace.
 *
 * @param {string[]} args
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function tar(args) {
  const r = spawnSync(TAR, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) return { status: 1, stdout: "", stderr: r.error.message };
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/**
 * Read an archive back and count the regular files in it. An archive that cannot be
 * listed, or that holds fewer files than its manifest claims, is not a backup —
 * catching that here is the whole point of verifying before the rename.
 *
 * @param {string} archivePath
 * @returns {{ ok: boolean, files: number, why: string | null }}
 */
function inspectArchive(archivePath) {
  const r = tar(["-tzf", archivePath]);
  if (r.status !== 0) return { ok: false, files: 0, why: r.stderr.trim() || "tar could not read the archive" };
  const files = r.stdout.split("\n").filter((l) => l && !l.endsWith("/")).length;
  return { ok: true, files, why: null };
}

/**
 * How long a lock may be held before it is assumed abandoned. Generous: a snapshot
 * takes well under a second on a vault this size, so anything near this is a crash,
 * not slowness.
 */
const LOCK_STALE_MS = 10 * 60_000;

/**
 * Whether a process id is still running. `EPERM` counts as alive — the process
 * exists, it simply belongs to someone else.
 *
 * @param {number} pid
 * @returns {boolean}
 */
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return /** @type {NodeJS.ErrnoException} */ (err).code === "EPERM";
  }
}

/**
 * Take the archive directory's lock, or report that someone else holds it.
 *
 * Two triggers write here — the SessionEnd hook and the hourly launchd job — and
 * nothing stops them firing in the same second. Two Claude Code windows closing
 * together, or `/backup` run by hand while a detached child still works, collide the
 * same way. Without this they would compute the *same* temp path (stamps have second
 * resolution), interleave their writes, and rename the result into place as though it
 * were a good archive. Detaching the hook makes the overlap more likely, not less,
 * which is why the two land together.
 *
 * `wx` is the whole mechanism: create-if-absent is atomic at the filesystem level, so
 * exactly one racer wins even if both check at the same instant.
 *
 * @param {string} dest
 * @returns {Promise<(() => Promise<void>) | null>} a release function, or null if held
 */
async function acquireLock(dest) {
  const lockPath = path.join(dest, ".lock");
  await fs.mkdir(dest, { recursive: true, mode: 0o700 });
  const mine = JSON.stringify({ pid: process.pid, started: Date.now() });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await fs.writeFile(lockPath, mine, { flag: "wx", mode: 0o600 });
      return async () => {
        await fs.rm(lockPath, { force: true });
      };
    } catch (err) {
      if (/** @type {NodeJS.ErrnoException} */ (err).code !== "EEXIST") throw err;
      // Someone holds it — or died holding it. A lock left by a killed process must
      // not disable backups forever, so an unparseable or expired one is broken.
      const raw = await fs.readFile(lockPath, "utf8").catch(() => null);
      /** @type {{ pid?: number, started?: number } | null} */
      let held = null;
      try {
        held = raw ? JSON.parse(raw) : null;
      } catch {
        held = null;
      }
      const fresh =
        held &&
        typeof held.started === "number" &&
        Date.now() - held.started < LOCK_STALE_MS &&
        typeof held.pid === "number" &&
        isAlive(held.pid);
      if (fresh) return null;
      await fs.rm(lockPath, { force: true });
    }
  }
  return null;
}

/* ------------------------------------------------------------------ modes */

/**
 * The snapshot entry point: refuse politely, then run the pass under the lock.
 *
 * @param {{ root: string, dest: string, quiet: boolean, dry: boolean }} opts
 * @returns {Promise<number>} exit code
 */
async function snapshot({ root, dest, quiet, dry }) {
  /** @param {string} msg */
  const say = (msg) => {
    if (!quiet) console.log(msg);
  };

  const cfg = parseConfig(await fs.readFile(path.join(root, "config.json"), "utf8").catch(() => null));
  if (!cfg.backups) {
    say('Backups are off in config.json ({ "backups": false }) — nothing archived.');
    return 0;
  }

  if (!existsSync(root)) {
    if (!quiet) console.error(`No vault at ${root} — nothing to archive.`);
    return quiet ? 0 : 1;
  }

  // A dry run only reads and reports, so it takes no lock — holding one would make a
  // real run give up for nothing.
  if (dry) return archivePass({ root, dest, quiet, dry, say });

  const release = await acquireLock(dest);
  if (!release) {
    say("Another backup is already running — nothing to do.");
    return 0;
  }
  try {
    return await archivePass({ root, dest, quiet, dry, say });
  } finally {
    await release();
  }
}

/**
 * Scan, gate, skip-if-unchanged, archive, verify, prune. Runs with the archive
 * directory's lock held, so no other trigger can be writing here at the same time.
 *
 * @param {{ root: string, dest: string, quiet: boolean, dry: boolean, say: (msg: string) => void }} opts
 * @returns {Promise<number>} exit code
 */
async function archivePass({ root, dest, quiet, dry, say }) {
  const entries = await scan(root);
  const text = manifestText(entries);
  const digest = digestOfText(text);
  /** @type {import("../src/backup.mjs").VaultSnapshot} */
  const current = {
    digest,
    files: entries.length,
    bytes: entries.reduce((n, e) => n + e.size, 0),
    rels: entries.map((e) => e.rel),
  };

  const existing = await listArchives(dest);
  const newest = existing[0];
  const previous = newest ? await readManifest(dest, newest.name) : null;

  const { fatal, warnings } = checkVault(current, previous);
  if (fatal) {
    await logLine(dest, `REFUSED: ${fatal}`);
    if (!quiet) console.error(`Refusing to archive: ${fatal}`);
    return quiet ? 0 : 1;
  }
  for (const w of warnings) {
    await logLine(dest, `WARNING: ${w}`);
    if (!quiet) console.error(`Warning: ${w}`);
  }

  // Unchanged since the last archive: taking another would spend a rung of the
  // ladder on a duplicate, pushing real history out that much sooner.
  if (previous && previous.digest === digest) {
    await fs.writeFile(path.join(dest, "last-run"), new Date().toISOString() + "\n", { mode: 0o600 }).catch(() => {});
    say(`Vault unchanged since ${newest?.name} — nothing to archive.`);
    return 0;
  }

  const name = archiveName(new Date());
  if (dry) {
    say(`Would archive ${current.files} files (${humanBytes(current.bytes)}) to ${path.join(dest, name)}.`);
    const { evict } = selectRetention([...existing, { name, date: new Date() }], new Date(), RETENTION);
    for (const a of evict) say(`Would evict ${a.name}.`);
    return 0;
  }

  await fs.mkdir(dest, { recursive: true, mode: 0o700 });
  // Written under a temp name and renamed only once it reads back: a job killed
  // mid-write (laptop closing, session ending) must not leave a truncated file that
  // the next prune would count as a good archive.
  const tmp = path.join(dest, `.tmp-${name}`);
  const excludes = TAR_EXCLUDES.flatMap((e) => ["--exclude", e]);
  const made = tar(["-czf", tmp, "-C", path.dirname(root), ...excludes, path.basename(root)]);
  if (made.status !== 0) {
    await fs.rm(tmp, { force: true });
    await logLine(dest, `FAILED: tar exited ${made.status}: ${made.stderr.trim()}`);
    if (!quiet) console.error(`Archive failed: ${made.stderr.trim() || `tar exited ${made.status}`}`);
    return quiet ? 0 : 1;
  }

  const check = inspectArchive(tmp);
  if (!check.ok || check.files < current.files) {
    await fs.rm(tmp, { force: true });
    const why = check.why ?? `archive holds ${check.files} files, expected ${current.files}`;
    await logLine(dest, `FAILED: unusable archive discarded — ${why}`);
    if (!quiet) console.error(`Archive failed verification and was discarded: ${why}`);
    return quiet ? 0 : 1;
  }

  const finalPath = path.join(dest, name);
  await fs.rename(tmp, finalPath);
  await fs.chmod(finalPath, 0o600).catch(() => {});
  await fs.writeFile(finalPath + MANIFEST_SUFFIX, text, { mode: 0o600 });
  await fs.writeFile(path.join(dest, "last-run"), new Date().toISOString() + "\n", { mode: 0o600 }).catch(() => {});

  const size = (await fs.stat(finalPath)).size;
  const { evict } = selectRetention(await listArchives(dest), new Date(), RETENTION);
  for (const a of evict) {
    await fs.rm(path.join(dest, a.name), { force: true });
    await fs.rm(path.join(dest, a.name + MANIFEST_SUFFIX), { force: true });
  }

  await logLine(dest, `archived ${name} — ${current.files} files, ${humanBytes(size)}, evicted ${evict.length}`);
  say(`Archived ${current.files} files (${humanBytes(size)}) to ${finalPath}.`);
  if (evict.length) say(`Pruned ${evict.length} older archive${evict.length > 1 ? "s" : ""}.`);
  return 0;
}

/**
 * The listing: what history exists, and when it was last checked.
 *
 * @param {string} dest
 * @returns {Promise<number>}
 */
async function list(dest) {
  const archives = await listArchives(dest);
  if (!archives.length) {
    console.log(`No archives yet in ${dest}.`);
    return 0;
  }
  let total = 0;
  /** @type {string[]} */
  const rows = [];
  for (const a of archives) {
    const size = await fs.stat(path.join(dest, a.name)).then(
      (s) => s.size,
      () => 0,
    );
    total += size;
    const m = await readManifest(dest, a.name);
    rows.push(
      `  ${a.date.toLocaleString()}  ${humanBytes(size).padStart(8)}  ${m ? `${m.files} files` : "no manifest"}` +
        `${a.pinned ? "  [pinned]" : ""}`,
    );
  }
  const oldest = /** @type {import("../src/backup.mjs").ArchiveRef} */ (archives[archives.length - 1]);
  console.log(`${archives.length} archives in ${dest}, ${humanBytes(total)} total`);
  console.log(
    `spanning ${oldest.date.toLocaleDateString()} → ${/** @type {import("../src/backup.mjs").ArchiveRef} */ (archives[0]).date.toLocaleDateString()}`,
  );
  console.log(rows.join("\n"));
  const lastRun = await fs.readFile(path.join(dest, "last-run"), "utf8").catch(() => null);
  if (lastRun) console.log(`\nLast checked: ${new Date(lastRun.trim()).toLocaleString()}`);
  return 0;
}

/**
 * Re-read every archive. A backup nobody has ever opened is a guess, not a backup.
 *
 * @param {string} dest
 * @returns {Promise<number>}
 */
async function verify(dest) {
  const archives = await listArchives(dest);
  if (!archives.length) {
    console.log(`No archives to verify in ${dest}.`);
    return 0;
  }
  let bad = 0;
  for (const a of archives) {
    const m = await readManifest(dest, a.name);
    const check = inspectArchive(path.join(dest, a.name));
    const short = m && check.ok && check.files < m.files;
    if (!check.ok || short) {
      bad++;
      console.error(`  BROKEN  ${a.name} — ${check.why ?? `holds ${check.files} files, manifest says ${m?.files}`}`);
    } else {
      console.log(`  ok      ${a.name} — ${check.files} files`);
    }
  }
  console.log(
    bad
      ? `\n${bad} of ${archives.length} archives are unusable.`
      : `\nAll ${archives.length} archives read back cleanly.`,
  );
  return bad ? 1 : 0;
}

/**
 * Unpack an archive to a *new* directory. Never over the live vault: a restore that
 * can overwrite is a restore that can destroy, and the person can move the tree
 * themselves once they have looked at it.
 *
 * @param {{ dest: string, which: string, to: string | null }} opts
 * @returns {Promise<number>}
 */
async function restore({ dest, which, to }) {
  const archives = await listArchives(dest);
  const found = which === "latest" ? archives[0] : archives.find((a) => a.name === which || a.name.includes(which));
  if (!found) {
    console.error(`No archive matching "${which}" in ${dest}. Run --list to see what exists.`);
    return 1;
  }
  const target = to ?? path.join(os.homedir(), `claudia-restore-${found.name.replace(ARCHIVE_SUFFIX, "")}`);
  if (existsSync(target) && (await fs.readdir(target).catch(() => [])).length) {
    console.error(`${target} already exists and is not empty — pick another --to, nothing was touched.`);
    return 1;
  }
  await fs.mkdir(target, { recursive: true, mode: 0o700 });
  const r = tar(["-xzf", path.join(dest, found.name), "-C", target]);
  if (r.status !== 0) {
    console.error(`Restore failed: ${r.stderr.trim()}`);
    return 1;
  }
  console.log(`Restored ${found.name} to ${target}.`);
  console.log(`Your live vault was not touched. Compare the two, then move what you want back yourself.`);
  return 0;
}

/**
 * Destroy the whole archive set. `/forget` calls this, because a rotating backup
 * would otherwise turn "permanent, no undo" into a false promise.
 *
 * @param {{ dest: string, yes: boolean }} opts
 * @returns {Promise<number>}
 */
async function purge({ dest, yes }) {
  if (!yes) {
    console.error(`--purge destroys every archive in ${dest}. Re-run with --yes to confirm.`);
    return 1;
  }
  const archives = await listArchives(dest);
  await fs.rm(dest, { recursive: true, force: true });
  console.log(`Purged ${archives.length} archive${archives.length === 1 ? "" : "s"} — ${dest} is gone.`);
  return 0;
}

/* -------------------------------------------------------------------- cli */

async function main() {
  const argv = process.argv.slice(2);
  /** The only flags that consume the argument after them. */
  const TAKES_VALUE = new Set(["--dest", "--restore", "--to"]);
  /** @param {string} flag */
  const valueOf = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? (argv[i + 1] ?? null) : null;
  };
  const has = /** @param {string} f */ (f) => argv.includes(f);

  // Hand the work to a detached child and return immediately. The SessionEnd hook
  // uses this: a backup is not part of closing a conversation, and the person should
  // never wait on one. The child outlives this process; if the machine goes down
  // mid-archive, the temp-file-then-rename dance means there is nothing to clean up.
  if (has("--detach") && !has("--dry-run")) {
    const self = fileURLToPath(import.meta.url);
    const child = spawn(process.execPath, [self, ...argv.filter((a) => a !== "--detach")], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return process.exit(0);
  }

  const dest = valueOf("--dest") ?? DEFAULT_DEST;
  // A bare flag must not swallow the vault path behind it: only TAKES_VALUE flags do.
  const positional = argv.filter((a, i) => !a.startsWith("--") && !TAKES_VALUE.has(argv[i - 1] ?? ""));
  const root = (positional[0] ?? path.join(os.homedir(), ".claudia")).replace(/\/+$/, "");

  if (has("--list")) return process.exit(await list(dest));
  if (has("--verify")) return process.exit(await verify(dest));
  if (has("--purge")) return process.exit(await purge({ dest, yes: has("--yes") }));
  if (has("--restore")) {
    return process.exit(await restore({ dest, which: valueOf("--restore") ?? "latest", to: valueOf("--to") }));
  }
  process.exit(await snapshot({ root, dest, quiet: has("--quiet"), dry: has("--dry-run") }));
}

main().catch((/** @type {unknown} */ err) => {
  // Under --quiet this is a hook: a backup that blew up must not fail the session
  // the person just had. Run by hand, say what broke.
  const quiet = process.argv.includes("--quiet");
  if (!quiet) console.error(`Backup failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(quiet ? 0 : 1);
});
