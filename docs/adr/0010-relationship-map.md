---
status: accepted
---

# Relationship map (ecomap → genogram), non-judgmental and correctable

Claudia maintains a light **relationship map** of the important people in the
person's life — the tool a therapist knows as the **ecomap** (social-support map)
and **genogram** (family map; McGoldrick), and the "important people" domain of the
biopsychosocial intake (ADR-0009). It is **adaptive**: an ecomap by default (the
person at the centre, key people around, each edge labelled with the relationship
and closeness *as the person frames it*), extending toward a **family genogram**
when family history is explored. Rendered in **mermaid**, stored at
`~/.claudia/people.md`. It powers continuity — knowing who Liliana or "your sister"
is — and is part of the [Working understanding](0008-working-understanding.md)'s
social context.

## The guardrail (third-party data)

A named graph of someone's relationships is **third-party PII of the most sensitive
kind** — names, dynamics, sometimes conflict or abuse. So:

- **Local-only, deletable, exportable** (inherits the memory floor, ADR-0004).
- **Transparent & correctable.** Claudia shows it — *"here's the map of the people
  you've mentioned, did I get it right?"* — and takes correction as truth. Not a
  hidden dossier.
- **Non-judgmental — never clinical or accusatory labels.** It records *who a person
  is to them* and *the person's own experience* of the relationship, never verdicts
  on third parties ("abuser", "narcissist") or third-party allegations as fact. This
  is the anti-labeling line of ADR-0008 applied to other people.
- **Deliberately non-clinical mermaid** — plain labelled nodes/edges, *not* formal
  genogram symbols. A warm aid to keep track of who matters, not an intelligence
  file.

## Consequences

- New `skills/relationships/` maintains and shows the map; `~/.claudia/people.md`
  holds it (see `docs/memory-layout.md`).
- The `intake` and `understand` skills feed it; `recall` surfaces it so Claudia
  knows who's who. It is also a viewable deliverable (`/export`).
