# Memory layout — `~/.claudia/`

The full contract for the person's data. It lives **on the person's own machine**,
never in this repo, never uploaded (ADR-0004, safety-floor rule 10). Filenames are
English/universal; **content is written in the person's language**.

```
~/.claudia/
├── config.json          optional — e.g. { "saveTranscripts": false } to opt out of verbatim archive
├── MEMORY.md            one-line-per-entry index of what Claudia knows and where
├── person.md            distilled, evolving model of the person (context, what helps, style)
├── goals.md             agreed therapy goals (alliance: goal consensus)
├── understanding.md     the working understanding — provisional, dated, correctable (ADR-0008)
├── safety.md            locale + region resources + standing safety flags (never means/methods)
└── sessions/
    ├── 2026-07-21.summary.md        distilled — READ on recall
    ├── 2026-07-21.transcript.jsonl  verbatim — the person's archive, NOT read in routine
    ├── teachings/
    │   └── 2026-07-21-anxiety-cycle.md
    └── exercises/
        └── 2026-07-21-thought-record.md
```

## Two layers, two jobs

| Layer | Files | Who reads it | Default |
|---|---|---|---|
| **Working memory** | `person.md`, `goals.md`, `understanding.md`, `safety.md`, `*.summary.md`, `MEMORY.md` | Claudia, via `recall`, every session | on |
| **Person's archive** | `*.transcript.jsonl` | the person (via `/export`); **not** Claudia in routine | on (opt-out via `config.json`) |

## Invariants

- **Recall reads the working layer only** — never a raw transcript (context
  economy, avoid re-exposing crisis content, limit dependency). See `recall`.
- **Summaries are distilled, never verbatim**, and respect the safety floor (no
  means/methods). See `distill-session` and `remember`.
- **`/forget` is real deletion**; **`/export` copies everything out**. Both
  operate here. See `commands/`.
- **First-run disclosure** happens once when this directory is created (see
  `remember`) — plain, not a repeated disclaimer.

## Who writes what

- `hooks/save-session.mjs` (SessionEnd) → `*.transcript.jsonl` (deterministic).
- `distill-session` skill (close ritual) → `*.summary.md`.
- `remember` skill → `person.md`, `goals.md`, `safety.md`, `MEMORY.md`.
- `understand` skill → `understanding.md` (the working understanding).
- `teach` / `exercise` skills → `teachings/`, `exercises/`.
