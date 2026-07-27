/**
 * The rotating vault archive (ADR-0032). Two things are actually being asserted
 * here, and only the second one is interesting:
 *
 * 1. that a snapshot happens and reads back, and
 * 2. that history *survives* — that a ladder fed hourly still holds a copy from
 *    before a corruption nobody noticed for three weeks, and that nothing the
 *    person asked to forget outlives the forgetting.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARCHIVE_SUFFIX,
  MANIFEST_SUFFIX,
  PIN_SUFFIX,
  RETENTION,
  archiveName,
  checkVault,
  digestOfText,
  humanBytes,
  isIgnored,
  manifestText,
  parseArchiveName,
  parseManifest,
  selectRetention,
  vaultDigest,
  weekKey,
  type ArchiveRef,
  type ManifestEntry,
  type VaultSnapshot,
} from "../src/backup.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "vault-backup.mjs");

const run = (args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

const tmpDirs: string[] = [];
const tmp = async (): Promise<string> => {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-backup-"));
  tmpDirs.push(d);
  return d;
};

/** A minimal but realistic vault: an index, a working file, a session, a person. */
async function makeVault(parent: string): Promise<string> {
  const root = path.join(parent, ".claudia");
  await fs.mkdir(path.join(root, "sessions"), { recursive: true });
  await fs.mkdir(path.join(root, "people"), { recursive: true });
  await fs.writeFile(path.join(root, "MEMORY.md"), "# index\n");
  await fs.writeFile(path.join(root, "person.md"), "notes\n");
  await fs.writeFile(path.join(root, "safety.md"), "flags\n");
  await fs.writeFile(path.join(root, "sessions", "2026-07-24.summary.md"), "a session\n");
  await fs.writeFile(path.join(root, "people", "Sixtine.md"), "a fiche\n");
  return root;
}

const entry = (rel: string, size = 10): ManifestEntry => ({ rel, size, sha256: "a".repeat(64) });
const snap = (over: Partial<VaultSnapshot> = {}): VaultSnapshot => ({
  digest: "d",
  files: 10,
  bytes: 1000,
  rels: ["MEMORY.md", "person.md", "safety.md"],
  ...over,
});

/** An archive N hours before `now`. */
const at = (now: Date, hoursAgo: number, pinned = false): ArchiveRef => {
  const date = new Date(now.getTime() - hoursAgo * 3600_000);
  return { name: archiveName(date), date, pinned };
};

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe("what counts as the person's data", () => {
  it("ignores Finder and VCS noise, keeps everything else", () => {
    // .DS_Store is rewritten just by opening the folder — counting it would mint an
    // archive, and burn a rung of the ladder, for a change nobody made.
    expect(isIgnored(".DS_Store")).toBe(true);
    expect(isIgnored("people/.DS_Store")).toBe(true);
    expect(isIgnored("._MEMORY.md")).toBe(true);
    expect(isIgnored(".git/config")).toBe(true);
    expect(isIgnored("people/Sixtine.md")).toBe(false);
    expect(isIgnored(".migrations")).toBe(false);
    expect(isIgnored("sessions/2026-07-24.transcript.md")).toBe(false);
  });
});

describe("the vault's identity (what makes a snapshot worth taking)", () => {
  it("does not depend on the order readdir happened to return", () => {
    const a = [entry("b.md"), entry("a.md"), entry("c/d.md")];
    const b = [entry("c/d.md"), entry("a.md"), entry("b.md")];
    expect(vaultDigest(a)).toBe(vaultDigest(b));
  });

  it("changes when a file's contents change", () => {
    const before = [{ rel: "person.md", size: 5, sha256: "a".repeat(64) }];
    const after = [{ rel: "person.md", size: 5, sha256: "b".repeat(64) }];
    expect(vaultDigest(before)).not.toBe(vaultDigest(after));
  });

  it("round-trips through the manifest sidecar", () => {
    const entries = [entry("MEMORY.md", 12), entry("people/Sixtine.md", 30)];
    const text = manifestText(entries);
    const parsed = parseManifest(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.files).toBe(2);
    expect(parsed!.bytes).toBe(42);
    expect(parsed!.rels).toEqual(["MEMORY.md", "people/Sixtine.md"]);
    expect(parsed!.digest).toBe(digestOfText(text));
    expect(parsed!.digest).toBe(vaultDigest(entries));
  });

  it("treats a damaged sidecar as 'no previous snapshot' rather than throwing", () => {
    // This is read inside a SessionEnd hook. A truncated file must degrade, not blow up.
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest("")).toBeNull();
    expect(parseManifest("# claudia vault manifest\ngarbage")).toBeNull();
  });
});

