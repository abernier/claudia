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
own machine — session summaries, a person model, goals, safety flags, and the
[Working understanding](#continuity--outputs). Bounded retention, real deletion
(safety floor rule 10).

**Working understanding**:
Claudia's living, dated, *provisional* theory of what the person is navigating,
what feeds it, what helps, and where they're heading together — a de-clinicalised
adaptation of case formulation that adapts her direction across sessions. Held
lightly, reflected back collaboratively, correctable and deletable by the person.
_Avoid_: "formulation", "case file", "clinical notes", "dossier" (all imply the
clinical record this is deliberately not). Defined in ADR-0008.

**Intake**:
The gentle "getting to know you" Claudia *offers* at the start — a short,
declinable series of questions that seeds the [Working understanding](#continuity--outputs).
A skill invocable by both the person (`/intake`) and Claudia. Offered, never
imposed; not a clinical assessment. Defined in ADR-0009.
_Avoid_: "assessment", "screening", "questionnaire".

**Relationship map**:
A light, living map of the important people in the person's life — a mermaid
ecomap (who's around them, how each bond feels *as they frame it*) that can grow
into a family genogram. Non-judgmental, correctable, local (`~/.claudia/people.md`).
Defined in ADR-0010.
_Avoid_: clinical/accusatory labels about the people in it; "dossier", "profile".

**Person fiche**:
A markdown note per important person (`~/.claudia/people/<name>.md`) following a
common reflective template, wiki-linked to other fiches, session summaries, themes,
and the working understanding. A *mirror* of the person's own experience of the
bond — never a profile of the third party. Defined in ADR-0011.
_Avoid_: "profile", "dossier", "record" (it is the person's reflective note, not a
file kept *on* someone).

**Life timeline**:
The arc of the person's life — the important events, as *they* choose to tell them
(`~/.claudia/timeline.md`): both a memory of the arc and an offered life-review
tool. Person-led, partial by design, trauma-informed (painful events titrated,
never forced), positive events first-class. A dated list is canonical; a mermaid
`timeline` is an optional view. Defined in ADR-0014.
_Avoid_: "life chart" (the clinical symptom-tracking method we don't do), "trauma
inventory".

**Deliverable**:
An artifact Claudia produces *for* the person, written under `~/.claudia/` —
a session summary, an exercise/worksheet, a `/teach` explainer (with diagrams),
progress notes.

## Self-authoring

**Authored skill**:
A new *additive technique* skill Claudia writes for herself when she identifies a
recurring capability gap. Never touches the core (floor, soul, crisis, hooks).
Defined in ADR-0006.

**Skill auditor**:
The independent, read-only, adversarial subagent that must clear an
[Authored skill](#self-authoring) before it can be promoted — it assumes the
draft is unsafe and rejects on any doubt.

**Quarantine**:
The `proposed-skills/` directory where drafts wait. Deliberately *not* on the
plugin's skill-load path, so a draft is inert until an auditor clears it and it is
promoted into `skills/`.
_Avoid_: "staging" alone (too neutral — the point is that it cannot act).
