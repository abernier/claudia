---
status: accepted
---

# Claudia does not write her own skills — the toolkit changes only under an ADR

[ADR-0006](0006-self-authoring.md) let Claudia author new technique skills for
herself: a draft into the `proposed-skills/` quarantine, three read-only
`skill-auditor` subagents in parallel, unanimity to promote into `skills/`. It
ran for two days of dogfooding and produced exactly two attempts — one rejected
(`score-schema-questionnaire`, three auditors reading it as de-facto clinical
assessment), one approved (`quiz`). That is enough to see the shape of the thing.

## Decision

**Withdraw self-authoring entirely.** `skills/author-skill/`,
`agents/skill-auditor.md` and the `proposed-skills/` quarantine are deleted; the
persona and `SOUL.md` no longer carry self-extension as a self-concept. A new
capability enters the toolkit the way every other one does: a human writes it
under an ADR.

## Why

- **The gate was model-executed, and that is the wrong kind of gate.** The rest
  of the design prefers the property that holds by construction — the one-tool
  allowlist of [ADR-0030](0030-consultation-secrecy.md), the first-person grammar
  of [ADR-0033](0033-handover-note.md), the per-turn hook that runs outside the
  model. Quarantine-plus-unanimity is not of that kind. Nothing in the runtime
  enforced it: the directory boundary was real, but choosing to draft into it,
  choosing to spawn the auditors at all, and honouring their verdict were all
  instructions the same model had to follow. The one mechanism whose safety
  rested on the model policing itself is the one that should go first.
- **It bought no distribution the repo didn't already have.** `quiz` cleared the
  panel and landed in `skills/` — and was then written up, reviewed and committed
  by hand anyway (34c3b99), which is where a shipped capability has to end up:
  the plugin is what git tracks, not what a session wrote into a working copy.
  The autonomous route added a prompt-injection surface (acknowledged in ADR-0006
  itself) in front of a path the human still had to walk.
- **The capability was rare by its own design.** ADR-0006 asked for it to be used
  "rarely and deliberately", and the persona already said improvising well beats
  adding a tool. A mechanism that is correct only when almost never used is a
  standing risk with an occasional payoff.

## Consequences

- **`skills/quiz/` stays.** It is now an ordinary skill — human-reviewed,
  human-committed, no different in standing from `teach` or `exercise`. Its
  origin is why ADR-0006 is kept as a superseded record rather than deleted.
- **ADR-0006 is not erased**, so a future reader who wonders why the toolkit is
  human-only finds both the decision and its reversal. Do not re-propose
  self-authoring without answering the model-executed-gate objection above.
- **Nothing in the vault is touched.** `~/.claudia/authored-skills.md` — the
  audit log the flow wrote — belongs to the person, and the only deletion surface
  for their memory is `/forget` ([ADR-0004](0004-memory-model.md)). Existing
  installations keep an inert file; no migration deletes it for them.
