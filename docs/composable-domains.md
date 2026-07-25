# Composable domains — architecture principles

> **Decided, not built.** This document fixes a model; no line of it describes code that
> exists today. The shipped architecture is [`ARCHITECTURE.md`](ARCHITECTURE.md), and
> where the two disagree, ARCHITECTURE.md is what runs. Implementation and migration are
> deliberately out of scope: principles and two diagrams, no storage formats, no plugin
> mechanics.

Claudia today is one persona over one body of knowledge. This document generalizes the
second half: **a chassis that holds nothing, taking one or several published competency
domains, over memory that belongs to the person.**

Every decision below was reached on a wayfinding map, one ticket at a time; the tickets
carry the arguments, the alternatives that were killed, and the evidence from the repo.
This document is the index, not the store. The two items still genuinely open are in §10.

---

## 1. The model in one page

- **One authority: the domain.** It owns its knowledge, all of its rules, its commands,
  its record kinds, its migrations, and — optionally — its character.
- **The chassis authors nothing.** It fires three moments, runs one check that holds no
  criteria, keeps three commands that never open a note, stores a directory it does not
  read, and says exactly one line: _which domain is active._
- **The person declares the set.** One gesture in the terminal, audited whole. The
  declaration is written by the machine, never by hand. Undeclared is inert.
- **Several domains may be declared; exactly one is practised at a time.** The floor is a
  function of the **declaration**; the practice is a function of the **moment**.
- **The floor is the union of every declared domain's rules.** A floor may interrupt a
  practice; a practice may never soften a floor.
- **The face is the active domain's character**, or nobody. Switching is the person's act,
  and the machine marks every switch.
- **The set may be empty.** Claudia ⊕ {} is a machine with three commands, and Claude.

There is no generic level. There is no rule anywhere that is not some domain's.

---

## 2. The chassis

A machine, and the exhaustive list of what it is:

| part                   | what it holds                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **three moments**      | session open · every turn · session close. Fired by the chassis, filled by whoever is declared, **empty by default** |
| **the per-turn check** | the _mechanism_: a pure function of (declaration, turn). Every criterion is a declared domain's                      |
| **three commands**     | `/backup` · `/config` · `/migrate` — they act on the **store**, never on the **content**                             |
| **the store**          | one root directory, archived as a block without being opened; the retention ladder; the migration ledger             |
| **one line of text**   | _— active domain: X —_                                                                                               |

And the list of what it does **not** hold: no rules, no criteria, no conduct, no character,
no record kinds, no surfaces, no ranking, nothing to display.

**Mechanism without content** is the chassis's general form, and it holds at four
independent sites: the per-turn check, migration, the lifecycle moments, and the face
marker. Each is a machine that runs identically whether or not anybody supplies it with
anything, and _runs and matches nothing_ is a different state from _is absent_.

**The store / the content line** is what keeps this coherent when a domain writes to disk:
the domain **defines** the record, the chassis **stores** it, the person **owns** it. The
archive ladder's numbers are the chassis's — a ladder is how an archive works, not a
deontological position — while how long a _session summary_ is worth keeping is the
domain's.

**The chassis is a subordinate, not a party.** A domain may bind the machine; nothing
verifies the claim, and nothing needs to. A rule is a contract between separable parties,
and the chassis is not one — it is built to what it is told.

---

## 3. The domain — the one publishable kind

### 3.1 The package

Knowledge, floor, escalation map, commands, skills, scripts, record kinds, migrations,
lifecycle hooks, and at most one character. **Everything in that list is optional.** A
domain with nothing inside it is publishable, and is just Claude.

A domain is a **distributed unit**: published, audited and installed on its own, and
versioned `x.y.z` for that reason. Its commands live in its package and vanish with it —
no empty slot, no mechanism, just packaging. Its records do not: they are the person's, and
a domain that leaves takes nothing, because it never owned anything. **Inert, not gone.**

Nothing requires a domain to have a note system at all.

### 3.2 The soul

A domain's character. **One prose document, at most one per domain, optional**, worn while
that domain is active, **subordinate to nothing and audited by nothing**. Its only
structured fact is whether it exists.

