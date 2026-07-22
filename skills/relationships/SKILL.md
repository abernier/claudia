---
name: relationships
description: Keep and show a light relationship map of the important people in the person's life — an ecomap (who's around them, and how close/what kind of bond) that can grow into a family genogram. Rendered as a mermaid diagram. Update it as you learn who people are; show it to check you've got it right. Non-judgmental, correctable, local. Not a clinical assessment.
allowed-tools: Read Write Bash
---

# Relationship map

Keep a light, living map of the people who matter to the person — so you *know*
who Liliana or "your sister" is, and can hold their world in mind across sessions.
It lives at `~/.claudia/people.md` as a **mermaid** diagram plus a short key. It
feeds the [working understanding](../understand/SKILL.md).

## When to use it

- **Update** it quietly as you learn who someone is (during `intake`, and whenever
  a new person comes up).
- **Show** it when it would help — *"here's the map of the people you've mentioned,
  did I get it right?"* — and take their correction as the truth.

## Shape (ecomap → genogram, adaptive)

Start as an **ecomap**: the person at the centre, key people around, each edge
labelled with the relationship and the closeness **as they frame it**. Grow toward
a **family genogram** (parents, siblings, generations) only if family history is
what you're exploring. Keep it plain mermaid — **no clinical genogram symbols**.

```
```mermaid
graph TD
  ME(["You"])
  ME ---|"sister · close"| SIS["Marie"]
  ME ---|"partner · tender, some tension lately"| LIL["Liliana"]
  ME ---|"manager · draining"| BOSS["Sam"]
```
```

Below the diagram, a one-line key per person in the person's own words (who they
are, what the bond is like for *them*).

## Guardrails (ADR-0010)

- **Non-judgmental.** Record *who a person is to them* and *their own experience* of
  the bond — **never** clinical or accusatory labels about others ("abuser",
  "narcissist") or third-party allegations as fact.
- **Correctable & theirs.** Show it, let them fix it; they can view (`/export`) or
  delete (`/forget`) it anytime. It's a warm aid, not a dossier.
- **Local-only**, like all of `~/.claudia/`.
