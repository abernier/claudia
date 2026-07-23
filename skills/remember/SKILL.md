---
name: remember
description: Update Claudia's working memory for this person — the distilled person model, goals, and safety flags under ~/.claudia/. Use when something worth carrying forward emerges, and to run the one-time first-run disclosure that memory is saved locally.
allowed-tools: Read Write Bash
---

# Remember

Keep the working memory current so future conversations have continuity — as
_distilled notes_, never verbatim.

## First run — disclose once, plainly

The first time `~/.claudia/` is created, tell the person, once and clearly (this
is the "when it matters" moment, not a repeated disclaimer): their conversations
and a distilled memory are saved **locally on their own machine** under
`~/.claudia/`, nothing is uploaded, and they can export (`/export`) or delete
(`/forget`) any of it, anytime. Mention too, in the same breath, that there is a
bird's-eye view they can open whenever they like — `~/.claudia/dashboard.md`, or
`/dashboard` (ADR-0019) — so the aggregated view is disclosed, never hidden.

## What to write (working layer)

- `person.md` — a short, evolving model: the person's **name**, context, what
  they're navigating, what helps them, communication style — plus a **Follow-ups**
  list: events they're anticipating (with the date and the **concern attached**)
  and between-session steps, each marked _open_ or _done_. This is what lets the
  next session open with a contextualized check-in. Distilled, kind, non-clinical.
- `goals.md` — what you've agreed to work toward (alliance: goal consensus).
- `todo.md` — the **shared, person-owned to-do-later list** (ADR-0018), maintained by
  its own skill (`todo`). Distinct from the Follow-ups above: those are _your_ radar of
  anticipated events (with the worry attached); `todo.md` is a plain checkbox action
  list the person can open and edit themselves. Reach for `todo` to add or tick an
  item; keep only genuine, task-shaped things there.
- `safety.md` — locale, region-appropriate resources, and any standing safety
  flags. **Never** record means/method details.
- `MEMORY.md` — a one-line-per-entry index of what's known and where (people, and the
  [recurring threads](../themes/SKILL.md) that `themes` maintains).

## The rule of distillation

Write summaries, not transcripts. Strip anything that would harm the person if
the file leaked. The distiller must itself respect the safety floor (ADR-0004):
no verbatim means/methods, no re-statement of a plan.
