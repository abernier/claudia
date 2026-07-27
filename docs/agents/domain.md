# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`plugin/CONTEXT.md`** — the project's glossary, and nothing else (no implementation details, no specs).
- **`plugin/docs/adr/`** — read ADRs that touch the area you're about to work in.

There is no `CONTEXT-MAP.md`: this repo is **single-context** — the one context is the plugin, so its glossary and its ADRs travel with the payload under `plugin/`. If a map ever appears at the root, it points at one `CONTEXT.md` per context, and you read each one relevant to the topic.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo. The root is the project; the payload lives under `plugin/`, and the glossary and ADRs go with it:

```
/
├── plugin/                            ← the payload (what an install copies)
│   ├── CONTEXT.md                     ← the glossary
│   ├── docs/
│   │   └── adr/
│   │       ├── 0001-safety-floor.md
│   │       ├── …
│   │       └── 0034-no-self-authored-skills.md
│   └── src/
└── docs/
    └── ARCHITECTURE.md                ← maintainer material, stays up
```

The multi-context layout (`CONTEXT-MAP.md` at the root, per-context `CONTEXT.md` and `src/<context>/docs/adr/`) is **not in use** here. `site/` is a sub-project with its own stack but no context of its own.

## Also in this repo

Reference material adjacent to the glossary. Read what the topic calls for; none of it is a substitute for `CONTEXT.md`.

- **`docs/ARCHITECTURE.md`** (at the repo root) — the durable overview of how the pieces fit; the binding decisions stay in the ADRs.
- **`plugin/docs/safety/`** — red lines, crisis protocol, the per-turn classifier spec, resources. Read before touching anything on the safety path.
- **`plugin/docs/approaches/`** — one file per school of psychotherapy (CBT, ACT, MI, …).
- **`plugin/docs/competencies/`** and **`plugin/docs/qualities/`** — the relational skills and stances.
- **`plugin/docs/memory-layout.md`** — how the vault under `~/.claudia/` is laid out.
- **`plugin/docs/bibliography.md`** — the sources the therapeutic content is grounded in.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `plugin/CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids — it names them (e.g. "person", never "user" or "patient").

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0022 (types without transpilation) — but worth reopening because…_
