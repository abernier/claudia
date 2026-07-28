#!/usr/bin/env node
/**
 * Claudia — the whole deterministic opening in ONE visible call.
 *
 * `recall` used to run four scripts back to back (pending check, migration,
 * dashboard, settings) — four tool-call lines on the person's screen before a
 * single human word. This orchestrator runs the same steps, same order, same
 * contracts, and prints one compact report instead.
 *
 * Two-phase on purpose: if un-distilled sessions are pending, it prints their
 * stems and STOPS — distillation is the model's job (`distill-session`), not a
 * script's. Recall hands each stem over, then runs this again; the second pass
 * finds nothing pending and completes the open (ADR-0016 ordering preserved).
 *
 * Fail-soft everywhere: the open must never be blocked by upkeep (each child
 * already fails silent; a missing child yields a quiet "unavailable" note).
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @param {string} script @returns {string | null} the child's stdout; null when the child is missing or crashed */
function run(script) {
  try {
    return execFileSync("node", [path.join(here, script)], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const pending = run("pending-sessions.mjs");
if (pending) {
  console.log("pending sessions — hand each stem to distill-session, then run this script again:");
  console.log(pending);
  process.exit(0);
}

const migration = run("migrate-vault.mjs"); // self-gates on the ledger; discloses only real work
run("build-dashboard.mjs"); // silent mirror refresh (ADR-0019)
const settings = run("config.mjs"); // the switches that shape the voice (ADR-0028)

// The first line lands exactly where narration tends to slip out — a
// context-local reminder beats distant prose (the person never sees tool output).
console.log("(silent open — no narration between here and your greeting)");
// A crashed detector must not read as an all-clear: "none" is a verdict only a
// live child may render — a broken one degrades visibly instead (ADR-0016).
console.log(pending === null ? "pending: unavailable (skipped) — a distillation may still be owed" : "pending: none");
console.log(`migration: ${migration || "unavailable (skipped)"}`);
console.log("settings:");
console.log(settings || "  unavailable — shipped defaults apply");
