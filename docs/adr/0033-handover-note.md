---
status: accepted
---

# The handover note — the person's page, carried by the person

[`refer-only.md`](../approaches/refer-only.md) tells Claudia to **recognise and
refer**, and stops there. Nothing follows the referral. A person who books an
appointment after months of conversation walks in with fifty minutes and no way to
say what those months held; the material is sitting in `~/.claudia/` and cannot
travel.

The profession has asked for the other half of this. The APA's health advisory on
generative-AI chatbots and wellness applications (November 2025) — already load-bearing
in [ADR-0008](0008-working-understanding.md) — recommends that clinicians **inquire
proactively about a patient's use of AI chatbots and wellness apps**. The handover note
is the prepared answer to a question the advisory says will be asked.

**There is no evidence base for a client-prepared written summary at intake.** We
looked; the searches return therapist-side intake documentation and nothing on the
person arriving with a page. The nearest established genre is the **therapeutic
document** (White & Epston, _Narrative Means to Therapeutic Ends_, 1990) — the written
artifact the person takes home and re-reads, whose informal research the authors valued
at "4.5 sessions of good therapy". The repo already claims that lineage for
[keepsakes](0023-keepsakes.md). This ADR extends it to a document with one reader who
is not the person, and says so plainly rather than dressing an invention as practice.

## The two things that make it safe

**The voice is the person's, and that is structural.** The note is written in the
first person — "here is what I'd like to bring you" — because a first-person
self-report **cannot syntactically be a diagnosis**. Safety-floor rule 6 holds by
grammar, not by an instruction the model must remember on every draft. This is the
same reasoning that chose a one-tool allowlist in
[ADR-0030](0030-consultation-secrecy.md) ("the denylist is not the mechanism") and
quarantine-plus-unanimity in [ADR-0006](0006-self-authoring.md): prefer the property
that holds by construction.

**The provenance header cannot be removed.** Every other line is the person's to cut.
One is not:

> _Written with Claudia, an AI companion (not a clinician). My words, reviewed by me._

The note arrives in front of a professional who has no other way to know what produced
it. Without that line the document functions as correspondence from a peer, which is
safety-floor rule 1 at the receiving end. It is not data about the person, so removing
it is not a privacy right they are exercising.

## Decision

**One skill, `handover`. No new command** — a skill is invocable by its own name, the
way `/intake` already is, so the person's explicit door costs nothing.
[ADR-0003](0003-plugin-runtime-shape.md) reserves `commands/` for data, safety and
orientation affordances; composing a note with someone is a therapeutic act, and
belongs beside [`exercise`](../../skills/exercise/SKILL.md) and
[`teach`](../../skills/teach/SKILL.md).

**Claudia poses; she never pre-decides.** She builds the **inventory** — what recurred
across sessions, which is the one thing she can produce that the person cannot, since
they see the last conversation and she sees twelve. **Nothing is pre-ticked.** Each
item carries its reason in one line, so her judgment is legible and rebuttable rather
than sticky. The person selects; then an open question — _is there something you want
to bring that isn't here?_ — because a list crowds out what it omits.

Pre-ticking was proposed and rejected. The CJEU settled the shape of the argument in
_Planet49_ (C-673/17, 2019): a pre-ticked box does not demonstrate a deliberate choice.
The GDPR mechanics do not apply literally — Claudia transmits nothing and no controller
relies on that tick — but what is being decided is the disclosure of Article 9 data to a
third party, and a default is not a decision.

**Her judgment lives in four places, all visible:** which items make the inventory, the
one-line reason under each, the "what we couldn't get to" section where she names her
own limits, and **inline attribution** in the drafted prose — _"Claudia pointed out
that…, and I think she's right"_ — each such sentence ratified in conversation before
it is written.

**Five sections, one page.** _What keeps coming up_ ([`themes.md`](../memory-layout.md),
`understanding.md`) · _What I'm hoping for_ (`goals.md`) · _What we tried, and what came
of it_ (`exercises/`, `teachings/`) · _What's still open_ (`todo.md`) · _What we couldn't
get to_ ([refer-only](../approaches/refer-only.md) territory, named plainly). An empty
section is omitted. The length cap **is** the curation mechanism: without one, "include"
wins by default and the note becomes the case file this project refuses everywhere else.

**`safety.md` is an item like any other.** It appears in the inventory, unticked, and
Claudia says in her own words why she put it there. She may not write it unilaterally,
and she may not silently omit it either — deciding to withhold is still deciding.
[ADR-0019](0019-dashboard.md) omits `safety.md` from the dashboard entirely because the
dashboard is _derived and automatic_: it appears without anyone asking. The handover has
a ratification conversation by construction, so that reason does not transfer. What does
transfer: never a risk profile as an object, only a sentence in the person's words.
Rule 2 is unchanged — no means, no methods, in any deliverable, ever.

**Drafted, then read back, then written.** Claudia drafts only what was ticked and reads
it back section by section — _"this is what I have for that; are those your words?"_ —
and nothing reaches the disk until the whole is agreed. An unratified handover sitting
in the vault is a half-formed disclosure artifact. Reading it back **together** rather
than handing it over to review alone follows the OpenNotes finding: most people gain
control and trust from reading notes about themselves, but a minority are reliably
upset, and a PTSD diagnosis predicts the negative response (Psychiatric Services, 2018).
The sentence that lands wrong should land while someone is there.

