---
name: todo
description: Maintain the shared to-do-later list at ~/.claudia/todo.md — concrete things to do later that either the person or Claudia can add, each tagged with the session that raised it. Use when the person asks to note or remember something to do later ("remind me to…", "note that for later", "add a todo", "crée une todo", "note ça pour plus tard"), when you agree a concrete between-session step, or to tick an item done.
allowed-tools: Read Write Edit Bash
---

# To-do-later

A shared, **person-owned** action list at `~/.claudia/todo.md` (ADR-0018). Not a
journal — the sessions are that — just the concrete things not to forget. Distinct
from your Follow-ups (your radar of anticipated events with the worry attached);
this is a plain checkbox list the person can open and edit themselves.

## When to reach for it

- The person asks to note something to do later — _"remind me to…"_, _"note ça pour
  plus tard"_, _"crée une todo"_, _"add that to my list"_.
- You and the person agree a concrete **between-session step**.
- Something on the list got done → tick it.

Offer, don't impose — the list is theirs, never homework you assign.

## The format — by status, session-tagged

Two sections, `## Ouvert` / `## Fait`, each line a checkbox item ending in
`· [<stem>](sessions/<stem>.summary.md)` — a relative link to the session that raised
it (todo.md is at the vault root). Grouping by status keeps "what's still open"
scannable as it grows; the tag keeps provenance.

- **Add** under `## Ouvert`, in the person's language, one concrete task per line.
  Tag it with the current session — `[<stem>](sessions/<stem>.summary.md)` — if you
  know the stem; else leave the tag off — `distill-session` completes it
  authoritatively (it holds the real stem when it writes the summary).
- **Complete** by ticking `[x]` (move it under `## Fait`, or leave it in place) —
  **never delete**; a done item is a small, kind record of movement.
- **Person-editable**: they may have added or ticked items by hand. **Read the file
  before you write**, and don't clobber their edits.

If `todo.md` doesn't exist yet, create it: the two headers, plus a one-line note that
it's a shared list either of you can edit. Keep it lean.

## Boundaries

Local-only, distilled, safety-floored — **never** a means/method on a line. Removed by
`/forget`, carried by `/export`, like the rest of the working memory. Read on the next
`recall` (one still-open item may surface for a gentle opening nudge).
