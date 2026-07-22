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
2. **Confirm once, explicitly** — deletion is permanent and there is no undo.
   Name exactly what will be removed.
3. Delete it for real from `~/.claudia/` (and update `MEMORY.md` so the index no
   longer references it).
4. If anything survived (a **partial** delete — a single session or a topic),
   rebuild the dashboard mirror so it no longer reflects what was erased (ADR-0019).
   On "everything", it is gone with the directory, so skip this.

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"
   ```
5. Confirm gently what was removed. Do not editorialise or resist the person's
   choice — deletion is theirs.

Never delete without the explicit confirmation in step 2.
