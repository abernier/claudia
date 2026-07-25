---
id: 4
title: "Floor rules and the per-turn check: shape, union, routing"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

The per-turn verification runs outside any persona, with criteria =
chassis law ⊕ union of the loaded domains' floors. What is its contract?

- **Rule shape.** What must a domain floor rule declare so that (a) the
  conjunctive union is well-defined and "strictest wins" is comparable across
  domains, and (b) when a rule speaks, the response is led by the _owning_
  domain's practice?
- **The check itself.** What does it see (the turn? the whole conversation?),
  and what are its verdicts — block, reshape, surface the floor to the person?
- **The generic silence on danger.** The chassis level knows no "crisis" and
  no "hand-off". Verify the check's contract cannot smuggle danger conduct
  back into the generic level — detection criteria are domain payload, or they
  are nowhere.

Principle level only: what a rule _declares_ and what the check _guarantees_ —
not how either is computed.

**Input from [Concurrent domains](003-concurrent-domains.md)**:

- **The union is over the _declared_ set, not the active domain.** One domain is
  practised at a time, but the floor does not follow it — _the floor is a function of
  the declaration, the practice a function of the moment_. The alternative (floor
  follows the active domain) was examined and killed there; the decisive reason is
  this ticket's business too: `UserPromptSubmit` fires _before_ the persona picks its
  library, so a floor scoped to the active domain is unknowable at check time.
- **Rule shape, partially supplied.** A rule must declare its **polarity** —
  prohibition or obligation, generalising `red-lines.md`'s `NEVER`/`ALWAYS` split —
  and an obligation must declare whether it is **conditional**. That is what makes
  the conjunctive union well-defined and "strictest wins" comparable.
- **Direction, sharpened.** This ticket's _"when a rule speaks, the response is led
  by the owning domain's practice"_ becomes: **a floor may interrupt the active
  practice; a practice may never soften a floor.** That interrupt is the only
  involuntary transition in a session and the only surviving cross-domain
  interaction. A domain can therefore be _active and mute_ on part of its own ground.
- **Where the union is computed.** Not per turn: it is compiled once at
  `add`/`remove`, as part of the artifact [The domain set](002-domain-set.md) made
  the compose gate's _output_. The per-turn check reads one precompiled thing —
  O(1) in the number of domains. Today `src/safety.mjs` `heuristic()` is a pure
  function over inlined constants; keeping it a function of the declaration rather
  than of the conversation is what preserves that.
- **The generic silence on danger — live question, not settled here.** Danger
  decomposes four ways (mechanism / criteria / conduct / resources) and the charter
  already gives the **mechanism** to the chassis; the _"100% psy"_ acquis covers only
  the other three. Antoine had the option of moving detection (**A1**) or detection +
  a minimal generic pivot (**A2**) down into the chassis law explicated in full, and
  the acquis **stands** — but for a reason that leaves this ticket's question open:
  A2 rescues only the imminent-risk slice (`A2`/`A3`/`A7`) and not the domain
  hard-blocks (`N2`/`N3`/`N4`/`N6`), which are authored by psy and target _other_
  domains' practices. So this ticket still owes an answer to: **what does a
  psy-less composition do on a detected danger?** — Claudia ⊕ {} and Claudia ⊕
  {software-dev} are both legal per [The domain set](002-domain-set.md). Note that
  this ticket's own framing (_detection criteria are domain payload, or they are
  nowhere_) forces **A0** unless Antoine reopens the acquis, and only he can.

## Resolution

> **Amended by the charter (Antoine, 2026-07-25): the chassis law dissolves.** Read
> every _chassis law_ below as **psy**. §1's table rows attributed to it — N1/A5, N5,
> N8/A6, the character law's product surface — are psy's rules, with the same sites and
> the same bearers: `SOUL.md` for site 2, the machinery for site 3. What this resolution
> **derived** is untouched, and mostly strengthened: the check as a mechanism without
> content, opacity, the three sites, the site's refutability, the two verdicts, and A0 on
> the empty set — the chassis was already holding no criteria, which is why the level
> could be removed at no cost. What it **assumed** — a generic law level with rules of
> its own (§5), and site 3 reserved to it (§6) — is void, and
> [No generic floor](015-no-generic-floor.md) carries the consequences.
>
> §4's command table is superseded the same day: `/forget` and `/export` are **not**
> chassis _"because they are literally the chassis law"_ — there is no chassis law.
> Antoine generalized `/help-now`'s departure to the whole surface: every command is
> psy's except `/backup`, `/config` and `/migrate`. See the map's banner and
> [Surfaces](006-surfaces.md), which owns the two commands that resist the split.

