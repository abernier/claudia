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
 * `/forget`. Gated on isClaudiaSession so coding sessions (the plugin may be
 * user-scoped) never pollute the "since you last spoke with Claudia" clock.
 */

import { promises as fs, createReadStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { isEntrypoint } from "../src/entry.mjs";
import { resolveTranscriptPath, isClaudiaActivationLine } from "../src/session.mjs";
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
 * Does this transcript contain a genuine Claudia activation? Streamed line by line,
 * stopping at the first hit.
 *
 * This used to be a bounded head-read (the first 256 KB), which looked cheap and was
 * wrong: an image pasted early in the conversation is a single ~500 KB line, so
 * everything after it — the activation included — fell outside the window, the gate
 * read "not a Claudia session", and the time layer silently switched off for the whole
 * conversation. That is precisely the bug ADR-0012 exists to close, so the gate may not
 * be the thing that reintroduces it. A stream costs one substring test per line and
 * exits on the first match (turn one, in a real Claudia session); only a session that
 * never activates Claudia is walked to the end.
 *
 * @param {string} file  path to the JSONL transcript
 * @returns {Promise<boolean>}
 */
async function hasClaudiaActivation(file) {
  const stream = createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) if (isClaudiaActivationLine(line)) return true;
    return false;
  } finally {
    rl.close();
    stream.destroy();
  }
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
  // GATE: only Claudia conversations get time context and a last-seen tick.
  const transcriptPath = resolveTranscriptPath(payload, home);
  if (!transcriptPath) return null;
  let activated;
  try {
    activated = await hasClaudiaActivation(transcriptPath);
  } catch {
    return null; // no transcript yet (e.g. first turn) → stay silent
  }
  if (!activated) return null;

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
