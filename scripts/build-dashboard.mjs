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
 * Opt-out: `{ "dashboard": false }` in ~/.claudia/config.json — then no file is
 * written and any existing dashboard.md is removed (the opt-out must be real,
 * or /forget-ing the file would be undone at the next close).
 *
 * Benign layer: FAILS SILENT — it never blocks a hook or recall.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildDashboard, personName, sessionsForMirror } from "../src/dashboard.mjs";

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const read = (p) => fs.readFile(p, "utf8").catch(() => null);

async function main() {
  try {
    const root = path.join(os.homedir(), ".claudia");
    // Nothing to mirror until the person actually has a memory here.
    try {
      await fs.access(root);
    } catch {
      return process.exit(0);
    }

    const dashboardPath = path.join(root, "dashboard.md");

    // Respect the opt-out — and make it real by removing any stale mirror.
    try {
      const cfg = JSON.parse((await read(path.join(root, "config.json"))) || "{}");
      if (cfg.dashboard === false) {
        await fs.rm(dashboardPath, { force: true }).catch(() => {});
        return process.exit(0);
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
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
