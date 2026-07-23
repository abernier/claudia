# claudia

## 0.11.0

### Minor Changes

- 4eb74c5: Draw the line on the **choice UI** (ADR-0024) — buttons for decisions, an open floor for everything else. Fixes a real defect first: `quiz` was built end-to-end on `AskUserQuestion` while declaring `allowed-tools: Read Write Bash`, so the picker raised a permission prompt mid-quiz — immersion broken at the worst moment. Beyond the fix, the boundary is now written down and enforced rather than merely observed: `AskUserQuestion` is for _decisions_ — scoping, format, pacing, consent, a destination, or choosing among material that already exists — and plain conversational text is for anything the person is _disclosing_. A menu pre-writes the answers, which is the most closed question there is, and closes the door the persona works to leave ajar (Ivey on closed questions eliciting "socially acceptable answers rather than honest ones"; Cecchin's curiosity; Padesky's guided discovery — all now in `docs/bibliography.md`). Extends the pattern to the three places it genuinely fits: `/export` (the destination), `exercise` and `teach` (_may_ offer candidate practices or concepts as options — never must, and never for `teach`'s closing "does this fit your experience?"). The **non-goals carry equal weight**: `/help-now` keeps its plain "what country are you in?" because the command's own rule is "not the moment for exploration"; `/forget` and `/migrate` keep prose confirmations because friction is _protective_ on an irreversible write; and `intake`, `themes` ratification, `timeline` life-review, `relationships` and `understand` ask openly, permanently. The persona (`skills/claudia/SKILL.md`) carries the rule, since it is the only always-loaded file, and `tests/structure.test.ts` guards both directions — declared wherever used, and **absent** from the exploratory skills and the crisis/irreversible commands. Adds a **Choice UI** glossary entry to `CONTEXT.md`. No new command, no new skill, safety floor unchanged.
- c2ef4d3: Split the vault's frontmatter in two and stop asking the model to guess half of it (ADR-0025). Only two note blocks were ever specified — the theme note and the person fiche — so the session summary, the exercise and the teaching were re-improvised at every write, and drifted measurably: **2 summaries of 4 carried no frontmatter at all**, `session:` meant the bare short id in one file and the full stem in another, and **both exercise stems pointed at sessions that never existed**. Prose could not have caught it: nothing parses these blocks (`dashboard.mjs` and `pending.mjs` re-derive date and id from the _filename_), so a wrong one is invisible to the tests. The diagnosis is that the block mixes two kinds of fact — **identity** (`type`, `session`, `dates`, `created`, `slug`), which is derivable, and **judgment** (`people`, `themes`), which only a reader of the conversation can write — and asking one writer for both degrades the derivable half into recall. For the deliverables it was structurally impossible: an exercise is written mid-conversation, when the session's stem does not exist yet (it is minted at close, ADR-0017), so the model could only invent one. Now identity is written by code: `save-session` computes the block from the transcript it already reads — `dates` comes from its timestamps via a new `sessionDays()`, so a conversation that ran past midnight reports both days exactly — and leaves it in the `pending-summary` marker, whose content was free because `pending.mjs` keys on existence alone. `distill-session`'s closing `rm -f` becomes `scripts/finish-distillation.mjs <stem> [deliverable…]`, which stamps the summary (and any exercise/teaching the session wrote, from the _path_ the model supplies) **and then** clears the marker — so the enforcement is structural: skipping it leaves the flag standing and `recall` re-flags the session. `exercise` and `teach` now write no `session:` at all. A new `src/frontmatter.mjs` is the one place that knows the format, and deliberately exposes **no general serializer**: `stampIdentity` does line surgery, leaving every untouched line byte-identical and returning a block whose fence never closes **unmodified** — these are the person's hand-editable notes, and a parse→serialize round-trip would quietly reformat their choices. Dates stay day-grained via a new `localDay()` (ADR-0012: exact about the hour in the moment, sober about the record), and there is **no safety key**, for the reason ADR-0019 keeps `safety.md` out of the dashboard. Migration `0002-vault-frontmatter` repairs what is already on disk — filling what is absent, normalising `session:` to the stem, and repairing a dead deliverable stem only when its short id resolves to exactly one summary (zero or several: left alone, never guessed) — backed up and disclosed at `recall` like every migration. Zero new dependencies. Safety floor unchanged.
- bf2a6c9: **A menu you pull — `/menu`** (ADR-0027). The question that arrived straight after ADR-0024 was whether Claudia should _open_ a conversation with a picker — _resume a past session · do an exercise · …_ — to guide someone who doesn't know what to do with her. She should not, and the ADR says so with reasons rather than doctrine: ADR-0024's own test (_would pre-writing the plausible answers change what the person tells me?_) is answered loudest at the opening, where someone arriving with an acute worry clicks a tidy option instead of saying what is wrong; it would displace something better, since `recall` has already read `person.md`, `goals.md`, `todo.md` and the last summary and earned **one** warm, specific check-in that a generic list downgrades; and `safety-check.mjs` runs on `UserPromptSubmit`, so a first turn spent clicking arrives as a tool result rather than a submitted prompt and the per-turn net has nothing to read on the turn where it matters most. But the need underneath is real, and the resolution is **who pulls it**: a ninth command, person-typed, like `/thread` and `/dashboard`. Its options are the person's **own live threads** in their own words — an open Follow-up, a `todo.md` item, a goal, one unfinished thread from the last summary — with any activity **incarnated in that material** (_"the evening-thoughts worksheet, noted last time"_) or absent; `SOUL.md` opens by saying Claudia is who she is, _not a list of features_, and a menu of skills would make her exactly that. The **last option is always the open door** (_just talk about now_), thin memory yields two options rather than four padded ones, and it is one question with no drill-down — a navigation tree is an app. It reads memory and writes nothing. Hard non-goals, each recorded with its reason: no menu at the opening (also written into ADR-0024's non-goals, where the next person to have the idea will look), no dated list of past sessions to browse (that turns memory into an archive and feeds the "illusion of a continuous relationship" ADR-0004 warns against — `recall` surfaces one thread, and `/menu` holds the same limit), and no catalogue of capabilities. The persona gains one sentence: when the floor feels _too_ open, she may **name** the command once, lightly, and never open it herself. `tests/structure.test.ts` guards the fences — pulled not pushed, the open door present, no session archive, reads-only, and `recall` still opening in plain text.
- 8130cfe: **Show the deliverable, don't just name its path** (ADR-0026). Claudia writes ecomaps, timelines, explainers with diagrams and worksheets, and until now announced every one of them in prose — the relationship map, the one artifact genuinely worth _looking at_, arrived as raw ` ```mermaid ` text in a terminal. `SendUserFile` renders it: `display: 'render'` for what is looked at together now (`relationships`' `people.md`, `timeline.md`, a `teach` explainer, `/dashboard`), `display: 'attach'` for what is taken away (an `exercise` worksheet). The privacy question is answered head-on rather than waved past, because ADR-0007's "nothing leaves the machine" is load-bearing over GDPR Article 9 data: Claudia **authored** this content in the conversation, so the model already holds every word — showing it back adds no disclosure the conversation did not already carry. **Artifact stays refused** on exactly that line, since it mints a durable, shareable URL — a new persistent copy outside the machine, which is what ADR-0007 rejected when it rejected the remote connector. Showing is not publishing. `status: 'proactive'` is a **hard non-goal**: it pushes a notification at the person, and Claudia shows a file because they are already here, never to bring them back — the same refusal as scheduled check-ins (ADR-0012, _"Presence, not surveillance"_; SOUL's _"needing me less"_). Never sent: `*.transcript.md` (the archive is deliberately unnavigable), `safety.md` (the dashboard already omits it), anything mid-crisis, and the ephemeral views — `/thread` promises to write **nothing** and the optional mermaid in `themes`/`timeline` is "a regenerated view, never the store", so they stay inline; the temp-file escape hatch is noted in the ADR as deliberately not taken. Nothing **depends** on the tool: every surface keeps naming the path as its fallback. `tests/structure.test.ts` guards the fences rather than the feature — declared wherever used, `proactive` nowhere, `crisis` never sends, `Artifact` absent — each mutation-tested.
- 907fe77: **Documents survive the transcript too, not just images** (ADR-0021, extended). A PDF that entered the conversation is stored by Claude Code exactly like a pasted screenshot — base64, inline in the session JSONL — but under `{"type":"document"}` instead of `{"type":"image"}`, and `renderMarkdown` only ever knew the latter. So it was dropped: gone from `~/.claudia/` the moment Claude Code's own store rotated. That is the wrong thing to lose, because the PDF someone brings to a session is a letter, a medical report, a decision they received — the thing the conversation is _about_. `partsFromContent` now yields `kind: "file"` beside `kind: "image"`, top-level and one level inside a `tool_result` alike, and the assets land in the **same** `<stem>.assets/` on their own counter (`doc-001.pdf`) — so the whole trust boundary is inherited unchanged: one `saveTranscripts` opt-out, `/forget` deleting the folder wholesale, `/export` already walking it, `recall` still never reading a transcript. A document is emitted as a **plain link** carrying its filename, not an `![…]` embed, since no reader inlines a PDF and a broken embed reads as a lost image rather than an attached file; an unknown media type falls back to `.bin` — the bytes are written under a name that claims nothing about them. `renderMarkdown` returns `{ markdown, assets }` where it returned `{ markdown, images }`: one list, because the name already carries the kind and the write loop has no reason to care. **Explicitly not done**: files `@`-mentioned or dragged in, which Claude Code puts in a JSONL line _outside_ `.message.content` — those already exist on the person's own disk, so copying them would duplicate sometimes-large, often-sensitive data nobody asked the archive to keep, whereas a base64 block has no other copy at all. The ADR records the cost of that (a transcript can say "the document I showed you" and name nothing resolvable) and leaves the reference-only fix for its own decision, since it turns on whether an attached file counts as the person's words or as a tool result. Also recorded: a `document` block does not say **who** brought it — a PDF the person attached and one Claudia read land identically in a `user` message — so both are archived, erring toward the copy `/forget` deletes wholesale over the one that is unrecoverable.

