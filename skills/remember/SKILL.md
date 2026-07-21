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

- `person.md` — a short, evolving model: context, what they're navigating, what
  helps them, communication style. Distilled, kind, non-clinical.
- `goals.md` — what you've agreed to work toward (alliance: goal consensus).
- `safety.md` — locale, region-appropriate resources, and any standing safety
  flags. **Never** record means/method details.
- `MEMORY.md` — a one-line-per-entry index of what's known and where.

## The rule of distillation

Write summaries, not transcripts. Strip anything that would harm the person if
the file leaked. The distiller must itself respect the safety floor (ADR-0004):
no verbatim means/methods, no re-statement of a plan.