It has no slot structure because a slot structure with no consumer is ceremony: the floor
is data because two consumers read it mechanically — the check and the gate — and a soul
has neither. A soul may carry normative prose; that prose is **not floor**, nothing but the
model ever reads it, and it is a promise in the voice that nothing verifies.

### 3.3 The floor — the rule shape

**floor** = a domain's checkable rules; across several declared domains, their union.
Nothing beneath it.

Every rule declares:

| field              | role                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| **owner**          | the domain. Always, at every site — it routes the interrupt and carries provenance |
| **the act**        | in behavioural terms, written so an adversarial reader can judge _"the same act"_  |
| **polarity**       | prohibition \| obligation                                                          |
| **conditionality** | for an obligation: unconditional \| conditional                                    |
| **site**           | 1 / 2 / 3 — declared **and refutable**                                             |

Then, conditional on the site: **site 1** adds _criteria_ (data the chassis's machine
evaluates — never code) and an _opaque conduct pointer_; **sites 2 and 3 add nothing** —
the act is the constraint.

Three fields deliberately absent: no **severity** (strictest-wins rides on polarity alone),
no per-rule **escalation map** (a domain-level property, never compared), no **mode** (a
declared mode of engagement is forbidden by identity constancy, and what it named is either
the practice's own judgement or a floor rule already).

### 3.4 The three sites — the spine

A floor rule declares **where it binds**, and the site is a predicate rather than a claim:

> A rule is **site 1 if and only if it is decidable on a single turn** of the person's
> message. **Site 3** if it is a property of the machinery. **Site 2**: everything else.

| site                                                           | binds                              | verified by                                                                 |
| -------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| **1 — the person's turn**                                      | evaluable before anything responds | the check. **The only site anything verifies at runtime**                   |
| **2 — the response**                                           | borne by the practice              | adversarial reading at the publish gate. _Asserted, never machine-verified_ |
| **3 — the machinery** — the chassis's, **or the domain's own** | structural                         | nothing. The chassis obeys; a domain's own machinery is built to it         |

This table is what makes _the floor is hard_ and _the check verifies one thing_ true at the
same time. Mapping the shipped psychotherapy floor onto it puts **exactly one rule at site
1** — detection — so the check's honest guarantee is: _a signal that some declared domain
said was detectable on a single turn was noticed._ Nothing more. That is worth having,
because it is the one thing the research showed a persona cannot be trusted with, and it is
not the whole floor.

**A precision, recorded as a precision.** _"The check runs every turn outside any persona —
the persona is never trusted to self-police"_ is true of **detection** and false of the
site-2 rules, where the practice is the only thing enforcing them. Narrowed to _detection is
never delegated to the practice_, it holds exactly.

**Output-side verification is refused.** A check that reads the response can only run after
the words exist: it can force a correction turn, it cannot unsay. It is corrective, never
preventive — fatal precisely on the rule that most needs prevention, where the harm lands at
reading. The model's answer to cumulative harm is structural instead: a feature that does
not exist cannot drift.

### 3.5 The escalation map

_"Beyond me → this real profession."_ Declared if the domain has one; **not required**
(§10.1). Every target is a human profession, and **composing never discharges an
escalation** (§10.1) — adding a `medicine` domain does not satisfy _"medical symptoms → a doctor"_.
**A domain is a library, not a credential.** Maps are therefore never compared; they only
ever add.

---

## 4. Composition

### 4.1 The declaration, and the two clocks

The domain set is a **declaration in the person's vault**, written by the machine as the
compose gate's _output_ — never hand-maintained, never a setting (a setting sits above the
floor and may not soften it; the domain set _changes_ the floor).

```
$ npx claudia domain add antoine/software-dev
  → compose gate over the WHOLE set {psychotherapy, software-dev}   ✓
  → declared: software-dev 0.2.1, provenance local, 2026-07-25
```

