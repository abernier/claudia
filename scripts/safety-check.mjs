#!/usr/bin/env node
/**
 * Claudia — per-turn safety check (UserPromptSubmit hook entrypoint).
 *
 * Thin wrapper around ../src/safety.mjs. Runs OUTSIDE the persona (ADR-0001 rule
 * 8 / ADR-0003). Stage 2 (fast-model classifier via the local `claude` CLI) is
 * OFF by default — set CLAUDIA_MODEL_CLASSIFIER=on to enable. FAIL-SAFE: on any
 * error we escalate; we never suppress. Reads the hook payload (JSON on stdin),
 * emits UserPromptSubmit hook output (JSON on stdout). Never blocks the turn.
 *
 * **This file loads; it does not author.** Every criterion, the classifier prompt and
 * the conduct all come from the domain's declared floor. Today that is one known path;
 * once domains are packaged it is whatever the person's declaration points at, and
 * nothing else here changes.
 *
 * A floor that fails to load leaves the machine with **no rules**, so it matches
 * nothing — the empty composition, silent rather than permissive. That is deliberate
 * and it is not a hole left open: an unreadable floor is refused **at the gate**, in the
 * terminal, and a malformed pattern throws at compile time here rather than on somebody's
 * turn. What the machine must never do is invent a note of its own to cover the gap —
 * the chassis has nothing to say and no standing to say it. The guard is
 * `tests/structure.test.ts`, which fails the build if the shipped floor stops parsing.
 */

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileFloor, decide, renderConduct, NO_RULES } from "../src/safety.mjs";

/** Where the shipped domain keeps its site-1 rule. Stands in for the declaration. */
const FLOOR_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../docs/safety/floor.json");

/**
 * The declared site-1 rules, compiled once at startup. Never throws: an unreadable or
 * malformed floor yields no rules rather than a broken hook.
 * @returns {readonly import("../src/safety.mjs").FloorRule[]}
 */
function loadRules() {
  try {
    return compileFloor(JSON.parse(readFileSync(FLOOR_PATH, "utf8")));
  } catch {
    return NO_RULES;
  }
}

const RULES = loadRules();

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
 * The prompt is the firing domain's, already rendered — this function ships it and
 * parses what comes back.
 * @param {string} prompt - The domain's classifier prompt, with the turn interpolated.
 * @returns {Promise<import("../src/safety.mjs").ClassifierResult>}
 */
function classifyWithModel(prompt) {
  return new Promise((resolve) => {
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
 * Hand the turn to the firing domain's conduct. The chassis routes a string it has not
 * read; when the domain declared no conduct there is nothing to hand on, and it stays
 * silent rather than speaking for anyone.
 * @param {import("../src/safety.mjs").ConductPointer | null} pointer
 * @param {string} reason - Why we escalated.
 * @returns {void}
 */
function emitInterrupt(pointer, reason) {
  const note = renderConduct(pointer, reason);
  if (!note) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: note },
    }),
  );
}

/**
 * The fail-safe route, for when the machine itself broke. Inability to evaluate a
 * *declared* rule counts as that rule firing; with nothing declared there is nothing to
 * fail toward, and it emits nothing.
 * @param {string} reason
 * @returns {void}
 */
function failSafe(reason) {
  const first = RULES[0];
  if (!first) return;
  emitInterrupt({ owner: first.owner, rule: first.id, conduct: first.conduct }, reason);
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

    const decision = await decide(prompt, {
      rules: RULES,
      modelClassifierEnabled: process.env.CLAUDIA_MODEL_CLASSIFIER === "on",
      classifyWithModel,
    });

    if (decision.escalate) emitInterrupt(decision.interrupt, decision.reason);
    process.exit(0);
  } catch {
    failSafe("safety-check error — failing safe");
    process.exit(0);
  }
}

main();
