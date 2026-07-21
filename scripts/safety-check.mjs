#!/usr/bin/env node
/**
 * Claudia — per-turn safety check (UserPromptSubmit hook).
 *
 * Two stages (docs/safety/classifier.md), run OUTSIDE the persona (ADR-0001 rule
 * 8 / ADR-0003 — the character is never trusted to catch its own risk):
 *
 *   Stage 1 — deterministic, zero-latency, HIGH-RECALL heuristic. Always on.
 *             CLEAR risk  → escalate immediately.
 *             UNCERTAIN   → hand to stage 2 (if enabled).
 *             CLEAR safe  → stay silent (immersion preserved).
 *
 *   Stage 2 — a fast-model classifier (Haiku) via the local `claude` CLI, using
 *             the user's existing auth (no separate API key). Refines the
 *             UNCERTAIN band only. OFF BY DEFAULT: set CLAUDIA_MODEL_CLASSIFIER=on
 *             to enable. Kept off by default because spawning a model on every
 *             lightly-distressed message (common in therapy) adds latency; the
 *             Stage-1 net already covers explicit danger.
 *
 * FAIL-SAFE everywhere: on any error, or when Stage 2 is uncertain/unavailable
 * for an already-suspicious message, we ESCALATE. We never suppress.
 *
 * Reads the Claude Code hook payload (JSON on stdin); emits UserPromptSubmit hook
 * output (JSON on stdout). Never blocks the turn — only augments it.
 */

import { execFile } from "node:child_process";

// --- Stage 1a: CLEAR risk (explicit). High recall; escalate with no model call.
const CLEAR = [
  { name: "suicide", re: /\b(kill myself|end (it all|it|my life)|suicid|take my (own )?life|don'?t want to (be here|live|wake up)|better off dead|no reason to live|jump off|hang myself|overdose)\b/i },
  { name: "self-harm", re: /\b(cut(ting)? myself|hurt myself|self.?harm|burn myself)\b/i },
  { name: "violence", re: /\b(kill (him|her|them|someone)|hurt (him|her|them|someone)|want to (kill|hurt)|shoot (him|her|them|up)|stab)\b/i },
  { name: "abuse", re: /\b(is (hitting|abusing|hurting|raping) me|being abused|was raped|assaulted me)\b/i },
  { name: "medical", re: /\b(overdosed|can'?t breathe|chest pain|bleeding (a lot|out)|took (all|too many) (the )?pills|passed out|unconscious)\b/i },
  { name: "psychosis", re: /\b(voices telling me|they'?re watching me|being controlled|not real anymore|losing my mind)\b/i },
];
const CLEAR_ML = /\b(me suicider|me tuer|en finir|plus envie de vivre|me faire du mal|passer à l'acte|suizidieren|umbringen|matarme|suicidarme|quitar la vida|farla finita|uccidermi)\b/i;

// --- Stage 1b: UNCERTAIN — veiled / ambiguous distress that MIGHT be risk.
// Deterministic and zero-latency; refined by Stage 2 when enabled, else escalated.
const UNCERTAIN = [
  /\b(can'?t (do this|go on|take (it|this)) anymore|want (it|the pain) to stop|so tired of (it all|everything|living)|what'?s the point|give up on everything|don'?t see a way out|everyone would be better off without me|disappear forever)\b/i,
  /\b(je (n'?en peux plus|veux que (ça|tout) s'arrête|suis fatigué de (tout|vivre))|à quoi bon|aucune issue|tout le monde serait mieux sans moi|disparaître pour de bon)\b/i,
];

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
}

function escalate(reason) {
  const context =
    `[CLAUDIA SAFETY] The per-turn safety check flagged possible risk (${reason}). ` +
    `Invoke the \`crisis\` skill NOW: read docs/safety/crisis-protocol.md, assess with ` +
    `C-SSRS logic, stay WITH the person, and surface region-appropriate human help ` +
    `(docs/safety/resources.md). Do not counsel-and-continue as if this were an ordinary ` +
    `turn. This note is from the safety layer, not the person.`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: context },
    })
  );
}

// --- Stage 2: fast-model classifier via `claude -p` (Haiku). Enabled on demand.
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
          resolve({ ok: true, verdict: JSON.parse(m[0]) });
        } catch {
          resolve({ ok: false });
        }
      }
    );
    child.on("error", () => resolve({ ok: false }));
  });
}

async function main() {
  try {
    const raw = await readStdin();
    let prompt = "";
    try {
      const p = JSON.parse(raw || "{}");
      prompt = p.prompt || p.user_prompt || p.message || "";
    } catch {
      prompt = raw;
    }

    // Stage 1a — clear risk → escalate now.
    const clear = CLEAR.find((c) => c.re.test(prompt)) || (CLEAR_ML.test(prompt) ? { name: "risk" } : null);
    if (clear) {
      escalate(clear.name);
      return process.exit(0);
    }

    // Stage 1b — uncertain?
    const uncertain = UNCERTAIN.some((re) => re.test(prompt));
    if (uncertain) {
      const enabled = process.env.CLAUDIA_MODEL_CLASSIFIER === "on";
      if (enabled) {
        const res = await classifyWithModel(prompt);
        if (!res.ok) return (escalate("uncertain, classifier unavailable — failing safe"), process.exit(0));
        const risk = res.verdict?.risk;
        if (risk === "imminent" || risk === "elevated") {
          return (escalate(`model:${risk}:${res.verdict?.category || "?"}`), process.exit(0));
        }
        return process.exit(0); // model cleared it
      }
      // Stage 2 disabled → fail safe on an already-suspicious message.
      escalate("veiled distress (model classifier off)");
      return process.exit(0);
    }

    // Clear safe → say nothing.
    process.exit(0);
  } catch {
    escalate("safety-check error — failing safe");
    process.exit(0);
  }
}

main();
