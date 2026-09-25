#!/usr/bin/env node
/**
 * Claudia — rebuild the person-facing dashboard mirror (ADR-0019).
 *
 * Runs at SessionEnd (after `save-session`), at the tail of `recall` (after any
 * deferred distillation, so the newest summary is reflected), and on demand via
 * `/dashboard`. The SessionEnd hook passes `--hook`: the plugin is user-scoped, so
 * that close fires for every session on the machine, and under `--hook` the script
 * reads the payload on stdin and does nothing unless the session was Claudia's
 * (ADR-0036). Every other caller runs it bare and gets the rebuild unconditionally. Reads the working memory under ~/.claudia/ and writes
 * ~/.claudia/dashboard.md — a MIRROR that only transcludes or links, never
 * summarises (the summarising already happened in the source files).
 * `safety.md` is never mirrored.
 *
 * `rebuildDashboard({ root })` is exported so the migration runner can refresh the
 * mirror after applying a migration, without duplicating the read/assemble logic.
 *
 * Opt-out: `{ "dashboard": false }` in ~/.claudia/config.json (ADR-0028) — then no
 * file is written and any existing dashboard.md is removed (the opt-out must be
 * real, or /forget-ing the file would be undone at the next close).
 *
 * Benign layer: FAILS SILENT — it never blocks a hook or recall.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isEntrypoint } from "../src/entry.mjs";
import { isClaudiaHookPayload } from "../src/gate.mjs";
import { resolveVaultRoot } from "../src/vault.mjs";
import { buildDashboard, personName, sessionsForMirror } from "../src/dashboard.mjs";
import { parseConfig } from "../src/config.mjs";

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
 * @param {{ root: string }} opts — `root` is the vault root (normally `~/.claudia`)
 * @returns {Promise<boolean>}
 */
export async function rebuildDashboard({ root }) {
  try {
    // Nothing to mirror until the person actually has a memory here.
    try {
      await fs.access(root);
    } catch {
      return false;
    }

    const dashboardPath = path.join(root, "dashboard.md");

    // Respect the opt-out — and make it real by removing any stale mirror.
    // parseConfig is total: no config, or an unreadable one, resolves to default-on.
    const cfg = parseConfig(await read(path.join(root, "config.json")));
    if (cfg.dashboard === false) {
      await fs.rm(dashboardPath, { force: true }).catch(() => {});
      return false;
    }

    const [person, goals, themes, todo, keepsakes, people, timeline, understanding] = await Promise.all([
      read(path.join(root, "person.md")),
      read(path.join(root, "goals.md")),
      read(path.join(root, "themes.md")),
      read(path.join(root, "todo.md")),
      read(path.join(root, "keepsakes.md")),
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
      keepsakes,
      people,
      timeline,
      understandingExists: understanding != null,
      generatedAt: todayStamp(),
      language: cfg.language,
    });

    await fs.writeFile(dashboardPath, md);
    return true;
  } catch {
    return false; // benign: never blocks a hook, recall, or a migration run
  }
}

/**
 * The SessionEnd path: rebuild the mirror only when the closing session was
 * Claudia's. Any other session — a coding session, a background task — gets no
 * vault effect at all. Never throws.
 *
 * @param {{ root: string, payload: import("../src/session.mjs").TranscriptHookPayload, home?: string }} opts
 *   `home` locates the transcript (Claude Code's own tree, not the vault)
 * @returns {Promise<boolean>} true if the mirror was written
 */
export async function rebuildDashboardAtClose({ root, payload, home = os.homedir() }) {
  if (!(await isClaudiaHookPayload(payload, home))) return false;
  return rebuildDashboard({ root });
}

/**
 * The hook payload on stdin, or whatever arrived within 3s — a hook must never hang.
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 3000);
  });
}

async function main() {
  const root = resolveVaultRoot();
  if (process.argv.includes("--hook")) {
    /** @type {import("../src/session.mjs").TranscriptHookPayload} */
    let payload = {};
    try {
      payload = JSON.parse((await readStdin()) || "{}");
    } catch {
      /* tolerate: an unreadable payload reads as "not Claudia" */
    }
    await rebuildDashboardAtClose({ root, payload });
  } else {
    await rebuildDashboard({ root });
  }
  process.exit(0);
}

// Run only when invoked directly (`node scripts/build-dashboard.mjs`), not on import.
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
