---
status: accepted
---

# Life timeline — a person-led lifeline, trauma-informed

Claudia can keep a **life timeline** at `~/.claudia/timeline.md`: both a memory
structure (the *arc* of a life, feeding the [working understanding](0008-working-understanding.md)
and warm openings) and an **offered life-review tool**. The healthy analogue is the
counselling **"lifeline"** exercise plus **life-review / reminiscence** (Butler,
1963; Pinquart & Forstmeier, 2012 — ego-integrity g≈0.64, depression g≈0.57) and
**narrative re-authoring** (White & Epston). We explicitly do **not** copy the
clinical NIMH **Life Chart Method** — that is symptom tracking, which the floor
forbids.

## Trauma-informed guardrails (non-negotiable)

Behave as if permanently in Herman's **Phase 1 (safety/stabilisation)** — the
timeline is *not* a container for processing trauma.

- **Opt-in, never imposed.** Painful events appear only if the person volunteers
  them, marked plainly ("loss of my father · 2019") — **never forced, never
  detailed on the timeline** (the felt detail lives in fiches/sessions, linked).
- **Never force a chronological trauma inventory** or "fill missing years" (SAMHSA
  TIP 57: pursuing details can retraumatise). **Never infer** an unstated event —
  `source: person-stated` only.
- **Titrate and pace** (window of tolerance): small amounts; if distress rises,
  **ground and defer** rather than push.
- **Positive and neutral events are first-class** — otherwise reminiscence can
  worsen mood in ruminators (Brinker, 2013). Externalise problems; surface
  strengths and "what got you through" (resilience / unique outcomes).
- **Safety floor first.** On risk signals, invoke [crisis](../../skills/crisis/SKILL.md),
  never "continue the timeline". The person can edit, redact, or delete anything.

## Shape & rendering

Life events **broadly** (birth, moves, relationships, work, education, place,
health, achievements, losses, turning points), **partial by design** (gaps are
fine). Per-event fields: flexible **date** (exact / year / age / "the hard year" /
undated), person-authored **title**, optional **valence** (their own felt sense,
never a clinical severity score), **people** (`[[fiche]]` links), **note**
(meaning / what got them through), **session** backlinks, a **sensitivity** flag,
and `source: person-stated`.

**Canonical store = a clean, chronological, sectioned dated list** (life stages as
headings) — it holds every field and the wikilinks. A **mermaid `timeline` is an
optional generated "see the shape of it" view only** (short labels, one `section`
per stage); mermaid nodes can't hold valence, links, or notes, so they are never
the store.

## Consequences

- New `skills/timeline/`; `~/.claudia/timeline.md`. It is a **view over** memory:
  events cross-link to person fiches and session summaries.
- `intake` and `understand` feed it; `recall` should surface the arc (small
  follow-up wiring).
