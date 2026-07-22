#!/usr/bin/env node
/**
 * Claudia — vault migration runner (ADR-0020).
 *
 * Applies pending vault migrations (see `src/migrations/`) to `~/.claudia/`, in order,
 * skipping any already recorded in the vault's `.migrations` ledger. Each migration is a
 * pure, idempotent `{ relPath: content } → { relPath: newContent }` transform; this
 * script does the fs work: read → (dry-run preview | backup → apply → ledger → rebuild
 * dashboard). `*.transcript.md` (the verbatim archive) is never read for rewriting nor
 * written.
 *
 * Two callers:
 *  - `/migrate` (manual): `--dry` to preview, or apply with an explicit backup.
 *  - `recall` (benign upkeep): applies pending migrations then discloses what changed —
 *    a no-op after the first run because the ledger + idempotency say so.
 *
 * Usage: node scripts/migrate-vault.mjs [--dry] [vaultDir]
 *   default vaultDir = ~/.claudia
 *
 * `runMigrations({ root, dry, migrations })` is exported (pure-ish: only touches the
 * given vault) so it can be tested against a fixture directory, with `migrations`
 * injectable to exercise registry shapes the real list does not have yet.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrations } from "../src/migrations/index.mjs";
import { rebuildDashboard } from "./build-dashboard.mjs";

const LEDGER = ".migrations";

/** @returns {string} timestamp `YYYYMMDD-HHMMSS`, used to name the backup directory */
function stamp() {
  const d = new Date();
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * @param {string} dir  directory to walk recursively
 * @param {string} [base]  root the returned paths are made relative to (defaults to `dir`)
 * @returns {Promise<string[]>} vault-relative POSIX paths of every file under `dir`
 */
async function walk(dir, base = dir) {
  /** @type {string[]} */
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
    if (e.isDirectory()) out.push(...(await walk(abs, base)));
    else out.push(path.relative(base, abs).split(path.sep).join("/"));
  }
  return out;
}

/**
 * @param {string} root  vault directory
 * @returns {Promise<Set<string>>} migration ids already recorded in the ledger
 */
