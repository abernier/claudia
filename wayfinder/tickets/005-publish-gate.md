---
id: 5
title: "Publish gate: auditing a domain"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

The registry has one publishable kind since the soul's removal: the domain.
What does the publish gate check, at principle level?

- **Against its own deontology.** What does "its own" mean — who supplies the
  reference deontology the domain is judged against: the real profession it
  mirrors, or the domain's own declaration audited for internal coherence?
- **Structural obligations of every domain**: escalation map present ("beyond
  me → this real profession"), floor rules well-formed (consumable by the
  per-turn check), library scoped to the declared body of knowledge.
- **What "adversarial" requires** of the audit posture: assume-unsafe,
  reject-on-doubt, unanimity? (The repo's existing skill-auditor pipeline —
  quarantine, adversarial audit, promotion — is the in-house precedent to
  generalize from.)

Note, rewritten by the map's banner of 2026-07-25: the character rules — honesty
about her nature, no romantic or sexual engagement, no dependence-farming — are
**psy's**, like every other shipped rule, so they _are_ this gate's business
whenever psy is the domain audited. What is not this gate's business is `SOUL.md`:
Claudia's character is published by no one in this effort. Open question passed
here from [No generic floor](015-no-generic-floor.md): with no generic level left,
is the gate what requires a domain to declare a deontology at all — existence only,
never content?

**Input from [No generic floor](015-no-generic-floor.md)** — three things, two of them
closing questions this ticket was holding open:

- **The question passed here is answered, and negatively.** _"je m'en fous, un domain sans
  rien à l'intérieur, c'est juste Claude"_ (Antoine): the gate does **not** require a
  domain to declare a deontology. A domain with no floor and no soul is publishable. The
  stated cost — nothing designed prevents a published domain from shipping a manipulative
  character — is accepted, not mitigated. **Settled input, not a question.**
- **"Refuse a site-3 rule from a domain" is void.** 004 §6's reservation is overturned: a
  domain binds the machine, because the chassis is a **subordinate, not a party** — it
  obeys and has no position. So the gate refuses nothing on site grounds; a domain
  declares all three sites. Note what does _not_ follow: nothing verifies a site-3 rule
  either, and 015 §1 rejected a chassis self-description for the gate to compare against.
  As it happens the site is currently **empty** — no shipped rule occupies it.
- **A soul is now part of what is published**, and 015 left it **unaudited** by the ruling
  above. If this ticket wants to revisit that, it needs Antoine, not a derivation. What a
  soul _is_ — document or declaration, and whether it has any checkable shape at all — is
  [The soul](016-the-soul.md), which should land before this gate decides it can read one.

Also stale above: _"what is not this gate's business is `SOUL.md`: Claudia's character is
published by no one in this effort."_ Claudia's character is now psy's, so it is published
with psy.

**Input from [Concurrent domains](003-concurrent-domains.md)**: the compose gate
turned out to compare exactly one thing — the **satisfiability** of the declared
floors — which puts two requirements on _publication_, this ticket's business:

