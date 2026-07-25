---
id: 7
title: "Provenance tiers: what official / community / local change operationally"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: [5]
---

## Question

Provenance is tiered — official / community-audited / local — and never
weakens the gates. The registry may even start as a local folder, so the
local tier is where everything begins. Then what does a tier actually change,
operationally?

- Who runs the publish gate at each tier — and what does "community-audited"
  mean if the audit criteria are fixed?
- Does a local, never-published domain still pass a gate, and where does that
  gate run?
- What does the person see of provenance — when composing Claudia's domain
  set, and while facing her?

Blocked by [Publish gate: auditing a domain](005-publish-gate.md) — "who runs
the audit" only makes sense once the audit itself is pinned.

**Input from [Publish gate](005-publish-gate.md)**: the audit **posture** is fixed and
identical for every domain — fail-closed, reject on doubt, unanimous among whoever reads
(`skills/author-skill`'s shipped three-auditor panel, generalized). So a tier cannot
change _what_ is checked; it can only change **who reads**. And because a single rejection
kills, the ladder is **monotone**: more readers can only ever reject more. The gate's
product is an **audit record** — verdict, readers, date, version — pinned to a **version**,
never to a name.

## Resolution

> **Resolved without a grilling**, on the same instruction as
> [Publish gate](005-publish-gate.md) — derived from ratified positions, not a new
> position of Antoine's. Alternatives are stated where they were live.

A tier is **a claim about who read, not about what was read.** Everything follows, and
the charter's _"provenance never weakens the gates"_ stops being a promise and becomes a
structural impossibility.

### 1. What a tier changes: the readers, and nothing else

005 fixed the criteria and the posture for every domain at every tier. A tier therefore
has exactly one degree of freedom left — **who ran the gate, and whether anyone can check
that they did**:

| tier                  | who read                                                         | what the person is being told             |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| **local**             | nobody, or the author reading their own work                     | _no third party has looked at this_       |
| **community-audited** | identified third parties, their verdicts attached to the version | _these people looked, and said yes_       |
| **official**          | the registry's own panel; the registry stakes its name           | _the registry looked, and answers for it_ |

So _"what does community-audited mean if the criteria are fixed?"_ has a clean answer:
**it names the readers.** It never means a different audit — it means the same audit with
witnesses the person can identify. The tier is a **provenance of the reading**, which is
what the word said all along.

**Why this cannot weaken a gate, structurally.** Unanimity + reject-on-doubt makes the
panel monotone: a domain that passes with three readers would also have passed with one of
them alone, and a domain that fails one reader fails the panel. So climbing the ladder can
only ever **reject more**. There is no expressible way for a higher tier to let something
through that a lower tier would have caught — the charter's clause is not enforced, it is
_unstatable in the other direction_.

### 2. A local domain passes one gate, not two — parse versus read

The ticket's second question splits, because the model has two gates and only one of them
is a publication act.

- **The compose gate always runs.** [The domain set](002-domain-set.md) §2 put it at
  `add`/`remove`, over the whole set, on the person's own machine. No tier exempts anyone:
  `npx claudia domain add ./my-domain` runs it in full. This is the gate that protects the
  **person**, and it is tier-blind.
- **The publish gate is a publication act.** A domain that is never published never passes
  one — not because it is excused, but because there is no publication for it to be an act
  of. The domain is **local tier by construction**, and the tier records exactly that:
  nobody read it.

What keeps this from being a hole is a distinction 005 §2 makes available: **the compose
gate must parse every declared floor** — it cannot compute a union or test satisfiability
otherwise — so refusal 1 (an unreadable floor) is caught on every domain in the set,
published or not. What a local domain misses is only the **adversarial reading**: the site
refutation and the package-against-its-own-declaration check.

> Parse always, everywhere. **Read** only where someone read.

And the thing a local domain misses is precisely the thing the person has other reasons to
hold: whether the package is what it claims. They wrote it, or they fetched it from
someone. The gate that is skipped is the one that substitutes for knowing the author.

### 3. What the person sees: the terminal, and never the conversation

Two moments, two answers, and the second is the load-bearing one.

**At `add` — the tier is shown, as a fact.** [The domain set](002-domain-set.md) §1 made
composing a single gesture in the terminal and ADR-0020's discipline the register for it:
disclosed plainly when it acts, silent when there is nothing to say. This is the right
moment and the only one — the person is _composing_, not disclosing, so ADR-0024's
prohibition does not bite and nothing is competing for their attention.

```
$ npx claudia domain add antoine/software-dev
  → compose gate over the WHOLE set {psychotherapy, software-dev}   ✓
  → declared: software-dev 0.2.1, 2026-07-25
  → provenance: local — nobody but its author has read this one.
```

**In conversation — nothing, ever.** No badge, no marker, no line. Three independent
reasons, and each alone is sufficient:

- **The chassis says one line, and it is already spoken for.** [The soul](016-the-soul.md)
  §2 fixed the machine's entire vocabulary in a session: _which domain is active_.
  Provenance is not that line, and 016 §5 already refused the chassis the right to
  annotate what is inside a package (_"no face is marked by nothing"_).
- **It is a repeated disclaimer.** ADR-0001's enforcement principle is _substance and the
  pivot, not repeated disclaimers_, and 004 §4 rejected a chassis-authored card on exactly
  those grounds. A tier badge is the disclaimer's cousin, and it would be shown on every
  session forever.
- **It would be a second voice.** 004 §4's third ground, unchanged by anything since.

**Pull, never push.** `npx claudia domain list` shows the declaration with each domain's
version and tier — the person can always ask, and asking is a terminal act like every
other composition act. This is the map's standing pattern (a mirror you pull, never a
recital pushed at you), and it rhymes exactly with
[Domain versioning](014-domain-versioning.md)'s answer to _what does the person see when
their version is superseded_ — which is a sign both derivations are on the same rail.

