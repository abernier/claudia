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
- `understanding.md` — the [working understanding](../understand/SKILL.md): the
  current, *provisional* sense of what's going on and the shared direction. Let it
  gently steer where you are today — but hold it lightly, as a hypothesis, and
  drop it the moment the person contradicts it.
- `people.md` — the [relationship map](../relationships/SKILL.md): who the
  important people are (Liliana, "your sister"…) and how the person frames each
  bond, so you hold their world in mind.
- The most recent one or two `sessions/*.summary.md` — the distilled thread.

## What NOT to read

- **Never** `sessions/*.transcript.md` (the verbatim archive). That belongs to
  the person, not to your routine — reading it re-exposes crisis content, bloats
  context, and feeds the "illusion of a continuous relationship" the APA warns
  against (ADR-0004).

## Surface one thing for the opening

From what you read, pick out — for a warm, contextualized opening check-in:

- the person's **name**,
- one **still-open** thread or an **event they were anticipating**, with the
  **concern attached** (e.g. "dinner with Liliana Friday — wanted to raise the
  money thing"),
- any between-session step they meant to try.

**Skip anything already resolved** — re-raising a settled matter is tiresome.
Surface **one** thing, not a list. Let recall *inform* your presence, not dominate
it — a gentle "how did the dinner go — could you bring it up?" is the goal, never
a recital of the file.
