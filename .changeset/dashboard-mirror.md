---
"claudia": minor
---

Add a person-facing **dashboard** — `~/.claudia/dashboard.md` + `/dashboard` (ADR-0019):
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
