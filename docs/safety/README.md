# Safety

This subtree is the reference material for how Claudia stays safe: the
non-negotiable rules she operates under, how she recognises and routes danger,
which human resources she surfaces, and the machinery that runs the check on
every turn.

It is **reference**, not persona. Claudia's warmth and immersion live in
`skills/claudia/`; the rules and mechanics that sit _beneath_ that warmth live
here. When the two seem to conflict, the floor wins — immersion operates _above_
the [Safety floor](../../CONTEXT.md#safety--register), never through it.

## The core stance

**Safety lives in substance and in the [Crisis pivot](../../CONTEXT.md#safety--register),
not in repeated disclaimers.**

This is the enforcement principle of [ADR-0001](../adr/0001-safety-floor.md). A
warm companion that ends every third sentence with "I'm not a substitute for
professional care" is not safer — it is merely more annoying, and it trains the
person to stop reading the warnings. Real safety is:

- **Substance** — Claudia does the _right therapeutic thing_: she reflects and
  gently questions rather than affirming a distortion, she declines to give
  means information, she does not play along with a delusion. Refusing to be
  sycophantic on danger (floor rules 4 and 6) is worth more than any banner.
- **The Crisis pivot** — when she detects real, imminent danger she shifts,
  visibly and honestly, to _routing the person to human help_. Disclosure is
  honest **when it matters** — a direct question about her nature, or a crisis
  moment — never an ambient, infantilising tic.

Immersion and safety are allies, not opposites. A person in distress is helped
more by a companion who stays present _and_ hands them a real phone number than
by one who breaks character to recite legal boilerplate.

## Why a floor at all

Every documented real-world harm from a therapy chatbot came from an agent with
**no floor**: NEDA's "Tessa" handing out calorie-deficit advice to people with
eating disorders (NPR, 2023); Character.AI, where a bot claimed to be a licensed
therapist and failed to respond to a distressed minor's self-harm — suits
settled Jan 2026 (CNN, 2026); the Stanford study showing commercial "therapy"
bots list bridges to someone who just lost their job, missing the obvious
suicidal intent (Moore, Haber et al., FAccT 2025). The floor exists so Claudia
is categorically different from these.

## What is here

- **[red-lines.md](./red-lines.md)** — the never/always rules, expanded from the
  floor into operational detail, each with a rationale and citation. The floor
  in [ADR-0001](../adr/0001-safety-floor.md) is the source of truth; this file
  is its operational reading.
- **[crisis-protocol.md](./crisis-protocol.md)** — the five risk categories, the
  C-SSRS / Columbia Protocol stratification logic, and the escalation decision
  flow. Describes how the Crisis pivot is _risk-stratified and adapted to the
  person, yet sitting on the floor_. Core message: Claudia **routes** to human
  help; she never "talks people down" alone.
- **[resources.md](./resources.md)** — how crisis resources are localised by
  country and language, and how Claudia detects or asks locale _before_ it is
  needed.
- **[classifier.md](./classifier.md)** — the design spec for the per-turn
  `UserPromptSubmit` safety hook: heuristic pre-filter, fast-model risk
  classifier, and the fail-safe rule.

## Related decisions

- [ADR-0001 — Safety floor beneath immersion](../adr/0001-safety-floor.md) (the
  non-negotiable floor and its enforcement principle)
- [ADR-0003 — Plugin runtime shape](../adr/0003-plugin-runtime-shape.md) (the
  per-turn safety hook and the `/help-now` command)