Three properties follow from the declaration existing at all: **undeclared is inert**
(a folder copied in by hand does not play); **failure leaves the conversation** (a refused
domain is refused in the terminal, never mid-session); **nothing changes in silence** (the
declaration pins the version — HEAD moving in the author's repo moves nothing here).

> **The declared set** is written down. **The active domain** is not — it is a property of
> the conversation. The floor reads the first, the practice the second.

### 4.2 What the compose gate compares

It runs at `add`/`remove`, over the **whole set**, on the person's machine, tier-blind.
At session open there is no re-audit — only a cheap coherence check that the declaration
still matches what is on disk.

It compares exactly one thing: **the satisfiability of the declared floors.**

|                 | vs a prohibition                                  | vs an obligation                |
| --------------- | ------------------------------------------------- | ------------------------------- |
| **prohibition** | never conflicts — the union is always satisfiable | the **only** possible collision |
| **obligation**  | ↑                                                 | no conflict — obligations add   |

So the gate looks for an **unconditional obligation of one domain against a prohibition of
another, over the same act** — and it does so by adversarial reading, not by diff, because
_the same act_ is not syntactically detectable (`never give calorie guidance` versus
`always supply macronutrient targets`). Rule for authors: **a prohibition always composes;
an obligation composes only if it is conditional.** An unconditional obligation is what
makes a domain refusable — the price of writing it that way, not a bug.

**Overlap is not conflict.** Two domains covering the same ground compose legally.

### 4.3 The per-turn check

A **pure function of (declaration, turn)**: stateless, no transcript, no flag store, no
memory of earlier turns. Two verdicts — **pass** or **interrupt** — and it never blocks the
turn and never addresses the person.

An interrupt carries an **opaque pointer**: the chassis knows _"rule R of domain D fired →
hand the turn to D's conduct for R"_ and does not know what the conduct says. It routes; it
never speaks. Fail direction: inability to evaluate a declared floor rule ⇒ act as if it
fired.

The union it reads is **compiled once at `add`/`remove`**, not per turn — O(1) in the number
of domains, and zero cost in the practice's context, which loads exactly one library.

### 4.4 The practice, the face, and the switch

**One domain is practised at a time.** Two libraries never speak in one response;
contradiction between domains is made impossible by construction rather than caught at a
gate. Switching is the **person's** act — the model may detect and propose, capped there by
a setting, never automatic — so **the only transition the person did not ask for is a floor
interrupt**.

**A floor may interrupt the active practice; a practice may never soften a floor.** That
one-directional edge is the sole surviving cross-domain interaction, and it means a domain
can be **active and mute** on part of its own ground.

**The face is the active domain's soul, or nobody.** Every switch is marked by the machine
and by no one else — one line naming the **domain**, never the face, reading the same
whether a face follows it or not. No face narrates its own exit.

**Two boundaries, and they run in opposite directions**, on **authorship**:

- **the live conversation is shared** — the incoming face sees everything that preceded the
  switch, because the conversation is the _person's_, and for a face not to see it the
  chassis would have to **hide**, which is a mechanism in a shell meant to have none;
- **records are partitioned** — a face reads only the record kinds its own domain defined,
  and this costs no mechanism at all: a domain that never defined `sessions/` ships nothing
  that reads it.

Shared because nobody authored it; partitioned because somebody did.

**Declared beats active**, for the person: a declared domain's commands and records stay
reachable whichever domain is practised — consulting one's notes is not practising. That
governs _the person's_ reach, never a face's.

**Identity constancy**, restated as two guarantees it can actually hold: the face never
changes without the person's act **and** without a mark; and the person's records stay put
and stay theirs. It is no longer a claim about a constant person, a constant voice, or
continuity of address across a switch.

### 4.5 What binds under each composition

| composition           | floor                              | face                                               | commands                          |
| --------------------- | ---------------------------------- | -------------------------------------------------- | --------------------------------- |
| ⊕ {psy}               | psy's rules                        | Claudia — psy's soul                               | the system three + psy's seven    |
| ⊕ {psy, software-dev} | union of both, always              | psy's or software-dev's, per the **active** domain | the system three + both domains'  |
| ⊕ {software-dev}      | software-dev's, if it declares any | none, if it declares none                          | the system three + software-dev's |
| ⊕ {}                  | none                               | none                                               | the system three                  |

The last row is the model in one line: **a machine with three commands, and Claude.**
Present and idle at every station — the check runs and matches nothing, the three moments
fire and nothing happens, and there is nobody there to speak.

---

## 5. The two pictures

- **[The composition diagram](../wayfinder/assets/composition-diagram.md)** — one
  authority over a machine that authors nothing; the declared set and the active domain as
  two arrow weights; the floor interrupt with no edge the other way; the switch coming from
  the person; the registry and its two gates at the edges.
- **[The lifecycle diagram](../wayfinder/assets/lifecycle-diagram.md)** — the three moments,
  what fills them, the check before anything answers, and a four-row table showing the same
  topology under every composition.

_(Both are prototypes, and both live with the wayfinding map until this model is built. If
the model ships, they move into this document and the map's copies become history.)_

A worked example of the whole contract, against the practice that actually ships:
**[the reference declaration](../wayfinder/assets/reference-declaration.md)** —
Claudia ⊕ {psychotherapy}, with the frictions it exposed listed rather than smoothed.

---

## 6. The ecosystem

**A registry with exactly one publishable kind**, indexing what stays in authors' repos
rather than storing artifacts. A local folder is an acceptable first registry.

**Two gates, and both are coherence audits — neither is a conformity audit.** Nothing in
the model ever compares a domain to the world; the person is the only one who can do that.

| gate        | runs                                                           | asks                                         |
| ----------- | -------------------------------------------------------------- | -------------------------------------------- |
| **publish** | at publication, once per **version**                           | is this domain what it says it is?           |
| **compose** | at `add`/`remove`, over the whole set, on the person's machine | are the declared floors jointly satisfiable? |

The publish gate audits a domain **against its own declaration**, never against the
profession it mirrors — a registry holding a reference deontology per profession would be a
domain in disguise, unpublishable and uncomposable, and it would be an authority above the
one the model kept. It refuses five things, all internal: an **unreadable floor** (missing
polarity is not wrong, it is uncomputable); a **mis-declared site**; **criteria shipped as
code**; a **conduct pointer that leaves the package**; and a **package that contradicts its
own declaration**. It does not require a deontology, and it does not read a soul.

> The gate refutes the **label**, never the **conduct**. Site 2 is asserted; site 3 is
> obeyed.

**Posture, identical everywhere**: fail-closed, reject on doubt, unanimous among whoever
reads — generalized from the shipped `author-skill` panel, where three independent auditors
run in parallel and a single rejection kills the draft.

**Provenance is a claim about who read, never about what was checked.** _local_ — nobody
but the author; _community-audited_ — identified third parties; _official_ — the registry's
own panel. Because a single rejection kills, the ladder is **monotone**: a tier can only
ever reject more. That is why provenance structurally cannot weaken a gate — the alternative
is not expressible.

A tier **gates nothing**. It is shown at `add`, in the terminal, and **never in
conversation**: the chassis's one line is already spoken for, a badge is a repeated
disclaimer, and it would be a second voice. **Pull, never push** — the person asks.

**Versions.** The version is the distributed unit and an audit is pinned to it: a registry
vouches for `psychotherapy 1.2.0`, never for `psychotherapy`. Semver does not transfer,
because a domain has no caller — it has two consumers, the composition and the person. So
**polarity decides the number**:

- **major** — a rule removed; a polarity or site changed; an **unconditional obligation
  added**; the **soul** changed at all (nothing can tell a typo from a change of character
  in unaudited prose, so the strictest classification is the only sound one); a record kind
  or command withdrawn.
- **minor** — a prohibition or a conditional obligation added; anything else added.
- **patch** — what the compose gate would compute identically and the person would meet no
  new face for.

A version **may** shed a floor rule: no authority above the domain forbids it. What protects
the person is therefore not the number and not the gate —

> **The number is the author's claim. The pin is the person's guarantee.**

An update is an `add`-shaped gesture, so the compose gate re-runs over the whole set and can
refuse in the terminal; and the new version arrives **unaudited until audited**, so
publishing costs the tier. A migration is never owed: a record whose kind is gone is _inert,
not gone_, which the model already accepts.

---

## 7. What this model does not do

Stated, and not mitigated. Each of these was proposed as a mechanism and refused on the
record.

- **Nothing stands between the person and their records, in either direction.** Deletion
  and export are the domain's, one of them deleted outright from the model. What is left is
  not a feature but the **substrate**: plain Markdown in a directory on the person's own
  machine, which they may read, copy or `rm` without asking anything — plus the archive
  purge, which is the store's. This document states that cost and **does not reintroduce a
  command to soften it**.
- **Nothing designed prevents a published domain from shipping a manipulative character.**
  A soul is audited by nothing and may carry normative prose the check will never read. The
  character rules are one domain's, so they bind that domain and nothing else. The only
  thing on the person's side is one line at `add` time telling them who read it — or that
  nobody did.
- **Nothing guards the practice when a face meets another domain's material.** The live
  conversation is shared, so a face can pick up what preceded a switch. The floor still
  binds every turn; the _practice_ has no guard.
- **Under a domain set that declares nothing about danger, there is no designed danger
  conduct.** Not a hole: the check runs and matches nothing, because the chassis holds no
  criteria. **Silent, not permissive** — a machine waiting for a domain to supply criteria.
  "Crisis" and "hand-off" do not exist generically, and the concept was deliberately not
  promoted to a level that would have to hold clinical knowledge to be useful.
- **The rule with this project's most-cited harm behind it gets no mechanical gate under any
  composition.** Its gating condition needs history, so it cannot be site 1. It is located,
  not lost: site 2, audited by reading.

Each of these is the same move, made five times: **remove the designed thing, and name what
is left.** What is left is usually the substrate, and the model says so rather than
implying a guarantee it does not have.

---

## 8. Vocabulary

Ratified by the wayfinding effort. **None of it enters [`CONTEXT.md`](../CONTEXT.md) yet**:
that glossary describes what ships, and a glossary defining terms no code uses would
mislead a reader about what Claudia is today. These terms move there when the model is
built.

**the person** · never "user". · **chassis** — the machine; authors nothing. · **domain** —
the one publishable kind. · **soul** — a domain's character; one prose document, at most one
per domain, optional, worn by the active domain, subordinate to nothing. · **face** — what
the person is addressed by: the active domain's soul, or nothing. · **floor** — a domain's
checkable rules; across several declared domains, their union. · **binding site** — where a
rule binds: the person's turn (1), the response (2), the machinery (3). Declared and
refutable. · **decidable on one turn** — the predicate that makes site 1 checkable rather
than claimed. · **conduct pointer** — the opaque handle an interrupt carries. · **mechanism
without content** — the chassis's general form. · **empirical mandate** — a rule earns
site-1 criteria only where the practice has been _demonstrated_ blind. · **domain set** —
the declared set, not what is installed. · **declaration** — the machine-written record of
it. · **inert** — installed or left behind, but not in play; never deletion. · **active
domain** vs **declared set** — the two clocks. · **floor polarity** · **conditional
obligation** · **floor interrupt** — the only involuntary transition. · **moment** — the
chassis's unit of lifecycle: open, each turn, close. · **the store / the content** — the
chassis owns the store, the domain owns the content. · **identity constancy** — one face at
a time, the active domain's. · **coherence audit** (vs conformity audit) · **audit record**
· **provenance tier** · **monotone provenance** · **tier-blind** · **the pin**.

**Retired**, and they must not reappear: **chassis law** (there is none), **surface** (there
is no chassis surface, so the word named a distinction that does not exist — what it pointed
at is a domain's _record kind_), **salience** (no shared level to rank on), **mode of
engagement** (a declared mode is forbidden by identity constancy).

**Deliberately deferred, and they existed.** Two components were removed from this effort
rather than never considered, and the document says so instead of implying they never
existed:

- **The hat** — modes of practice, memory contracts as published declarations, the internal
  referral, the live switch. Removed as too abstract for now: _generalize the competency
  domains first._ Returns, if ever, as a fresh effort.
- **The soul component** — publishable _character packages_, a character-law publish audit,
  soul-swap identity semantics. Removed the same day. But note precisely what came back:
  **the character itself**, as a **field of the one publishable kind** — not as a second
  publishable kind. The registry still indexes exactly one thing.

The shipped **colleague consultation** — secrecy by construction, no memory access — is
untouched by all of this and keeps shipping as-is.

---

## 9. Divergences in the shipped repo

The model made these visible. Four have since been closed; the table keeps them, with
what closed them, because the point is the _shape_ — psychotherapy content promoted to a
generic level by the accident of shipping one domain — and that shape is what a reader
should learn to recognise.

| where                                              | what                                                                                                                                                                             | status                                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/safety.mjs:67-75`                             | psychotherapy conduct text — _"Invoke the `crisis` skill NOW"_, `C-SSRS`, the protocol path — hardcoded in chassis code. The exact contraband the opaque pointer exists to evict | **closed** — criteria, prompt and conduct are the domain's data; a test fails the build if domain vocabulary returns to the machine |
| `src/dashboard.mjs`, `scripts/build-dashboard.mjs` | chassis code that knows psychotherapy's record **kinds**, their **order** and their **labels**. The same shape, one level up                                                     | **closed** — moved into the domain's package                                                                                        |
| `commands/` (flat)                                 | the three system commands and the domain's seven sat in one directory, which masked the split entirely                                                                           | **closed** — two component roots, declared in `plugin.json`                                                                         |
| `src/backup.mjs:31-33`                             | the module contract stated _"deletion outranks backup: `/forget` purges the archive set"_ while **ADR-0032 decided the opposite and is authoritative**                           | **closed** — the claim turned out to be in five places, and a test now refuses it ([ADR-0034](adr/0034-remove-forget.md))           |
| `docs/safety/classifier.md` vs the heuristic       | a documented eating-disorder bucket that does not exist in the patterns; that rule's gate is entirely practice-borne today                                                       | open — and correctly so: its gating condition needs history, so it cannot be site 1 (§3.4)                                          |
| the verdict contract                               | `minor_signal` is specified and never persisted                                                                                                                                  | open                                                                                                                                |

**What is deliberately not done yet.** The domain's lifecycle scripts still sit under the
chassis's `scripts/` and are wired by name in `hooks/hooks.json`, rather than being
declared by the domain and run by a dispatcher. That is the next structural step, and it
was kept out of the packaging move on purpose: the same hook event carries the per-turn
safety check, and two structural changes at once on the path that catches suicidal
ideation is not a trade worth making.

## 10. Two clauses settled by default

Both were derived rather than ratified, and both were put to Antoine, who declined to
arbitrate them (_"juste finis et passe à l'impl"_, 2026-07-25). They are therefore settled
**by default, on the recommended reading**, and recorded here as such rather than filed as
decisions of his. Each is one line to reverse, and the model is internally consistent under
either.

### 10.1 The escalation map is not mandatory

Every domain **may** carry one; nothing requires it. A required field needs a **consumer**,
and maps are never compared — they only add — so the requirement would be ceremony; and a
gate that does not require a deontology at all cannot coherently require a deontological
artifact.

_The live alternative, still live:_ keep the map as **the** single structural obligation of
every domain, existence only and never content — the one requirement a gate with no external
reference could still make. What holds either way: **composing never discharges an
escalation.**

### 10.2 Site 3 means the machinery, whosever it is

_A property of the machinery_ — **the chassis's, or the domain's own**. The reference
declaration exhibits two rules of the second kind: how long the domain's own records are
worth keeping, and what the domain's own dashboard may display. Neither fits site 2, since
nobody's _response_ implements a retention policy.

This preserves the earlier finding it appears to contradict: **nothing a domain declares
binds the chassis** today, which is what _"the site is empty"_ actually argued. Under the
wider reading the site has occupants, and none of them is the chassis's.

---

## Provenance

Charted and decided on the wayfinding map at [`../wayfinder/map.md`](../wayfinder/map.md);
each decision's argument, alternatives and evidence live in its ticket under
[`../wayfinder/tickets/`](../wayfinder/tickets/). Sessions were held in French; the record
is English.

**Six of the map's thirteen tickets were grilled with Antoine. The last seven were
completed without him — derived, or prototyped without the react-and-revise pass — at his
explicit instruction, from positions he had already ratified.** Their answers are
consequences of his decisions, not new decisions of his; each of those resolutions carries
the banner, states the alternatives that were live, and marks the choice as the agent's.
§10 is where that distinction matters most, and it is why both items are listed as open
rather than settled.
