#!/usr/bin/env node
/**
 * Claudia — persona re-anchor (SessionStart hook entrypoint).
 *
 * Thin wrapper around ../src/anchor.mjs. On a session that is RESUMED or COMPACTED,
 * re-asserts Claudia's identity so she doesn't drift toward a generic assistant
 * after her operative instructions fall out of context (ADR-0013).
 *
 * Benign layer, like the time hook: FAILS SILENT — on any error, a non-anchor
 * source (startup/clear), or a non-Claudia session, it injects nothing and never
 * blocks the session from starting.
 *
 * Unlike the per-turn time hook, SessionStart fires once, so it reads the FULL
 * transcript (not a bounded head) to detect the persona signature as robustly as
 * possible — including after compaction rewrote the visible history.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import { resolveTranscriptPath, isClaudiaSession } from "../src/session.mjs";
import { ANCHOR_SOURCES, shouldAnchor, renderAnchorContext } from "../src/anchor.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

function emit(note) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: note },
    })
  );
}

async function main() {
  try {
    const raw = await readStdin();
    let payload = {};
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      /* tolerate */
    }

    const source = payload.source;
    // Cheap short-circuit before any I/O: only resume/compact can strand a persona.
    if (!ANCHOR_SOURCES.has(source)) return process.exit(0);

    const transcriptPath = resolveTranscriptPath(payload, os.homedir());
    if (!transcriptPath) return process.exit(0);

    let jsonl;
    try {
      jsonl = await fs.readFile(transcriptPath, "utf8");
    } catch {
      return process.exit(0);
    }

    if (shouldAnchor(source, isClaudiaSession(jsonl))) emit(renderAnchorContext(source));
    process.exit(0);
  } catch {
    process.exit(0); // benign layer: never block a session from starting
  }
}

main();