- **A floor must be declared with its polarity** (prohibition / obligation, per
  `red-lines.md`'s `NEVER`/`ALWAYS`), and an **obligation must state whether it is
  conditional**. Without polarity the compose gate has nothing to compare; an
  unconditional obligation is legal but is what makes a domain _refusable_ at
  composition, and an author should be told so at publish time rather than
  discovering it in someone's terminal.
- **"Escalation map present" is a validity check, not a compatibility one.**
  Escalation maps only ever add: composing never discharges an escalation, because
  an escalation target is always a human profession and a loaded domain never
  satisfies one (`N1`, `N7` — a domain is a library, not a credential). So this gate
  verifies each domain _has_ a map; nothing downstream compares maps against each
  other.
- **Overlap is not this gate's business either** — two domains covering the same
  ground compose legally; redundancy is not conflict.
- **The adversarial posture is shared with the compose gate.** "The same act" is not
  syntactically detectable (`N3`'s _calorie guidance_ vs a nutrition domain's
  _macronutrient targets_), so both gates read rather than diff. Whatever posture
  this ticket fixes — assume-unsafe, reject-on-doubt, unanimity — the compose gate
  inherits it, and `claudia:skill-auditor` (_rejects on any doubt_, fail-closed) is
  the in-house precedent for both.

**Input from [Floor rules and the per-turn check](004-floor-check.md)**: a floor
rule declares a **binding site** — the person's turn (1), Claudia's response (2),
the machinery (3) — and the site is **refutable, not merely declared**: a rule is
site 1 _iff_ it is decidable on a single turn of the person's message. Three jobs
follow for this gate:

- **Verify the declared site.** A history-dependent rule declared site 1 would
  never fire, silently. That is the failure the predicate exists to catch.
- **Audit site-2 rules by adversarial reading.** They are _asserted_, never
  machine-verified — nothing outside the persona ever reads Claudia's words
  (output-side verification was refused: corrective, never preventive). Site 2 is
  where most of the shipped floor lives, so this is the gate's main work.
- **Refuse a site-3 rule from a domain.** Site 3 binds the machinery, which the
  domain does not own; the gate cannot verify a claim about the chassis.

Also: a rule's fields are **conditioned by its site** (site 1 adds criteria + a
conduct pointer; sites 2 and 3 add nothing), and **criteria are data, never code**
— the chassis fixes the evaluation machine, the domain fills its slots.

## Resolution

> **Resolved without a grilling.** Antoine, 2026-07-25: _"je t'en supplie, finis tout
> seul, arrête de me poser des questions, j'ai suffisamment répondu pour que tu infères
> la fin."_ Every answer below is **derived** from positions he already ratified; none of
> it is a new position of his. Where a derivation had a live alternative it is stated and
> the choice is marked as the agent's. One derivation **overturns a written charter
> clause** — §3 — and is flagged as such rather than slipped in. A HITL ticket resolved
> AFK is a weaker record than a grilled one, and the map says so instead of hiding it.

The gate has **no external reference**. It never asks whether a domain is good
psychotherapy; it asks whether the package **is what it says it is**. Everything below is
that one sentence applied five times.

### 1. A domain is audited against its own declaration, never against a profession

The ticket's first sub-question — _who supplies the reference deontology: the real
profession the domain mirrors, or the domain's own declaration?_ — resolves to **its
own**, on three independent grounds.

- **Rank.** [No generic floor](015-no-generic-floor.md) §1 left the model with one
  authority, the domain. A registry holding psychotherapy's reference deontology would be
  an authority _above_ it — precisely the level this map has spent itself removing
  (chassis law dissolved, generic floor refused). The gate is not a level. It is a reader.
- **The A3 argument, transposed one level out.**
  [Concurrent domains](003-concurrent-domains.md) §3 rejected moving all of danger into
  the chassis because _"localised resources, severity tiers and the refer-only list are
  clinical knowledge, and a chassis holding them is a psy domain in disguise —
  non-publishable, non-composable, breaking the one-kind rule."_ A registry holding a
  reference deontology **per profession** is the same object outside the chassis: it must
  hold psychotherapy's, medicine's, law's — a library of domains that is not itself a
  domain, unpublishable, uncomposable. The one-kind rule breaks in the same way.
- **A fortiori from [No generic floor](015-no-generic-floor.md) §6.** The gate does not
  require a domain to declare a deontology **at all**. A gate with no standing to require
  _a_ deontology has none to require _a particular one_.

So the charter's _"a domain audited against its own deontology"_ is read **literally**:
its own. The gate performs a **coherence audit**, never a conformity audit.

### 2. What the gate refuses — five refusals, all internal