The check is a **mechanism without content**. The chassis owns the machine — every
criterion, every conduct is authored by the level that authored the rule. Its
guarantee is deliberately narrow: one turn, no state, two verdicts, and it never
speaks. What the check structurally cannot verify is carried by the floor's _other
two sites_, and saying which is which is this ticket's real product.

### 0. What the code said, before any decision

Five facts, all load-bearing, none of them what the charter's prose implies:

| fact                                                                                                                                                                                | source                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| The check is a **`UserPromptSubmit`** hook only — it reads the person's message, **never Claudia's response**                                                                       | `hooks/hooks.json`, `scripts/safety-check.mjs:101` |
| `red-lines.md` names **three** enforcement sites itself: the hook (N9/A1), _"the persona's substance plus the Crisis pivot"_ (N2, N4, N5, N6, A2–A4), _"the memory design"_ (N8/A6) | `docs/safety/red-lines.md:174-181`                 |
| `escalationContext()` — **chassis** code — contains **psy** conduct text: `Invoke the crisis skill NOW`, `crisis-protocol.md`, `C-SSRS`, `resources.md`                             | `src/safety.mjs:67-75`                             |
| `safety.mjs` has **no eating-disorder bucket**, though `classifier.md` documents one (_"gates N3"_). N3's gate is 100% persona-borne today                                          | `src/safety.mjs:10-39` vs `classifier.md:78-80`    |
| `safety.mjs` **never reads the transcript** (the payload carries the locator; it is unused) → the check sees exactly **one message**                                                | `scripts/safety-check.mjs:95-99`                   |

The third fact is _already_ the contraband this ticket was written to prevent —
hardcoded in the chassis.

### 1. The floor has three sites, not one

A floor rule declares **where it binds**:

- **site 1 — the person's turn.** Evaluable by the chassis before the persona
  responds. The only site the check verifies.
- **site 2 — Claudia's response.** Borne by the practice; verified only by
  adversarial reading at the publish gate.
- **site 3 — the machinery.** Structural, verified at build; no runtime check
  exists or is possible.

Mapping the shipped floor onto them is the result, because of how lopsided it is:

