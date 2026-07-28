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
import path from "node:path";
import { isEntrypoint } from "../src/entry.mjs";
import { pendingSessions } from "../src/pending.mjs";
import { resolveVaultRoot } from "../src/vault.mjs";

/**
 * Stems under `<root>/sessions` still owed a distillation, oldest first.
 * Any error — including a vault that does not exist yet — reads as "nothing
 * pending", never as a throw.
 *
 * @param {{ root: string }} opts
 * @returns {Promise<string[]>}
 */
export async function listPending({ root }) {
  try {
    return pendingSessions(await fs.readdir(path.join(root, "sessions")));
  } catch {
    return [];
  }
}

/** @returns {Promise<void>} always exits 0 itself; never rejects */
async function main() {
  try {
    for (const stem of await listPending({ root: resolveVaultRoot() })) process.stdout.write(stem + "\n");
  } catch {
    /* fail silent */
  }
  process.exit(0);
}

// Run only when invoked directly, not on import (tests import listPending).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
