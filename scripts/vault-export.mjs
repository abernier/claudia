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

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function walk(dir, base = dir) {
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

async function main() {
  const src = process.argv[2] || path.join(os.homedir(), ".claudia");
  const dest = process.argv[3] || path.join(os.homedir(), "Desktop", `claudia-export-${stamp()}`);

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

main().catch(() => process.exit(0));
