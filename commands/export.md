---
description: Export your memory and deliverables to a location you choose.
argument-hint: "[destination path]"
allowed-tools: Read Bash
---

# /export

The person's data is theirs to take anywhere (ADR-0004).

1. Ask where they'd like it (or use `$ARGUMENTS`); default to
   `~/Desktop/claudia-export-<date>/`.
2. Copy the contents of `~/.claudia/` there — summaries, transcripts, goals,
   `teachings/`, `exercises/`. Keep the structure intact and readable.
3. Tell them exactly what was exported and where, so they can open, back up, or
   move it themselves.

Everything stays local — this copies files on their own machine; nothing is
uploaded anywhere.
