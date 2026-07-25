---
id: 10
title: "The composition diagram: the chassis and its domains"
type: wayfinder:prototype
status: closed
assignee: abernier
blocked-by: [2, 3, 6, 15, 16]
---

## Question

Draw the generalized composition diagram — Claudia ⊕ domains: one constant
person (her persona shipped, not a package) taking one or several published
domains over the chassis; the two authorities the dissolution of 2026-07-25 left
standing — `SOUL.md`, her character, and the domains, which own every rule — with
the chassis drawn as machine only, authoring none; the memory owned by the person;
the registry and its two gates at the edges.

Mermaid, reviewed with Antoine (react-and-revise — a prototype, not a final
plate). The domain dimension must read generically — "one or several" — with
psychotherapy (+ software-dev next) as the drawn instance.

Asset: the diagram source under `../assets/`, linked from this ticket.

Blocked by [The domain set](002-domain-set.md),
[Concurrent domains](003-concurrent-domains.md),
[Surfaces](006-surfaces.md), and [No generic floor](015-no-generic-floor.md) — it
draws what they decide, and the last one decides what is left to draw beneath the
domains.

**Input from [No generic floor](015-no-generic-floor.md)** — this rewrites the question
above, which is left as written for the record. There is **no constant person** and there
are **not two authorities**: the chassis holds no soul, a domain carries at most one
(optional), and the **active** domain's soul is the face. So the diagram draws **one
authority — the domain** — bringing knowledge, floor, commands, record kinds, migrations
_and_ character, over a chassis with three commands and nothing else. `SOUL.md` is not a
box beside the domains; it is inside psy. Two things the drawing must not lose: the face
follows the **active** domain (the practice clock) while commands and records follow the
**declared** set (006 §6) — so the switch arrow moves the face and not the records — and
Claudia ⊕ {} draws as a machine with no one in it.

**Input from [Concurrent domains](003-concurrent-domains.md)**: "one or several"
still holds for the _set_, but the diagram must now draw the distinction that
decision turned on — **declared** (several, the floor's scope) versus **active**
(exactly one, the practice's scope). The floor arrow gathers from the whole declared
set; the practice arrow comes from a single highlighted domain. Two more edges the
drawing owes: the **floor interrupt** — one arrow from the floor into the active
practice, and none the other way — and the **switch**, coming from the person, never
from Claudia and never from the chassis.

## Resolution

> **Prototyped without the react-and-revise pass**, on Antoine's instruction of 2026-07-25
> (_"finis tout seul"_). A first take, not a final plate.

**Asset:** [`composition-diagram.md`](../assets/composition-diagram.md) — mermaid source
plus a reading guide.

### What it draws

**One authority, in one colour.** Knowledge, floor, escalation map, library, commands,
record kinds, migrations, hooks _and_ character all hang off the domain box. `SOUL.md` is
not a box beside the domains — it is a line inside psychotherapy. The chassis is drawn as
four machine parts that author nothing: the check with no criteria, the three moments, the
three commands, and the one line it may say.

**The two clocks are drawn as two arrow weights**, which is what made the picture
tractable: a thick arrow from the _whole declared set_ to the floor, a dotted arrow from
the set to the _single active domain_. Same source, two clocks, visibly different.

**The switch moves the face and not the records.** It enters the active-domain box from
the person, and the records edge leaves the declared set — so the drawing cannot be read as
a switch that moves someone's notes.

**One edge is absent on purpose** and the reading guide says so rather than drawing a
crossed arrow: the interrupt runs floor → practice and there is nothing the other way.

**The registry sits at the edge with both gates**, and the compose gate is drawn _outside_
it — it is the person's gate, on the person's machine, tier-blind, while the publish gate
and the tier are the registry's. The refusal edge from the compose gate goes back to the
person **in the terminal**, never into the conversation.

### Choices made in drawing, worth knowing

- **Claudia ⊕ {} is not drawn as a fifth diagram.** The guide says it in one line: the same
  picture with the purple gone. Drawing an empty variant would have implied the topology
  changes, which is the one thing the composition model insists it does not.
- **The face is its own node**, between the active domain and the person, so that _no face
  at all_ has somewhere to be true. A face folded into the domain box could not express a
  domain that declares no soul.
- **Provenance is drawn informing the person and nothing else** — a dotted edge to the
  person, none into the gates. That is [Provenance tiers](007-provenance.md) §4's _a tier
  gates nothing_, made visible rather than asserted.

### Inputs passed

- [Assemble the principles document](012-assemble-doc.md) — this is the document's first
  plate
