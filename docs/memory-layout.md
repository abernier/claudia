# Memory layout — `~/.claudia/`

The full contract for the person's data. It lives **on the person's own machine**,
never in this repo, never uploaded (ADR-0004, safety-floor rule 10). Filenames are
English/universal; **content is written in the person's language**.

```
~/.claudia/
├── config.json          optional — e.g. { "saveTranscripts": false }, { "dashboard": false } to opt out
├── .migrations          applied vault-migration ids, one per line — the ledger (ADR-0020)
├── MEMORY.md            one-line-per-entry index of what Claudia knows and where
├── dashboard.md         derived, person-facing mirror — bird's-eye view; transcludes or points, never summarises (ADR-0019)
├── person.md            distilled, evolving model of the person (context, what helps, style)
├── goals.md             agreed therapy goals (alliance: goal consensus)
├── todo.md              shared to-do-later list — status-grouped, session-tagged, person-editable (ADR-0018)
├── keepsakes.md         passages kept verbatim — newest-first blockquotes, attributed, person-pulled (ADR-0023)
├── understanding.md     the working understanding — provisional, dated, correctable (ADR-0008)
├── people.md            relationship map (mermaid ecomap → genogram), non-judgmental (ADR-0010)
├── timeline.md          the life timeline — person-led, trauma-informed dated list (ADR-0014)
├── themes.md            recurring threads across sessions — person-ratified, provisional (ADR-0015)
├── safety.md            locale + region resources + standing safety flags (never means/methods)
├── people/                         one reflective fiche per important person (ADR-0011)
│   ├── Liliana.md                  relative-linked to sessions, themes, other people
│   └── Marie.md
├── themes/                         one note per recurring thread that earned depth (ADR-0015)
│   └── the inner critic.md         name in the person's words; verbatim kept separate
└── sessions/                        one set of files per SESSION, keyed <date>-<short-session-id> (ADR-0017)
    ├── 2026-07-21-9113d5d7.summary.md      distilled — READ on recall
    ├── 2026-07-21-9113d5d7.transcript.md   verbatim — the person's archive, NOT read in routine
    ├── 2026-07-21-9113d5d7.assets/         images the person pasted, extracted from the transcript (ADR-0021)
    │   └── img-001.png                     named by order of appearance; embedded inline in the .md
    ├── 2026-07-22-4f0ac1e2.pending-summary dirty flag: needs (re)distilling; cleared by distill-session
    ├── teachings/
    │   └── 2026-07-21-anxiety-cycle.md
    └── exercises/
        └── 2026-07-21-thought-record.md
```

## Two layers, two jobs

| Layer | Files | Who reads it | Default |
|---|---|---|---|
| **Working memory** | `person.md`, `goals.md`, `todo.md`, `keepsakes.md`, `understanding.md`, `people.md`, `timeline.md`, `themes.md`, `themes/*`, `safety.md`, `*.summary.md`, `MEMORY.md` | Claudia, via `recall`, every session | on |
| **Person's archive** | `*.transcript.md` (`.jsonl` fallback), `<stem>.assets/*` | the person (via `/export`); **not** Claudia in routine | on (opt-out via `config.json`) |

## Invariants

- **Notes cross-link with plain relative markdown links**, computed from the linking
  file's own directory — a `people/` fiche links another person as `[Marie](Marie.md)`,
  a session as `[…](../sessions/<stem>.summary.md)`, a root file as `[…](../themes.md)`;
  a root file (e.g. `timeline.md`) links a fiche as `[…](people/<name>.md)`. Wrap any
  path containing spaces in angle brackets — `[…](<themes/the inner critic.md>)`.
  `/export` copies notes verbatim, with no rewrite step.
- **`dashboard.md` is a derived view, not a source** — a mirror of the files above,
  rebuilt deterministically; **`recall` reads the sources, never the mirror**. It only
  transcludes or links (never summarises), omits `safety.md` entirely, and is refusable
  via `config.json` (ADR-0019).
- **`keepsakes.md` is working-layer, but not recall-read** — it is the one working
  file held **verbatim** (ADR-0023), and it is *pulled*: by the person re-reading it,
  by `/keep` writing to it, by the dashboard mirroring its top entry, by `quiz` when
  the person wants to drill it. It never enters an opening — a greeting that quotes a
  past session back at someone is a recital. The floor is unchanged: no means/methods
  on a kept line, ever.
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
  *activation*, not a stray persona string. Also extracts any images the person pasted
  from the transcript into `<date>-<id>.assets/` (`img-NNN.<ext>`, embedded inline;
  ADR-0021), and drops a `<date>-<id>.pending-summary` dirty flag every close.
- `distill-session` skill → `<date>-<id>.summary.md`. Runs live at close when possible,
  but is normally **deferred**: `recall` detects any `pending-summary` (via
  `scripts/pending-sessions.mjs`) and distills that session at the next open, then
  clears the marker (ADR-0016).
- `remember` skill → `person.md`, `goals.md`, `safety.md`, `MEMORY.md`.
- `todo` skill → `todo.md` (the shared to-do-later list): the persona reaches for it
  live to add/tick items; `distill-session` **authoritatively tags** them (it holds the
  session stem); `recall` reads it; the person hand-edits it (ADR-0018).
- `keep` skill → `keepsakes.md` (the passages kept verbatim): the person pulls `/keep`
  (or says "garde ça") and it prepends the blockquote; `distill-session` completes the
  session tag on any live entry that lacked the stem; the person edits or deletes
  entries by hand (ADR-0023).
- `understand` skill → `understanding.md` (the working understanding).
- `relationships` skill → `people.md` (the relationship map).
- `timeline` skill → `timeline.md` (the life timeline).
- `themes` skill → `themes.md`, `themes/` (recurring threads; `distill-session` flags
  candidates, `recall` surfaces them for the person to ratify).
- `teach` / `exercise` skills → `teachings/`, `exercises/`.
- `scripts/build-dashboard.mjs` → `dashboard.md`, the derived mirror (ADR-0019). Runs at
  `SessionEnd` (after `save-session`) and at the tail of `recall` (after deferred
  distillation), and on demand via `/dashboard`. Reads the working files, transcludes or
  links, never summarises; respects `{ "dashboard": false }`.
- `scripts/migrate-vault.mjs` → the working `.md` files (never `*.transcript.md`) + the
  `.migrations` ledger, when a versioned format upgrade is pending (ADR-0020). Runs at
  `recall` (backup first, then disclosed) and on demand via `/migrate`; pure, idempotent
  transforms live in `src/migrations/`.
