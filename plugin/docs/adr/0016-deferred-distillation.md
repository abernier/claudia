---
status: accepted
---

# Deferred distillation — distill at the next open, not at the close

The memory model (ADR-0004) has two layers: a verbatim **archive** written
deterministically by a hook, and a distilled **working memory** (`*.summary.md`,
`person.md`, `people/*`, `themes.md`, …) written by skills — `distill-session`,
`remember`, `relationships`, `understand`, `themes`. The archive always
materialised; the working memory routinely did **not**. Real sessions ended with a
transcript and nothing else — the very gap that prompted this ADR.

## Why it failed

The trigger was **session close**. `distill-session` was meant to run "at close,
also triggered by the Stop hook" — but:

- No `Stop` hook is (or was) wired, and a hook is a shell script: it **cannot run
  an LLM skill** anyway. So distillation depended entirely on the model choosing to
  invoke it before the conversation ended.
- A person just closes the terminal. Close is **structurally unreliable** — there is
  no moment the model is guaranteed to act.

So the fragile half of the design sat on the unreliable half of the lifecycle.

## Decision

**Move the distillation trigger from session _close_ to the next session's _open_.**
Open is structurally reliable: a Claudia conversation cannot begin without `recall`
(loaded by the `claudia` skill when she is named). Concretely:

- `save-session.mjs` (SessionEnd) drops a `<stem>.pending-summary` marker on **every**
  close — a **dirty flag**, not just a placeholder. `distill-session` clears it once it
  has (re)written the summary, so a session that was distilled and then _resumed_ is
  re-distilled and its now-stale summary refreshed.
- New pure module `src/pending.mjs` (`pendingSessions`) + CLI `scripts/pending-sessions.mjs`
  give `recall` a **deterministic** list of sessions carrying that marker (keyed by
  **stem** — `<date>-<session-id>` per ADR-0017, or a legacy `<date>`).
- `recall` runs that check first and hands each stem to `distill-session`, which reads
  that one past transcript, writes the summary, and clears the marker. Detection is
  deterministic; distillation stays the model's job.

## Why not a `SessionStart` hook

A hook _is_ reliable, but at `startup` the new transcript is empty, so it cannot tell
a Claudia session from a coding one — and the plugin runs at user scope. ADR-0013
deliberately gates the persona anchor on `isClaudiaSession` to never touch coding
sessions; a blind startup nudge would violate that. `recall` only runs inside a real
Claudia conversation, so it is the correctly-scoped home for the catch-up.

## Consequences

- Distillation now reliably happens **one session late** rather than not at all: the
  conversation you just had is distilled at the start of the next one. Acceptable —
  continuity is what matters, not immediacy.
- `distill-session` gains an explicit **deferred / from-transcript** path. Reading a
  past transcript to _build_ its summary is the one sanctioned exception to recall's
  "never read a transcript" invariant (ADR-0004) — it exists precisely to spare every
  future recall from doing so.
- `remember` / `understand` / `relationships` / `themes` are still model-invoked from
  within `distill-session`'s follow-through; deferring the distill defers them too, so
  the whole working layer catches up together.
- All layers **fail silent** (like ADR-0012/0013): a missing dir, unreadable file, or
  bad date prints nothing and never blocks recall.
- Originally summaries were keyed by **date**, which mashed two same-day conversations
  into one summary. **ADR-0017 supersedes this**: keying by session (`<date>-<id>`) means
  each conversation gets its own transcript, marker, and summary.
- This is the memory counterpart to ADR-0013: an invariant that must outlive an abrupt
  close belongs on the reliable edge of the lifecycle, surfaced deterministically to
  the model — not left to a moment that may never come.