describe("the gate before archiving", () => {
  it("refuses only the one unrecoverable case: archiving nothing over real history", () => {
    const r = checkVault(snap({ files: 0, rels: [] }), snap());
    expect(r.fatal).toMatch(/no files/);
  });

  it("passes a first-ever snapshot, with nothing to compare against", () => {
    expect(checkVault(snap(), null)).toEqual({ fatal: null, warnings: [] });
  });

  it("warns — but never refuses — when the vault shrinks hard", () => {
    // It cannot tell a corruption from a /forget the person asked for, and treating
    // a legitimate deletion as corruption would be its own kind of broken.
    const r = checkVault(snap({ files: 3, bytes: 200 }), snap({ files: 20, bytes: 5000 }));
    expect(r.fatal).toBeNull();
    expect(r.warnings.join(" ")).toMatch(/file count fell from 20 to 3/);
    expect(r.warnings.join(" ")).toMatch(/total size fell/);
  });

  it("names a core working file that was there last time and is gone now", () => {
    const r = checkVault(snap({ rels: ["MEMORY.md", "safety.md"] }), snap());
    expect(r.warnings.join(" ")).toMatch(/person\.md was in the last archive and is gone now/);
  });

  it("stays quiet about a vault that is simply growing", () => {
    const r = checkVault(snap({ files: 30, bytes: 9000 }), snap({ files: 20, bytes: 5000 }));
    expect(r.warnings).toEqual([]);
  });
});

describe("archive names", () => {
  it("round-trips a moment", () => {
    const d = new Date(2026, 6, 24, 17, 12, 3);
    const parsed = parseArchiveName(archiveName(d));
    expect(parsed).not.toBeNull();
    expect(parsed!.date.getTime()).toBe(d.getTime());
  });

  it("refuses to claim files it did not write", () => {
    // The prune pass deletes what this function recognises, so a stray file in the
    // directory has to come back null — not "close enough".
    expect(parseArchiveName("notes.txt")).toBeNull();
    expect(parseArchiveName("claudia-vault-nope.tar.gz")).toBeNull();
    expect(parseArchiveName("claudia-vault-20260724-171203.tar.gz.manifest")).toBeNull();
    expect(parseArchiveName("claudia-vault-20260231-000000.tar.gz")).toBeNull(); // Feb 31st
  });
});

