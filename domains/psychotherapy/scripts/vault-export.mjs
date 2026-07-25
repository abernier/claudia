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

// Resolved before main() runs so the failure handler below can name the
// destination — a mid-copy error leaves files there, and the person needs to
// know where that untrustworthy partial tree lives.
const src = process.argv[2] || path.join(os.homedir(), ".claudia");
const dest = process.argv[3] || path.join(os.homedir(), "Desktop", `claudia-export-${stamp()}`);

/** @returns {Promise<void>} */
async function main() {
  const files = await walk(src);
  if (!files.length) {
    console.log(`Nothing to export at ${src}`);
    return process.exit(0);
  }

  for (const rel of files) {
    const from = path.join(src, rel);
    const to = path.join(dest, rel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  }

  console.log(`Exported ${files.length} files to ${dest}.`);
  process.exit(0);
}

main().catch((/** @type {unknown} */ err) => {
  // /export is user-invoked: exiting 0 here would pass an interrupted copy off
  // as a complete backup. Say what broke and where the partial tree landed.
  const why = err instanceof Error ? err.message : String(err);
  console.error(`Export failed: ${why}`);
  console.error(`A partial copy may exist at ${dest} — don't trust it as a complete export.`);
  process.exit(1);
});
