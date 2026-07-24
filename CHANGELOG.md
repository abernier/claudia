# claudia

Written for the person using Claudia: what changed, and what it means for you. The
reasoning behind each decision lives in the ADRs under `docs/adr/`, referenced here
by number.

## 0.11.0

**Digest.** Claudia now **shows** what she makes — your relationship map, timeline,
explainers and worksheets open as views instead of arriving as file paths — and a new
`/menu` lays out your own open threads for the moments you don't know where to start.

### Minor Changes

- bf2a6c9: **`/menu`** — a menu you pull when the open floor feels too open. It lists your own live threads (an open follow-up, a to-do, a goal) and always ends on _just talk about now_. Never a list of features, and never opened on you. ADR-0027.
- 8130cfe: **Deliverables are shown, not just named.** Your ecomap, timeline and explainers open inline; a worksheet arrives as an attachment. Still nothing leaves your machine — she shows, she never publishes, and she never pushes a notification to bring you back. ADR-0026.
- 4eb74c5: **Buttons for decisions, an open floor for everything else.** Clickable options are now reserved for choices — a scope, a format, a destination. Anything you'd _tell_ her stays an open question. Also fixes a permission prompt that interrupted `quiz` mid-way. ADR-0024.
- 907fe77: **Documents you share are kept with the conversation.** A PDF now survives in your session folder the way pasted screenshots already did, instead of disappearing when Claude Code rotates its own store. Same opt-out, same deletion by `/forget`. ADR-0021.
- c2ef4d3: **Your notes get a dependable header.** The factual half — dates, session, type — is now written by code instead of guessed, so it stops drifting. A migration repairs what is already on disk, backed up first. ADR-0025.

### Patch Changes

- 8130cfe: `/keep` and `exercise` now show the actual passage, or the worksheet's shape, beside each option — instead of squeezing it into a one-line label. ADR-0024.

## 0.10.0

**Digest.** The one sentence worth keeping — yours or hers — held word for word.

### Minor Changes

- 1024044: **Keepsakes.** `/keep` holds a passage verbatim in `~/.claudia/keepsakes.md`, honestly attributed and dated. With no argument, Claudia offers you a few candidates from what was just said. She may offer to catch a sentence _you_ found; she never proposes keeping her own. Never counted, never a streak. ADR-0023.

## 0.9.0

**Digest.** The life timeline now actually fills up.

### Minor Changes

- 7bbf934: **The timeline populates.** The feature shipped in 0.2.0 but nothing cued Claudia to use it, so `timeline.md` stayed empty in practice. A datable life event is now placed as it surfaces — in your own words, never by interrogation, painful events only if you volunteer them. ADR-0014.

## 0.8.0

**Digest.** Practice what you worked out, so it lasts.

### Minor Changes

- 34c3b99: **`quiz`** — warm, one-at-a-time retrieval practice on the reframes and coping moves you came up with yourself. You pick the scope, the format (free recall, multiple choice, or a mix) and the pace. It draws only on your own saved exercises and agreed lessons.

## 0.7.0

**Digest.** Save where you've got to without waiting for the conversation to end.

### Minor Changes

- 31dad39: **`/save`** — checkpoint your memory mid-conversation. It distils where things got to and refreshes your notes and dashboard, for reassurance or before a break. It saves the distilled memory, not the verbatim transcript. ADR-0016.

## 0.6.2

**Digest.** Fixes to how failures behave — the safety check now errs toward caution.

### Patch Changes

- b2841f8: **Fail-safe fixes** surfaced by the typing pass (ADR-0022):
  - The per-turn **safety check** now escalates when the risk classifier answers in an unexpected form — previously an unrecognised verdict could read as _no risk_.
  - A failed transcript write still flags the session for distillation next time, so nothing is silently lost.
  - A failing `/export` now says so and exits non-zero, warning the copy may be partial, instead of reporting success.
  - An error mid-`/migrate` now names the backup to restore.

## 0.6.1

**Digest.** Internal quality pass — nothing changes for you.

### Patch Changes

- 99c4e01: **Strict type checking, no build step.** TypeScript joins as a dev-only checker; the runtime stays plain `.mjs`, so there is no new requirement on your machine. ADR-0022.

## 0.6.0

**Digest.** Screenshots you paste are kept with the conversation.

### Minor Changes

- b9538e2: **Pasted images persist.** A screenshot used to be dropped from your saved transcript. It is now kept alongside it and shown inline. Local only, covered by the same `saveTranscripts` opt-out, deleted with the session by `/forget`. ADR-0021.

