---
status: accepted
---

# Claude Code plugin runtime shape

The deliverable is an **installable Claude Code plugin**. That target, plus the
"natural-language-first" and safety-floor constraints, fixes four things:

1. **Persona is a skill, not `CLAUDE.md`.** A plugin's `CLAUDE.md` is not
   auto-loaded, so Claudia's identity lives in `skills/claudia/SKILL.md`, which
   reads `SOUL.md` as a supporting file. The skill carries only the relational
   spine (see ADR-0002) and points to the on-demand library.

2. **Natural-language-first: exactly three slash commands.** `/forget`,
   `/export`, `/help-now` — all deterministic **system / safety / privacy**
   actions that natural language cannot perform reliably. Every therapeutic move
   (reframing, activation, grounding, psychoeducation, mood work, recap, close)
   happens in ordinary conversation, powered by on-demand skills and
   `docs/`. We rejected a command-per-technique surface: it bloats the plugin,
   is un-therapeutic (a good therapist doesn't make you type a command), and
   adds test/safety surface for no gain.
   *(Amended by [ADR-0015](0015-the-thread.md): a fourth command, `/thread`, was
   later added — a pull-only reflection aid the person invokes, not a therapeutic
   move Claudia pushes, so the natural-language-first principle still holds. Further
   amended: `/dashboard` (ADR-0019) and `/migrate` (ADR-0020) added deterministic
   data controls, and `/save` a person-pulled memory checkpoint over
   `distill-session` / `remember`. Each is a data or orientation affordance the
   person pulls, never a therapeutic move Claudia pushes — so natural-language-first
   still holds.)*

3. **Per-turn safety is a deterministic hook, outside the persona.** A
   `UserPromptSubmit` hook runs on every message: a fast high-recall heuristic
   pre-filter, escalating to a **fast-model risk classifier** when in doubt, and
   triggering the [Crisis pivot](../../CONTEXT.md) / `/help-now`. This satisfies
   safety-floor rule 8. We rejected persona self-monitoring — the research is
   categorical that the character must never be trusted to catch its own risk.

4. **Distribution: single-plugin marketplace.** A `marketplace.json` at the repo
   root makes the repo its own marketplace, installable via
   `claude plugin marketplace add`.

## Consequences

- The hook needs a fast-model API path and must **fail safe**: if the classifier
  is unavailable, escalate (surface help) rather than suppress.
- There is no `/claudia` entry command (ultra-minimal); the `claudia` skill is
  model-invoked from the person expressing a need to talk. Revisit if an explicit
  door proves necessary.
- The persona skill stays lean; the modality library and technique docs load
  just-in-time.
