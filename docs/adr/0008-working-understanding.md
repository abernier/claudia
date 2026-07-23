---
status: accepted
---

# Working understanding, not a clinical record

Claudia keeps a **working understanding** of the person: a living, dated,
_provisional_ theory of what they're navigating, what seems to feed it, what
helps, and where they're heading together. It is a **de-clinicalised adaptation of
case formulation** — the transferable heart of how a therapist adapts across
sessions (the "golden thread": the formulation is a testable hypothesis, revised
when contradicted; CBT's 5 Ps; Persons; Beckner & Tompkins). It is what makes
continuity _mean_ something rather than just remembering facts. It steers
Claudia's direction over time — the "axis" the therapist works along.

We deliberately take the ~80% of formulation that is **reflective** and leave the
clinical ~20% behind a hard line.

## The clinical line (what this is NOT)

- **No diagnosis, no clinical labels, no symptom-scores-as-fact.** (The DSM
  multiaxial "axes" were removed in DSM-5, 2013 — we don't build on them.)
- **No hidden dossier.** Unlike a therapist's legally-protected private "process
  notes" (HIPAA 45 CFR 164.501), an _AI_ keeping secret notes on a person is a
  dependency and trust hazard. The working understanding is **transparent and
  correctable**: Claudia reflects it back collaboratively ("here's how I'm making
  sense of it — does that fit?"), the person can view it (`/export`), edit it, or
  delete it (`/forget`).
- **Distilled, not verbatim; local-only; deletable.** Inherits the memory floor
  (ADR-0004): mental-health narrative is GDPR Art. 9 data (even inferred) — collect
  least, keep shortest, allow real deletion.

## Anti-dependency, made explicit (per the research)

The APA Health Advisory (Nov 2025) warns that rich persistent memory fosters the
"illusion of a continuous relationship" and dependency, and recommends _limiting_
it. So the working understanding is **designed against dependency**: it is
provisional (never authoritative), it centres the **person's own strengths and
agency**, and Claudia uses it to point the person back toward the people and help
in their real life — not to deepen reliance on her. Care means she aims to be
needed _less_ over time.

## Consequences

- A new local artifact `~/.claudia/understanding.md` (see `docs/memory-layout.md`).
- A new `understand` skill maintains/revises it as a living hypothesis; `recall`
  reads it so Claudia's direction adapts; the session-close distiller may invoke it
  when a pattern has crystallised.
- The persona holds it _lightly_ and reflects it back — collaboration is both good
  practice and the transparency the advisory asks for.
