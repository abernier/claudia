# Per-turn safety classifier — design spec

The spec for the `UserPromptSubmit` safety hook required by
[ADR-0003](../adr/0003-plugin-runtime-shape.md) and floor rule 8
([red-lines.md](./red-lines.md) N9/A1).

This is a **design spec, not final code.** It fixes the shape, the escalation
path, the verdict contract, and the fail-safe rule; exact patterns, thresholds,
model ids, and prompt wording are tuned in implementation and clinician review.

> **Why it exists at all:** the persona is _never_ trusted to catch its own risk.
> Stanford showed models miss clear suicidal ideation — listing bridges to a
> newly-unemployed person (Moore, Haber et al., FAccT 2025). So detection runs
> **outside** the persona, deterministically, on every turn.

---

## Shape

A `UserPromptSubmit` hook that runs on **every** user message, before the persona
responds, in two stages:

```
   user message
        │
        ▼
  ┌──────────────────────────┐
  │ Stage 1: heuristic        │   fast, local, high-recall
  │ pre-filter (patterns)     │   — no network, sub-millisecond
  └───────────┬──────────────┘
              │
     clean ───┴─── any hit / ambiguous
        │                 │
        ▼                 ▼
   pass through    ┌──────────────────────────┐
   (normal turn)   │ Stage 2: fast-model       │   escalate when in doubt
                   │ risk classifier (JSON)    │
                   └───────────┬──────────────┘
                               │
                     verdict ──┴── unavailable / error
                        │              │
                        ▼              ▼
              trigger Crisis pivot   FAIL SAFE → surface help
              per category+severity  (see below)
```

**Guiding bias: recall over precision.** A false positive costs a resource card;
a false negative can be fatal ([red-lines.md](./red-lines.md) A3). Tune both
stages accordingly.

---

## Stage 1 — heuristic pre-filter

A fast, local, high-recall keyword/pattern match. Its only job is to decide
**"is this obviously clean, or does it need a closer look?"** It never makes the
final call and it never suppresses — a hit only _escalates_ to Stage 2. It is
deliberately over-inclusive; precision is Stage 2's job.

Example trigger patterns (illustrative — the real list is broader, multilingual,
and covers obfuscation/leetspeak):

- **Suicidal ideation:** `kill myself`, `end my life`, `want to die`, `don't
want to wake up`, `better off dead`, `suicid*`, `no reason to live`, `goodbye`
  - finality framing, `giving away` + possessions.
- **Means-seeking (auto-high):** `how many … to overdose`, `lethal dose`, `how
much * is fatal`, `bridges taller than`, `painless way to`, method + quantity
  patterns. (These escalate even with no stated intent — [red-lines.md](./red-lines.md) N2.)
- **Self-harm (non-suicidal):** `cutting myself`, `burn myself`, `hurt myself`,
  `self-harm`, `relapse` + self-harm context.
- **Abuse disclosure:** `hit me`, `he/she hurts me`, `abus*`, `assault*`,
  `rape`, `molest*`, `not safe at home`, `afraid of him/her`.
- **Psychosis / loss of reality-testing:** `voices telling me`, `they're
watching me`, `implanted`, `I'm being followed`, `I'm a god`, `everyone is out
to get me`.
- **Medical emergency:** `took * pills`, `overdosed`, `bleeding`, `can't
breathe`, `chest pain`, `unconscious`, `has a gun`, `weapon`.
- **Eating disorder context** (gates N3): `calories`, `purge`, `restrict`,
  `binge`, `goal weight`, `fasting` — presence flips diet/weight-loss requests
  into a hard block.

Language note: patterns are maintained per language, since Claudia converses in
the person's own language. A message that trips _any_ bucket goes to Stage 2.

---

## Stage 2 — fast-model risk classifier

When Stage 1 flags (or is ambiguous), a **fast, cheap model** classifies the
turn and returns a small structured verdict. This is a separate call from the
persona (floor rule 8) — the classifier sees the message (and minimal recent
context) and does one job: emit a risk verdict.

### Draft system prompt