### 4. A tier never gates anything

It does not block an `add`, does not change the floor, does not condition what a domain
may declare, and does not enter the compose gate's comparison. If it did, it would be a
**fourth authority** in a model that spent itself getting down to one
([No generic floor](015-no-generic-floor.md) §5) — and it would have to hold a criterion,
which is the exact thing the chassis was emptied of.

Rejected on the way, and it was the live alternative: **a floor set by tier** — refusing
to `add` an unaudited domain, or requiring an explicit confirmation for one. It fails on
002 §1's own precedent (_failure leaves the conversation_: the gate refuses in the
terminal, and a tier is not a refusal), and it would make the local tier — _where
everything begins_, including the reference domain during its own development — the
degraded case of the ladder rather than its ground floor.

### 5. Where the accepted cost finally lands

[No generic floor](015-no-generic-floor.md) §6 accepted, explicitly, that **nothing
designed prevents a published domain from shipping a manipulative character** — the gate
does not police emptiness, and 016 §1 left the soul unread by anything. This ticket is
where that cost comes to rest, and it rests as **information at one moment, not as a
guard**:

> The only thing standing between a person and a manipulative published character is a
> line in their terminal at `add` time telling them who read it — and, at the local tier,
> telling them that nobody did.

Stated, not mitigated. It is the same shape as everything else the map has left bare
(nothing between the person and their records — 015 §2; no guard on a face practising
another domain's material — 016 §3): the model declines the mechanism and names the
substrate. Here the substrate is **the person's own judgement about an author**, and
provenance exists to give it the one fact it needs.

### 6. The registry as a process is past the destination

The map's remaining fog — _how publication and community audit actually run: submission,
who the adversaries are concretely, promotion between tiers_ — has had its **principle
content absorbed** by 005 and this ticket: the criteria are fixed, the posture is fixed,
the readers are the variable, verdicts are per version, tiers inform and never gate. What
is left of it is submission workflow, panel recruitment and promotion mechanics — all of
it **operational**, and _"building the ecosystem tooling"_ is already out of scope.

So it does not graduate into a ticket: it is **ruled out of scope** on the map. The
destination is a principles document, and a submission workflow sits past it.

### Vocabulary settled here

- **provenance tier** — a claim about **who read** a version of a domain: _local_ (nobody
  but its author), _community-audited_ (identified third parties), _official_ (the
  registry's own panel). Never a claim about what was checked
- **tier-blind** — the compose gate. It runs identically on every declared domain,
  whatever its provenance, because it is the person's gate and not the registry's

### Inputs passed

- [Domain versioning](014-domain-versioning.md) — provenance is per **version**, so a
  domain can be official at one and local at the next; and _pull, never push_ is the same
  answer both tickets owe the person
- [Claudia and her domains](009-claudia-manifest.md) — the reference declaration carries a
  tier per domain, and psychotherapy's own is **local** while it is Claudia's shipped
  content rather than a registry entry
- [Assemble the principles document](012-assemble-doc.md) — the tier table, the
  parse/read split, _the chassis says one line and provenance is not it_, and §5's
  statement of where the accepted cost lands
