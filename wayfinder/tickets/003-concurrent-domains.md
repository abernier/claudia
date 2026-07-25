---
id: 3
title: "Concurrent domains: how loaded domains combine"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

Domains are concurrent — several loaded at once, and since the hat's removal
nothing above them arbitrates. What holds the ensemble together?

- **In one response.** When two libraries both have something to say (psy and
  software-dev on "how do I ship this by pulling all-nighters?"), who leads?
  The charter routes floor-speech to the owning domain's practice; what routes
  ordinary, non-floor moves?
- **Mode of engagement.** The hat used to fix each domain's mode of use
  (understand vs advise). Hat-free, is there still a per-domain mode — and if
  so, who sets it: Claudia's own stance (her shipped persona), the person, the
  conversation itself? Or does the distinction dissolve?
- **Domain × domain compatibility (compose gate).** Can two domains'
  deontologies conflict — one demanding a directive practice the other
  forbids? The old worked example ("a directive posture over the psy domain
  dies at the gate") must be reformulated hat-free: what property, declared
  where, does the gate compare now?

**Input from [The domain set](002-domain-set.md)**: the compose gate's trigger
and scope are now fixed — it runs when the set changes (`add`/`remove`), over
the **whole set**, and its refusal surfaces in the terminal rather than
mid-session. This ticket owns only _what it compares_.

## Resolution

The question's premise was refused rather than answered. Domains do **not**
combine in one response: _"Claudia agira selon 1 domaine de compétence à la
fois"_ (Antoine, 2026-07-25) — contradiction between domains is made impossible
by construction instead of caught at a gate.

But the refusal applies to the **practice**, not to the floor. The load-bearing
result of this ticket is the split those two words name:

> **The floor is a function of the declaration; the practice is a function of the
> moment.** Two clocks. One competency domain is practised at a time; the floor is
> the union of _every declared_ domain's, whichever one is active.

### 0. Charter reopening

The charter defined `Domain (publishable, **concurrent**)` and left "how they
combine" to this ticket. **Concurrency is withdrawn** — recorded in the map's
reopening banner. Nothing else in the charter is reopened; in particular _danger
is 100% psy-domain_ survived a direct examination (§3) and stands untouched.

### 1. One at a time — the set holds several, one is active

The set keeps the cardinality [The domain set](002-domain-set.md) gave it (several,
possibly empty). What is exclusive is the **practice**: at any moment Claudia works
under exactly one declared domain.

**A singleton set was rejected** (`domain add` replacing rather than adding). The
reason is not ergonomics: [The domain set](002-domain-set.md) established that
`domain remove psychotherapy` retires the danger conduct (_"no crisis conduct, no
escalation map"_). Under a singleton, changing subject _requires disarming the
floor_ — someone wanting help with their code would have to strip Claudia of her
crisis conduct to get it. The refusal to depend on an audit must also be a refusal
to depend on a `remove`.

The ticket's first sub-question — _in one response, who leads?_ — therefore has no
answer, by construction. Nobody. There is only ever one.

### 2. The selector is the person

Claudia may **detect** which domain the person is soliciting and **propose** to
switch. She never switches on her own, and the proposing behaviour is itself a
setting (Antoine: _"lui proposer de switcher tout au plus - réglable en conf"_).

This does not collide with what [The domain set](002-domain-set.md) refused: what
is settable is the _proposal behaviour_, not the set and not the floor, so
ADR-0028's shape (declared keys, closed value sets) holds.

- **The setting's ceiling is `propose`.** It varies downward — propose ↔ silent —
  never up to automatic. Under §4 there is already exactly **one** involuntary
  transition, the floor event. Allowing automatic topic-switching too would give
  two involuntary transitions with opposite justifications and no way for the
  person to tell them apart. Capping at `propose` buys one legible sentence: _the
  only transition the person did not ask for is a floor event._ Aligned with
  `SOUL.md` — _"I move at the person's pace, and I let them steer."_
- **Default `propose`, in ADR-0027's register** — named once, lightly, easy to
  decline, never repeated. Without that default the person never discovers the
  other domain is there and the multi-domain set is dead weight.
- **A sentence, never a menu.** ADR-0024 reserves the choice UI for _selecting_
  and forbids it while the person is _disclosing_. The moment a switch becomes
  relevant is usually a disclosure — someone talking about their sprint who lets
  their distress through. ADR-0024's own test (_would offering the plausible
  answers change what they'd tell me?_) says no-menu precisely there.

### 3. The floor is cumulative — the alternative was examined and killed

Two readings were live: **(A)** the floor follows the active domain; **(B)** the
floor is the union of all declared domains' floors. **(B) is decided.** (A) was
taken seriously, including its rescue attempt, because it is genuinely simpler —
under (A) the compose gate's domain × domain check disappears entirely.

Four findings killed it.

**(a) The hook fires before the turn's active domain exists.** `UserPromptSubmit`
runs on the person's message _before the persona responds_
(`docs/safety/classifier.md`, `hooks/hooks.json`), and it is the persona that picks
its library while composing. Under (A) the hook can only apply the _last known_
domain:

    T1..T3  sprint talk, software-dev active
    T4      a message carrying suicidal ideation
            → hook runs with software-dev's floor, which the charter makes
              silent on danger → stage 1 has no patterns to match → passes clean
            → the persona then reads it, recognises psy territory, proposes a switch

Detection arrives **one turn after it was needed** — the failure mode
`red-lines.md` cites at N2 (Stanford bots listing bridge heights to a
newly-unemployed person). Second-order: `src/safety.mjs` `heuristic()` is today a
pure function over inlined constants (`CLEAR`, `CLEAR_ML`, `UNCERTAIN`); under (A)
its patterns become per-turn data assembled from conversation state. The
deterministic part of the floor becomes a function of the conversation.

**(b) (A) makes the in-conversation switch as safety-bearing as the `remove`
already refused** in §1 — same hole, lighter gesture, no `remove` to make it
visible, and settable in config.

**(c) The decoupling is partial anyway.** The charter's floor is `chassis law ⊕
union of the loaded domains' floors`; chassis law binds always, so even under (A)
the floor is `chassis ⊕ active`, never just the active domain's. (A) narrows the
coupling rather than removing it — and what it narrows away is precisely danger.

**(d) The rescue does not rescue.** _Move danger down into the chassis law_ was
explicitly explicated at Antoine's request. Danger decomposes four ways:

|           | what                                                                 | where                                             | already chassis?                                                       |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| mechanism | deterministic per-turn check, outside the persona, fail-safe         | `hooks/hooks.json`, `scripts/safety-check.mjs`    | **yes** — the charter gives the chassis the _per-turn check mechanism_ |
| criteria  | stage-1 patterns, classifier, thresholds                             | `docs/safety/classifier.md`, `red-lines.md`       | no — psy                                                               |
| conduct   | the pivot, staying with the person, not handling the high tier alone | `docs/safety/crisis-protocol.md`, `skills/crisis` | no — psy                                                               |
| resources | localised, age-appropriate crisis lines                              | `docs/safety/resources.md`                        | no — psy                                                               |

So the _"100% psy"_ acquis only ever covered the last three rows. (`A4` — _always
encourage and facilitate connection to trusted humans_ — is also already the
positive form of the character law's _no parasocial substitution_, hence already
chassis.) The graduated options: **A0** status quo · **A1** detection descends ·
**A2** detection + a minimal generic pivot descends, psy strictly strengthening it
· **A3** all of danger descends (rejected outright: localised resources, severity
tiers and the refer-only list are clinical knowledge, and a chassis holding them is
a psy domain in disguise — non-publishable, non-composable, breaking the
one-kind rule).

**A2 rescues only one slice of the floor**, and it is the minority slice:

| rule                                                                 | what it targets                    | rescued by A2? |
| -------------------------------------------------------------------- | ---------------------------------- | -------------- |
| `A2`,`A3`,`A7` escalate, ambiguity resolves up, strictest for minors | the turn's risk                    | **yes**        |
| `N2` never means or methods                                          | a `pharmacology` domain's practice | no             |
| `N3` never diet/calorie guidance on ED signals                       | a `nutrition` domain's practice    | no             |
| `N4` never validate a delusion                                       | any conversational move            | no             |
| `N6` never diagnose or prescribe                                     | a `medicine` domain's practice     | no             |

Read the middle column: **these rules are authored by psy but they target other
practices.** `red-lines.md` says so itself at N3 — _"Generic 'wellness' content is
actively dangerous for this population — context blindness kills"_: the rule is a
rule _about generic wellness content_, i.e. about another domain's practice. Hence
the line that settles it:

> **A prohibition that only binds the practice that authored it is not a
> prohibition; it is a style guide.**

Under (A) those rules can structurally never reach their target, because their
target is the domain that just took the wheel — and they cannot be moved down
either, since that is A3.

**Consequence for the acquis**: none. (B) is decided for a reason that does not
depend on it — a floor indexed on the active practice cannot do the only job a
floor exists for. That holds with or without danger in the chassis. The A1/A2
question survives as a live question, passed to
[Floor rules and the per-turn check](004-floor-check.md).

**The `/model` analogy, raised by Antoine, lands on (B).** `hooks/hooks.json` is
keyed on events and `${CLAUDE_PLUGIN_ROOT}` — nothing in it names a model.
`/model` mid-session changes the engine; `safety-check.mjs` keeps firing
identically. Term for term: the model ↔ the active domain; hooks and permissions
↔ the floor; `/model` as the person's explicit gesture ↔ detect-and-propose;
settable in config ↔ settable in config. The discontinuity that is accepted is at
the _practice_ level; the guardrail layer never moves. (A) would be a `/model`
that unplugs the hooks on the way past.

### 4. The floor may interrupt the active practice

The one cross-domain interaction that survives, and it is **one-directional and
always in the strict direction**: software-dev is active, the hook detects (psy's
patterns are live because psy is _declared_), psy's escalation map binds, the
crisis pivot pulls Claudia out of the software-dev practice.

- a floor may cut a practice;
- a practice may never soften a floor.

No blending, no negotiation, never two voices in one response — which is what the
concurrency refusal was protecting. _"They might contradict each other"_ is
satisfied at the level of practice without paying for it at the level of floor.

It also means **a domain can be active and mute on part of its own ground**: a
`nutrition` domain stays muzzled on N3 territory as long as psy is declared. That
is the accepted cost of (B), and the second of the two mechanisms in §6.

### 5. Mode of engagement dissolves

No declared per-domain mode (`software-dev: directive`, `psychotherapy:
reflective`). **A declared mode is forbidden by the charter, not merely
inelegant**: _identity constancy (hard)_ says _Claudia never changes face_. If the
domain fixes the mode, switching changes her posture — her face — and the domain
set becomes a set of personalities with the switch as a change of person. A switch
may change only her **competence**.

What was called "mode" is already covered by the two existing axes: **posture** is
Claudia's, constant and free above the law; a **mode constraint**, where one
exists, is a floor rule. Three confirmations in the shipped repo:

- `choose-approach` step 2 weighs _"does this person need a specific technique now,
  or do they need to be heard?"_ — Claudia's judgement per moment, not a declared
  attribute of CBT.
- MI is described in `docs/approaches/README.md` as _"a **style** for ambivalence
  and engagement"_ — an approach that **is** a mode, and still just an inert file.
  Even inside psy, mode is content, not a field.
- `refer-only.md`'s _"recognise, never run alone"_ is exactly a mode constraint,
  already expressed as a floor rule. It never needed a `mode` field.

The race-condition case resolves without one: Claudia stays warm and attentive _in
her manner_ and answers the technical question directly because that is what the
active library contains. Answering plainly is the unchanged posture applied to
different matter; what would change her face is being made curt because a field
said `directive`.

### 6. What the compose gate compares

After §1, §2 and §5 the inventory emptied itself: not postures (they no longer
exist), not practices (they never meet). Only what is declared remains.

**It compares one thing: the satisfiability of the declared floors.** The conflict
class is asymmetric, and the shipped repo already has the shape — `red-lines.md` is
literally split into `NEVER` (N1–N9) and `ALWAYS` (A1–A7), two polarities:

|                 | vs a prohibition                                                  | vs an obligation                |
| --------------- | ----------------------------------------------------------------- | ------------------------------- |
| **prohibition** | never conflicts — strictest wins, the union is always satisfiable | the **only** possible collision |
| **obligation**  | ↑                                                                 | no conflict — obligations add   |

So the gate looks for exactly one thing: **an unconditional obligation of one
domain against a prohibition of another, over the same act.** The worked example
that replaces the charter's dead one: a `nutrition` domain whose floor obliges
_"always supply a quantified dietary plan"_ against psy's `N3` → unsatisfiable →
refused at `add`. Conditioned (_"except where another floor forbids it"_) →
satisfiable → accepted, and its practice is muzzled per turn on that ground (§4).

Rule for domain authors: **a prohibition always composes; an obligation composes
only if it is conditional.** An unconditional obligation is what makes a domain
refusable — the price of writing it that way, not a bug.

**Composing never discharges an escalation.** psy escalates _"medical symptoms → a
doctor"_; adding a `medicine` domain whose practice that is does **not** satisfy
it. An escalation target is always a human profession, and a loaded domain never
satisfies an escalation — otherwise composing erodes referral, and enough domains
means Claudia never refers anyone anywhere, which is `N1` and `N7` exactly. **A
domain is a library, not a credential.** Consequence: escalation maps are not
_compared_, they add; the gate only verifies each domain has one — a validity
check, not a compatibility check.

**Overlap is not conflict.** Two domains covering the same ground — psy and a
`life coaching` — pass. The gate checks satisfiability, not tidiness. Redundancy is
legal.

**By adversarial reading, not by diff.** "The same act" is not syntactically
detectable: `N3` says _diet, calorie, weight-loss guidance_, a nutrition domain will
write _macronutrient targets_. Only a reader catches that these are the same act.
The in-house precedent ships already — `claudia:skill-auditor`, _rejects on any
doubt_, fail-closed.

### 7. Cost — (B) is the cheaper one at runtime

The objection _isn't reading everyone's floors expensive?_ was checked against the
code. The union is a function of the declaration, which changes only at
`add`/`remove` — so it is **compiled once at compose time, not read per turn**, and
[The domain set](002-domain-set.md) already made the declaration the gate's
_output_: that artifact extends to carry the compiled floor.

|                          | cost                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| per turn                 | one read of a precompiled artifact — O(1) in the number of domains |
| per set change           | union + satisfiability — O(N), once, in the terminal               |
| in the persona's context | **zero** — one practice library, the active domain's               |

The scarce resource here is context, not I/O, and (B) spends none of it: floors live
in the hook's world (outside the persona), practice in the persona's (one at a
time, on demand). What would have been expensive is loading N practice libraries
at once — exactly what the concurrency refusal forbids. The only real cost sits at
the gate, where [The domain set](002-domain-set.md) already put cost: in the
terminal, where a person is waiting on a command and a few seconds are free.

And (A) is the _more_ expensive at runtime — per-turn determination of the active
domain plus per-turn pattern assembly from conversation state, on the hot path,
non-deterministic. (B) reads one compiled file.

### Vocabulary settled here

- **active domain** — the single declared domain Claudia practises under at a given
  moment. A property of the conversation, never of the declaration
- **declared set** vs **active domain** — the floor reads the first, the practice
  the second. The two clocks
- **floor polarity** — a floor rule is a **prohibition** or an **obligation**;
  `red-lines.md`'s `NEVER`/`ALWAYS` split generalised. The gate's only comparison
  rides on it
- **conditional obligation** — an obligation yielding to another floor's
  prohibition. The form an obligation must take to compose
- **floor interrupt** — a floor event pulling Claudia out of the active practice.
  The only involuntary transition, and the only surviving cross-domain interaction

Held for [Assemble the principles document](012-assemble-doc.md), which decides
what enters `CONTEXT.md` and when. Note for it: §3's decision meets all three of
`/domain-modeling`'s ADR tests (hard to reverse, surprising without context, a real
trade-off with a genuine alternative) — it is ADR-worthy _when the generalized
model lands_, not before; no ADR is written by this map.

### Inputs passed

- [Floor rules and the per-turn check](004-floor-check.md) — the floor interrupt's
  direction; the compiled-floor artifact; the four-way decomposition of danger and
  the still-live A1/A2 question
- [Publish gate](005-publish-gate.md) — a floor must be declared with its polarity,
  and an obligation must state whether it is conditional
- [Surfaces](006-surfaces.md) — practice exclusive / records cumulative, and
  whether surfaces are gated by the active domain
- [Claudia and her domains](009-claudia-manifest.md) and
  [The composition diagram](010-composition-diagram.md) — the declared/active
  distinction and the two clocks are what they must express