### Patch Changes

- 8130cfe: Use `AskUserQuestion`'s **`preview` field** where the person is choosing between things worth _seeing_ rather than labels (amends ADR-0024). It renders markdown beside whichever option is focused, and it is **single-select only** — a multi-select question cannot carry one, which is why `quiz`'s "which lessons" must not try. The surface it most improves is `keep`: the candidate passage was being crammed into an option `description`, and the person is choosing _words_, so the words now get the preview pane and read like the quote they are, with whose line it was and when left in the description. `exercise` gains the same treatment for the worksheet's shape — its headings and blanks, so they see what they'd actually be filling in. `skills/quiz/SKILL.md` documents the field, as ADR-0024 designates it the reference description of the tool's shape for the whole plugin.

## 0.10.0

### Minor Changes

- 1024044: Add **keepsakes** — the one sentence worth keeping (ADR-0023). `/keep [passage]` holds a passage verbatim in `~/.claudia/keepsakes.md`, newest first, honestly attributed and session-tagged; with no argument, Claudia offers 2–4 candidate passages from the last exchange on the `AskUserQuestion` choice UI, with the auto-"Other" field free for anything the person would rather paste or reword. Either voice can be kept — hers or the person's own — and reworded words are attributed to whoever now owns them. A dedicated `keep` skill carries the natural-language triggers ("garde ça", "épingle cette phrase", "pin that"), so the command is the discoverable door rather than the only one. Claudia may **offer** to keep a sentence _the person_ just found, but never proposes keeping her own — a keepsake exists to work when she is not there. The dashboard mirrors the newest kept passage verbatim (`quoteBlocks()` in `src/dashboard.mjs`), `quiz` can drill them, `distill-session` completes their session tag, and `recall` deliberately never loads them. Never counted, never a streak; the safety floor is unchanged (no means/methods on a kept line, nothing lifted from a crisis moment).

