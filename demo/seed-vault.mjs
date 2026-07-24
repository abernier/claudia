#!/usr/bin/env node
/**
 * Claudia demo — instantiate the fictional fixture vault into the fake home.
 *
 * Copies demo/vault/ to $DEMO_HOME/.claudia (default DEMO_HOME: ~/.claudia-demo),
 * rendering the evergreen date tokens so a re-shoot in six months still reads
 * "last session 3 days ago":
 *   - `{{TODAY-N}}` in file content  → the local calendar day N days ago (YYYY-MM-DD)
 *   - `TODAY-N-` filename prefixes   → same, so session stems stay well-formed (ADR-0017)
 * Also writes `last-seen` (epoch ms, 3 days ago) so the time layer opens with a
 * believable "it's been a few days" gap.
 *
 * The scratch vault is wiped and re-seeded on every run — the canonical fixture in
 * the repo is never mutated by a recording. Refuses to touch the real ~/.claudia.
 */

import { accessSync, constants } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Same resolution as demo/env.sh: $DEMO_HOME > /Users/nora (if ours) > ~/.claudia-demo. */
function resolveDemoHome() {
  if (process.env.DEMO_HOME) return process.env.DEMO_HOME;
  try {
    accessSync("/Users/nora", constants.W_OK);
    return "/Users/nora";
  } catch {
    return path.join(os.homedir(), ".claudia-demo");
  }
}

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), "vault");
const DEMO_HOME = resolveDemoHome();
const DEST = path.join(DEMO_HOME, ".claudia");

const DAY_MS = 86_400_000;

// Named apart from src/time.mjs's localDay(parts) on purpose — same-looking
// name, different contract, and this directory sits outside that module's world.
/** @param {number} daysAgo */
function dayStamp(daysAgo) {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** @param {string} s */
const render = (s) => s.replace(/\{\{TODAY-(\d+)\}\}/g, (_, n) => dayStamp(Number(n)));

/** @param {string} name */
const renderName = (name) => name.replace(/^TODAY-(\d+)-/, (_, n) => `${dayStamp(Number(n))}-`);

/**
 * @param {string} src
 * @param {string} dest
 * @returns {Promise<number>} files written
 */
async function seedDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  let count = 0;
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    if (entry.isDirectory()) {
      count += await seedDir(from, path.join(dest, entry.name));
    } else {
      await fs.writeFile(path.join(dest, renderName(entry.name)), render(await fs.readFile(from, "utf8")));
      count += 1;
    }
  }
  return count;
}

async function main() {
  // The one guard that matters: never point this at a real vault.
  if (path.resolve(DEST) === path.join(os.homedir(), ".claudia")) {
    console.error("refusing: destination is the real ~/.claudia (set DEMO_HOME elsewhere)");
    process.exit(1);
  }

  await fs.rm(DEST, { recursive: true, force: true });
  const count = await seedDir(FIXTURE, DEST);
  await fs.writeFile(path.join(DEST, "last-seen"), String(Date.now() - 3 * DAY_MS) + "\n");

  console.log(`seeded ${count} files → ${DEST}`);
  console.log(`last session reads as ${dayStamp(3)}; last-seen set 3 days ago`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
