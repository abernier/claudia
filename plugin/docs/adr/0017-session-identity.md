---
status: accepted
---

# Session identity — a genuine-session gate, and one file per session

Two bugs let `~/.claudia/sessions/` fill with the wrong thing. Both are about
**identity**: which transcripts are genuinely Claudia's, and how one conversation
maps to files on disk.

## Bug 1 — the gate false-positived on dev sessions

`isClaudiaSession` decided a transcript was Claudia's if the raw JSONL _contained_
persona strings (`You are Claudia`, `skills/claudia`, …). But the plugin runs at
user scope, so the hook fires for every session — and any session that **works on
Claudia** carries those strings: reading `SOUL.md`, opening a skill file, or
`/grill-me`-ing a feature. So dev sessions were archived into the person's
therapy vault (and would keep being, including the session doing this cleanup).

## Bug 2 — date-keyed, append-only archiving

`save-session` wrote `<date>.transcript.md` and **appended** on every close. A
resumed conversation re-dumps its _entire_ transcript each time, so one Liliana
session appeared **three times** (growing) in a single day's file; and because the
gate was loose, three unrelated dev `/grill-me` sessions were concatenated after
it. One day-file, six sessions, two of them real.

## Decision

**A genuine-session gate (`src/session.mjs`).** A transcript is Claudia's only if
the `claudia` skill was actually _activated_ — its loader preamble appears as a
**user-authored message**: `Base directory for this skill: …/skills/claudia\n# You
are Claudia …`. `textFromContent` drops `tool_result`/`tool_use` blocks, so merely
_reading_ a skill file never counts, and `/grill-me` loads `…/skills/grilling`, not
`…/skills/claudia`. Validated against real transcripts: all five repo-dir dev
sessions (incl. the live one) → excluded; the one genuine session run from the
person's own dir → kept.

**One file per session, overwritten (`scripts/save-session.mjs`).** The archive is
keyed by session, not date: `<start-date>-<short-session-id>.transcript.md`, where
the short id is the session id's first 8 chars (readable, and enough to disambiguate
one person's own sessions). On each close the file is **overwritten** (the stem is
recovered by matching the existing file for this session, so its first-seen date and
name stay stable across resumes and across midnight). No more duplicate re-dumps;
one conversation ⇒ one file. `pending.mjs` keys on the **stem** (`<date>-<id>` or a
legacy plain `<date>`), so both schemes coexist.

## Consequences

- The gate **fails safe**: a missed genuine session simply isn't archived (the
  person still has it under `~/.claude/`); it never mis-files a dev session as
  therapy. It couples to Claude Code's skill-loader preamble format — an acceptable,
  documented coupling for the strongest available signal.
- Keying by session also **fixes distillation granularity** (the same-day limitation
  noted in ADR-0016): two conversations on one day are now two files with two
  summaries, and a session resumed across days is _one_ file, not two.
- **Migration (one-off).** The existing date-files were rebuilt: the genuine Liliana
  session (spanning 07-21→07-22) was re-rendered from its source JSONL to a single
  session-keyed transcript + one consolidated summary; the polluted/triplicated
  date-files were moved to `sessions/_pre-cleanup/` (reversible) rather than deleted.
- Short-id collision (two of the person's sessions sharing an 8-hex-char prefix on
  the same start date) is astronomically unlikely and out of scope; the full id
  remains available in the source transcript if ever needed.