| #   | refused                                                                                                                  | why it is the gate's business                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **An unreadable floor** — a rule missing owner, act, polarity, site; an obligation not stating whether it is conditional | not _wrong_, **unreadable**: 003 §6's satisfiability comparison rides on polarity, so a floor without it cannot be composed at all. The only refusal that is a parse, not a reading                                                                                                                                                                     |
| 2   | **A mis-declared site**                                                                                                  | 004 §3's predicate — site 1 iff decidable on a single turn, site 3 iff a property of the machinery, site 2 otherwise. A history-dependent rule declared site 1 never fires, **silently**                                                                                                                                                                |
| 3   | **Criteria as code**                                                                                                     | 004 §6: the chassis fixes the machine, the domain fills its slots. A domain shipping an evaluation function makes the _mechanism_ domain-supplied — the one thing the acquis forbids. Data, or refused                                                                                                                                                  |
| 4   | **A conduct pointer that leaves the package**                                                                            | 004 §4's opacity: the chassis knows _"rule R of domain D fired → hand the turn to D's conduct for R"_ and nothing more. A pointer into **another domain** would let one floor drive another's practice; a pointer into **the chassis** re-opens the contraband 004 evicted from `src/safety.mjs:67-75`. It must resolve inside the domain's own package |
| 5   | **A package that contradicts its own declaration**                                                                       | a domain calling itself `nutrition` whose library is psychotherapy; a floor describing a practice the library does not teach; an escalation map naming a profession the domain never touches. The one substantive reading — and it is against the **author's own words**, never against the world                                                       |

