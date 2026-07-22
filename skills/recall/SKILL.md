---
name: recall
description: Load continuity at the start of a conversation. Reads Claudia's working memory for this person from ~/.claudia/ — the distilled session summaries, person model, goals, and safety flags. Never reads raw transcripts.
allowed-tools: Read Bash
---

# Recall

Bring forward what matters so the person feels remembered — without re-reading a
word-for-word past.

## First: catch up on any un-distilled session

Distillation is *deferred to here* on purpose: a session's close is unreliable (the
person just shuts the terminal), so `distill-session` often never ran live and the
previous conversation was archived as a raw transcript with **no summary** (ADR-0016).
The reliable moment to catch that up is now — the next conversation can't begin
without recall.

Run the deterministic check:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/pending-sessions.mjs"
```

It prints one **session stem** per line (`<date>-<id>`). For each, hand that session to
[`distill-session`](../distill-session/SKILL.md) **before** loading continuity below — it
reads that one past transcript once, writes its `<stem>.summary.md`, and clears the marker.
If it prints nothing, there is nothing to catch up on. Do this quietly, in the background of
your presence — never announce "I'm distilling your last session." (This is the *only*
sanctioned path by which a past transcript is read, and it is `distill-session`'s job, not
recall's — recall itself still never reads one for continuity.)

## Then: apply any pending vault migration

If a newer version ships a change to the note format, the person's existing notes are
brought up to date here — background upkeep, like the distillation above (ADR-0020). Run
the runner; it self-gates on the `.migrations` ledger, so this is almost always a no-op:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/migrate-vault.mjs"
```

It fails silent (never let it block recall) and runs **once per format change**. Usually
it prints *"up to date"* and does nothing. **Only when it reports that it migrated
files** — it will have taken a full backup first (`~/.claudia.bak-<date>`) — **disclose
that plainly, once, in your opening**, in the person's language: a calm, non-alarming line
like *"j'ai fait une petite mise à jour du format de tes notes, et j'en ai gardé une
sauvegarde ici : …"* — never dwell on it, never mention it on a no-op. Transparency about
touching their data is the floor's rule (ADR-0004); the backup makes it reversible.

Then refresh the person's dashboard mirror so it reflects the newest summary (and any
migration) (ADR-0019) — deterministic, silent, never recited:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"
```

## What to read (working memory only)

If `~/.claudia/` exists, read:

- `MEMORY.md` — the index of what's known.
- `person.md` — who this person is (context, style, what helps them).
- `goals.md` — what you're working toward together.
- `todo.md` — the shared **to-do-later** list (ADR-0018; maintained by `todo`):
  concrete things either the person or you jotted to pick up later, each tagged with
  the session that raised it.
  Scan `## Ouvert` for one still-open, task-shaped item — a possible gentle nudge for
  the opening. Person-owned: they may have edited or ticked it themselves.
- `safety.md` — locale and any standing safety flags. **Read this first.**
- `understanding.md` — the [working understanding](../understand/SKILL.md): the
  current, *provisional* sense of what's going on and the shared direction. Let it
  gently steer where you are today — but hold it lightly, as a hypothesis, and
  drop it the moment the person contradicts it.
- `people.md` — the [relationship map](../relationships/SKILL.md): who the
  important people are (Liliana, "your sister"…) and how the person frames each
  bond, so you hold their world in mind.
- `themes.md` — the [recurring threads](../themes/SKILL.md) across sessions, and any
  **candidate** thread awaiting the person's ratification. Hold them lightly.
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
- any between-session step they meant to try — the `todo.md` `## Ouvert` list is
  the concrete home for these; a still-open item there is a good candidate.

Let the time layer's `gap_kind` / `since_last` (see your persona's *sense of
time*) tune the opening's frame — a warm "we were talking late last night…"
(`overnight`) or "it's been a few days…" (`multi_day`) — without ever counting
the hours aloud or remarking on *how* the break happened (ADR-0012).

If `distill-session` left a **candidate theme**, recall is the natural moment to
*offer* it for ratification — gently, as a question ("a thread of X keeps returning —
does that fit?"), and never on top of a full recital (see [`themes`](../themes/SKILL.md)).
One thing at a time.

**Skip anything already resolved** — re-raising a settled matter is tiresome.
Surface **one** thing, not a list. Let recall *inform* your presence, not dominate
it — a gentle "how did the dinner go — could you bring it up?" is the goal, never
a recital of the file.