## 0.9.0

### Minor Changes

- 7bbf934: Wire the life timeline into Claudia's persona so it actually populates. The `timeline` skill (ADR-0014) shipped, but nothing in the relational spine cued Claudia to reach for it — only `intake` and a passing pointer in `understand` referenced it, so in practice `timeline.md` never got created while `person.md`, `people.md`, and `understanding.md` filled normally. Add a cue in `skills/claudia/SKILL.md`, parallel to the relationship-map instruction, so a datable life event gets placed on the timeline **as it surfaces** — in the person's own words, never by interrogation, trauma-titrated (painful events only if volunteered, never detailed there). Deliberately kept a consult-on-demand store: `recall` still does not load it into every opening, to avoid context bloat.

## 0.8.0

### Minor Changes

- 34c3b99: Add the `quiz` skill — warm, one-at-a-time retrieval practice on the reframes and coping moves the person co-created, so the lessons last (the testing effect). Built around Claude Code's `AskUserQuestion` choice UI: scope, format (free recall / multiple choice / a mix), and pacing are clickable questions, while free-text is reserved for a free-recall answer and Claudia's warm reaction. Person-led, drawing only on their own saved exercises and agreed lessons. Wires `exercise` → `quiz` (create → consolidate) and adds a `Quiz` glossary entry to `CONTEXT.md`.

