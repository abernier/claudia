#!/usr/bin/env node
/**
 * Claudia — per-turn safety check (UserPromptSubmit hook entrypoint).
 *
 * Thin wrapper around ../src/safety.mjs. Runs OUTSIDE the persona (ADR-0001 rule
 * 8 / ADR-0003). Stage 2 (fast-model classifier via the local `claude` CLI) is
 * OFF by default — set CLAUDIA_MODEL_CLASSIFIER=on to enable. Reads the hook
 * payload (JSON on stdin), emits UserPromptSubmit hook output (JSON on stdout).
 * Never blocks the turn.
 *
 * GATED (ADR-0036): the plugin is user-scoped, so this fires in every session on
 * the machine. It screens only a Claudia session — the transcript shows the
 * `claudia` skill activated, or the prompt names her (turn one, before the
 * activation is written) — and only the person's own words, never a harness
 * block such as a `<task-notification>`. Everywhere else it is silent.
 *
 * FAIL-SAFE inside the gate: once the session is established as Claudia's, any
 * error escalates; we never suppress. A gate that cannot tell (no transcript,
 * unreadable) reads as "not Claudia" unless the prompt names her.
 */

import { execFile } from "node:child_process";
import os from "node:os";
import { isEntrypoint } from "../src/entry.mjs";
import { isClaudiaHookPayload, namesClaudia } from "../src/gate.mjs";
import { decide, escalationContext, personsWords } from "../src/safety.mjs";

/**
 * UserPromptSubmit hook payload: the transcript locator plus the prompt text,
 * under whichever field name Claude Code sends it. All fields optional — this
 * parses external stdin and falls back to `{}`.
 * @typedef {import("../src/session.mjs").TranscriptHookPayload & { prompt?: string, user_prompt?: string, message?: string }} UserPromptSubmitPayload
 */

/**
 * @returns {Promise<string>} Hook stdin, or whatever arrived within the window
 *   (2s, overridable via CLAUDIA_STDIN_TIMEOUT_MS so the race is testable
 *   without waiting on the production clock).
 */
function readStdin() {
  // Floor of 25ms: a stray tiny (or unparsable) override must not truncate the
  // read — a screen decided on cut-off input is the one gap fail-safe can't see.
  const override = Number(process.env.CLAUDIA_STDIN_TIMEOUT_MS);
  const windowMs = override >= 25 ? override : 2000;
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), windowMs);
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
          resolve({
            ok: true,
            verdict: /** @type {import("../src/safety.mjs").ClassifierVerdict} */ (JSON.parse(m[0])),
          });
        } catch {
          resolve({ ok: false });
        }
      },
    );
    child.on("error", () => resolve({ ok: false }));
  });
}

/**
 * Emit the UserPromptSubmit hook output that injects the escalation note.
 * @param {string} note - the full note, as escalationContext() renders it
 * @returns {void}
 */
function emit(note) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note },
    }),
  );
}

/**
 * The hook's stdin, read as a payload: JSON when it parses, else the raw text as
 * the prompt (malformed input is still screened — if it is a Claudia turn).
 * @param {string} raw
 * @returns {{ payload: UserPromptSubmitPayload, prompt: string }}
 */
function parseInput(raw) {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object") return { payload: {}, prompt: raw };
    const payload = /** @type {UserPromptSubmitPayload} */ (parsed);
    return { payload, prompt: String(payload.prompt || payload.user_prompt || payload.message || "") };
  } catch {
    return { payload: {}, prompt: raw };
  }
}

/**
 * The whole per-turn decision: raw stdin in, the escalation note (or null for
 * silence) out. Never throws.
 *
 * Order matters. Harness blocks are stripped first, so a background task's report
 * is never screened and never counts as naming her. Then the gate: the person's
 * words name Claudia, or the transcript shows her activated. Only past the gate
 * does the fail-safe apply — from there, an error escalates.
 *
 * @param {{
 *   raw: string,
 *   home?: string,
 *   modelClassifierEnabled?: boolean,
 *   classify?: (text: string) => Promise<import("../src/safety.mjs").ClassifierResult>,
 * }} opts - `home` locates a transcript given only `session_id` + `cwd`;
 *   `classify` is the stage-2 model call (injectable, for tests)
 * @returns {Promise<string | null>}
 */
export async function safetyCheck({
  raw,
  home = os.homedir(),
  modelClassifierEnabled = false,
  classify = classifyWithModel,
}) {
  const { payload, prompt } = parseInput(raw);
  const words = personsWords(prompt);
  if (!words) return null; // nothing the person wrote — a task notification, a reminder

  // GATE: a Claudia session, or a turn that names her. Never throws.
  const claudia = namesClaudia(words) || (await isClaudiaHookPayload(payload, home));
  if (!claudia) return null;

  try {
    const { escalate, reason } = await decide(words, { modelClassifierEnabled, classifyWithModel: classify });
    return escalate ? escalationContext(reason) : null;
  } catch {
    return escalationContext("safety-check error — failing safe");
  }
}

/**
 * Hook entrypoint — always exits 0. safetyCheck never throws; the catch is the
 * floor's default for an error in this adapter itself.
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const note = await safetyCheck({
      raw: await readStdin(),
      modelClassifierEnabled: process.env.CLAUDIA_MODEL_CLASSIFIER === "on",
    });
    if (note) emit(note);
    process.exit(0);
  } catch {
    emit(escalationContext("safety-check error — failing safe"));
    process.exit(0);
  }
}

// Run only when invoked directly, not on import (tests import safetyCheck).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
