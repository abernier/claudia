---
"claudia": patch
---

Fix `~/.claudia/sessions/` filling with the wrong thing, and the working memory
never materialising.

- **Genuine-session gate (ADR-0017).** `isClaudiaSession` keyed on persona strings
  appearing *anywhere*, so any dev session that read `SOUL.md` or `/grill-me`-d a
  feature was archived into the therapy vault. It now requires the `claudia` skill to
  have been genuinely *activated* (its loader preamble as a user message) — reading a
  file (a `tool_result`) or loading `…/skills/grilling` no longer counts.
- **One file per session, overwritten (ADR-0017).** Archiving was date-keyed and
  append-only, so a resumed conversation piled up as duplicate full re-dumps and
  distinct sessions mashed into one day-file. It is now keyed `<date>-<short-session-id>`
  and overwritten each close — one conversation, one file.
- **Deferred distillation (ADR-0016).** Distillation was a close-time ritual (a person
  just closes the terminal, so it rarely ran). It is now deferred to the next session's
  `recall`, which is structurally reliable. `save-session` drops a `pending-summary`
  dirty flag each close; `pending.mjs` + `scripts/pending-sessions.mjs` list flagged
  sessions deterministically; `recall` distills each from its transcript (the one
  sanctioned transcript read) and clears the flag — so a resumed session's stale
  summary is refreshed, too.
