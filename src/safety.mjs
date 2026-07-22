/**
 * Claudia — safety classification logic (pure, importable, testable).
 *
 * The hook entrypoint (scripts/safety-check.mjs) is a thin wrapper around this.
 * Everything here is side-effect-free so it can be unit-tested without spawning a
 * process or calling a model.
 */

// Stage 1a — CLEAR risk (explicit). High recall; escalate with no model call.
export const CLEAR = [
  { name: "suicide", re: /\b(kill(ing)? myself|end(ing)? (it all|it|my life)|suicid|take my (own )?life|don'?t want to (be here|live|wake up)|better off dead|no reason to live|jump off|hang myself|overdose)\b/i },
  { name: "self-harm", re: /\b(cut(ting)? myself|hurt myself|self.?harm|burn myself)\b/i },
  { name: "violence", re: /\b(kill (him|her|them|someone)|hurt (him|her|them|someone)|want to (kill|hurt)|shoot (him|her|them|up)|stab)\b/i },
  { name: "abuse", re: /\b(is (hitting|abusing|hurting|raping) me|being abused|was raped|assaulted me)\b/i },
  { name: "medical", re: /\b(overdosed|can'?t breathe|chest pain|bleeding (a lot|out)|took (all|too many) (the )?pills|passed out|unconscious)\b/i },
  { name: "psychosis", re: /\b(voices telling me|they'?re watching me|being controlled|not real anymore|losing my mind)\b/i },
];

// Multilingual seeds for clear risk (Claudia is international). Extend freely.
export const CLEAR_ML = /\b(me suicider|me tuer|en finir|plus envie de vivre|me faire du mal|passer à l'acte|suizidieren|umbringen|matarme|suicidarme|quitar la vida|farla finita|uccidermi)\b/i;

// Stage 1b — UNCERTAIN: veiled / ambiguous distress that MIGHT be risk.
export const UNCERTAIN = [
  /\b(can'?t (do this|go on|take (it|this)) anymore|want (it|the pain) to stop|so tired of (it all|everything|living)|what'?s the point|give up on everything|don'?t see a way out|everyone would be better off without me|disappear forever)\b/i,
  /\b(je (n'?en peux plus|veux que (ça|tout) s'arrête|suis fatigué de (tout|vivre))|à quoi bon|aucune issue|tout le monde serait mieux sans moi|disparaître pour de bon)\b/i,
];

/**
 * Outcome of the synchronous first pass. Discriminated: any non-safe band
 * carries a concrete reason string (decide() forwards it as an escalation
 * reason, which must be a string — see SafetyDecision).
 * @typedef {{ band: 'clear'|'uncertain', reason: string } | { band: 'safe', reason: null }} HeuristicResult
 */

/**
 * Pure, synchronous first pass. Returns the risk band and a reason.
 * @param {string} text - Prompt text to screen (defensively coerced).
 * @returns {HeuristicResult}
 */
export function heuristic(text) {
  const t = String(text || "");
  const clear = CLEAR.find((c) => c.re.test(t)) || (CLEAR_ML.test(t) ? { name: "risk" } : null);
  if (clear) return { band: "clear", reason: clear.name };
  if (UNCERTAIN.some((re) => re.test(t))) return { band: "uncertain", reason: "veiled-distress" };
  return { band: "safe", reason: null };
}

/**
 * The context note injected into the turn when we escalate.
 * @param {string} reason - Why we escalated (an escalating SafetyDecision always
 *   carries a string reason — the discriminated union guarantees it).
 * @returns {string}
 */
export function escalationContext(reason) {
  return (
    `[CLAUDIA SAFETY] The per-turn safety check flagged possible risk (${reason}). ` +
    `Invoke the \`crisis\` skill NOW: read docs/safety/crisis-protocol.md, assess with ` +
    `C-SSRS logic, stay WITH the person, and surface region-appropriate human help ` +
    `(docs/safety/resources.md). Do not counsel-and-continue as if this were an ordinary ` +
    `turn. This note is from the safety layer, not the person.`
  );
}

/**
 * Verdict parsed from the model classifier's output. Model output is untrusted,
 * so every field stays optional AND `risk` is a plain string: the model can emit
 * anything ("IMMINENT", "unknown", …) and decide() only trusts what it can
 * normalize to a recognized value.
 * @typedef {{ risk?: string, category?: string }} ClassifierVerdict
 */

/**
 * Contract for the injected model stage: ok=false means no usable verdict.
 * @typedef {{ ok: boolean, verdict?: ClassifierVerdict }} ClassifierResult
 */

/**
 * The final call: whether to escalate this turn, and why. Discriminated on
 * `escalate` so an escalation can never lack a reason and a non-escalation can
 * never carry one — callers narrow on `escalate` and pass `reason` straight to
 * escalationContext() without a null check.
 * @typedef {{ escalate: true, reason: string } | { escalate: false, reason: null }} SafetyDecision
 */

/**
 * Full decision. Deterministic except for the optional model stage, which is
 * injected (so tests pass a fake). FAIL-SAFE: an uncertain message with no usable
 * model verdict escalates.
 * @param {string} text - Prompt text to screen.
 * @param {{ modelClassifierEnabled?: boolean, classifyWithModel?: ((text: string) => Promise<ClassifierResult>) | null }} [options]
 * @returns {Promise<SafetyDecision>}
 */
export async function decide(text, { modelClassifierEnabled = false, classifyWithModel = null } = {}) {
  const h = heuristic(text);
  if (h.band === "clear") return { escalate: true, reason: h.reason };
  if (h.band === "safe") return { escalate: false, reason: null };

  // uncertain
  if (modelClassifierEnabled && classifyWithModel) {
    const res = await classifyWithModel(text);
    if (!res || !res.ok) return { escalate: true, reason: "uncertain, classifier unavailable — failing safe" };
    // The verdict is untrusted model text: normalize before matching so
    // "IMMINENT" or " elevated " still read as risk instead of falling through.
    const risk = String(res.verdict?.risk ?? "").trim().toLowerCase();
    if (risk === "imminent" || risk === "elevated") {
      return { escalate: true, reason: `model:${risk}:${res.verdict?.category || "?"}` };
    }
    // Only an explicit, recognized "none" may clear an uncertain message. Any
    // other value (typo, schema drift, empty verdict) counts as NO verdict.
    if (risk === "none") return { escalate: false, reason: null };
    return { escalate: true, reason: "uncertain, unrecognized classifier verdict — failing safe" };
  }
  return { escalate: true, reason: "veiled distress (model classifier off)" };
}