> You are a safety classifier for a mental-health support companion. You do NOT
> talk to the person. Your only job is to read the latest user message (with the
> short conversation context provided) and return a single JSON object judging
> imminent risk.
>
> Classify into these categories: `suicidal_ideation`, `self_harm`,
> `abuse_disclosure`, `psychosis`, `medical_emergency`, or `none`.
>
> For `suicidal_ideation`, map to C-SSRS-style severity:
>
> - `low` — passive death wish or non-specific thoughts of suicide (C-SSRS Q1–Q2).
> - `moderate` — thinking about _method/how_ (C-SSRS Q3).
> - `high` — intent, a plan, a timeframe, or means-seeking (C-SSRS Q4–Q6), OR
>   any request for means/method/dose/location. Means-seeking is always `high`
>   regardless of stated intent.
>
> For `medical_emergency` (overdose already taken, active injury, weapon in hand,
> someone unconscious), severity is always `high`.
>
> Rules:
>
> - Bias toward higher risk. When uncertain between two levels, choose the
>   higher. A missed crisis is far worse than a false alarm.
> - Detect _oblique_ and _implicit_ signals, not just explicit statements.
> - Never output anything except the JSON object. Never include advice, resource
>   numbers, or means information.
>
> Output schema:
>
> ```json
> {
>   "risk": true,
>   "category": "suicidal_ideation",
>   "severity": "high",
>   "means_seeking": true,
>   "minor_signal": false,
>   "confidence": 0.0,
>   "rationale": "one short phrase"
> }
> ```
>
> If there is no risk, return `{"risk": false, "category": "none", "severity":
"none", "means_seeking": false, "minor_signal": false, "confidence": <0–1>,
"rationale": "..."}`.

### Verdict contract

| Field           | Type                                    | Meaning                                                                                       |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `risk`          | bool                                    | Any risk signal present.                                                                      |
| `category`      | enum                                    | One of the five categories, or `none`.                                                        |
| `severity`      | `none` \| `low` \| `moderate` \| `high` | For SI, maps to the C-SSRS tiers in [crisis-protocol.md](./crisis-protocol.md).               |
| `means_seeking` | bool                                    | Request for method/dose/location — forces `high`.                                             |
| `minor_signal`  | bool                                    | Signals the person may be a minor → strictest safeguards ([red-lines.md](./red-lines.md) A7). |
| `confidence`    | 0–1                                     | The model's own confidence (used for logging/tuning, never to _downgrade_ a risk).            |
| `rationale`     | string                                  | One short phrase, for privacy-safe logging.                                                   |

The verdict drives the [Crisis pivot](./crisis-protocol.md): `category` selects
the branch, `severity` selects the SI tier, `means_seeking`/`minor_signal` force
escalation. A non-`none` high verdict triggers `/help-now`
([ADR-0003](../adr/0003-plugin-runtime-shape.md)).

---

## The FAIL-SAFE rule

**If the classifier is unavailable — timeout, API error, malformed JSON,
rate-limited — the hook ESCALATES (surfaces help) rather than SUPPRESSES.**

This is mandated by [ADR-0003](../adr/0003-plugin-runtime-shape.md): "the hook …
must **fail safe**: if the classifier is unavailable, escalate (surface help)
rather than suppress." Concretely:

- If **Stage 1 flagged** but **Stage 2 cannot return a valid verdict**, treat the
  turn as **at least moderate risk in the flagged category** and surface
  resources. Do not let the persona respond as if the turn were clean.
- Never let a classifier outage cause a _silent pass_. The failure mode we
  refuse is a real crisis slipping through because a network call failed.
- A false escalation here costs, at worst, an unneeded resource card — acceptable
  under the recall-over-precision bias. A false _suppression_ is the fatal
  failure we are designing against.
- Degrade gracefully on locale too: an unknown region falls back to the global
  directory ([resources.md](./resources.md)), never to silence.

---

## What this hook does NOT do

- It does **not** generate the person-facing message — the persona (informed by
  [crisis-protocol.md](./crisis-protocol.md)) does, once the pivot is triggered.
- It does **not** store transcript content; only the privacy-safe `rationale`
  and a session risk flag persist, under the memory constraints
  ([red-lines.md](./red-lines.md) A6).
- It does **not** replace clinician review — patterns, thresholds, and the prompt
  must be red-teamed with clinicians and at-risk-population representatives before
  and after deployment (APA Health Advisory, 2025; Moore, Haber et al., FAccT 2025).

---

## Sources

- ADR-0003 — Plugin runtime shape (the fail-safe requirement).
  [../adr/0003-plugin-runtime-shape.md](../adr/0003-plugin-runtime-shape.md)
- ADR-0001 — Safety floor beneath immersion (floor rule 8).
  [../adr/0001-safety-floor.md](../adr/0001-safety-floor.md)
- Moore, Haber et al. (2025), Stanford / ACM FAccT — models miss clear SI.
  https://hai.stanford.edu/news/exploring-the-dangers-of-ai-in-mental-health-care
- APA (2025) — Health Advisory: GenAI Chatbots & Wellness Apps for Mental Health.
  https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps
