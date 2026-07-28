#!/usr/bin/env node
/**
 * Claudia — vault export pass.
 *
 * Copies the person's `~/.claudia/` to a destination, verbatim. The vault's notes
 * already use plain relative markdown links, so they open cleanly in any viewer /
 * GitHub with no rewriting. Local-only: this just copies files on the person's own
 * machine.
 *
 * Usage: node scripts/vault-export.mjs [srcDir] [destDir]
 *   defaults: src = ~/.claudia, dest = ~/Desktop/claudia-export-<date>
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isEntrypoint } from "../src/entry.mjs";
import { resolveVaultRoot } from "../src/vault.mjs";

/**
 * Today's local date as `YYYY-MM-DD`, used to name the default export folder.
 *
 * @returns {string}
 */
function stamp() {
  const d = new Date();
  /** @type {(n: number) => string} */
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Recursively list every file under `dir` as vault-relative paths. An unreadable
 * (or absent) directory yields no entries rather than throwing.
 *
 * @param {string} dir - directory to descend into
 * @param {string} [base] - root the returned paths are made relative to (defaults to `dir`)
 * @returns {Promise<string[]>}
 */
async function walk(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(abs, base)));
    else out.push(path.relative(base, abs)); // vault-relative path
  }
  return out;
}

/**
 * The export pass at the vault seam (ADR-0035): copy every file under `root`
 * to `dest`, verbatim. Returns how many files were copied — zero means there
 * was nothing at `root`. Throws on a failed copy; the caller owns the story
 * about the partial tree left behind.
 *
 * @param {{ root: string, dest: string }} opts
 * @returns {Promise<{ count: number }>}
 */
export async function exportVault({ root, dest }) {
  const files = await walk(root);
  for (const rel of files) {
    const from = path.join(root, rel);
    const to = path.join(dest, rel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  }
  return { count: files.length };
}

/** @returns {Promise<void>} */
async function main() {
  const root = process.argv[2] || resolveVaultRoot();
  // Resolved before the copy starts so the failure handler below can name the
  // destination — a mid-copy error leaves files there, and the person needs to
  // know where that untrustworthy partial tree lives.
  const dest = process.argv[3] || path.join(os.homedir(), "Desktop", `claudia-export-${stamp()}`);

  try {
    const { count } = await exportVault({ root, dest });
    console.log(count ? `Exported ${count} files to ${dest}.` : `Nothing to export at ${root}`);
    process.exit(0);
  } catch (/** @type {unknown} */ err) {
    // /export is person-invoked: exiting 0 here would pass an interrupted copy
    // off as a complete backup. Say what broke and where the partial tree landed.
    const why = err instanceof Error ? err.message : String(err);
    console.error(`Export failed: ${why}`);
    console.error(`A partial copy may exist at ${dest} — don't trust it as a complete export.`);
    process.exit(1);
  }
}

// Run only when invoked directly, not on import (tests import exportVault).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
