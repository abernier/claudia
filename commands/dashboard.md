---
description: Open your dashboard — a bird's-eye view of where things are (goals, themes, what's to pick up, your people). A mirror you pull, never a recital pushed at you.
allowed-tools: Read Bash
---

# /dashboard

A **person-pulled** overview (ADR-0019). It exists as a standing file —
`~/.claudia/dashboard.md`, refreshed in the background — so you can open it in any
editor whenever you like. This command just rebuilds it fresh and shows it to you
on demand. Claudia never recites it unprompted.

## What to do

1. Rebuild it so it reflects the current memory:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"
   ```

2. If `~/.claudia/dashboard.md` exists, read it and show it as-is. It is a
   **mirror**: every section is either transcluded verbatim from a working file or
   a relative markdown link to it — nothing here is re-summarised, so it can never
   put words in your mouth. The working understanding and each session's thread are **linked**,
   never excerpted.

3. If the file is absent, it means either there's no memory yet, or you've turned
   the dashboard **off** (`{ "dashboard": false }` in `~/.claudia/config.json`) — say
   so plainly, and don't recreate it against that choice.

## Never

- Never push this into ordinary conversation — it appears only because the person
  asked (typed `/dashboard`).
- Never add safety flags or crisis content to it — the mirror deliberately omits
  `safety.md` (that net lives in the safety hook and `/help-now`).
- If anything in the moment trips a risk signal, [crisis](../skills/crisis/SKILL.md)
  comes first — never "here's your dashboard".
