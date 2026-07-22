#!/usr/bin/env node
/**
 * Claudia — rebuild the person-facing dashboard mirror (ADR-0019).
 *
 * Runs at SessionEnd (after `save-session`), at the tail of `recall` (after any
 * deferred distillation, so the newest summary is reflected), and on demand via
 * `/dashboard`. Reads the working memory under ~/.claudia/ and writes
 * ~/.claudia/dashboard.md — a MIRROR that only transcludes or links, never
 * summarises (the summarising already happened in the source files).
 * `safety.md` is never mirrored.
 *
 * `rebuildDashboard(root)` is exported so the migration runner can refresh the mirror
 * after applying a migration, without duplicating the read/assemble logic.
 *
 * Opt-out: `{ "dashboard": false }` in ~/.claudia/config.json — then no file is
 * written and any existing dashboard.md is removed (the opt-out must be real,
 * or /forget-ing the file would be undone at the next close).
 *
 * Benign layer: FAILS SILENT — it never blocks a hook or recall.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDashboard, personName, sessionsForMirror } from "../src/dashboard.mjs";

/**
 * Local `YYYY-MM-DD` stamp for the mirror footer.
 *
 * @returns {string}
 */
function todayStamp() {
  const d = new Date();
  /** @param {number} n */
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// null = "file absent" — load-bearing downstream: buildDashboard omits the section.
/** @type {(p: string) => Promise<string | null>} */
const read = (p) => fs.readFile(p, "utf8").catch(() => null);

/**
 * Rebuild `<root>/dashboard.md` from the working files. Honours the opt-out and fails
 * silent (never throws). Returns true if the mirror was written, false if skipped.
 *
 * @param {string} root — the vault root (normally `~/.claudia`)
 * @returns {Promise<boolean>}
 */
export async function rebuildDashboard(root) {
  try {
    // Nothing to mirror until the person actually has a memory here.
    try {
      await fs.access(root);
    } catch {
      return false;
    }

    const dashboardPath = path.join(root, "dashboard.md");

    // Respect the opt-out — and make it real by removing any stale mirror.
    try {
      const cfg = /** @type {import("./save-session.mjs").ClaudiaConfig} */ (
        JSON.parse((await read(path.join(root, "config.json"))) || "{}")
      );
      if (cfg.dashboard === false) {
        await fs.rm(dashboardPath, { force: true }).catch(() => {});
        return false;
      }
    } catch {
      /* no/unreadable config → default-on */
    }

    const [person, goals, themes, todo, people, timeline, understanding] = await Promise.all([
      read(path.join(root, "person.md")),
      read(path.join(root, "goals.md")),
      read(path.join(root, "themes.md")),
      read(path.join(root, "todo.md")),
      read(path.join(root, "people.md")),
      read(path.join(root, "timeline.md")),
      read(path.join(root, "understanding.md")),
    ]);

    const names = await fs.readdir(path.join(root, "sessions")).catch(() => []);

    const md = buildDashboard({
      name: personName(person),
      sessions: sessionsForMirror(names),
      goals,
      themes,
      todo,
      people,
      timeline,
      understandingExists: understanding != null,
      generatedAt: todayStamp(),
    });

    await fs.writeFile(dashboardPath, md);
    return true;
  } catch {
    return false; // benign: never blocks a hook, recall, or a migration run
  }
}

async function main() {
  await rebuildDashboard(path.join(os.homedir(), ".claudia"));
  process.exit(0);
}

// Run only when invoked directly (`node scripts/build-dashboard.mjs`), not on import.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
