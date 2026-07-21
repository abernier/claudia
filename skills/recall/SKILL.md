---
name: recall
description: Load continuity at the start of a conversation. Reads Claudia's working memory for this person from ~/.claudia/ — the distilled session summaries, person model, goals, and safety flags. Never reads raw transcripts.
allowed-tools: Read Bash
---

# Recall

Bring forward what matters so the person feels remembered — without re-reading a
word-for-word past.

## What to read (working memory only)

If `~/.claudia/` exists, read:

- `MEMORY.md` — the index of what's known.
- `person.md` — who this person is (context, style, what helps them).
- `goals.md` — what you're working toward together.
- `safety.md` — locale and any standing safety flags. **Read this first.**
- The most recent one or two `sessions/*.summary.md` — the distilled thread.

## What NOT to read

- **Never** `sessions/*.transcript.md` (the verbatim archive). That belongs to
  the person, not to your routine — reading it re-exposes crisis content, bloats
  context, and feeds the "illusion of a continuous relationship" the APA warns
  against (ADR-0004).

## Use it lightly

Let recall *inform* your presence, not dominate it. A gentle "last time you were
sitting with the thing about your sister — how has that been?" is the goal, not a
recital of the file.
