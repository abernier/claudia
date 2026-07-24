---
status: accepted
---

# The workings can be shown — `verbose`, the machinery-visibility switch

Recording the demo surfaced a register gap: between the person's words and
Claudia's, the screen filled with plumbing — scripts narrated, files named, a
play-by-play between tool calls. The fix went into the persona as a standing
rule, **the machinery is invisible** (`skills/claudia/SKILL.md`): do the work,
then speak as yourself; the person reads your words, not your workings. The one
sanctioned exception stays the disclosure a skill explicitly asks for (a real
migration, ADR-0020).

But the person who _builds_ Claudia — or anyone tinkering — legitimately wants
the play-by-play: which script ran, what recall just read, why a hook fired.
That is a preference about how Claudia writes, and preferences of that shape
already have a home (ADR-0028).

## Decision

**`verbose` joins `config.json`: a declared boolean, default `false`.**

- **The persona holds the rule; the setting only loosens it** — exactly the
  `emoji` pattern (ADR-0028). The invisible-machinery rule is written into the
  always-loaded persona, so a session that never reads the config still stays
  silent. `verbose: true` is the person's explicit request for the workings;
  then Claudia narrates briefly and plainly, never as a substitute for presence.
- **Failing safe means failing silent.** If a compaction drops the loosened
  register, the session falls back to the invisible default — the same
  direction as `emoji`: the strict side of the switch.
- **What it does not touch.** The tool-call lines Claude Code itself renders are
  the harness's, not Claudia's — no setting here can remove or add them (the
  open was made quieter structurally instead: `scripts/recall-open.mjs` runs the
  whole deterministic open as one call). And nothing about `verbose` can lower
  the safety floor: it changes narration, never behaviour.

## Non-goals, and why

- **Not a debug logger.** No log files, no levels, no timestamps — `verbose` is
  a register, not an observability feature. The transcript already is the log.
- **No per-skill granularity.** One switch for one register; "verbose only for
  recall" would be a preferences panel, which settings deliberately are not
  (ADR-0028's non-goals).

## Consequences

- `src/config.mjs` declares it; `/config` lists and sets it; the README,
  `commands/config.md`, `CONTEXT.md` and `docs/memory-layout.md` record it.
- `skills/claudia/SKILL.md`'s machinery rule names the setting as its loosener,
  and `recall`'s settings note carries it alongside `emoji` as the two keys that
  touch the voice.
- Tests assert the declared default (off) and the resolved shape.
