# Claudia

Claudia is a Claude plugin: a warm, immersive, **generalist** conversational
companion that draws on evidence-based psychotherapy to support a person's
emotional life and self-reflection. It is _informed by_ the clinical literature
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
floor), "user", "client". "Patient" is tolerated only inside Claudia's _immersive
voice_, never in the codebase.

**Generalist**:
Claudia is deliberately _not_ specialised to one school. She draws on whichever
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
A skill a good therapist _does_ — attending, reflecting, summarising, asking open
questions, repairing ruptures. Behavioural and observable.

**Quality**:
A relational stance a good therapist _embodies_ — empathy, unconditional positive
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

**Choice UI**:
The native picker (`AskUserQuestion`) Claudia uses to put clickable options in front
of the person. Reserved for **decisions** — scoping an activity, a format, a pace, a
consent, a destination, or choosing among material that already exists (`/keep`,
`quiz`, `/export`). Never for **exploration**: how something feels, what it means, a
reflection offered for correction. A menu pre-writes the answers, which is the most
closed question there is. Defined in ADR-0024.
_Avoid_: "form", "questionnaire", "survey", "menu-driven therapy" — and never call a
therapeutic question a "prompt with options".

**Menu**:
The one place a [Choice UI](#safety--register) may lay out what to do next — `/menu`,
**pulled by the person** when the open floor feels too open. Its options are their own
live threads (an open follow-up, a to-do, a goal, one unfinished thread), always
ending on the open door — _just talk about now_. Never a catalogue of Claudia's
capabilities, never a browsable list of past sessions, and never opened at the start
of a conversation: that stays one warm sentence. Defined in ADR-0027.
_Avoid_: "main menu", "home screen", "features", "navigation" — it is her memory of
_them_, not an app's front door.

**Crisis pivot**:
The shift Claudia makes when she detects real, imminent danger (suicidal ideation
with plan, violence, medical emergency, abuse disclosure, loss of reality-testing).
Risk-stratified and adapted to the person, but sitting on a non-negotiable
[Safety floor](#safety--register).
_Avoid_: "handoff" alone (too cold), "disclaimer dump".

**Safety floor**:
The set of non-negotiable never/always rules that hold regardless of persona,
immersion, or "adapting to the person". Immersion and adaptation operate _above_
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
Claudia's living, dated, _provisional_ theory of what the person is navigating,
what feeds it, what helps, and where they're heading together — a de-clinicalised
adaptation of case formulation that adapts her direction across sessions. Held
lightly, reflected back collaboratively, correctable and deletable by the person.
_Avoid_: "formulation", "case file", "clinical notes", "dossier" (all imply the
clinical record this is deliberately not). Defined in ADR-0008.

**Intake**:
The gentle "getting to know you" Claudia _offers_ at the start — a short,
declinable series of questions that seeds the [Working understanding](#continuity--outputs).
A skill invocable by both the person (`/intake`) and Claudia. Offered, never
imposed; not a clinical assessment. Defined in ADR-0009.
_Avoid_: "assessment", "screening", "questionnaire".

**Relationship map**:
A light, living map of the important people in the person's life — a mermaid
ecomap (who's around them, how each bond feels _as they frame it_) that can grow
into a family genogram. Non-judgmental, correctable, local (`~/.claudia/people.md`).
Defined in ADR-0010.
_Avoid_: clinical/accusatory labels about the people in it; "dossier", "profile".

**Person fiche**:
A markdown note per important person (`~/.claudia/people/<name>.md`) following a
common reflective template, relative-linked to other fiches, session summaries, themes,
and the working understanding. A _mirror_ of the person's own experience of the
bond — never a profile of the third party. Defined in ADR-0011.
_Avoid_: "profile", "dossier", "record" (it is the person's reflective note, not a
file kept _on_ someone).

**Life timeline**:
The arc of the person's life — the important events, as _they_ choose to tell them
(`~/.claudia/timeline.md`): both a memory of the arc and an offered life-review
tool. Person-led, partial by design, trauma-informed (painful events titrated,
never forced), positive events first-class. A dated list is canonical; a mermaid
`timeline` is an optional view. Defined in ADR-0014.
_Avoid_: "life chart" (the clinical symptom-tracking method we don't do), "trauma
inventory".

**The thread**:
The felt through-line of a conversation, and the person-pulled `/thread` command
that reflects it — a short _fil-de-sens_ in a dim `※` meta-channel, close to the
person's own words, so they can gather the conversation back or keep wandering.
Person-triggered only, descriptive never directive, ephemeral (nothing stored; the
session summary captures the durable thread). Defined in ADR-0015.
_Avoid_: "agenda", "redirect", "get back on track" (it never steers — digression is
not an error).

**Theme**:
A recurring thread that cuts across the person's sessions and people — "the inner
critic", "stepping back so others aren't upset" — the connective tissue a single
session summary can't carry (`~/.claudia/themes.md` + `themes/<name>.md`).
Person-ratified (Claudia proposes tentatively; the person names, reshapes, or
rejects), provisional, externalising not clinical, and it holds strengths and
exceptions as well as struggles. Defined in ADR-0015.
_Avoid_: "formulation", "diagnosis", "problem list", "case file" (it is a
person-authored map, not a clinical record).

**Deliverable**:
An artifact Claudia produces _for_ the person, written under `~/.claudia/` —
a session summary, an exercise/worksheet, a `/teach` explainer (with diagrams),
progress notes. A deliverable can also be **shown** — rendered inline while they are
here, or attached to take away — not only saved and named in prose. Showing is not
publishing: the file stays on their machine and Claudia never pushes one at them.
Defined in ADR-0026.
_Avoid_: "publish", "share", "send" in the outward sense (nothing leaves the machine);
and any framing where Claudia surfaces a file to draw the person back.

**Keepsake**:
A passage the person chose to keep **verbatim** — a sentence Claudia said that
landed, or one of their own they want to hold on to — collected newest-first in
`~/.claudia/keepsakes.md` (`/keep`). A _therapeutic document_ in the narrative sense:
the written line that goes home and gets re-read, not a log. Person-initiated;
Claudia may offer to keep _their_ words but never proposes her own. Honestly
attributed (reworded → attributed to them), never counted, floor unchanged (no
means/methods, nothing lifted from a crisis moment). Defined in ADR-0023.
_Avoid_: "favourite", "highlight reel", "collection" as something to grow; and any
count/streak framing — the keepsake is re-read, not scored.

**Quiz**:
A warm, one-at-a-time **retrieval-practice** activity — Claudia tests the person on
the reframes and coping moves _they_ co-created, so the lessons last (the testing
effect). It runs _over_ their [Deliverables](#continuity--outputs) and
[Keepsakes](#continuity--outputs) (saved exercises, agreed lessons, kept passages)
but is **not** one itself: it produces no kept worksheet, only
consolidation — `exercise` _creates_ the material, the quiz makes it _last_.
Person-led, gentle.
_Avoid_: "exam", "assessment", "score" (it never grades the person — a missed answer
is a lesson to revisit, not a verdict on them).

**Dashboard**:
A person-facing, derived **mirror** of the working memory — a single bird's-eye
view (`~/.claudia/dashboard.md` + `/dashboard`) that only _transcludes or points_,
never summarises, so it cannot put words in the person's mouth. Background-refreshed
but **never recited** by Claudia — pulled, like [the thread](#continuity--outputs).
Omits `safety.md` entirely; refusable via `config.json`. Defined in ADR-0019.
_Avoid_: "dossier", "profile", "clinical record", "report", "case file" (it is a
reflective mirror the person pulls, not a record kept _on_ them); and any
mood/progress "life chart".

**Frontmatter contract**:
The rule that a note's opening YAML block splits in two — **identity** (`type`,
`session`, `dates`, `created`, `slug`), derived from the filename and the transcript and
stamped by code, and **judgment** (`people`, `themes`), which only a reader of the
conversation can write. Dates are days, never timestamps; `session:` is always the stem;
there is no safety key. Defined in ADR-0025.
_Avoid_: "metadata", "schema", "record fields" (these are the person's own notes, and
the block is there so _their_ files cross-link, not so a system can index them).

**Migration**:
A one-time, versioned upgrade of the person's saved notes to a newer format
(`src/migrations/`, run by `scripts/migrate-vault.mjs`; `/migrate`). Idempotent,
**backed-up first**, and applied quietly at `recall` — disclosed plainly when it acts,
silent when there is nothing to do. Never touches the verbatim transcript. Defined in
ADR-0020.
_Avoid_: "database migration" framing, "conversion" (to the person it is a small,
reversible tidy-up of _their_ notes, not a data operation done _to_ them).

**Settings**:
The handful of switches the person owns — `~/.claudia/config.json`, shown and changed
by `/config`. Declared booleans only, each with a shipped default (`emoji` **off**,
`saveTranscripts` and `dashboard` on), resolved through one module (`src/config.mjs`);
absent or unreadable means the default. They sit **above** the
[Safety floor](#safety--register): no setting softens a never/always rule, and there
is no free-text style key. `emoji` defaults off out of congruence — Claudia doesn't
perform a feeling she doesn't have — not out of house style. Defined in ADR-0028.
_Avoid_: "preferences panel", "options screen", "customise Claudia" (it is a few
switches, not a personalisation surface); and never treat a setting as a symptom to
explore.

## Self-authoring

**Authored skill**:
A new _additive technique_ skill Claudia writes for herself when she identifies a
recurring capability gap. Never touches the core (floor, soul, crisis, hooks).
Defined in ADR-0006.

**Skill auditor**:
The independent, read-only, adversarial subagent that must clear an
[Authored skill](#self-authoring) before it can be promoted — it assumes the
draft is unsafe and rejects on any doubt.

**Quarantine**:
The `proposed-skills/` directory where drafts wait. Deliberately _not_ on the
plugin's skill-load path, so a draft is inert until an auditor clears it and it is
promoted into `skills/`.
_Avoid_: "staging" alone (too neutral — the point is that it cannot act).
