#!/usr/bin/env node
/**
 * Claudia — list sessions that were archived but never distilled.
 *
 * Prints one session stem per line, oldest first; prints nothing when there is
 * nothing to catch up on. A stem is the archive key (ADR-0017): `<date>-<shortId>`
 * for session-keyed archives, plain `<date>` only for legacy date-keyed ones.
 * The `recall` skill runs this at the start of a conversation to distill any
 * session whose close was too abrupt to run `distill-session` live (ADR-0016).
 * Detection is deterministic (this script); the distillation itself is the
 * model's job.
 *
 * Benign layer: FAILS SILENT — on any error or a missing directory it prints
 * nothing and exits 0, never blocking recall.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pendingSessions } from "../src/pending.mjs";

/** @returns {Promise<void>} always exits 0 itself; never rejects */
async function main() {
  try {
    const dir = path.join(os.homedir(), ".claudia", "sessions");
    /** @type {string[]} */
    let names;
    try {
      names = await fs.readdir(dir);
    } catch {
      return process.exit(0); // no sessions dir yet → nothing pending
    }
    for (const stem of pendingSessions(names)) process.stdout.write(stem + "\n");
  } catch {
    /* fail silent */
  }
  process.exit(0);
}

main();
