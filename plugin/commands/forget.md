---
description: Really delete a memory — a session, a topic, or everything. Your data, your call.
argument-hint: "[session date | topic | all]"
allowed-tools: Read Bash
---

# /forget

Real deletion, honoured (safety-floor rule 10 / ADR-0004). This is the person's
right and it must be reliable.

1. Clarify the scope with them (unless `$ARGUMENTS` already says):
   - a **single session** (e.g. `2026-07-21`) → its `.summary.md`,
     `.transcript.md` (or `.transcript.jsonl` fallback), its `<stem>.assets/` folder
     of pasted images, and related deliverables,
   - a **topic** → the relevant lines in `person.md` / `goals.md` and any tied
     files,
   - **everything** → the whole `~/.claudia/` directory.
2. **Confirm once, explicitly** — from their notes this is permanent and there is no
   undo. Name exactly what will be removed. Say plainly, in the same breath and
   without making a production of it, that **the safety copies are a separate
   thing**: archives taken before today are dated records and are not rewritten, so
   they still hold this until they rotate out, and `/backup` is where they clear them
   if they want to. State it; do not turn it into a second decision to make. Someone
   deleting a hard memory should not have to run a data-retention review to do it
   (ADR-0032).
3. Delete it for real from `~/.claudia/` (and update `MEMORY.md` so the index no
   longer references it). **Never touch `~/.claudia-backups/`** — an archive is a
   record of what was true when it was taken, not a mirror of what the person wants
   today, and nothing here rewrites one.
4. If anything survived (a **partial** delete — a single session or a topic),
   rebuild the dashboard mirror so it no longer reflects what was erased (ADR-0019).
   On "everything", it is gone with the directory, so skip this.

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"
   ```

5. Confirm gently what was removed. Do not editorialise or resist the person's
   choice — deletion is theirs.

**Never reach into an archive to bring back something they chose to forget** — not to
check a fact, not to fill a gap, not because it would be useful. The archive keeps it;
you do not go and get it. That rule is what makes leaving the archives alone
compatible with honouring the deletion.

Never delete without the explicit confirmation in step 2.
