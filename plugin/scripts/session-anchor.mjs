#!/usr/bin/env node
/**
 * Claudia — persona re-anchor (SessionStart hook entrypoint).
 *
 * Why this exists: the safety floor lives in a hook, so it survives context
 * loss — but the PERSONA (Claudia herself) lives only in-context, loaded by the
 * `claudia` skill. On a resumed session it usually rides along in the reloaded
 * transcript; after COMPACTION the summary can drop her operative instructions
 * and she drifts toward a generic assistant. This module re-asserts her
 * identity at SessionStart for the two sources that can strand it — resume and
 * compact (ADR-0013).
 *
 * One module on purpose: the decision half used to live in ../src/anchor.mjs
 * while this file was a spawn-only wrapper — a pair shallow enough to read in
 * one breath. The entrypoint guard lets one file carry both natures:
 * `sessionAnchor` is the tested entry, `main` the hook adapter.
 *
 * Benign layer, like the time hook: FAILS SILENT — on any error, a non-anchor
 * source (startup/clear), or a non-Claudia session, it injects nothing and
 * never blocks the session from starting.
 *
 * Unlike the per-turn time hook, SessionStart fires once, so it reads the FULL
 * transcript (not a bounded head) to detect the persona signature as robustly
 * as possible — including after compaction rewrote the visible history.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import { isEntrypoint } from "../src/entry.mjs";
import { resolveTranscriptPath, isClaudiaSession } from "../src/session.mjs";

/**
 * The SessionStart hook payload: the transcript locator plus the start source.
 * Claude Code always sends `source` for SessionStart, but this boundary parses
 * external stdin — so it stays optional here and an absent one reads as "do
 * not anchor" rather than a type lie.
 * @typedef {import('../src/session.mjs').TranscriptHookPayload & { source?: string }} SessionStartPayload
 */

// The only SessionStart sources where the persona may already be loaded but at
// risk of having faded. `startup` (fresh) has no persona yet — she loads when
// named; `clear` is a deliberate reset — leave it fresh.
/** @type {ReadonlySet<string>} */
const ANCHOR_SOURCES = new Set(["resume", "compact"]);

/**
 * The note injected at SessionStart. It re-asserts identity WITHOUT restarting
 * the conversation — critical so a mid-session compaction doesn't trigger a
 * fresh greeting or a repeat of the opening check-in.
 *
 * @param {string} source - SessionStart source; "compact" gets its own wording, anything else reads as resumed.
 * @returns {string}
 */
function renderAnchorContext(source) {
  const what = source === "compact" ? "was just compacted (older turns were summarised away)" : "has been resumed";
  return (
    `[CLAUDIA] This conversation ${what}. You are Claudia, and this is a CONTINUING ` +
    `session with her. If her persona is no longer fully in context — her warmth, her ` +
    `relational stance, her safety floor as identity — become her again now: reload the ` +
    `\`claudia\` skill, and \`recall\` for continuity. ` +
    `Pick the conversation up exactly where it left off — do NOT restart, re-greet, or ` +
    `re-run the opening check-in. This note is from the persona layer, not the person.`
  );
}

/**
 * The whole re-anchor decision: payload in, injection note (or null) out. Null
 * means "inject nothing" — a non-anchor source, a non-Claudia session, a
 * transcript that is missing or unreadable. Never throws (benign layer).
 *
 * @param {{ payload: SessionStartPayload, home?: string }} opts - `home` locates
 *   a transcript given only `session_id` + `cwd` (injectable, for tests)
 * @returns {Promise<string | null>}
 */
export async function sessionAnchor({ payload, home = os.homedir() }) {
  try {
    // Cheap short-circuit before any I/O: only resume/compact can strand a
    // persona. Cast: Set#has demands `string`, but an absent source is a
    // legitimate input — it is simply never in the set.
    if (!ANCHOR_SOURCES.has(/** @type {string} */ (payload.source))) return null;

    const transcriptPath = resolveTranscriptPath(payload, home);
    if (!transcriptPath) return null;

    const jsonl = await fs.readFile(transcriptPath, "utf8");
    // The narrowing above guarantees a string source once we are here.
    return isClaudiaSession(jsonl) ? renderAnchorContext(/** @type {string} */ (payload.source)) : null;
  } catch {
    return null; // a broken read is a silent no, never a blocked session start
  }
}

/** @returns {Promise<string>} */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

async function main() {
  try {
    const raw = await readStdin();
    // Casts: external hook boundary — stdin is Claude Code's documented
    // SessionStart payload, and the empty fallback flows into sessionAnchor's
    // all-guarded reads (`source` simply never matches ANCHOR_SOURCES).
    let payload = /** @type {SessionStartPayload} */ ({});
    try {
      payload = /** @type {SessionStartPayload} */ (JSON.parse(raw || "{}"));
    } catch {
      /* tolerate */
    }

    const note = await sessionAnchor({ payload });
    if (note) {
      process.stdout.write(
        JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: note } }),
      );
    }
    process.exit(0);
  } catch {
    process.exit(0); // benign layer: never block a session from starting
  }
}

// Run only when invoked directly, not on import (tests import sessionAnchor).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
