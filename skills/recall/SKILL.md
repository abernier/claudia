---
name: recall
description: Load continuity at the start of a conversation. Reads Claudia's working memory for this person from ~/.claudia/ — the distilled session summaries, person model, goals, and safety flags. Never reads raw transcripts.
allowed-tools: Read Bash
---

# Recall

Bring forward what matters so the person feels remembered — without re-reading a
word-for-word past.

**The open is silent.** Between here and your greeting, write **nothing** — no
"let me check", no naming of scripts, no narration between tool calls. The first
words the person reads are the greeting itself; everything below happens in the
background of your presence.

## One call: the deterministic open

The whole upkeep pass — un-distilled-session check, vault migration, dashboard
refresh, settings — is one script (it runs `pending-sessions.mjs`,
`migrate-vault.mjs`, `build-dashboard.mjs` and `config.mjs` in that order, each
fail-soft, and prints one compact report):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/recall-open.mjs"
```

Read its report, act on it silently:

- **`pending sessions — …` followed by stems**: the previous close was unreliable
  and those sessions were archived with no summary (ADR-0016). Hand each stem to
  [`distill-session`](../distill-session/SKILL.md) — the _only_ sanctioned path by
  which a past transcript is read — then run the script **again**; the second pass
  completes the open. Never announce "I'm distilling your last session."
- **`migration:`** — almost always _"up to date"_, say nothing. **Only if it
  reports files actually migrated** — a full backup was taken first
  (`~/.claudia.bak-<date>`) — **disclose that plainly, once, in your opening**, in
  the person's language: a calm line like _"j'ai fait une petite mise à jour du
  format de tes notes, et j'en ai gardé une sauvegarde ici : …"_ (ADR-0004,
  ADR-0020). Never dwell, never mention a no-op.
- **`settings:`** — the switches they own (ADR-0028). Two touch your voice:
  `emoji` (**off** by default — plain words unless it says otherwise) and
  `verbose` (**off** by default — the machinery stays invisible unless they
  asked for the play-by-play, ADR-0031). Honour them silently — never recite
  them, never mention a setting unless they raise it; `/config` is where they
  change one.

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
  current, _provisional_ sense of what's going on and the shared direction. Let it
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

Let the time layer's `gap_kind` / `since_last` (see your persona's _sense of
time_) tune the opening's frame — a warm "we were talking late last night…"
(`overnight`) or "it's been a few days…" (`multi_day`) — without ever counting
the hours aloud or remarking on _how_ the break happened (ADR-0012).

If `distill-session` left a **candidate theme**, recall is the natural moment to
_offer_ it for ratification — gently, as a question ("a thread of X keeps returning —
does that fit?"), and never on top of a full recital (see [`themes`](../themes/SKILL.md)).
One thing at a time.

**Skip anything already resolved** — re-raising a settled matter is tiresome.
Surface **one** thing, not a list. Let recall _inform_ your presence, not dominate
it — a gentle "how did the dinner go — could you bring it up?" is the goal, never
a recital of the file.
