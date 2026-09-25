#!/usr/bin/env node
/**
 * Claudia — per-turn time context (UserPromptSubmit hook entrypoint).
 *
 * Thin wrapper around ../src/time.mjs. Re-anchors "now" every turn so a
 * conversation resumed the next morning no longer believes it is still last night
 * (ADR-0012), and reports the gap since the person last spoke with Claudia.
 *
 * Runs alongside the safety hook on UserPromptSubmit, but is a SEPARATE, benign
 * layer: unlike safety (fail-safe → escalate), time FAILS SILENT — on any error
 * or a non-Claudia session it injects nothing and touches no state.
 *
 * State: `~/.claudia/last-seen` (one epoch-ms line), local-only, covered by
 * `/forget`. Gated on a Claudia session (src/gate.mjs, ADR-0036) so coding sessions
 * (the plugin is user-scoped) never pollute the "since you last spoke with Claudia"
 * clock.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isEntrypoint } from "../src/entry.mjs";
import { isClaudiaHookPayload } from "../src/gate.mjs";
import { buildTimeContext, renderTimeContext } from "../src/time.mjs";
import { resolveVaultRoot } from "../src/vault.mjs";

// This hook only ever reads the transcript-locator fields of the UserPromptSubmit
// payload, so it is consumed as its TranscriptHookPayload subset (not the fuller
// prompt-bearing shape safety-check.mjs needs).
/** @typedef {import("../src/session.mjs").TranscriptHookPayload} TranscriptHookPayload */

/** @returns {Promise<string>} Everything from stdin, or whatever arrived within 2s — a hook must never hang. */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

/**
 * Emit the hook stdout envelope that injects `note` into the turn.
 * @param {string} note
 */
function emit(note) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note },
    }),
  );
}

/**
 * The per-turn time note at the vault seam (ADR-0035): payload in, note out,
 * `<root>/last-seen` ticked as the one vault effect. Returns null — and touches
 * nothing — for anything but a genuine Claudia conversation.
 *
 * @param {{ root: string, payload: TranscriptHookPayload, home?: string, now?: Date }} opts
 *   `home` locates the transcript (Claude Code's own tree, not the vault)
 * @returns {Promise<string | null>} the note to inject, or null to stay silent
 */
export async function timeContextNote({ root, payload, home = os.homedir(), now = new Date() }) {
  // GATE (ADR-0036): only Claudia conversations get time context and a last-seen
  // tick. No transcript yet (e.g. the first turn) reads as "not Claudia" → silent.
  if (!(await isClaudiaHookPayload(payload, home))) return null;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const lastSeenPath = path.join(root, "last-seen");

  /** @type {number | null} */
  let prevMs = null;
  try {
    const parsed = Number.parseInt((await fs.readFile(lastSeenPath, "utf8")).trim(), 10);
    if (Number.isFinite(parsed)) prevMs = parsed;
  } catch {
    /* no last-seen yet → first_time */
  }

  const note = renderTimeContext(buildTimeContext({ now, prevMs, timeZone }));

  // Tick last-seen AFTER computing the gap, so this turn measures from the last.
  await fs.mkdir(root, { recursive: true }).catch(() => {});
  await fs.writeFile(lastSeenPath, String(now.getTime())).catch(() => {});

  return note;
}

/** @returns {Promise<void>} */
async function main() {
  try {
    const raw = await readStdin();
    /** @type {TranscriptHookPayload} */
    let payload = {};
    try {
      payload = /** @type {TranscriptHookPayload} */ (JSON.parse(raw || "{}"));
    } catch {
      /* tolerate */
    }

    const note = await timeContextNote({ root: resolveVaultRoot(), payload });
    if (note) emit(note);
    process.exit(0);
  } catch {
    process.exit(0); // benign layer: never block or shout on failure
  }
}

// Run only when invoked directly, not on import (tests import timeContextNote).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
