# Architecture

How Claudia is put together, and why. This is the durable overview; the binding
decisions live as ADRs in [`docs/adr/`](adr/), the vocabulary in
[`CONTEXT.md`](../CONTEXT.md).

## The shape in one picture

```
                         ┌───────────────────────────────────────┐
   person's message ───▶ │  UserPromptSubmit hook (safety)        │  every turn,
                         │  heuristic pre-filter → fast-model      │  outside the
                         │  risk classifier → fail-safe escalate   │  persona
                         └───────────────┬───────────────────────┘
                                         │ safe
                                         ▼
                         ┌───────────────────────────────────────┐
                         │  skills/claudia  (the persona)         │  always-on
                         │  loads SOUL.md + relational spine       │  relational
                         │  (qualities + competencies + alliance)  │  core
                         └───────────────┬───────────────────────┘
                            reaches for  │  when indicated
                                         ▼
              ┌──────────────────────────────────────────────────────┐
              │ choose-approach ──▶ docs/approaches/*.md  (JIT)       │  toolbox
              │ crisis ───────────▶ docs/safety/*         (on danger) │
              │ teach / exercise ─▶ deliverables                      │
              │ recall / remember / distill-session ─▶ ~/.claudia/    │
              └──────────────────────────────────────────────────────┘
                                         │ at session close
                                         ▼
                         ┌───────────────────────────────────────┐
                         │  Stop hook: write transcript + summary │
                         └───────────────────────────────────────┘
```

## The five load-bearing decisions

1. **Safety floor beneath immersion** — [ADR-0001](adr/0001-safety-floor.md).
   Immersion-first, but a small set of never/always rules is non-negotiable and
   enforced by substance + the crisis pivot, not by repeated disclaimers.
2. **Relationship-first core, modalities on demand** —
   [ADR-0002](adr/0002-knowledge-architecture.md). The relational spine is always
   loaded; the 12+ approaches are a just-in-time library; an approach may lead
   when a specific technique is indicated (e.g. exposure for anxiety/OCD/PTSD).
3. **Claude Code plugin runtime shape** —
   [ADR-0003](adr/0003-plugin-runtime-shape.md). Persona is a skill (a plugin's
   `CLAUDE.md` is not auto-loaded); natural-language-first with only four
   commands; per-turn safety is a deterministic hook; single-plugin marketplace.
4. **Two-layer memory under `~/.claudia/`** —
   [ADR-0004](adr/0004-memory-model.md). Working memory (distilled summaries, read
   for continuity) vs the person's archive (verbatim dated transcripts, saved by
   default, local-only). Recall reads only the working layer.
5. **English structure, person's-language experience** —
   [ADR-0005](adr/0005-language-policy.md).

## Runtime pieces

- **`skills/claudia/`** — the persona entry. Loads `SOUL.md` and the relational
  spine, then conducts the conversation. Model-invoked (and available as a door).
- **`hooks/hooks.json`** — `UserPromptSubmit` runs the safety check on every turn;
  `Stop` writes the transcript and a distilled summary to `~/.claudia/`.
- **`skills/choose-approach/`** — selects the modality for the moment
  (relationship-first default; approach leads when indicated).
- **`skills/crisis/`** — the structured crisis pivot, invoked when the safety
  layer flags danger. Routes to human help; never handles acute crisis alone.
- **`skills/recall` · `remember` · `distill-session`** — the memory read/write path.
- **`skills/teach` · `exercise`** — deliverables (with mermaid diagrams), written
  in the person's language under `~/.claudia/`.
- **`skills/research/`** — lets Claudia look up a technique or fact when useful.
- **`commands/`** — the person-pulled surface: `/help-now`, `/forget`, `/export`,
  `/save`, `/migrate`, `/config`, `/thread`, `/dashboard`, `/keep`, `/menu`.
- **`src/config.mjs`** — the person's settings (`~/.claudia/config.json`): declared
  booleans with defaults, read by `/config`, `recall`, and the two hook scripts that
  carry an opt-out ([ADR-0028](adr/0028-settings.md)).

## The person's data (`~/.claudia/`, never in this repo)

```
~/.claudia/
├── MEMORY.md            index of what Claudia knows (à la auto-memory)
├── person.md            distilled model of the person (goals, context, style)
├── goals.md             therapy goals (alliance: goal consensus)
├── safety.md            locale, risk flags, personal crisis resources
└── sessions/
    ├── 2026-07-21.summary.md      distilled — read on recall
    ├── 2026-07-21.transcript.md   verbatim — the person's archive
    ├── exercises/
    └── teachings/
```

See [`docs/memory-layout.md`](memory-layout.md) for the full contract.
