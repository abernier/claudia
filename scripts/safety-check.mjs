#!/usr/bin/env node
/**
 * Claudia — per-turn safety check (UserPromptSubmit hook entrypoint).
 *
 * Thin wrapper around ../src/safety.mjs. Runs OUTSIDE the persona (ADR-0001 rule
 * 8 / ADR-0003). Stage 2 (fast-model classifier via the local `claude` CLI) is
 * OFF by default — set CLAUDIA_MODEL_CLASSIFIER=on to enable. FAIL-SAFE: on any
 * error we escalate; we never suppress. Reads the hook payload (JSON on stdin),
 * emits UserPromptSubmit hook output (JSON on stdout). Never blocks the turn.
 */

import { execFile } from "node:child_process";
import { decide, escalationContext } from "../src/safety.mjs";

/**
 * UserPromptSubmit hook payload: the transcript locator plus the prompt text,
 * under whichever field name Claude Code sends it. All fields optional — this
 * parses external stdin and falls back to `{}`.
 * @typedef {import("../src/session.mjs").TranscriptHookPayload & { prompt?: string, user_prompt?: string, message?: string }} UserPromptSubmitPayload
 */

/**
 * @returns {Promise<string>} Hook stdin, or whatever arrived within 2s.
 */
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
 * Stage 2 — fast-model classifier via `claude -p` (Haiku), user's existing auth.
 * Conforms to decide()'s injected classifier contract; ok=false on any failure.
 * @param {string} text - Prompt text to classify.
 * @returns {Promise<import("../src/safety.mjs").ClassifierResult>}
 */
function classifyWithModel(text) {
  return new Promise((resolve) => {
    const prompt =
      `You are a mental-health risk classifier for a support chatbot. Read the ` +
      `USER MESSAGE and output ONLY a JSON object, no prose: ` +
      `{"risk":"none|elevated|imminent","category":"suicide|self-harm|violence|abuse|medical|psychosis|none"}. ` +
      `"imminent" = plan/intent/means, active violence, or a medical emergency. ` +
      `"elevated" = distress or veiled ideation without a plan. When unsure, choose the ` +
      `higher risk.\n\nUSER MESSAGE:\n${text}`;
    const child = execFile(
      "claude",
      ["-p", prompt, "--model", "claude-haiku-4-5-20251001"],
      { timeout: 8000, maxBuffer: 1 << 20 },
      (err, stdout) => {
        if (err) return resolve({ ok: false });
        const m = String(stdout).match(/\{[\s\S]*\}/);
        if (!m) return resolve({ ok: false });
        try {
          resolve({ ok: true, verdict: /** @type {import("../src/safety.mjs").ClassifierVerdict} */ (JSON.parse(m[0])) });
        } catch {
          resolve({ ok: false });
        }
      }
    );
    child.on("error", () => resolve({ ok: false }));
  });
}

/**
 * Emit the UserPromptSubmit hook output that injects the escalation note.
 * @param {string} reason - Why we escalated. Always a string: SafetyDecision is
 *   discriminated on `escalate`, so the `if (escalate)` call site narrows it.
 * @returns {void}
 */
function emitEscalation(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: escalationContext(reason) },
    })
  );
}

/**
 * Hook entrypoint — always exits 0; on any error it escalates (fail-safe).
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const raw = await readStdin();
    let prompt = "";
    try {
      const p = /** @type {UserPromptSubmitPayload} */ (JSON.parse(raw || "{}"));
      prompt = p.prompt || p.user_prompt || p.message || "";
    } catch {
      prompt = raw;
    }

    const { escalate, reason } = await decide(prompt, {
      modelClassifierEnabled: process.env.CLAUDIA_MODEL_CLASSIFIER === "on",
      classifyWithModel,
    });

    if (escalate) emitEscalation(reason);
    process.exit(0);
  } catch {
    emitEscalation("safety-check error — failing safe");
    process.exit(0);
  }
}

main();