## 0.7.0

### Minor Changes

- 31dad39: Add `/save` — a person-pulled command to checkpoint working memory mid-session. It distills where the conversation got to and refreshes the working notes (person/goals/themes) plus the dashboard, without waiting for the session to close, filling the discoverability/reassurance gap left by deferred distillation (ADR-0016). It checkpoints the distilled memory, not the verbatim transcript (still the `SessionEnd` hook's job). Amends ADR-0003's command surface (now seven commands).

## 0.6.2

### Patch Changes

- b2841f8: Fix the latent bugs surfaced by the strict-typing pass (ADR-0022 follow-up):

  - **safety**: an unrecognized model-classifier verdict (wrong case, unknown
    value, missing field) on an uncertain message now escalates fail-safe —
    previously `{"risk":"IMMINENT"}` silently read as _no risk_. Only an
    explicit, recognized `none` clears; `SafetyDecision` is now a discriminated
    union so `escalate: true` provably carries a reason.
  - **save-session**: the `pending-summary` marker is dropped _before_ the
    transcript write, so a failed archive write still flags the session for
    distillation at next recall (ADR-0016's dirty-flag contract).
  - **vault-export**: a failing `/export` now reports the error and exits
    non-zero, warning that the copy at the destination may be partial —
    previously it swallowed everything with a success code.
  - **migrate-vault**: errors mid-migration now print a clear message naming the
    `.bak-<stamp>` backup to restore (was: unhandled rejection); a dry-run over a
    file-_creating_ migration renders as pure additions instead of crashing.
  - **session**: `resolveTranscriptPath` tolerates a nullish payload like its
    sibling `sessionIdFrom`; `ContentBlock.content` models the raw-string form
    real transcripts can carry.
  - Plus: `rewriteFile`'s guard/read pair collapsed to a single checked `get`,
    and `pending-sessions`' docs now describe the stems it actually emits.

## 0.6.1

### Patch Changes

- 99c4e01: Strict TypeScript checking without transpilation (ADR-0022). Runtime stays pure
  `.mjs` — no build, no new Node requirement for the person. TypeScript 7 (native
  compiler) joins as a dev-only checker: full strict JSDoc annotations across
  `src/` and `scripts/`, tests converted to real TypeScript (`tests/*.test.ts`),
  and `npm test` now typechecks (`tsc --noEmit`) before running Vitest.

## 0.6.0

### Minor Changes

- b9538e2: Persist pasted images in a transcript. Screenshots a person pastes into a
  conversation used to be dropped from the saved `.transcript.md` (they lived only as
  base64 inside Claude Code's own JSONL). They are now extracted at `SessionEnd` into a
  per-session `sessions/<stem>.assets/` folder as `img-NNN.<ext>`, embedded inline in
  the transcript with a relative link, and reusable from any other markdown. Local-only,
  governed by the same `saveTranscripts` opt-out, deleted with the session by `/forget`,
  copied out by `/export` (ADR-0021).

## 0.5.0

### Minor Changes

- 605e676: Add **reusable vault migrations** (ADR-0020) — a safe, repeatable way to bring a person's
  existing `~/.claudia/` notes up to date when the format changes between versions. Each
  migration is a pure, idempotent transform under `src/migrations/NNNN-<slug>.mjs` behind an
  ordered registry (a future migration is one new file + one line); `scripts/migrate-vault.mjs`
  runs the pending ones — read → **backup first** (`~/.claudia.bak-<date>`) → apply → record
  a `.migrations` ledger → rebuild the dashboard — and **never touches the verbatim
  transcripts**. Migrations apply **automatically and quietly at `recall`** (background upkeep,
  like deferred distillation), disclosed plainly only when they actually change something, and
  a no-op after the first run (ledger + idempotency). A new **`/migrate`** command is the manual
  surface: preview with a dry-run, or apply on demand. The first registered migration rewrites
  the old Obsidian `[[wikilinks]]` to relative links, so upgrading users are carried forward
  without hand-editing. The command surface grows from five to six.

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
