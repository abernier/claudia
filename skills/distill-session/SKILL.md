---
name: distill-session
description: Turn a finished conversation into a distilled session summary for ~/.claudia/sessions/. Used at session close (also triggered by the Stop hook). Produces the summary that recall will read — never a verbatim copy.
allowed-tools: Read Write Bash
---

# Distill a session

Produce `~/.claudia/sessions/<date>.summary.md` — the memory that future
conversations actually read.

## What a good summary holds

- **The thread**: what the person brought, and where it went.
- **What seemed to matter**: the felt core, not every detail.
- **What helped**: approaches/techniques that landed, so they can recur.
- **Movement**: any shift, insight, or agreed next step (tie to `goals.md`).
- **Follow-ups**: any event the person is anticipating (with the date and the
  worry attached) and anything they meant to try — so next time can open with a
  contextualized check-in. Mark any earlier follow-up **done** if it was resolved
  or discussed this session, so it isn't raised again.
- **Safety**: note if a safety flag was raised (kind, and what was offered) —
  never the means/method.

## Rules

- **Distill, don't transcribe.** This layer is read on every recall; keep it lean
  and kind.
- **Person's language.** Write it in the language the conversation happened in.
- **Respect the floor.** No verbatim harmful content (ADR-0004).
- The verbatim `<date>.transcript.md` is saved separately by the Stop hook — that
  is the person's archive, not this.

Then update `person.md` / `goals.md` via `remember` if something durable emerged,
and — if a pattern crystallised or the direction shifted — invoke `understand` to
revise the working understanding.
