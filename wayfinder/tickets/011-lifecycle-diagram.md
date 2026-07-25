---
id: 11
title: "The lifecycle diagram: the invariant session"
type: wayfinder:prototype
status: closed
assignee: abernier
blocked-by: [4, 15, 16]
---

## Question

Draw the session-lifecycle diagram, invariant under any composition: opening
(memory recall — chassis machinery), the per-turn out-of-persona floor check,
the conversation and its practice, closing (save, then deferred
distillation).

The invariant is the point: the domain set may change what fills a node,
never the topology. Show which layer owns each node's content (Claudia's
persona / domain / chassis) — the persona colors the greeting and the voice
(shipped, not a package), a domain leads when its floor or its library
speaks, the chassis owns the deterministic edges (open, check, close).

Mermaid, reviewed with Antoine (react-and-revise). Asset: the diagram source
under `../assets/`, linked from this ticket.

Blocked by [Floor rules and the per-turn check](004-floor-check.md) — the
lifecycle's one parameterized station since the hat's removal.

**Input from [No generic floor](015-no-generic-floor.md)**: the question above says the
persona _"colors the greeting and the voice (shipped, not a package)"_ — **false now**.
The persona **is** a package: no soul in the chassis, at most one per domain, optional,
and the **active** domain's wears the face. So there is no "Claudia's persona" layer to
label on the diagram; the greeting's voice is a property of whichever domain is active,
and under Claudia ⊕ {} — or under an active domain that declares no soul — the moments
fire and **nobody speaks**. The three-layer legend the question assumes (persona /
domain / chassis) collapses to two: **the domain**, which owns everything said, and
**the chassis**, which owns the moments and says nothing.

**Input from [Floor rules and the per-turn check](004-floor-check.md)**: what the
diagram must express about the check —

- it sits **before the persona responds**, outside it, and sees **one turn** — no
  transcript, no flag store, no memory of earlier turns;
- it has **two verdicts**: pass, or **interrupt**. It never blocks the turn and
  never addresses the person;
- an interrupt carries an **opaque pointer** to the owning level's conduct, so the
  diagram must show the chassis _routing_, never _speaking_;
- the interrupt is the **only involuntary transition** in a session (003 §4);
- and the invariant that is easy to draw wrong: under Claudia ⊕ {} the mechanism is
  **present and idle** — it runs and matches nothing, because the chassis holds no
  criteria. Silent, not absent, and not permissive.

**Input from [Surfaces](006-surfaces.md)** — this changes what the diagram _is_. The
lifecycle is a **topology of moments**, not of content: the chassis fires session-open,
each-turn and session-close, and whoever is declared hooks onto them. Recall reads psy
notes; distillation writes a psy summary; both are the domain's, drawn as hooks, not as
chassis nodes. So:

- the invariant to draw is the **three moments**, and under Claudia ⊕ {} they fire and
  **nothing happens** — the same _present and idle_ shape as the check, now holding for
  every station, not just one;
- there is **no chassis surface** on the diagram — memory is psy's records in the
  person's vault, and nothing says a future domain has a note system at all;
- `/save` no longer straddles: the moment belongs to the machine, the command and the
  summary it writes to psy.

## Resolution

> **Prototyped without the react-and-revise pass**, on Antoine's instruction of 2026-07-25
> (_"finis tout seul"_). A first take, not a final plate.

**Asset:** [`lifecycle-diagram.md`](../assets/lifecycle-diagram.md) — mermaid source, the
two-layer legend, the five things the drawing must not lose, and the invariance table.

It is the generalization of the shipped picture in
[`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md), and the comparison is the fastest way
to see what this map did: the shipped diagram names `skills/recall`, `skills/crisis`,
`docs/safety/*` and `SOUL.md` inside chassis boxes. The generalized one names **moments**,
and every one of those names moves into a hook.

### What it draws

- **Three moments, and the conversation is not one of them.** Open, each turn, close are
  fired by the chassis and filled by whoever is declared; the conversation is where
  everything is _said_ and belongs entirely to the active domain. Numbering only the
  moments is what keeps the topology honest.
- **Two layers, not three.** The question's persona/domain/chassis legend collapsed: there
  is no persona layer, because the greeting's voice is a property of whichever domain is
  active. Blue owns the moments, the check mechanism, the routing and one line of text.
  Purple owns everything said, read and written.
- **The check before anything answers**, seeing one turn, with two verdicts, carrying an
  **opaque pointer** — the interrupt edge is labelled with the pointer's exact content
  (_rule R of domain D fired → hand the turn to D's conduct_), which is what makes
  "the chassis routes, never speaks" visible instead of claimed.
- **The switch marker** as a chassis node on the practice→practice edge, so the seam is
  drawn where it actually is: between two turns, in the machine's voice, naming the domain
  and never the face.

### The invariance is drawn as a table, not as four diagrams

The point of the picture is that the domain set changes what fills a node and never the
topology, so drawing four variants would have argued against it. Instead one diagram plus
a four-row table — ⊕{psy}, ⊕{psy, software-dev}, ⊕{software-dev}, ⊕{} — where every row
keeps every edge. The last row is the invariant proving itself: the moments fire, the check
runs and matches nothing, and nobody speaks.

**The trap the input warned about is handled by that table**: _present and idle_ is a row
in it, not a footnote, so the empty set reads as a machine waiting for criteria rather than
as a machine with a hole.

### Inputs passed

- [Assemble the principles document](012-assemble-doc.md) — this is the document's second
  plate, and its four-row table is the same object as
  [No generic floor](015-no-generic-floor.md) §7's composition table seen from the
  lifecycle instead of from the floor
