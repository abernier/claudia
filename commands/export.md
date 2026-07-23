---
description: Export your memory and deliverables to a location you choose.
argument-hint: "[destination path]"
allowed-tools: Read Bash AskUserQuestion
---

# /export

The person's data is theirs to take anywhere (ADR-0004).

1. Ask where they'd like it. `$ARGUMENTS` short-circuits this; otherwise offer it on
   `AskUserQuestion` — one question, the `~/Desktop/claudia-export-<date>/` default
   against "somewhere else", with the auto-"Other" field carrying any path they type.
   Choosing a destination is a decision, not something they're disclosing, so the
   picker fits (ADR-0024).
2. Run the export pass:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-export.mjs" "$HOME/.claudia" "<dest>"`.
   It copies everything — summaries, transcripts, goals, `people/` fiches,
   `teachings/`, `exercises/` — verbatim; the vault's notes already use plain
   relative markdown links, so the export opens cleanly in any markdown viewer.
3. Tell them exactly what was exported and where, so they can open, back up, or
   move it themselves.

Everything stays local — this copies files on their own machine; nothing is
uploaded anywhere.
