---
"claudia": minor
---

Add a shared **to-do-later** surface, `~/.claudia/todo.md` (ADR-0018): a plain,
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
