---
status: accepted
---

# A shared to-do-later surface — `todo.md`

Things worth doing surface mid-conversation and then evaporate — the person says
"I should call them before Thursday," or a between-session step is agreed, and by
next session it's gone. The working memory already had a place for the _relational_
version of this — **Follow-ups** in each `<stem>.summary.md` and in `person.md` — but
that home has two limits: it is **Claudia's** radar (phrased as check-in cues, written
by the distiller), and it is **read-only to the person** (a distilled note, not a list
they own). What was missing is a plain, shared, person-editable action list.

## Decision

A single file, `~/.claudia/todo.md` (working layer), holding concrete _task-shaped_
things to do later. Both parties write to it; the person can open and edit it directly.

- **Format: by status, session as a tag.** `## Ouvert` / `## Fait`, each line a
  checkbox item ending in `· [<stem>](sessions/<stem>.summary.md)` — a relative link to
  the session that raised it. Grouping by
  status (not by session) keeps "what's still open" scannable as the list grows across
  sessions, while the tag preserves provenance. Person's language, like every working
  file.
- **Read at recall.** `recall` scans `## Ouvert` for one still-open, task-shaped item as
  a candidate for the opening nudge — never a recital, always declinable, skipped if
  resolved. It is the concrete home for the "a step they meant to try" the opening
  already looks for.
- **A dedicated `todo` skill owns the behavior.** Like every other memory surface
  (`understand`, `relationships`, `timeline`, `themes`), `todo.md` has its own skill —
  the discoverable trigger for "note this for later" / "crée une todo," referenced from
  the persona so it fires mid-conversation. (An earlier revision folded the writes into
  `remember`; that left the capability untriggerable — the persona never routed to it.)
- **Written in three places, one of them authoritative:**
  - _Live_ — the persona reaches for `todo` (or the person appends by hand) under
    `## Ouvert` the moment a task surfaces. Mid-session she may not hold the finalized
    session stem (the archive file is only written at `SessionEnd`), so a live tag may
    be date-only or absent.
  - _Authoritative_ — `distill-session` holds the real `<stem>` (it is writing
    `<stem>.summary.md`), so it completes/normalizes tags, promotes this session's
    actionable items, and ticks resolved ones — mirroring the Follow-ups it marks _done_.
  - _By hand_ — the person edits and ticks their own list, anytime.
- **Complements Follow-ups, does not replace them.** Follow-ups stay Claudia's
  contextual-check-in radar (anticipated events + worry); `todo.md` is the shared,
  literal action list. Only genuine tasks get promoted — `todo.md` is not a mirror of
  the summary, and not every felt thread is a to-do.

## Consequences

- Same guarantees as the rest of the working layer (ADR-0004): strictly local,
  never uploaded; distilled and safety-floored (no means/methods on a line); removed by
  `/forget`; carried out by `/export`. It is added to `docs/memory-layout.md`.
- A live-added item can briefly carry a provisional (date-only) or missing tag until
  the next distillation reconciles it — an acceptable eventual-consistency window, and
  the same deferred-reconciliation shape distillation already uses (ADR-0016).
- Some overlap with Follow-ups is tolerated by design; the promotion rule ("tasks, not
  every follow-up") keeps the list from degenerating into a duplicate of the summary.
- When the person asks to _see_ the list, the skill may project the still-open items
  into the session task widget (`TaskCreate`/`TaskUpdate`) for a live checkbox view.
  The projection is session-scoped and discarded at close — never a second source of
  truth: every tick lands in `todo.md` first, and a hand-edited file wins over a stale
  widget. Projected only on explicit request, so the list stays pulled, not pinned.
