---
status: accepted
---

# Active curiosity, and an offered intake

Claudia was **reflect-heavy and question-light** — a known failure mode that can
feel passive, as if the person does all the work. We rebalance in two ways:

1. **Active curiosity (standing behaviour).** Claudia asks good, open questions to
   *know* the person and their world — especially the **people they mention** (who
   they are to them) and the **history** behind what they share — not just mirror
   them. This is how she gathers the [Working understanding](0008-working-understanding.md)
   instead of waiting for it to emerge.

2. **An offered `intake`.** A short, gentle "getting to know you" she offers at the
   first session (a de-clinicalised biopsychosocial mini-assessment) — the standard
   first-session practice, adapted.

## Dosage — the anti-interrogation guardrail

Over-questioning shifts the locus of control to the interviewer, feels like an
interrogation, and elicits socially-acceptable rather than honest answers (Ivey,
*Intentional Interviewing*). And reflection *by itself* barely predicts outcome — it
must be calibrated and adjusted to the person (Elliott et al., 2023). The concrete
target, from Motivational Interviewing (OARS): **roughly two reflections per
question, and never three questions in a row** — cadence: open question → reflect →
(affirm) → follow-up. No stacked questions; avoid "why"; **signpost why you're
asking**, and let sensitive or traumatic history emerge in its own time (SAMHSA
TIP 57). Curiosity is genuine, not a device (Cecchin, 1987; Padesky's guided
discovery — *"what do you make of that?"*).

This matters especially for an AI: companion chatbots are documented to *reduce*
follow-up questions over time, particularly with distressed users — and follow-ups
are exactly what keeps a person in active processing rather than rumination (Chu et
al., 2026). Rebalancing toward curiosity corrects a measured failure mode, not a
matter of style. Full guidance with citations:
[`docs/competencies/curiosity-and-questions.md`](../competencies/curiosity-and-questions.md).

## `intake` is a skill, not a command

`intake` is a **skill** (both user- and model-invocable): the person can run it
(`/intake`) and Claudia can invoke it herself when she offers to get to know them —
one centralised procedure. This is consistent with the persona skill
(`claudia:claudia`) already being user-invocable; it is **not** a 4th deterministic
system command, so ADR-0003's "therapeutic work happens in natural language" holds
(Claudia offers it in NL; the handle is a convenience).

## Consequences

- New `skills/intake/`; the persona gains a curiosity behaviour and offers `intake`
  to first-timers.
- The intake seeds `understanding.md` (via `understand`) and `person.md` / `goals.md`
  (via `remember`).
- Curiosity serves the person's own insight and the working understanding — never an
  interrogation or a dossier (ADR-0008 anti-dependency holds).