| rule                                                                            | site  | carried by                                                                         |
| ------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| N9 / A1 — a per-turn check runs, outside the persona                            | —     | _it is the mechanism, not a checked rule_                                          |
| psy's detection criteria (`CLEAR`, `CLEAR_ML`, `UNCERTAIN`)                     | **1** | psy's criteria, the chassis's machine                                              |
| N2 means/method · N4 validating a delusion · N6 diagnosis/prescription          | 2     | psy's practice                                                                     |
| N3 diet guidance on ED signals                                                  | 2     | psy's practice — its gating condition needs history, so it _cannot_ be site 1 (§3) |
| A2 the crisis pivot · A3 ambiguity resolves up · A7 strictest for minors        | 2     | psy's conduct                                                                      |
| N1 / A5 honesty about her nature · A4 connection to trusted humans              | 2     | chassis law → `SOUL.md` (A4 is the character law's positive form, 003 §3)          |
| N5 romantic/sexual, absolute with a minor                                       | 2     | chassis law → `SOUL.md`                                                            |
| N8 no sale · A6 bounded retention, real deletion                                | **3** | the chassis, at build                                                              |
| the character law's product surface — no counters, no streaks, no re-engagement | **3** | the chassis, at build (ADR-0008, ADR-0012)                                         |

**Exactly one row is site 1.** So the check's guarantee, stated honestly, is: _a
signal that some declared domain said was detectable on a single turn was noticed._
Nothing more. That is worth having — it is the one thing the research showed a
persona cannot be trusted with — and it is not the whole floor.

**This is a precision of the charter's wording, not a reopening.** The charter's
_"the check runs every turn, outside any persona — the persona is never trusted to
self-police"_ is true of **detection** and false of N2/N4/N5/N6, where the persona is
today the only thing enforcing the rule. Narrowed to _"detection is never delegated
to the persona"_, it holds exactly. The floor stays hard; it is applied in three
places. The charter text is left untouched — only Antoine amends it.

### 2. Output-side verification is refused

The check reads the person's turn and never Claudia's response. The decisive fact is
a runtime asymmetry: **an output-side check can only run after the words exist. It
can force a correction turn; it cannot unsay.** So output-side verification is
_corrective_, never _preventive_ — and that is fatal precisely where it matters
most: on N2, the harm lands **at reading**, so a correction turn is worth nothing.
The rule with the greatest need of prevention is the one an output-side check cannot
serve.

Two alternatives were examined and dropped:

- **a generic corrective output check** — and
- **one limited to the chassis law's character law**, where harm is cumulative and a
  correction genuinely repairs something.

What killed both: **the repo's own answer to the cumulative rules is structural, not
corrective.** ADR-0012 buys anti-dependency by _not building_ always-on time
narration — _"deliberately not to be 'improved' into always-on time awareness"_ —
and ADR-0008 is _"designed against dependency"_. A feature that does not exist
cannot drift; that is stronger than any post-hoc check. Second reason: both would
double the criteria surface a domain author writes and put the chassis in the
business of classifying **Claudia's own words** with domain-supplied criteria —
exactly where contraband would re-enter.

Note the irony this resolves: ADR-0003 §3 rejected _"persona self-monitoring"_ for
detection, while compliance with N2/N4/N5/N6 **is** persona self-monitoring. The
answer is not to extend the check; it is to stop claiming the check covers them.

Honest cost, and why it closes: under this decision the character law has **no
runtime mechanism** — it rests on site 3 and site 2. But site 2's bearer for the
chassis law is `SOUL.md`, which [The domain set](002-domain-set.md) §4 made
**irremovable**: Claudia ⊕ {} keeps the voice. The bearer can never disappear, not
even on the empty set.

### 3. What the check sees: the turn, and nothing else

The check is a **pure function of (declaration, turn)**. Stateless: no memory of
earlier turns, no transcript read, no flag store.

- **Rejected — flags raised by the floor, readable by the check** (ED signal, minor
  signal, risk tier). It would give N3 a mechanical gate and make A7 automatic, but
  it **reverses a decision already taken**: `memory-layout.md:63` refused the machine
  facet outright — _"there is no safety key: a flag lives in the body, never as a
  searchable facet"_ — and it would manufacture exactly the queryable
  special-category field (`minor`, `ED`) that N8/A6 push against.
- **Rejected — a bounded window of the transcript**, re-read every turn: it
  contradicts `classifier.md:186-188` (_"does not store transcript content"_) and
  ships the transcript to a classifier on every turn.

Standing flags therefore stay **persona-facing**: `safety.md` holds them, `recall`
reads them, the persona consumes them (`skills/claudia/SKILL.md:35`) — the check
never does. A7's session-long posture is site 2 by the same token.

**The result this produces, unlooked-for: the site becomes decidable instead of
declarative.**

> A rule is **site 1 if and only if it is decidable on a single turn** of the
> person's message. Site 3 if it is a property of the machinery. Site 2: everything
> else.

So the publish gate can **verify** a declared site rather than believe it, and catch
an author who declares a history-dependent rule as site 1 — a rule that would then
never fire, silently. The site is declared _and_ refutable. That is what §1 was
missing.

Honest cost: **N3 — the Tessa case, this repo's most-cited harm — never gets a
mechanical gate under any composition.** But that is already the shipped reality (no
ED bucket in `safety.mjs`), and §2's logic says a prohibition on Claudia's speech is
not mechanically preventable anyway. N3 is not lost; it is **located** in site 2, and
audited at the gate.

### 4. Two verdicts, and the chassis never speaks

**pass** · **interrupt**. Nothing else.

- **The chassis never addresses the person.** A chassis-authored card was rejected on
  three grounds: ADR-0001's enforcement principle (_substance and the pivot, not
  repeated disclaimers_ — a machine card is the disclaimer's cousin);
  `classifier.md:184`, which already says the hook does not write the person-facing
  message; and identity constancy — a card would be a **second voice** in a session
  whose whole design is one constant face, whereas 003 §4 established the interrupt as
  the only involuntary _transition_, not a second speaker. And it is never _needed_:
  `SOUL.md` is irremovable, so there is always a voice to hand to.
- **Blocking is refused.** The check never prevents the person from speaking nor
  Claudia from answering; it **binds** what the answer must do. Silencing someone in
  distress is the worst available failure, and the shipped code already refuses it:
  _"Never blocks the turn"_ (`safety-check.mjs:9`).
- **Opacity — the interrupt carries a pointer, never conduct text.** The chassis knows
  _"rule R of domain D fired → hand the turn to D's conduct for R"_. It does not know
  what "crisis" or "C-SSRS" means. This is the exact correction of
  `src/safety.mjs:67-75`.
- **Failure direction.** Inability to evaluate a _declared floor rule_ ⇒ act as if it
  fired. Generic, and it generalises the shipped fail-safe — where a non-floor context
  hook fails **silent** instead (ADR-0012 `0012:69`: two hooks on the same event with
  opposite failure directions).

**Correction from Antoine: `/help-now` is not chassis.** ADR-0003 §2 groups
`/forget`, `/export`, `/help-now` as _"deterministic system / safety / privacy
actions"_, and `commands/` is flat — but `/help-now`'s body is pure psy conduct
(locale → crisis resources → the pivot, reading `safety.md`). The trio splits:

| command              | level   | why                                                   |
| -------------------- | ------- | ----------------------------------------------------- |
| `/forget`, `/export` | chassis | privacy and real deletion — literally the chassis law |
| `/help-now`          | **psy** | crisis conduct made deterministic. Leaves with psy    |

This _strengthens_ §5: under Claudia ⊕ {}, `/help-now` does not exist — not an empty
slot, no command at all. Exactly 002 §3's removal line. It also means **a domain may
contribute a command**, not only knowledge — passed to [Surfaces](006-surfaces.md).

### 5. Chassis-law conduct is the persona's — and the check idles on the empty set

The chassis law's rules are **site 2 or site 3 by nature**: honesty when seriously
asked, refusing a romantic frame, not farming dependence are all properties of _how
Claudia speaks_, and `SOUL.md` carries them. The chassis law has **no site-1 rules**,
so the check never fires on it.

The alternative — the chassis shipping criteria and conduct pointers for its own
rules, injected as instructions to the persona (the `escalationContext` pattern minus
the psy content) — was tempting on one point: honesty (N1/A5) is the only chassis-law
rule genuinely decidable on one turn, and the only **legally** mandated obligation
(EU AI Act Art. 50). Leaving it persona-borne leaves the disclosure duty without a
mechanism while it is trivially detectable.

What killed it is the repo's own standard for building a mechanism:

> **The check exists for a demonstrated failure, not for symmetry.** A rule earns
> site-1 criteria only where the practice has been _shown_ blind. Stanford showed
> models **miss** clear suicidal ideation (`red-lines.md:104`, N9's rationale). There
> is no equivalent evidence that a model misses _"are you human?"_ — it answers. No
> demonstrated failure, no mechanism.

**This is where the danger question passed in from 003 gets its answer — as a
derivation, not a concession.** The question _"what does a psy-less composition do on
a detected danger?"_ is **malformed**: there is no detection. The chassis holds no
criteria, so under Claudia ⊕ {} the check is a **mechanism without criteria** — it
runs, matches nothing, and can never fire. Not a hole left open: a machine waiting for
a domain to supply criteria. _"Silent, not permissive"_ finally has an operational
meaning — the mechanism runs and matches nothing, rather than being absent or being a
permission. The fail-safe of §4 is correspondingly **vacuous** on the empty set: there
is nothing to fail toward.

**A0 stands, and the acquis is untouched — by construction rather than by
vigilance.** The ticket's third sub-question (_verify the contract cannot smuggle
danger conduct back into the generic level_) is answered structurally: the chassis
holds no criteria and no conduct text, so there is nothing for danger to be smuggled
_into_. The one place it had already been smuggled is `src/safety.mjs:67-75`, and
opacity (§4) is what evicts it.

### 6. The rule shape — one skeleton, three forms

Every floor rule declares:

| field              | role                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **owner**          | the domain, or the chassis law — routes the interrupt, carries provenance                  |
| **the act**        | in behavioural terms, written so an adversarial reader can judge _"the same act"_ (003 §6) |
| **polarity**       | prohibition \| obligation (003)                                                            |
| **conditionality** | for an obligation: unconditional \| conditional (003)                                      |
| **site**           | 1 / 2 / 3 — declared and refutable (§1, §3)                                                |

Then, **conditional on the site**:

- **site 1** adds **criteria** (data the chassis's machine evaluates) and a **conduct
  pointer** (opaque to the chassis);
- **site 2** adds **nothing** — the act _is_ the constraint, borne by the practice,
  audited at the gate;
- **site 3** adds **nothing** — the act is a property of the machinery, verified at
  build.

The uniform record — criteria and conduct everywhere, empty where unused — was
rejected for two costs. It invites an author to fill criteria on a site-2 rule that
would never fire (the exact silence the site's refutability exists to catch); and it
erases the one thing the shape must make legible — **which rules are verified and
which are merely asserted**. A three-form record says it in its structure; a uniform
one hides it in empty fields.

Two consequences derived rather than chosen:

- **Criteria are data, never code.** Forced by the acquis: the _mechanism_ belongs to
  the chassis, so if a domain shipped an evaluation function the mechanism would be
  domain-supplied. **The chassis fixes the machine; the domain fills its slots** — and
  a machine has a fixed input shape (patterns, plus the prompt for the optional model
  stage: exactly the two shipped stages). In-house precedent: skills are markdown and
  data, and `skill-auditor` audits markdown.
- **Site 3 is reserved to the chassis law; a domain declares site-1 or site-2 rules
  only.** A domain cannot bind the machinery, because it does not own it
  ([The domain set](002-domain-set.md): the domain _defines_, the chassis _stores_, the
  person _owns_), and the compose gate cannot verify a claim about the chassis. This
  matches the shipped floor exactly — every site-3 rule in §1's table (N8, A6, the
  character law's product surface) is already chassis law.

Three fields deliberately **not** added: no **severity** (003: "strictest wins" rides
on polarity alone; low/moderate/high are psy _criteria_ payload, not a rule property);
no **escalation map** at rule level (003: a domain-level property, checked for
existence, never compared); no **mode** (003 §5: dissolved).

### Vocabulary settled here

- **binding site** — where a floor rule binds: _the person's turn_ (1), _Claudia's
  response_ (2), _the machinery_ (3). Declared, and refutable
- **decidable on one turn** — the predicate that makes site 1 checkable rather than
  claimed. A rule is site 1 iff it holds
- **conduct pointer** — the opaque handle an interrupt carries. The chassis routes; it
  never speaks and never knows the conduct
- **mechanism without content** — the check. Chassis machine, criteria and conduct
  authored elsewhere; it idles when no declared rule supplies criteria
- **empirical mandate** — a rule earns site-1 criteria only where the practice has been
  demonstrated blind. Why the chassis ships no criteria

Held for [Assemble the principles document](012-assemble-doc.md), which decides what
enters `CONTEXT.md` and when.

### Inputs passed

- [Publish gate](005-publish-gate.md) — the gate **verifies the declared site** (§3's
  predicate), audits site-2 rules by adversarial reading (they are asserted, never
  machine-verified), and refuses a site-3 rule from a domain (§6)
- [Surfaces](006-surfaces.md) — **a domain may contribute a command**; `/help-now` is
  psy, not chassis, and the flat `commands/` directory masks the split. Standing flags
  stay persona-facing, never read by the check
- [The lifecycle diagram](011-lifecycle-diagram.md) _(now unblocked)_ — the check's
  position, its statelessness, its two verdicts, and the interrupt as the only
  involuntary transition
- [Domain versioning](014-domain-versioning.md) — a version that changes a rule's
  **site** or **polarity** changes what the gate must re-verify
- [Assemble the principles document](012-assemble-doc.md) — the three-site table is the
  document's spine for the floor. Record the shipped **divergences** as divergences,
  not fixes (implementation is out of scope): the psy conduct text in
  `src/safety.mjs:67-75`, `/help-now`'s placement, `classifier.md`'s documented but
  absent ED bucket, and `minor_signal` specified but never persisted
