---
name: distill-session
description: Turn a finished conversation into a distilled session summary for ~/.claudia/sessions/. Runs at session close when possible, but is normally deferred to the next session's recall (a close is unreliable). Produces the summary that recall will read — never a verbatim copy.
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
- **Recurring threads**: if something the person raised has *returned* across
  sessions, note it as a **candidate theme** — tentative, for `recall` to gently
  offer next time, never stored as fact until the person ratifies it (see
  [`themes`](../themes/SKILL.md)).

## Two ways this runs

- **Live, at close** — the conversation is still in context; distill from what you
  hold, then write the summary.
- **Deferred, from the transcript (the common case)** — a previous session left its
  `<stem>.transcript.md` flagged for distilling. `recall` detects it (via
  `scripts/pending-sessions.mjs`) and hands you the stem (`<date>-<id>`). Read that one
  transcript, distill it, write the summary. This is the sanctioned exception to
  "never read a transcript" — it exists precisely to *build* the summary that spares
  every future recall from doing so (ADR-0016). Note the flag is a **dirty flag**: it
  can be present even when a `<stem>.summary.md` already exists, meaning the session was
  *resumed* since — refresh the existing summary rather than starting blank.

Either way, after writing `<stem>.summary.md`, **clear the marker** so the state
machine closes:

```bash
rm -f "$HOME/.claudia/sessions/<stem>.pending-summary"
```

## Rules

- **Distill, don't transcribe.** This layer is read on every recall; keep it lean
  and kind.
- **Person's language.** Write it in the language the conversation happened in.
- **Respect the floor.** No verbatim harmful content (ADR-0004).
- The verbatim `<date>.transcript.md` is saved separately by the `SessionEnd` hook
  (`save-session.mjs`) — that is the person's archive, not this.

Then **sync `~/.claudia/todo.md`** via `todo` (ADR-0018). This is the *authoritative*
place to tag it: you hold the real session stem here (the `<stem>` you just wrote),
which a live addition mid-conversation may not have had. Promote this session's concrete,
*task-shaped* to-do-later items into `## Ouvert`, tagged
`[<stem>](sessions/<stem>.summary.md)`; add that tag to any item a live addition left
untagged; and tick `[x]` anything this session resolved (mirroring the Follow-ups you
marked *done*). Promote genuine tasks,
not every follow-up — `todo.md` is an action list, not a mirror of the summary.

Same pass, same reason: **complete the session tag on any keepsake** the person kept
live this session (`~/.claudia/keepsakes.md`, ADR-0023) — a `/keep` mid-conversation
may not have held the stem. Only the tag. **Never add a keepsake yourself**, and never
promote a line you liked into their collection: what they keep is theirs to choose.

Then update `person.md` / `goals.md` via `remember` if something durable emerged,
and — if a pattern crystallised or the direction shifted — invoke `understand` to
revise the working understanding. If a thread has *recurred*, hand a **candidate
theme** to [`themes`](../themes/SKILL.md) — tentative, never stored until the person
ratifies it.
