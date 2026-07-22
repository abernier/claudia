#!/usr/bin/env node
/**
 * Claudia — vault export pass.
 *
 * Copies the person's `~/.claudia/` to a destination, rewriting Obsidian
 * `[[wikilinks]]` to relative markdown links so the export opens cleanly in plain
 * viewers / GitHub. The live vault keeps wikilinks (Obsidian-friendly). Local-only:
 * this just copies files on the person's own machine.
 *
 * Usage: node scripts/vault-export.mjs [srcDir] [destDir]
 *   defaults: src = ~/.claudia, dest = ~/Desktop/claudia-export-<date>
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { wikilinksToRelative, ficheNames } from "../src/vault.mjs";

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
    else out.push(path.relative(base, abs)); // vault-relative POSIX-ish path
  }
  return out;
}

const toPosix = (p) => p.split(path.sep).join("/");

async function main() {
  const src = process.argv[2] || path.join(os.homedir(), ".claudia");
  const dest = process.argv[3] || path.join(os.homedir(), "Desktop", `claudia-export-${stamp()}`);

  const files = (await walk(src)).map(toPosix);
  if (!files.length) {
    console.log(`Nothing to export at ${src}`);
    return process.exit(0);
  }

  // Build a name/alias → vault-relative-path index.
  const index = new Map();
  const add = (name, target) => name && index.set(name, target);
  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    const baseNoExt = rel.replace(/\.md$/, "");
    add(path.posix.basename(baseNoExt), rel); // [[Liliana]] / [[MEMORY]] / [[people]]
    if (rel.startsWith("people/")) {
      try {
        for (const n of ficheNames(await fs.readFile(path.join(src, rel), "utf8"))) add(n, rel);
      } catch {
        /* skip */
      }
    }
    if (rel.startsWith("sessions/") && rel.endsWith(".summary.md")) {
      add(path.posix.basename(rel).replace(/\.summary\.md$/, ""), rel); // [[2026-07-21]]
    }
  }

  for (const rel of files) {
    const from = path.join(src, rel);
    const to = path.join(dest, rel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    if (rel.endsWith(".md")) {
      const md = await fs.readFile(from, "utf8");
      const fromDir = path.posix.dirname(rel);
      const resolve = (name) => {
        const target = index.get(name);
        if (!target) return null;
        const r = path.posix.relative(fromDir === "." ? "" : fromDir, target);
        return r || path.posix.basename(target);
      };
      await fs.writeFile(to, wikilinksToRelative(md, resolve));
    } else {
      await fs.copyFile(from, to);
    }
  }

  console.log(`Exported ${files.length} files to ${dest} (wikilinks rewritten to relative links).`);
  process.exit(0);
}

main().catch(() => process.exit(0));
