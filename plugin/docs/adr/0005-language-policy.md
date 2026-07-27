---
status: accepted
---

# English structure, person's-language experience

The repository is **English-only** — all code, identifiers, comments, docs, ADRs,
`CONTEXT.md`, `SOUL.md`, and **all file and directory names** (repo _and_ the
`~/.claudia/` data layout), kebab-cased. This is for international distribution:
the structure must be universal.

**Claudia herself speaks the person's own language** at runtime, and every
**deliverable she writes for the person** (session summaries, `/teach`
explainers, exercises) is authored in that language. So a file is named in
English (`2026-07-21.summary.md`) while its _content_ is in the person's
language — structure universal, lived content localised.

This also has a safety edge: crisis resources are localised by country and
language (see ADR-0001 consequences and `docs/safety/`).

We chose this over a fully-localised codebase (unmaintainable across contributors)
and over an English-only experience (excludes non-English speakers, unsafe for
localised crisis resources).