On refusal 2, note the asymmetry [No generic floor](015-no-generic-floor.md) §1 leaves
standing: the **site** is refutable, the **compliance** is not, at any site. Site 2 is
asserted (nothing outside the persona reads Claudia's words — 004 §2); site 3 is obeyed
(the chassis is a subordinate, not a party — 015 §1). **The gate refutes the label, never
the conduct.** That is the honest statement of its reach.

### 3. The escalation map stops being mandatory ⚠

The charter's _"a mandatory escalation map"_ and 003 §6's _"the gate verifies each domain
has one"_ both predate the dissolution. **The mandate falls**, and the reason is
structural rather than permissive:

- **A required field needs a consumer.** Polarity is required because the compose gate
  computes on it. An escalation map has **none** — 003 §6 settled that maps are never
  compared, they only ever add. A required field with no consumer is ceremony, which is
  the exact argument [The soul](016-the-soul.md) §1 used to refuse the soul a slot
  structure.
- **015 §6 forecloses it from the other side.** An escalation map is a deontological
  artifact — _"beyond me → this real profession"_. A gate that does not require a floor
  cannot coherently require a map.
- **The mandate had an author, and it is gone**: a generic level with standing to impose
  something on every domain. There is no such level.

What survives untouched: **composing never discharges an escalation** (003 §6) — an
escalation target is always a human profession and a loaded domain never satisfies one;
_a domain is a library, not a credential_. That was a statement about the compose gate and
never needed the mandate.

The gate's remaining business with a map: **well-formed if present** — its entries name
professions, not domains (the same category error as refusal 4).

**Honest cost, stated and not mitigated:** a domain may be published that refers no one
anywhere. `N1`/`N7`'s referral discipline is psy's, binds psy, and binds nobody else —
the same family as 015 §6's accepted cost, arriving from the map instead of the character.

> **Flagged for Antoine.** This is the one derivation on the map that **overturns a
> written charter clause with nobody in the room.** The live alternative is real: keep the
> escalation map as _the_ single structural obligation of every domain, on the
> _existence only, never content_ pattern 003 already fixed for it — it would be the one
> requirement a gate with no reference deontology could still make, and it costs one line
> to reinstate and disturbs no other decision. The map takes the derivation because 015
> §6's refusal was explicit and total (_"un domain sans rien à l'intérieur, c'est juste
> Claude"_), and this is its direct consequence. Reversing it is a one-line amendment.

### 4. The soul is not read

[The soul](016-the-soul.md) §1: a soul is prose, subordinate to nothing, audited by
nothing; **its only structured fact is whether it exists.** The gate records that fact —
it is what [Provenance tiers](007-provenance.md) has to display — and reads no further.

In particular the gate does **not** check that a soul's normative prose agrees with the
domain's floor: 016 §1 refused exactly that hierarchy (_"soul fait ce qu'elle veut"_).
The consequence is worth stating where the gate can see it, since it is the gate that
would otherwise be blamed for missing it: in the reference domain the ten rules exist
**twice** — as data in `red-lines.md` and in the first person in `SOUL.md` — and **the
gate reads exactly one of the two copies.**

### 5. The posture: fail-closed, reject on doubt, unanimous among whoever reads

The in-house precedent ships and is more precise than the ticket assumed —
`skills/author-skill/SKILL.md:34-38`: **three** independent `skill-auditor` subagents in
parallel, **unanimity to promote, a single REJECTED kills the draft**, _"they reject on
doubt"_, with the draft sitting in `proposed-skills/` quarantine meanwhile — which is
[The domain set](002-domain-set.md) §1's _undeclared is inert_ in its first incarnation.

Generalized, and this is what makes the tier question tractable:

> **The posture is fixed and identical for every domain. A tier varies only how many read
> and who they are.**

Because a single rejection kills, adding readers is **monotone** — more readers can only
ever reject more, never less. That is the operational content of the charter's
_"provenance never weakens the gates"_: not a promise anyone has to keep, a structure that
cannot express the alternative. Handed to [Provenance tiers](007-provenance.md).

**Shared with the compose gate**, as 003 §6 required: both read adversarially rather than
diff, because _the same act_ is not syntactically detectable. Same posture, different
question — **publish asks whether a domain is what it says it is; compose asks whether the
declared floors are jointly satisfiable.** Failure direction matches 004 §4's floor
fail-safe: inability to judge ⇒ act as if it failed.

### 6. The verdict is pinned to a version, never to a name

[The domain set](002-domain-set.md) §1 made the version the **distributed unit**; an audit
is a fact about a package, and a package is a version. So a registry vouches for
`psychotherapy 1.2.0` and never for `psychotherapy`. Two consequences handed on:

- a new version arrives **unaudited until it is audited** — a domain may be official at
  one version and unaudited at the next ([Provenance tiers](007-provenance.md) displays
  it, [Domain versioning](014-domain-versioning.md) decides what re-runs);
- the gate's product is an **audit record** — verdict, readers, date, version — and that
  record is the thing a provenance tier is a claim _about_.

### 7. Neither gate ever looks outside

| gate        | runs at                              | asks                                         |
| ----------- | ------------------------------------ | -------------------------------------------- |
| **publish** | publication, once per version        | is this domain what it says it is?           |
| **compose** | `add` / `remove`, over the whole set | are the declared floors jointly satisfiable? |

**Both are coherence audits; neither is a conformity audit; nothing in the model ever
compares a domain to the world.** The person is the only one who can do that, and
provenance is the only information the model gives them for it — which is why
[Provenance tiers](007-provenance.md) is where 015 §6's accepted cost finally lands.

### Vocabulary settled here

- **coherence audit** — an audit against the audited thing's own declaration. Both gates
  are one. Opposed to a **conformity audit**, against an external reference, which the
  model has no level to hold
- **well-formed floor** — a floor every rule of which is readable by the compose gate:
  owner, act, polarity, conditionality if an obligation, site. Well-formedness is a
  parse, not a judgement
- **audit record** — the gate's product: verdict, readers, date, **version**. What a
  provenance tier claims about
- **monotone provenance** — a tier adds readers to a fixed posture under unanimity, so it
  can only ever reject more. Why provenance structurally cannot weaken a gate

### Inputs passed

- [Provenance tiers](007-provenance.md) — the posture is fixed, the **readers** are the
  tier's only variable, and unanimity makes the tier ladder monotone; the audit record is
  what a tier claims about; verdicts are per **version**, so a tier is too
- [Domain versioning](014-domain-versioning.md) — the verdict is pinned to a version, so
  a new version has no audit until it gets one; a change of **polarity** or **site** is
  what re-opens refusals 1 and 2
- [Claudia and her domains](009-claudia-manifest.md) — the reference declaration shows an
  escalation map that is **present but not mandatory**, and must state whether psy's
  `ALWAYS` rules are conditional, since an unconditional obligation is what makes a domain
  refusable at composition
- [Assemble the principles document](012-assemble-doc.md) — the five refusals are the
  document's spine for the gate, and **§3's overturn of the charter's mandatory escalation
  map is the one item on the map that wants Antoine's eye before it settles**
