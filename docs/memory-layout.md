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
├── people.md            relationship map (mermaid ecomap → genogram), non-judgmental (ADR-0010)
├── timeline.md          the life timeline — person-led, trauma-informed dated list (ADR-0014)
├── themes.md            recurring threads across sessions — person-ratified, provisional (ADR-0015)
├── safety.md            locale + region resources + standing safety flags (never means/methods)
├── people/                         one reflective fiche per important person (ADR-0011)
│   ├── Liliana.md                  wiki-linked to sessions, themes, other people
│   └── Marie.md
├── themes/                         one note per recurring thread that earned depth (ADR-0015)
│   └── the inner critic.md         name in the person's words; verbatim kept separate
└── sessions/                        one set of files per SESSION, keyed <date>-<short-session-id> (ADR-0017)
    ├── 2026-07-21-9113d5d7.summary.md      distilled — READ on recall
    ├── 2026-07-21-9113d5d7.transcript.md   verbatim — the person's archive, NOT read in routine
    ├── 2026-07-22-4f0ac1e2.pending-summary dirty flag: needs (re)distilling; cleared by distill-session
    ├── teachings/
    │   └── 2026-07-21-anxiety-cycle.md
    └── exercises/
        └── 2026-07-21-thought-record.md
```

## Two layers, two jobs

| Layer | Files | Who reads it | Default |
|---|---|---|---|
| **Working memory** | `person.md`, `goals.md`, `understanding.md`, `people.md`, `timeline.md`, `themes.md`, `themes/*`, `safety.md`, `*.summary.md`, `MEMORY.md` | Claudia, via `recall`, every session | on |
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

- `scripts/save-session.mjs` (SessionEnd) → `<date>-<id>.transcript.md`, one file per
  session, **overwritten** each close (ADR-0017); gated on genuine `claudia`-skill
  *activation*, not a stray persona string. Also drops a `<date>-<id>.pending-summary`
  dirty flag every close.
- `distill-session` skill → `<date>-<id>.summary.md`. Runs live at close when possible,
  but is normally **deferred**: `recall` detects any `pending-summary` (via
  `scripts/pending-sessions.mjs`) and distills that session at the next open, then
  clears the marker (ADR-0016).
- `remember` skill → `person.md`, `goals.md`, `safety.md`, `MEMORY.md`.
- `understand` skill → `understanding.md` (the working understanding).
- `relationships` skill → `people.md` (the relationship map).
- `timeline` skill → `timeline.md` (the life timeline).
- `themes` skill → `themes.md`, `themes/` (recurring threads; `distill-session` flags
  candidates, `recall` surfaces them for the person to ratify).
- `teach` / `exercise` skills → `teachings/`, `exercises/`.
