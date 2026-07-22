#!/usr/bin/env node
/**
 * Claudia — list sessions that were archived but never distilled.
 *
 * Prints one `YYYY-MM-DD` per line, oldest first; prints nothing when there is
 * nothing to catch up on. The `recall` skill runs this at the start of a
 * conversation to distill any session whose close was too abrupt to run
 * `distill-session` live (ADR-0016). Detection is deterministic (this script);
 * the distillation itself is the model's job.
 *
 * Benign layer: FAILS SILENT — on any error or a missing directory it prints
 * nothing and exits 0, never blocking recall.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pendingSessions } from "../src/pending.mjs";

async function main() {
  try {
    const dir = path.join(os.homedir(), ".claudia", "sessions");
    let names;
    try {
      names = await fs.readdir(dir);
    } catch {
      return process.exit(0); // no sessions dir yet → nothing pending
    }
    for (const date of pendingSessions(names)) process.stdout.write(date + "\n");
  } catch {
    /* fail silent */
  }
  process.exit(0);
}

main();
