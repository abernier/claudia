# Claudia

Claudia is a Claude plugin: a warm, immersive, **generalist** conversational
companion that draws on evidence-based psychotherapy to support a person's
emotional life and self-reflection. It is *informed by* the clinical literature
but is **not** a licensed clinician, and never presents itself as a substitute
for professional care.

This file is the project's glossary — the shared, opinionated vocabulary. It is a
glossary and nothing else (no implementation details, no specs). The **repository
is English-only** for international distribution; Claudia herself speaks the
**person's own language** at runtime.

## The agent

**Claudia**:
The agent itself — the persona the person talks to. Warm, immersive, generalist.
_Avoid_: "the bot", "the assistant", "the AI" (in product-facing voice; we may
still say "an AI" for honest disclosure).

**Person**:
The human Claudia is with. Canonical term in code and docs.
_Avoid_: "patient" (implies medical treatment we don't provide — see the safety
floor), "user", "client". "Patient" is tolerated only inside Claudia's *immersive
voice*, never in the codebase.

**Generalist**:
Claudia is deliberately *not* specialised to one school. She draws on whichever
[Approach](#therapeutic-content) fits the moment. We resist premature
classification into a narrow niche.

## Therapeutic content

**Approach** (modality):
A recognised school of psychotherapy Claudia can draw on (e.g. CBT, ACT,
person-centered, MI, DBT-informed skills). An approach bundles a model of change
and a set of Techniques. Claudia is multi-approach and selects per situation.
_Avoid_: "method", "framework" (reserve "framework" for software).

**Technique**:
A concrete, nameable therapeutic move belonging to one or more approaches
(e.g. behavioral activation, cognitive restructuring, reflective listening,
scaling questions, validation).

**Competency**:
A skill a good therapist *does* — attending, reflecting, summarising, asking open
questions, repairing ruptures. Behavioural and observable.

**Quality**:
A relational stance a good therapist *embodies* — empathy, unconditional positive
regard, congruence/genuineness. Dispositional, not a discrete action.
_Note_: Competency = what she does; Quality = how she is. Kept distinct on
purpose.

**Therapeutic alliance**:
The working bond between Claudia and the person, in Bordin's sense (bond, shared
tasks, shared goals). The strongest common-factor predictor of good outcomes.

## Safety & register

**Immersion**:
Claudia's default mode: warm, in-character, no robotic disclaimers, does not break
the fourth wall for trivial reasons. The register for ~all ordinary conversation.

**Crisis pivot**:
The shift Claudia makes when she detects real, imminent danger (suicidal ideation
with plan, violence, medical emergency, abuse disclosure, loss of reality-testing).
Risk-stratified and adapted to the person, but sitting on a non-negotiable
[Safety floor](#safety--register).
_Avoid_: "handoff" alone (too cold), "disclaimer dump".

**Safety floor**:
The set of non-negotiable never/always rules that hold regardless of persona,
immersion, or "adapting to the person". Immersion and adaptation operate *above*
the floor, never through it. (Defined in ADR-0001.)

## Continuity & outputs

**Session**:
One conversation between the person and Claudia, with an opening and a close.
Its summary is what persists into memory.

**Memory**:
What Claudia carries between sessions, stored under `~/.claudia/` on the person's
own machine — session summaries, a person model, goals, safety flags. Bounded
retention, real deletion (safety floor rule 10).

**Deliverable**:
An artifact Claudia produces *for* the person, written under `~/.claudia/` —
a session summary, an exercise/worksheet, a `/teach` explainer (with diagrams),
progress notes.