describe("the retention ladder", () => {
  const now = new Date(2026, 6, 24, 12, 0, 0);

  it("keeps nothing from nothing", () => {
    expect(selectRetention([], now)).toEqual({ keep: [], evict: [] });
  });

  it("never evicts the newest archive, however old it is", () => {
    const ancient = at(now, 24 * 3000);
    const { keep, evict } = selectRetention([ancient], now);
    expect(keep.map((a) => a.name)).toEqual([ancient.name]);
    expect(evict).toEqual([]);
  });

  it("keeps every archive from the last two days", () => {
    const recent = [at(now, 1), at(now, 5), at(now, 20), at(now, 47)];
    const { evict } = selectRetention(recent, now);
    expect(evict).toEqual([]);
  });

  it("thins older days down to one archive each", () => {
    // Three archives on the same day, eight days back: only the newest survives.
    const day = [at(now, 24 * 8), at(now, 24 * 8 + 3), at(now, 24 * 8 + 6)];
    const { keep, evict } = selectRetention([at(now, 1), ...day], now);
    expect(keep.map((a) => a.name)).toContain(day[0]!.name);
    expect(evict.map((a) => a.name)).toEqual([day[1]!.name, day[2]!.name]);
  });

  it("never evicts a pinned archive", () => {
    const pinned = at(now, 24 * 400, true);
    const { keep } = selectRetention([at(now, 1), at(now, 24 * 400 - 1), pinned], now);
    expect(keep.map((a) => a.name)).toContain(pinned.name);
  });

  it("still holds a pre-corruption copy after a month of hourly runs", () => {
    // The failure this whole design exists for: something goes quietly wrong, and is
    // noticed weeks later. A flat "keep the last N" rotation fed hourly would have
    // evicted every good copy within a day or two.
    const hourly = Array.from({ length: 24 * 45 }, (_, i) => at(now, i));
    const { keep } = selectRetention(hourly, now);

    const daysBack = (a: ArchiveRef) => (now.getTime() - a.date.getTime()) / 86_400_000;
    expect(keep.some((a) => daysBack(a) > 21)).toBe(true); // three weeks ago
    // The ladder reaches back nearly as far as the archives themselves go. Not all
    // the way: the oldest surviving rung is the *newest* archive of the oldest week
    // bucket, which lands a few days short of the oldest input.
    expect(Math.max(...keep.map(daysBack))).toBeGreaterThan(35);
    // ...without hoarding: 1080 hourly archives collapse to a ladder, not a pile.
    expect(keep.length).toBeLessThan(80);
  });

  it("keeps a graded ladder of a vault's last active days, not its last calendar days", () => {
    // Someone who stops for six months and comes back should still find history,
    // not a single archive: the tiers count buckets that exist, not calendar slots.
    const old = Array.from({ length: 10 }, (_, i) => at(now, 24 * (180 + i)));
    const { keep } = selectRetention(old, now);
    expect(keep.length).toBeGreaterThan(1);
  });

  it("keeps one archive per year, forever", () => {
    expect(RETENTION.yearly).toBe(Infinity);
    const years = [at(now, 1), at(now, 24 * 400), at(now, 24 * 800), at(now, 24 * 1200)];
    const { keep } = selectRetention(years, now);
    expect(keep.length).toBe(4);
  });

  it("puts a week where ISO-8601 puts it", () => {
    expect(weekKey(new Date(2026, 0, 1))).toBe("2026-W01"); // a Thursday
    expect(weekKey(new Date(2027, 0, 1))).toBe("2026-W53"); // a Friday, still 2026's week
  });
});

