---
status: accepted
---

# The mirror speaks the person's language — `language`, the first enum setting

[ADR-0005](0005-language-policy.md) split structure from experience: English
structure, person's-language content. Every surface the **model** writes honours
that by construction — Claudia observes the language the person speaks and answers
in it. But one person-facing surface is deliberately not written by the model:
`dashboard.md`, the deterministic mirror ([ADR-0019](0019-dashboard.md) — transclude
or point, never summarise, no LLM near therapeutic prose). Deterministic code has to
choose its own words for headings, vitals, cadence labels and the footer — and those
literals were written in French. Invisible while every real vault happened to be
French (dogfooding); surfaced the day the first English vault was built (the demo
fixture, `demo/`). The to-do list had the same French-as-structure assumption: its
status headings are specified as `## Ouvert` / `## Fait` ([ADR-0018](0018-todo-surface.md)),
and the mirror greps `/ouvert/i`.

## Decision

**`language` joins `config.json` as the first non-boolean setting — a closed enum,
`"fr" | "en"`.**

- **The rule ADR-0028 was protecting is unchanged, now stated precisely.** "Booleans,
  declared keys only" was always a safety argument: no free text that could smuggle an
  instruction to the always-loaded persona through a preference. The precise rule is
  **declared keys with closed value sets, never free text**. A value drawn from a
  two-entry list, consumed only by deterministic scripts, cannot carry an instruction.
- **Default `"fr"` — the behaviour every existing vault already had.** ADR-0028's
  total-resolution rule ("a stray comma must degrade to the behaviour they already
  had") decides the default: the mirror has only ever spoken French, so an absent key
  keeps doing that. New vaults don't lean on the default: `remember` **stamps the
  observed language at first run** (`scripts/config.mjs --set language=…`) — the same
  no-form reflex as the rest of the vault. `/config` changes it any time.
- **`buildDashboard` owns a per-language string table** — headings, vitals words,
  cadence labels, the "being distilled" note, the footer, and day formatting
  (`22/07` in French, `Jul 22` in English). `cadence()` now returns a semantic key
  (`daily` / `weekly` / `monthly` / `sparse`); which label that becomes is the
  mirror's business, in the mirror's language.
- **The to-do status headings follow the person's language too** — `## Ouvert` /
  `## Fait` or `## Open` / `## Done`. The mirror's matcher accepts either
  **regardless of the setting**, so a vault that changes language keeps its whole
  history readable.
- **The persona gets nothing.** Claudia already speaks the person's language by
  listening (ADR-0005); a setting could only contradict what she hears. `language`
  is read by scripts alone.

## Non-goals, and why

- **No free-text locale, no BCP-47 surface.** The value list is exactly the set of
  shipped string tables. Adding a language is one table and one enum entry — a code
  change, reviewed, not a config value that silently half-works.
- **No translation of content.** The person's notes are transcluded verbatim or not
  at all; that rule predates this ADR and survives it.
- **No auto-detection from vault content.** Deterministic code guessing a language
  out of therapeutic prose is the exact move the mirror was built to refuse
  ("transclude or point, never guess").

## Consequences

- `/config` lists a non-boolean value for the first time; `scripts/config.mjs --set`
  validates enum values and says the allowed set when refused; `renderSettings`
  prints the value verbatim rather than on/off.
- `docs/memory-layout.md`'s "declared booleans" wording becomes "declared keys
  (booleans, plus the `language` enum)"; `CONTEXT.md`'s Settings line follows.
- `skills/todo/SKILL.md` names both heading pairs; `skills/remember/SKILL.md` gains
  the first-run language stamp.
- Tests: `cadence()` asserts keys, `buildDashboard` gains an English fixture, config
  tests cover enum resolution (unknown value → default).
- The demo fixture (`demo/`) ships `{ "language": "en" }` — the first English vault,
  and the reason this gap became visible at all.