## 0.5.0

**Digest.** Your existing notes are carried forward automatically when the format changes.

### Minor Changes

- 605e676: **Vault migrations, and `/migrate`.** When a new version changes the note format, your existing notes are updated for you — quietly at the start of a conversation, after a full backup, and only ever once. You are told plainly when it actually changed something. `/migrate` is the manual control, with a preview. The verbatim transcripts are never touched. ADR-0020.

## 0.4.0

**Digest.** A bird's-eye view of where things are, that you open yourself.

### Minor Changes

- a1383eb: **`/dashboard`** — goals, live themes, what's to pick up, your people, recent threads, in one place. It is a mirror, not a summary: it only ever quotes what your notes already say or links to them, so it cannot put words in your mouth. Claudia never recites it. Your safety notes are deliberately absent, and there is no mood chart. Turn it off with `{ "dashboard": false }`. ADR-0019.

### Patch Changes

- 8f277f5: **Notes use plain relative links** instead of Obsidian `[[wikilinks]]`, so they stay readable everywhere — GitHub, any plain viewer, Obsidian — with no rewriting when you export.

## 0.3.0

**Digest.** A shared to-do list, yours to edit and tick.

### Minor Changes

- 58ebd2c: **`todo.md`** — concrete things to pick up later, that either of you can jot down. Grouped into open and done, each tagged with the conversation that raised it. Hand-editable, ticked rather than deleted, removed by `/forget` and carried by `/export`. ADR-0018.

## 0.2.1

**Digest.** Fixes to what gets archived, and to summaries that never arrived.

### Patch Changes

- 2f473d8: **Three fixes to session archiving:**
  - Only genuine Claudia conversations are archived — a development session that merely read her files no longer lands in your notes. ADR-0017.
  - One conversation is now one file, overwritten, instead of piling up duplicates in a shared day-file.
  - Summaries are written at the _start of the next_ conversation rather than at close — closing a terminal is unreliable, so they were often never written at all. ADR-0016.

## 0.2.0

**Digest.** Memory with shape. Claudia gains a living **working understanding** and
agreed **goals**, **active curiosity** with an offered **intake**, a **relationship
map** and a cross-linked **person-fiche vault**, a person-led, trauma-informed **life
timeline**, and **"the thread"** — a person-pulled `/thread` recap within a session and
recurring **themes** across sessions. All local-only, provisional, and deletable — on
the same non-negotiable safety floor.

### Minor Changes

- cf19f7d: **A working understanding** — a provisional, collaborative sense of what you're navigating, which steers her direction across conversations. She reflects it back for you to correct, holds it as a hypothesis, and centres your own strengths. Never a diagnosis or a clinical record. ADR-0008.
- 6c5eb62: **Active curiosity, and an offered `intake`.** She now asks openly about you and the people behind what you share, while staying reflection-led — no stacked questions, no "why", and sensitive material is left to emerge. The intake is a short, declinable getting-to-know-you. ADR-0009.
- 4d407fe: **A relationship map** — an ecomap of the people around you and how _you_ frame each bond, drawn as a diagram. It's what lets her remember who "Liliana" or "your sister" is. Shown to you to check it's right, and strictly non-judgmental about anyone in it. ADR-0010.
- 9666578: **Person fiches** — each important person can get a reflective note of their own, cross-linked to your themes and summaries. A mirror of your experience of them, never a verdict about them. ADR-0011.
- 621298c: **A life timeline** — the arc of your life in your own words, and an offered life-review. Person-led and partial by design; painful events only if volunteered, never a forced chronological inventory. ADR-0014.
- f24e6b7: **The thread.** `/thread` reflects the through-line of the current conversation, briefly and never directively; across conversations, recurring **themes** are proposed tentatively and only kept once you ratify them. ADR-0015.

## 0.1.0

**Digest.** Initial public release — a warm, generalist companion for reflection and
emotional support, as an installable Claude Code plugin.

- Relationship-first, multi-approach (person-centered, CBT, behavioral activation,
  ACT, MI, solution-focused, mindfulness & self-compassion), on a non-negotiable
  safety floor.
- Deterministic per-turn safety check + crisis pivot with localized resources.
- Local-only, two-layer memory under `~/.claudia/`; warm, contextualized session
  openings.
- Self-authoring of new technique skills, gated by an adversarial auditor panel;
  bounded ephemeral delegation.
- Not a licensed clinician, not therapy, not a medical device.