describe("readable sizes", () => {
  it("reads as a person would say it", () => {
    expect(humanBytes(512)).toBe("512 B");
    expect(humanBytes(2048)).toBe("2.0 KB");
    expect(humanBytes(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });
});

describe("the snapshot pass (scripts/vault-backup.mjs)", () => {
  it("archives the vault, verifies it, and writes a manifest beside it", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    const r = run([root, "--dest", dest]);
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Archived 5 files/);

    const files = await fs.readdir(dest);
    const archive = files.find((f) => f.endsWith(ARCHIVE_SUFFIX));
    expect(archive).toBeDefined();
    expect(files).toContain(archive + MANIFEST_SUFFIX);

    // The archive is only a backup if it reads back.
    const listed = spawnSync("tar", ["-tzf", path.join(dest, archive!)], { encoding: "utf8" });
    expect(listed.status).toBe(0);
    expect(listed.stdout).toMatch(/\.claudia\/people\/Sixtine\.md/);
  });

  it("takes no second archive when nothing changed", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    run([root, "--dest", dest]);
    const second = run([root, "--dest", dest]);

    expect(second.status).toBe(0);
    expect(second.stdout).toMatch(/unchanged/);
    const archives = (await fs.readdir(dest)).filter((f) => f.endsWith(ARCHIVE_SUFFIX));
    expect(archives).toHaveLength(1);
  });

  it("archives again once a file actually changes", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    run([root, "--dest", dest]);
    await fs.writeFile(path.join(root, "person.md"), "notes, revised\n");
    // Stamps have one-second resolution, so a same-second second archive would
    // collide on the filename; the pass is hourly in real use.
    await new Promise((r) => setTimeout(r, 1100));
    const second = run([root, "--dest", dest]);

    expect(second.stdout).toMatch(/Archived/);
    const archives = (await fs.readdir(dest)).filter((f) => f.endsWith(ARCHIVE_SUFFIX));
    expect(archives).toHaveLength(2);
  });

  it("refuses to archive an emptied vault over the history it already has", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    await fs.rm(root, { recursive: true, force: true });
    await fs.mkdir(root, { recursive: true });
    const r = run([root, "--dest", dest]);

    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/Refusing to archive/);
    // The point of refusing: the good copy is still there.
    const archives = (await fs.readdir(dest)).filter((f) => f.endsWith(ARCHIVE_SUFFIX));
    expect(archives).toHaveLength(1);
  });

  it("warns about a hard shrink but still archives it", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    await fs.rm(path.join(root, "person.md"));
    await fs.rm(path.join(root, "sessions"), { recursive: true });
    await fs.rm(path.join(root, "people"), { recursive: true });
    await new Promise((r) => setTimeout(r, 1100));
    const r = run([root, "--dest", dest]);

    expect(r.status).toBe(0);
    expect(r.stderr).toMatch(/person\.md was in the last archive/);
    expect(r.stdout).toMatch(/Archived 2 files/);
  });

  it("honours { backups: false } — the person can refuse the copies", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    await fs.writeFile(path.join(root, "config.json"), JSON.stringify({ backups: false }));

    const r = run([root, "--dest", dest]);

    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/off in config\.json/);
    await expect(fs.readdir(dest)).rejects.toThrow();
  });

  it("stays silent and exits 0 under --quiet, whatever happens (it is a hook)", async () => {
    const parent = await tmp();
    const dest = path.join(parent, "backups");
    const missing = path.join(parent, "no-such-vault");

    const r = run([missing, "--dest", dest, "--quiet"]);

    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(r.stderr).toBe("");
  });

  it("reports what it would do without writing anything, under --dry-run", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    const r = run([root, "--dest", dest, "--dry-run"]);

    expect(r.stdout).toMatch(/Would archive 5 files/);
    await expect(fs.readdir(dest)).rejects.toThrow();
  });
});

describe("getting the data back out", () => {
  it("restores to a new folder and leaves the live vault untouched", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    // The vault is then damaged — the case this all exists for.
    await fs.writeFile(path.join(root, "person.md"), "");
    const to = path.join(parent, "restored");
    const r = run(["--dest", dest, "--restore", "latest", "--to", to]);

    expect(r.status).toBe(0);
    expect(await fs.readFile(path.join(to, ".claudia", "person.md"), "utf8")).toBe("notes\n");
    // Restoring never overwrites: the damaged file is still damaged until the
    // person decides otherwise.
    expect(await fs.readFile(path.join(root, "person.md"), "utf8")).toBe("");
  });

  it("refuses to restore into a folder that already holds something", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    const to = path.join(parent, "occupied");
    await fs.mkdir(to, { recursive: true });
    await fs.writeFile(path.join(to, "mine.md"), "do not clobber\n");
    const r = run(["--dest", dest, "--restore", "latest", "--to", to]);

    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/already exists and is not empty/);
    expect(await fs.readFile(path.join(to, "mine.md"), "utf8")).toBe("do not clobber\n");
  });

  it("lists the history and reads every archive back on demand", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    expect(run(["--dest", dest, "--list"]).stdout).toMatch(/1 archives in/);
    const verified = run(["--dest", dest, "--verify"]);
    expect(verified.status).toBe(0);
    expect(verified.stdout).toMatch(/read back cleanly/);
  });

  it("calls a truncated archive broken instead of counting it as history", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);
    const archive = (await fs.readdir(dest)).find((f) => f.endsWith(ARCHIVE_SUFFIX))!;
    await fs.writeFile(path.join(dest, archive), "not a gzip stream at all");

    const r = run(["--dest", dest, "--verify"]);

    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/BROKEN/);
  });
});

