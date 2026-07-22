# claudia

## 0.4.0

### Minor Changes

- a1383eb: Add a person-facing **dashboard** — `~/.claudia/dashboard.md` + `/dashboard` (ADR-0019):
  a single bird's-eye view of where things are (goals, live themes, what's to pick up,
  your people, recent threads). It is a **derived mirror**, never a source of truth: a
  deterministic script (`scripts/build-dashboard.mjs` → `src/dashboard.mjs`) only
  **transcludes** what a working file already says or **points** to it with a relative
  markdown link — it never summarises, so it cannot put words in the person's mouth (the working
  understanding and each session summary are linked, never excerpted; wrapped bullets are
  kept whole). Kept fresh in the background (rebuilt at `SessionEnd` and at the tail of
  `recall`, after any deferred distillation) so it can be opened directly, yet Claudia
  **never recites it**. `safety.md` is deliberately absent (no risk profile at a glance;
  that net lives in the safety hook and `/help-now`), and there is no mood/progress chart.
  Disclosed once via `remember`'s first-run note, refusable via `{ "dashboard": false }` in
  `config.json`, rebuilt by `/forget` after a partial delete, and carried by `/export`.
  Recorded in the `docs/memory-layout.md` contract. The command surface grows from four to
  five.

### Patch Changes

- 8f277f5: Drop Obsidian-style `[[wikilinks]]` from everything generated into `~/.claudia/` in
  favour of **plain relative markdown links** (`[Marie](Marie.md)`,
  `[…](../sessions/<stem>.summary.md)`). The dashboard mirror (`src/dashboard.mjs`) now
  emits relative links, and the skills/template that write the person's notes (fiches,
  `themes.md` + `themes/`, `timeline.md`, `todo.md`) prescribe them — computed from the
  linking file's own directory, with space-bearing paths wrapped in angle brackets. As a
  result the export pass no longer rewrites anything: `scripts/vault-export.mjs` copies the
  vault out verbatim, and the `wikilinksToRelative` helper (`src/vault.mjs`) is removed. The
  notes stay portable and legible everywhere (GitHub, any plain viewer, Obsidian) with no
  rewrite step. Docs and ADRs (0011/0014/0015/0018/0019, memory-layout) updated to match.

## 0.3.0

### Minor Changes

- 58ebd2c: Add a shared **to-do-later** surface, `~/.claudia/todo.md` (ADR-0018): a plain,
  person-owned action list that both the person and Claudia can jot into, distinct from
  Claudia's Follow-ups radar (anticipated events + the worry attached). It is
  status-grouped (`## Ouvert` / `## Fait`) with each item tagged by the session that
  raised it, so "what's still open" stays scannable while provenance is preserved.
  Wiring: `recall` reads it and may surface one still-open, task-shaped item for the
  opening; `distill-session` is the **authoritative tagger** — it holds the real session
  stem, so it completes tags a live addition couldn't, promotes genuine tasks, and ticks
  resolved ones; `remember` documents the live, in-session writes. Recorded in the
  `docs/memory-layout.md` contract. Local-only, hand-editable, ticked-not-deleted, removed
  by `/forget` and carried by `/export` — same guarantees as the rest of the working layer.

## 0.2.1

### Patch Changes

- 2f473d8: Fix `~/.claudia/sessions/` filling with the wrong thing, and the working memory
  never materialising.

  - **Genuine-session gate (ADR-0017).** `isClaudiaSession` keyed on persona strings
    appearing _anywhere_, so any dev session that read `SOUL.md` or `/grill-me`-d a
    feature was archived into the therapy vault. It now requires the `claudia` skill to
    have been genuinely _activated_ (its loader preamble as a user message) — reading a
    file (a `tool_result`) or loading `…/skills/grilling` no longer counts.
  - **One file per session, overwritten (ADR-0017).** Archiving was date-keyed and
    append-only, so a resumed conversation piled up as duplicate full re-dumps and
    distinct sessions mashed into one day-file. It is now keyed `<date>-<short-session-id>`
    and overwritten each close — one conversation, one file.
  - **Deferred distillation (ADR-0016).** Distillation was a close-time ritual (a person
    just closes the terminal, so it rarely ran). It is now deferred to the next session's
    `recall`, which is structurally reliable. `save-session` drops a `pending-summary`
    dirty flag each close; `pending.mjs` + `scripts/pending-sessions.mjs` list flagged
    sessions deterministically; `recall` distills each from its transcript (the one
    sanctioned transcript read) and clears the flag — so a resumed session's stale
    summary is refreshed, too.

## 0.2.0

**Digest.** Memory with shape. Claudia gains a living **working understanding** and
agreed **goals**, **active curiosity** with an offered **intake**, a **relationship
map** and a cross-linked **person-fiche vault**, a person-led, trauma-informed **life
timeline**, and **"the thread"** — a person-pulled `/thread` recap within a session and
recurring **themes** across sessions. Under the hood she also gains a light **sense of
time** and stays **continuous across resume/compaction**. All local-only, provisional,
and deletable — on the same non-negotiable safety floor.

