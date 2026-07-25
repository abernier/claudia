/**
 * Claudia — the per-turn check: the MACHINE, and nothing else.
 *
 * **Mechanism without content.** This module owns the evaluation machine — the two
 * stages, the bands, the fail-safe direction — and holds no criterion of its own. Every
 * pattern arrives as DATA from whichever domain declared the rule
 * ([`docs/safety/floor.json`](../docs/safety/floor.json) is the one shipped today), and
 * the conduct an interrupt hands the turn to is **opaque** here: this module carries the
 * string, never reads it, and never says it. See
 * [`docs/composable-domains.md`](../docs/composable-domains.md) §4.3.
 *
 * Supplied no rules, it runs and matches nothing — **silent, not permissive**, and the
 * fail-safe below is correspondingly vacuous: there is nothing to fail toward.
 *
 * Everything here is side-effect-free, so it unit-tests without spawning a process,
 * reading a file, or calling a model. Loading the data is the wrapper's job
 * (`scripts/safety-check.mjs`); this module is handed the result.
 */

/**
 * One pattern a domain declares, as data. `name` is what surfaces as the escalation
 * reason — it is the domain's word, never ours.
 * @typedef {{ name: string, pattern: string, flags?: string }} CriterionSpec
 */

/**
 * A domain's site-1 rule, as declared on disk.
 * @typedef {{
 *   id: string,
 *   criteria?: { clear?: CriterionSpec[], clearMultilingual?: CriterionSpec | null, uncertain?: CriterionSpec[] },
 *   classifierPrompt?: string,
 *   conduct?: string,
 * }} FloorRuleSpec
 */

/**
 * What a domain hands the machine: an owner and its site-1 rules.
 * @typedef {{ owner?: string, rules?: FloorRuleSpec[] }} FloorSpec
 */

/** A compiled criterion: the domain's name for it, plus a usable matcher. */
/** @typedef {{ name: string, re: RegExp }} Criterion */

/**
 * A rule with its patterns compiled. `conduct` and `classifierPrompt` are carried
 * verbatim — the machine routes them and does not interpret them.
 * @typedef {{
 *   id: string,
 *   owner: string,
 *   clear: Criterion[],
 *   uncertain: Criterion[],
 *   classifierPrompt: string | null,
 *   conduct: string | null,
 * }} FloorRule
 */

/** The empty floor: nothing declared, so nothing can ever match. */
/** @type {readonly FloorRule[]} */
export const NO_RULES = [];

/**
 * @param {CriterionSpec} c
 * @returns {Criterion}
 */
function compileCriterion(c) {
  return { name: String(c.name || "risk"), re: new RegExp(c.pattern, c.flags || "") };
}

/**
 * Turn a domain's declared floor into compiled rules. Pure, and total: a malformed
 * pattern throws HERE, at load time in the terminal, rather than on somebody's turn.
 * @param {FloorSpec | null | undefined} spec
 * @returns {FloorRule[]}
 */
export function compileFloor(spec) {
  const owner = String(spec?.owner || "");
  return (spec?.rules || []).map((r) => {
    const crit = r.criteria || {};
    const clear = (crit.clear || []).map(compileCriterion);
    if (crit.clearMultilingual) clear.push(compileCriterion(crit.clearMultilingual));
    return {
      id: String(r.id || "?"),
      owner,
      clear,
      uncertain: (crit.uncertain || []).map(compileCriterion),
      classifierPrompt: r.classifierPrompt ?? null,
      conduct: r.conduct ?? null,
    };
  });
}

/**
 * Outcome of the synchronous first pass. Discriminated: any non-safe band names the
 * rule that matched, so an escalation can never lack a route.
 * @typedef {{ band: 'clear'|'uncertain', reason: string, rule: FloorRule } | { band: 'safe', reason: null, rule: null }} HeuristicResult
 */

/**
 * Pure, synchronous first pass over the declared rules, in order — first match wins.
 * With no rules it returns `safe` for every input, which is the empty composition:
 * the machine runs and matches nothing.
 * @param {string} text - Prompt text to screen (defensively coerced).
 * @param {readonly FloorRule[]} [rules] - The declared site-1 rules.
 * @returns {HeuristicResult}
 */