describe("staying out of the way", () => {
  it("returns immediately under --detach and archives in the background", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    const started = Date.now();
    const r = run([root, "--dest", dest, "--quiet", "--detach"]);
    const elapsed = Date.now() - started;

    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    // The parent forks and leaves; it must not be waiting on tar. (Generous bound —
    // this is asserting "did not wait for the work", not a performance budget.)
    expect(elapsed).toBeLessThan(1500);

    // The detached child finishes on its own, after this process got its answer.
    const deadline = Date.now() + 10_000;
    let archives: string[] = [];
    while (Date.now() < deadline && archives.length === 0) {
      archives = (await fs.readdir(dest).catch(() => [])).filter((f) => f.endsWith(ARCHIVE_SUFFIX));
      if (!archives.length) await new Promise((res) => setTimeout(res, 100));
    }
    expect(archives).toHaveLength(1);
  });

  it("leaves no lock behind once it is done", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    run([root, "--dest", dest]);

    expect(await fs.readdir(dest)).not.toContain(".lock");
  });
});

describe("two triggers, one archive directory", () => {
  it("gives up quietly when another backup is already running", async () => {
    // The SessionEnd hook and the hourly job can fire in the same second. Both would
    // compute the same temp path (stamps are second-resolution), interleave their
    // writes, and rename the mixture into place as though it were history.
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    await fs.mkdir(dest, { recursive: true });
    // A live holder: this test process itself is unquestionably running.
    await fs.writeFile(path.join(dest, ".lock"), JSON.stringify({ pid: process.pid, started: Date.now() }));

    const r = run([root, "--dest", dest]);

    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/already running/);
    expect((await fs.readdir(dest)).filter((f) => f.endsWith(ARCHIVE_SUFFIX))).toHaveLength(0);
  });

  it("breaks a lock left behind by a process that died holding it", async () => {
    // Otherwise one crash disables backups permanently — the failure mode where the
    // safety net is silently gone is exactly the one worth engineering against.
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    await fs.mkdir(dest, { recursive: true });
    await fs.writeFile(
      path.join(dest, ".lock"),
      JSON.stringify({ pid: 0x7fffffff, started: Date.now() }), // a pid that is not running
    );

    const r = run([root, "--dest", dest]);

    expect(r.stdout).toMatch(/Archived/);
    expect((await fs.readdir(dest)).filter((f) => f.endsWith(ARCHIVE_SUFFIX))).toHaveLength(1);
  });

  it("breaks a lock that has been held far too long, whatever the pid says", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    await fs.mkdir(dest, { recursive: true });
    const anHourAgo = Date.now() - 3600_000;
    await fs.writeFile(path.join(dest, ".lock"), JSON.stringify({ pid: process.pid, started: anHourAgo }));

    expect(run([root, "--dest", dest]).stdout).toMatch(/Archived/);
  });

  it("breaks an unparseable lock rather than jamming on it", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    await fs.mkdir(dest, { recursive: true });
    await fs.writeFile(path.join(dest, ".lock"), "half-written garbage");

    expect(run([root, "--dest", dest]).stdout).toMatch(/Archived/);
  });

  it("takes no lock on a dry run — inspecting must not block a real backup", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");

    expect(run([root, "--dest", dest, "--dry-run"]).stdout).toMatch(/Would archive/);
    await expect(fs.readdir(dest)).rejects.toThrow();
  });
});

describe("clearing the archives is the person's own move (ADR-0032)", () => {
  it("purges the whole set when explicitly asked, and only then", async () => {
    const parent = await tmp();
    const root = await makeVault(parent);
    const dest = path.join(parent, "backups");
    run([root, "--dest", dest]);

    // Even a pinned archive goes: a pin is protection from rotation, never from the
    // person's own decision to erase.
    const archive = (await fs.readdir(dest)).find((f) => f.endsWith(ARCHIVE_SUFFIX))!;
    await fs.writeFile(path.join(dest, archive + PIN_SUFFIX), "");

    expect(run(["--dest", dest, "--purge"]).status).toBe(1); // needs --yes
    const r = run(["--dest", dest, "--purge", "--yes"]);

    expect(r.status).toBe(0);
    await expect(fs.readdir(dest)).rejects.toThrow();
  });
});