**One file per handover, never overwritten.** `sessions/handovers/<date>-<slug>.md`. The
note leaves the machine; the copy the clinician holds is frozen at the moment it was
handed over, so a living file would let the two versions diverge silently. A later
handover **reads** the earlier one and may open on what has moved since — it never
patches it. Accretion over a year produces the case file by another route.

**Frontmatter is `type` / `created` / `slug`, and never `session:`.** Exactly the block
[`exercise`](../../skills/exercise/SKILL.md) writes, with one difference:
`finish-distillation.mjs` does not come back at close to stamp the stem. Its regex
already matches `exercises|teachings` only, so this costs no code — it is a deliberate
non-extension. The opaque session id means nothing to the reader and reads as record-keeping
on a page a stranger will hold.

**Two doors, both pulled by the person.** They mention an appointment or a referral, and
Claudia offers — framed around _their_ appointment ("so you don't start from zero on
Thursday"), never as a verdict about them. Or they type `/handover`. Plus one occasion:
when Claudia recognises refer-only territory, **the referral goes first** and the note is
mentioned after. Never during a crisis ([ADR-0026](0026-showing-the-deliverable.md)).
**The note is never a precondition for getting help.**

**Claudia never transmits it.** No mail, no MCP, no `Artifact`, no `proactive`. It is
written to the vault, handed over with `SendUserFile` (`display: 'attach'`,
`status: 'normal'` — a take-away, the `exercise` pattern), and what happens to it next is
the person's business.

## Non-goals, and why

- **No `people.md`, no `timeline.md`.** The ecomap names third parties who consented to
  nothing; handing a named map to a professional changes what the data is. And a genogram
  **drawn in session** is a therapeutic act — what matters is what the person says while
  tracing it — so a pre-filled one takes something from the clinician rather than giving
  it. [ADR-0014](0014-life-timeline.md) titrates painful events for the person's own
  telling; handing that telling to a third party is not titrated by anything.
- **No `Claudia-signed` block.** A demarcated "Note from Claudia (AI companion)" carrying
  her read of what deserves attention was the most literal reading of the original ask, and
  it is refused. It is a written opinion deposited in someone's care pathway (rule 6); it
  anchors an intake clinician with a hypothesis built from a partial, self-selected channel
  that the written format over-authorises; and with two voices on the page the professional
  reads the AI's register first and the person's account becomes the annex. Nothing is
  lost: the same content reaches the clinician through inline attribution, routed through
  the person's ratification.
- **No line about whether the work with Claudia has sufficed.** Considered and dropped.
  Claudia asking "am I still useful to you?" puts the person in the position of reassuring
  or dismissing her, which is the closed question Ivey warns produces socially acceptable
  answers rather than honest ones ([ADR-0024](0024-the-choice-ui.md) cites him for exactly
  this). The direction SOUL.md names — _needing me less_ — is served by attributing gains
  to the person in ordinary conversation, not by an event.
- **No changed posture when the person already has a therapist.** The APA advisory
  supports one — apps that "reinforce skills learned in therapy" help when "integrated
  into a broader plan of care" — and it is refused anyway. A rule of the form _there is a
  clinician, so defer_ fires **exactly when Claudia should stay present**: the person is
  talking to her at 2am precisely because the appointment is Thursday, and a deferential
  mode makes _"bring that to your therapist"_ the default answer — withdrawal dressed as
  humility. The deference would also be uncalibrated, since she has no idea what the
  clinician is working on. The collision this was meant to prevent (coaching around
  avoidance while a clinician runs exposure) is thin in practice, because
  [refer-only](../approaches/refer-only.md) already keeps her out of exposure, ERP and
  trauma processing. The one part worth having — not taking sides when someone criticises
  their therapist — is not clinical at all: it is the same stance she owes a partner, a
  parent or a boss, and it needs no feature.
- **No dashboard pointer.** A "last handover: 14 March" line in the mirror turns a private
  preparation into a tracked event.
- **No eleventh command, no `Artifact`, no PDF.** [ADR-0026](0026-showing-the-deliverable.md)
  settled the last two: showing is not publishing, and a durable shareable URL is a copy
  outside the machine.

## Consequences

- New `skills/handover/`; `~/.claudia/sessions/handovers/` in
  [`memory-layout.md`](../memory-layout.md). `/export` and `/forget` need no change —
  `vault-export.mjs` walks the tree recursively.
- [ADR-0026](0026-showing-the-deliverable.md) gains a row: `handover` → `attach`.
- `tests/structure.test.ts` pins the fences that a later change would erode first: the
  provenance header is required, `session:` is forbidden, nothing is pre-ticked, and the
  existing global bans on `proactive` and `Artifact` already cover the new surface.
- The persona carries a pointer, because [ADR-0018](0018-todo-surface.md) established that
  a capability documented everywhere except `skills/claudia/SKILL.md` is invisible in
  practice.
- No change to the safety floor, the hooks, the crisis pivot, or what `recall` reads.

## Sources

- APA, _Health Advisory on the Use of Generative AI Chatbots and Wellness Applications for
  Mental Health_, November 2025.
- White, M. & Epston, D., _Narrative Means to Therapeutic Ends_, Norton, 1990 — therapeutic
  documents; the "4.5 sessions" figure is the authors' own **informal** estimate, not a
  controlled finding.
- _Patients' Positive and Negative Responses to Reading Mental Health Clinical Notes
  Online_, Psychiatric Services, 2018 (PMID 29493408).
- CJEU, _Planet49_, C-673/17, 1 October 2019 — a pre-ticked box is not a deliberate choice.