export function heuristic(text, rules = NO_RULES) {
  const t = String(text || "");
  for (const rule of rules) {
    const clear = rule.clear.find((c) => c.re.test(t));
    if (clear) return { band: "clear", reason: clear.name, rule };
  }
  for (const rule of rules) {
    const veiled = rule.uncertain.find((c) => c.re.test(t));
    if (veiled) return { band: "uncertain", reason: veiled.name, rule };
  }
  return { band: "safe", reason: null, rule: null };
}

/**
 * What an interrupt hands on: which rule of which domain fired, and that domain's
 * conduct **as an opaque payload**. The chassis routes it; nothing here reads it.
 * @typedef {{ owner: string, rule: string, conduct: string | null }} ConductPointer
 */

/**
 * Verdict parsed from the model classifier's output. Model output is untrusted, so
 * every field stays optional AND `risk` is a plain string: the model can emit anything
 * ("IMMINENT", "unknown", …) and decide() only trusts what it can normalize.
 * @typedef {{ risk?: string, category?: string }} ClassifierVerdict
 */

/**
 * Contract for the injected model stage: ok=false means no usable verdict.
 * @typedef {{ ok: boolean, verdict?: ClassifierVerdict }} ClassifierResult
 */

/**
 * The final call. Discriminated on `escalate`, so an escalation always carries both a
 * reason and a route, and a pass can carry neither.
 * @typedef {{ escalate: true, reason: string, interrupt: ConductPointer } | { escalate: false, reason: null, interrupt: null }} SafetyDecision
 */

/** @type {SafetyDecision} */
const PASS = { escalate: false, reason: null, interrupt: null };

/**
 * @param {FloorRule} rule
 * @param {string} reason
 * @returns {SafetyDecision}
 */
function interrupt(rule, reason) {
  return { escalate: true, reason, interrupt: { owner: rule.owner, rule: rule.id, conduct: rule.conduct } };
}

/**
 * Full decision. Deterministic except for the optional model stage, which is injected
 * (so tests pass a fake). FAIL-SAFE: an uncertain message with no usable model verdict
 * escalates — inability to evaluate a *declared* rule counts as that rule firing. With
 * no rules declared nothing is ever uncertain, so the fail-safe never arises.
 * @param {string} text - Prompt text to screen.
 * @param {{
 *   rules?: readonly FloorRule[],
 *   modelClassifierEnabled?: boolean,
 *   classifyWithModel?: ((prompt: string) => Promise<ClassifierResult>) | null,
 * }} [options]
 * @returns {Promise<SafetyDecision>}
 */
export async function decide(
  text,
  { rules = NO_RULES, modelClassifierEnabled = false, classifyWithModel = null } = {},
) {
  const h = heuristic(text, rules);
  if (h.band === "clear") return interrupt(h.rule, h.reason);
  if (h.band === "safe") return PASS;

  // uncertain — stage 2, on the rule's own prompt. A rule with no prompt has no
  // second stage to run, so it fails safe immediately.
  if (modelClassifierEnabled && classifyWithModel && h.rule.classifierPrompt) {
    const res = await classifyWithModel(h.rule.classifierPrompt.replace("{text}", String(text || "")));
    if (!res || !res.ok) return interrupt(h.rule, "uncertain, classifier unavailable — failing safe");
    // The verdict is untrusted model text: normalize before matching so "IMMINENT"
    // or " elevated " still read as risk instead of falling through.
    const risk = String(res.verdict?.risk ?? "")
      .trim()
      .toLowerCase();
    if (risk === "imminent" || risk === "elevated") {
      return interrupt(h.rule, `model:${risk}:${res.verdict?.category || "?"}`);
    }
    // Only an explicit, recognized "none" may clear an uncertain message. Any other
    // value (typo, schema drift, empty verdict) counts as NO verdict.
    if (risk === "none") return PASS;
    return interrupt(h.rule, "uncertain, unrecognized classifier verdict — failing safe");
  }
  return interrupt(h.rule, `${h.reason} (model classifier off)`);
}

/**
 * Fill the reason into the domain's conduct. A `{reason}` slot substitution and nothing
 * else: the chassis hands the turn to conduct it has not read.
 * @param {ConductPointer | null} pointer
 * @param {string} reason
 * @returns {string | null} The note to inject, or null when the firing domain declared
 *   no conduct — in which case the chassis has nothing to say and says nothing.
 */
export function renderConduct(pointer, reason) {
  if (!pointer?.conduct) return null;
  return pointer.conduct.split("{reason}").join(reason);
}
