---
description: Update your saved notes to the latest format — with a preview and a backup first. Normally automatic; this is the manual control.
allowed-tools: Read Bash
---

# /migrate

When Claudia's note format changes between versions, your existing `~/.claudia/` notes
are brought up to date by a **migration** (ADR-0020). This normally happens
**automatically and quietly** at the start of a session — with a full backup and a plain
word about it. `/migrate` is the manual control: preview what would change, or run it on
demand.

Everything stays local — this only rewrites files on your own machine, always after a
backup, and it **never touches the verbatim transcripts**.

## What to do

1. **Preview first** (writes nothing):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/migrate-vault.mjs" --dry
   ```

   - If it says _"up to date"_ / _"nothing would change"_, tell them plainly their notes
     are already current — and stop. Nothing to do.
   - Otherwise, show them briefly what would change (the file list), in plain language.

2. **Apply**, only if there's something to change and they're happy to proceed:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/migrate-vault.mjs"
   ```

   It takes a **full backup** (`~/.claudia.bak-<date>`) _before_ rewriting anything, then
   updates the notes and rebuilds the dashboard mirror.

3. **Tell them exactly** what changed and **where the backup is**, so they can open,
   check, or roll back themselves. Calm and matter-of-fact — a small piece of upkeep,
   not an event.

## Never

- Never run this as a recital or make it feel like a chore — it's housekeeping on _their_
  data, offered plainly.
- Never skip the backup or touch a `*.transcript.md`.
- If anything in the moment trips a risk signal, [crisis](../skills/crisis/SKILL.md)
  comes first — never "let's migrate your notes".
