---
name: remember
description: Update Claudia's working memory for this person — the distilled person model, goals, and safety flags under ~/.claudia/. Use when something worth carrying forward emerges, and to run the one-time first-run disclosure that memory is saved locally.
allowed-tools: Read Write Bash
---

# Remember

Keep the working memory current so future conversations have continuity — as
*distilled notes*, never verbatim.

## First run — disclose once, plainly

The first time `~/.claudia/` is created, tell the person, once and clearly (this
is the "when it matters" moment, not a repeated disclaimer): their conversations
and a distilled memory are saved **locally on their own machine** under
`~/.claudia/`, nothing is uploaded, and they can export (`/export`) or delete
(`/forget`) any of it, anytime.

## What to write (working layer)

- `person.md` — a short, evolving model: the person's **name**, context, what
  they're navigating, what helps them, communication style — plus a **Follow-ups**
  list: events they're anticipating (with the date and the **concern attached**)
  and between-session steps, each marked *open* or *done*. This is what lets the
  next session open with a contextualized check-in. Distilled, kind, non-clinical.
- `goals.md` — what you've agreed to work toward (alliance: goal consensus).
- `todo.md` — a **shared, person-owned to-do-later list** (ADR-0018), distinct from
  the Follow-ups above: those are *your* radar of anticipated events (with the worry
  attached), phrased as check-in cues; `todo.md` is a plain, checkbox action list the
  person can open and edit themselves. When something concrete and *task-shaped* to do
  later surfaces — the person says "note that for later," or you both agree on a
  between-session step — add it under `## Ouvert`, tagged with the current session
  (`[[<date>-id>]]`) if you know the stem, else the date alone; `distill-session`
  reconciles the tag. Tick items done rather than deleting them. Promote only genuine
  tasks here — not every felt thread belongs on a to-do list.
- `safety.md` — locale, region-appropriate resources, and any standing safety
  flags. **Never** record means/method details.
- `MEMORY.md` — a one-line-per-entry index of what's known and where (people, and the
  [recurring threads](../themes/SKILL.md) that `themes` maintains).

## The rule of distillation

Write summaries, not transcripts. Strip anything that would harm the person if
the file leaked. The distiller must itself respect the safety floor (ADR-0004):
no verbatim means/methods, no re-statement of a plan.