### Minor Changes

- 6c5eb62: Rebalance Claudia from reflect-heavy/question-light toward **active, well-dosed
  curiosity**, and add an offered **`intake`** (ADR-0009). She now asks openly about
  the person and the people/history behind what they share — reflection-led (~2
  reflections per question, never 3 in a row, no stacked/"why" questions, signpost
  why she asks), letting sensitive material emerge. The `intake` skill (invocable by
  the person via `/intake` and by Claudia when she offers to get acquainted) runs a
  short, declinable getting-to-know-you that seeds the working understanding.
  Grounded in the literature (Elliott 2023; Ivey; MI/OARS; Padesky; SAMHSA TIP 57;
  Chu et al. 2026) in `docs/competencies/curiosity-and-questions.md`.
- 621298c: Add a **life timeline** (ADR-0014): Claudia can keep the arc of the person's life
  at `~/.claudia/timeline.md` — both a memory of important events and an offered
  life-review tool (grounded in the counselling "lifeline", life-review/reminiscence,
  and narrative re-authoring; _not_ the clinical NIMH mood chart). New `timeline`
  skill; `intake` and `understand` feed it; events cross-link to person fiches and
  session notes. Canonical store is a dated, sectioned list holding flexible dates,
  the person's own titles/valence, and wikilinks; a mermaid `timeline` is an optional
  "see the shape" view. Strongly trauma-informed: person-led and partial by design,
  painful events titrated and only if volunteered, never a forced chronological
  trauma inventory, never inferred, positive events first-class, safety floor first.
- 9666578: Turn the relationship map into a small **cross-linked vault**: each important
  person can get a reflective **fiche** at `~/.claudia/people/<name>.md` following a
  common template (ADR-0011), wiki-linked to other people, session summaries,
  themes, and the working understanding — reaching a transcript only through its
  summary. The mermaid graph links each node to its fiche (`click`). Wikilinks are
  Obsidian-friendly; `/export` runs a pass (`scripts/vault-export.mjs`) that rewrites
  them to relative links for plain-markdown portability. Guardrail: a fiche is a
  mirror, not a dossier — the person's own experience, never a verdict or diagnosis
  about the third party; local, correctable, deletable. Grounded in CCRT, ecomap
  attributes, and PKM (Zettelkasten/MOC/evergreen).
- 4d407fe: Claudia can maintain a light **relationship map** of the important people in the
  person's life (ADR-0010) — an ecomap (who's around them, how each bond feels as
  they frame it) that grows into a family genogram, rendered in **mermaid** at
  `~/.claudia/people.md`. It powers continuity (knowing who "Liliana" or "your
  sister" is) and feeds the working understanding. New `relationships` skill; the
  `intake` seeds it, `recall` surfaces it. Guardrails: local-only, correctable
  (shown to check it's right), and strictly **non-judgmental** — it records who
  people are to the person and their own experience of each bond, never clinical or
  accusatory labels about others.
- f24e6b7: Add **the thread** (ADR-0015): person-pulled orientation at two scales, never a leash.
  Within a session, `/thread` reflects the conversation's through-line as a short
  _fil-de-sens_ in a dim `※` meta-channel — person-triggered, descriptive-never-directive,
  ephemeral (prose by default, an optional mermaid "arbre de pensée" on demand). Across
  sessions, a new `themes` skill sediments the recurring threads — proposed tentatively
  and ratified by the person, provisional, externalising-not-clinical, holding strengths
  and exceptions as well as struggles — filling the previously-dangling `[[themes]]` vault
  seam. Wiring: `distill-session` flags candidates, `recall` surfaces one for
  ratification, `remember` indexes them. Purely additive (floor/soul/crisis/hooks
  untouched); cleared by an adversarial safety panel.
- cf19f7d: Add a **working understanding** — a de-clinicalised, provisional, collaborative
  theory of the person that adapts Claudia's direction across sessions (ADR-0008).
  New `understand` skill and `~/.claudia/understanding.md`; `recall` and the persona
  load it, hold it lightly as a hypothesis, and reflect it back for correction.
  Transparent, editable, deletable, and anti-dependency by design (it centres the
  person's own strengths and aims to have them need Claudia _less_). Never a
  diagnosis or a clinical record.

## 0.1.0

Initial public release — a warm, generalist companion for reflection and emotional
support, as an installable Claude Code plugin.

- Relationship-first, multi-approach (person-centered, CBT, behavioral activation,
  ACT, MI, solution-focused, mindfulness & self-compassion), on a non-negotiable
  safety floor.
- Deterministic per-turn safety check + crisis pivot with localized resources.
- Local-only, two-layer memory under `~/.claudia/`; warm, contextualized session
  openings.
- Self-authoring of new technique skills, gated by an adversarial auditor panel;
  bounded ephemeral delegation.
- Not a licensed clinician, not therapy, not a medical device.