async function readLedger(root) {
  try {
    const txt = await fs.readFile(path.join(root, LEDGER), "utf8");
    return new Set(txt.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

/**
 * @param {string} root  vault directory
 * @param {string[]} ids  migration ids to record as applied
 */
async function appendLedger(root, ids) {
  const applied = await readLedger(root);
  for (const id of ids) applied.add(id);
  await fs.writeFile(path.join(root, LEDGER), [...applied].join("\n") + "\n");
}

/**
 * One changed file in a dry-run preview: full before/after content.
 * @typedef {object} MigrationDiff
 * @property {string} rel  vault-relative POSIX path
 * @property {string} before  content on disk; empty string for a file the migration creates
 * @property {string} after  content the migrations would write
 */

/**
 * Outcome of `runMigrations`, discriminated on `status`: `diffs` is always present on
 * `'dry'` (and also accompanies a dry-run `'nochange'`, possibly empty); `backup` is a
 * path only for `'applied'`.
 * @typedef {{status: 'absent'|'noop'|'nochange'|'applied', ran: string[], changed: string[], backup: string|null, diffs?: MigrationDiff[]}
 *         | {status: 'dry', ran: string[], changed: string[], backup: null, diffs: MigrationDiff[]}} MigrationRunResult
 */

/**
 * @param {{root: string, dry?: boolean, migrations?: ReadonlyArray<import("../src/migrations/index.mjs").Migration>}} opts
 *   `migrations` is a test seam: defaults to the real registry, overridable so tests can
 *   run the fs machinery against fabricated migrations (e.g. one that creates a file).
 * @returns {Promise<MigrationRunResult>}
 */
export async function runMigrations({ root, dry = false, migrations: list = migrations }) {
  try {
    await fs.access(root);
  } catch {
    return { status: "absent", ran: [], changed: [], backup: null };
  }

  const applied = await readLedger(root);
  const pending = list.filter((m) => !applied.has(m.id));
  if (!pending.length) return { status: "noop", ran: [], changed: [], backup: null };

  // Load markdown files (never the verbatim transcripts) into a { rel: content } map.
  const rels = (await walk(root)).filter((r) => r.endsWith(".md") && !r.endsWith(".transcript.md"));
  /** @type {Record<string, string>} */
  const original = {};
  for (const rel of rels) original[rel] = await fs.readFile(path.join(root, rel), "utf8");

  // Fold pending migrations, each transforming the accumulated content.
  let files = { ...original };
  /** @type {string[]} */
  const ran = [];
  for (const m of pending) {
    files = { ...files, ...m.migrate(files) };
    ran.push(m.id);
  }
  const changed = Object.keys(files).filter((rel) => files[rel] !== original[rel]);

  if (dry) {
    // A file a migration *creates* has no on-disk original: `original[rel]` is undefined
    // there, and `?? ""` maps it to the empty string so printDiffs renders the whole file
    // as pure additions — exactly what "new file" should look like in a preview.
    const diffs = changed.map((rel) => ({ rel, before: original[rel] ?? "", after: /** @type {string} */ (files[rel]) }));
    return { status: changed.length ? "dry" : "nochange", ran, changed, backup: null, diffs };
  }

  // Migrations were pending but produced nothing (e.g. hand-migrated already): record
  // them as applied so we never re-scan, but take no backup — there is nothing to undo.
  if (!changed.length) {
    await appendLedger(root, ran);
    return { status: "nochange", ran, changed, backup: null };
  }

  // Real change: back the whole vault up first, then apply.
  const backup = `${root.replace(/\/+$/, "")}.bak-${stamp()}`;
  await fs.cp(root, backup, { recursive: true });
  for (const rel of changed) {
    const abs = path.join(root, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, /** @type {string} */ (files[rel]));
  }
  await appendLedger(root, ran);
  await rebuildDashboard(root); // derived mirror: regenerate, never migrate in place

  return { status: "applied", ran, changed, backup };
}

/** @param {MigrationDiff[]} diffs */
function printDiffs(diffs) {
  for (const { rel, before, after } of diffs) {
    const b = before.split("\n");
    const a = after.split("\n");
    console.log(`\n${rel}`);
    for (let i = 0; i < Math.max(b.length, a.length); i++) {
      if (b[i] !== a[i]) {
        if (b[i] != null && b[i] !== "") console.log(`   - ${b[i]}`);
        if (a[i] != null && a[i] !== "") console.log(`   + ${a[i]}`);
      }
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry");
  const root = argv.find((a) => !a.startsWith("--")) || path.join(os.homedir(), ".claudia");

  // A failure can land mid-apply — after the backup, between file writes — so an
  // unhandled rejection here would leave the user staring at a stack trace with a
  // half-migrated vault. Catch it and say the one thing that matters: how to restore.
  try {
    const r = await runMigrations({ root, dry });
    switch (r.status) {
      case "absent":
        console.log(`Nothing to migrate at ${root}.`);
        break;
      case "noop":
        console.log("✓ Vault up to date (nothing to migrate).");
        break;
      case "nochange":
        if (dry) console.log(`DRY-RUN — nothing would change; would mark applied: ${r.ran.join(", ")}.`);
        else console.log(`✓ Already in target form. Marked applied: ${r.ran.join(", ")} (no backup needed).`);
        break;
      case "dry":
        printDiffs(r.diffs);
        console.log(`\nDRY-RUN — would migrate ${r.changed.length} file(s) via: ${r.ran.join(", ")}.`);
        break;
      case "applied":
        console.log(`✓ Migrated ${r.changed.length} file(s) via ${r.ran.join(", ")}.\n  Backup: ${r.backup}`);
        break;
    }
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `✗ Migration failed: ${msg}\n` +
        `  The vault at ${root} may be partially migrated.\n` +
        `  If a folder named ${root.replace(/\/+$/, "")}.bak-<timestamp> exists next to it, it is a full\n` +
        `  pre-migration backup taken before any change — restore by copying it back over ${root}.`,
    );
    process.exit(1);
  }
}

// Run only when invoked directly, not on import (tests import runMigrations).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
