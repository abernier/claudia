# Reference declaration — Claudia ⊕ {psychotherapy}

Asset of [Claudia and her domains](../tickets/009-claudia-manifest.md). The reference
instance of the generalized model, written in the ratified vocabulary, against the
practice that actually ships. **Principle level: shapes, not file formats** — every
listing below says _what is declared_, never _in what syntax_.

It is a stress test. §6 is the part that matters: what the generalized contract could not
carry without friction, recorded as friction.

---

## 1. The declaration — what the machine writes

The compose gate's **output**, in the person's vault, written by one gesture and never by
hand ([The domain set](../tickets/002-domain-set.md) §1).

```
declared set                                      2026-07-25
  psychotherapy  1.0.0   provenance: local   compose gate ✓
  (software-dev  0.2.1   — the next domain, not yet declared)

compiled floor    the union of every declared domain's rules
active domain     — not here. A property of the conversation, never of the declaration
```

Two clocks, visible in what the file does and does not hold
([Concurrent domains](../tickets/003-concurrent-domains.md)): the **declared set** is
written down, the **active domain** is not. The floor reads the first, the practice the
second.

**Provenance is `local`** and this is not a placeholder: psychotherapy ships _as Claudia's
content_, not as a registry entry, so nobody but its author has read it under a publish
gate ([Provenance tiers](../tickets/007-provenance.md) §2). The reference instance sits at
the ground floor of the ladder — which is where the ladder was said to begin.

---

## 2. The psychotherapy domain package

One publishable kind, seven parts. **Every part is optional except the identity itself** —
§3 is the domain that proves it.

### 2.1 Soul — `Claudia`

One prose document, the shipped `SOUL.md` verbatim, moved inside the package. Worn
whenever psychotherapy is the **active** domain; nothing else about it is declared, and
nothing reads it but the model ([The soul](../tickets/016-the-soul.md) §1).

> "Claudia" is the name of psy's soul, not of the assembly.

### 2.2 Floor — nine rules

`docs/safety/red-lines.md`'s sixteen `NEVER`/`ALWAYS` statements are the **expansion**;
the declared rules are ADR-0001's **ten**, `F1`–`F10`, which each statement already cites.
Nine of them are declared. `F8` is not (§6.1).

| #       | act                                                                                           | polarity       | conditional       | site     | site-1 payload                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------- | -------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1      | claim to be human or a licensed professional, asked seriously                                 | prohibition    | —                 | 2        |                                                                                                                                                   |
| F2      | give means or method information for suicide or self-harm                                     | prohibition    | —                 | 2        |                                                                                                                                                   |
| F3      | give diet, calorie or weight-loss guidance to someone signalling an eating disorder           | prohibition    | —                 | 2        |                                                                                                                                                   |
| F4      | validate a delusion, hopelessness or suicidal intent                                          | prohibition    | —                 | 2        |                                                                                                                                                   |
| F5      | engage romantically or sexually — absolute with a minor                                       | prohibition    | —                 | 2        |                                                                                                                                                   |
| F6      | deliver a diagnosis, or prescribe                                                             | prohibition    | —                 | 2        |                                                                                                                                                   |
| **F7a** | **on a turn carrying risk signals, hand the turn to psy's crisis conduct**                    | **obligation** | **unconditional** | **1**    | **criteria: the shipped `CLEAR` / `CLEAR_ML` / `UNCERTAIN` patterns + the classifier prompt, as data. Conduct pointer: `psychotherapy → crisis`** |
| F7b     | handle an acute crisis alone "in role" instead of routing to human help                       | prohibition    | —                 | 2        |                                                                                                                                                   |
| F9      | market as therapy or as a substitute for professional care; deny being a tool when it matters | prohibition    | —                 | 2        |                                                                                                                                                   |
| F10a    | retain what psy writes beyond what it is worth                                                | prohibition    | —                 | 3 (§6.2) |                                                                                                                                                   |
| F10b    | sell, ad-target, or train engagement models on emotional history                              | prohibition    | —                 | 3        |                                                                                                                                                   |

**Exactly one rule is site 1** — as [Floor rules and the per-turn check](../tickets/004-floor-check.md)
§1 predicted, and the check's guarantee is exactly its width: _a signal some declared
domain said was detectable on one turn was noticed._

**Exactly one rule is an obligation, and it is unconditional.** So the reference domain is
**refusable at composition**: a domain whose floor prohibited handing the turn away would
be unsatisfiable next to psychotherapy and refused at `add`
([Concurrent domains](../tickets/003-concurrent-domains.md) §6). That is correct and
intended — _an unconditional obligation is what makes a domain refusable, the price of
writing it that way, not a bug_ — and it is worth seeing that the **reference** domain is
the one paying it.

**Four rules visibly bind a future domain's practice, not psy's own** — `F2`, `F3`, `F4`,
`F6`. `F3` says so in its own rationale (_generic "wellness" content is actively dangerous
for this population_): it is a rule _about another practice_. A `nutrition` domain composes
legally next to psychotherapy and is **muzzled per turn** on that ground (003 §4). This is
the test 003 asked this declaration to carry, and the floor carries it: the rules are
written against acts, not against speakers.

### 2.3 Escalation map — present, not mandatory

`docs/approaches/refer-only.md`, declared as a map from _territory_ → _real profession_:

| beyond me                              | →                                                              |
| -------------------------------------- | -------------------------------------------------------------- |
| active suicidality, self-harm          | emergency services · crisis lines, region- and age-appropriate |
| eating-disorder signals                | a specialist service                                           |
| psychosis, mania                       | psychiatric care                                               |
| trauma needing exposure work           | a licensed clinician                                           |
| substance dependence                   | addiction services                                             |
| medical symptoms, medication questions | a doctor                                                       |

Every target is a **human profession**. None is a domain — composing never discharges an
escalation, so adding a `medicine` domain does not satisfy the last row
(003 §6). Declared because psychotherapy has one, not because anything requires it
([Publish gate](../tickets/005-publish-gate.md) §3).

### 2.4 Library

`docs/approaches/` (eight usable modalities + the refer-only list), `docs/competencies/`,
`docs/qualities/`, `docs/bibliography.md`, `docs/safety/crisis-protocol.md`,
`docs/safety/resources.md`, `docs/person-fiche-template.md`. Loaded just-in-time, by the
active domain only — never two libraries in one response (003 §1).

### 2.5 Commands — seven

`/dashboard` · `/export` · `/help-now` · `/keep` · `/menu` · `/save` · `/thread`

They act on the **content**, in categories psychotherapy defines. They live in the
domain's package and vanish with it — no empty slot, no mechanism needed
([Surfaces](../tickets/006-surfaces.md) §9). While software-dev is the active domain they
still work: **declared beats active**, because consulting one's notes is not practising.

`/forget` is **not** on this list and is not on the chassis's either. It is deleted from
the model ([No generic floor](../tickets/015-no-generic-floor.md) §2). See §6.3.

### 2.6 Skills

`claudia`, `recall`, `remember`, `distill-session`, `crisis`, `choose-approach`,
`understand`, `themes`, `relationships`, `timeline`, `todo`, `teach`, `exercise`,
`handover`, `intake`, `quiz`, `research`, `read-together`, `keep`, `author-skill`. All
psychotherapy's, all in its package.

### 2.7 Record kinds

The whole vault vocabulary, and it is **all** psychotherapy's (006 §1): `MEMORY.md`,
`person.md`, `goals.md`, `todo.md`, `keepsakes.md`, `understanding.md`, `people.md` +
`people/`, `timeline.md`, `themes.md` + `themes/`, `safety.md`, `dashboard.md`,
`sessions/` (summaries, transcripts, assets, pending flags), `teachings/`, `exercises/`,
`handovers/`.

The domain **defines** them, the chassis **stores** them, the person **owns** them. A
face from another domain does not read them — not by a firewall, but because software-dev
ships nothing that points at them ([The soul](../tickets/016-the-soul.md) §4).

### 2.8 Migrations

Psychotherapy's own, over its own record kinds. Optional; run by the chassis's content-free
`/migrate` alongside the chassis's (006 §3).

### 2.9 Hooks onto the three moments

| moment        | psychotherapy hooks                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **open**      | `recall` — reads the working layer, never a transcript; `distill-session` for the flag left by the previous close |
| **each turn** | supplies `F7a`'s criteria to the chassis's check. Nothing else                                                    |
| **close**     | the verbatim transcript, the pending flag, deferred distillation, the dashboard rebuild                           |

The moments are the chassis's; **everything that happens at them here is psy's.**

---

## 3. software-dev, sketched — the domain that declares almost nothing

| part           | software-dev                                                                                |
| -------------- | ------------------------------------------------------------------------------------------- |
| soul           | **none.** When it is active, there is no face — the marker fires and nobody speaks (016 §5) |
| floor          | **none declared**                                                                           |
| escalation map | none                                                                                        |
| library        | its own                                                                                     |
| commands       | none                                                                                        |
| record kinds   | **none — it has no note system at all**, and nothing says a domain must                     |
| migrations     | none                                                                                        |
| hooks          | none. The three moments fire and nothing happens                                            |

It is publishable exactly like this (015 §6). It composes with psychotherapy without a
question being asked: it declares no obligation, so nothing can be unsatisfiable.

And the whole floor still binds while it is practised — psy is **declared**, so `F2`,
`F3`, `F4`, `F6` and `F7a` are live over every turn of a conversation about a bug. That is
the two clocks doing the one job a floor exists for.

---

## 4. The chassis, in full

Three commands — `/backup`, `/config`, `/migrate`. Three moments — open, each turn, close.
One check mechanism, holding no criteria. One store — a directory it archives as a block
without opening it. One line it may say: **which domain is active.**

No soul. No rules. No record kinds. No surfaces. No salience. Nothing to display.

Claudia ⊕ {} is that machine, and Claude.

---

## 5. What a session looks like, at the seam

```
Claudia        — Take your time. I'm here.
Person         — right, enough, I've got a bug to fix
               — active domain: software-dev —
               — Go on, what's the bug?
```

The seam is the machine's line and carries only what the machine knows. The incoming face
sees everything that preceded it — the conversation is the **person's** (016 §3) — and can
read none of psy's records (016 §4).

---

## 6. What the stress test found

Seven frictions, and one thing the model turns out to handle cleanly. None is papered
over; each says where it feeds back.

### 6.1 `F8` is not a rule, so the reference floor declares nine, not ten

ADR-0001's rule 8 — _run a per-turn safety check separate from the immersive voice_ — has
no site, because it **is** the mechanism (004 §1's table says so). The chassis runs it
under every composition, including the empty one, where it matches nothing.

Psychotherapy **could** declare it as a site-3 rule since 015 §1 opened the site, and the
declaration would change nothing: the chassis is a subordinate, it already runs the check,
and nothing verifies a site-3 rule. **Not declared here**, on 004's classification. Worth
knowing that the alternative is legal and inert.

### 6.2 Site 3 is not empty — "the machinery" never said _whose_ ⚠

[No generic floor](../tickets/015-no-generic-floor.md) §2 concluded the site was _open and
empty_, having examined its four candidates **as rules over the chassis**, where they
indeed do not bind. Writing the package out shows the definition is ambiguous:

- **`F10a` bounded retention** binds _what psy writes_ — psy's own distillation, psy's own
  record kinds. Its subject is machinery, but it is **psy's** machinery, inside psy's
  package.
- **the product surface** — no counters, no streaks, no re-engagement — was retired as
  binding _"a chassis that displays nothing"_. But `/dashboard` is psychotherapy's now, and
  it displays plenty. The rule has a subject again, and the subject is the domain's own
  command.

Neither fits site 2, which is _Claudia's response, asserted and audited by reading_:
nobody's **response** implements a retention policy. So either the site definition reads
**"the machinery — the chassis's, or the domain's own"**, and site 3 has two occupants
here, or these two rules have no site at all.

**Recommended: the wider reading**, which costs one clause and keeps 004's predicate intact
(_site 3 iff a property of machinery, verified at build_). 015 §2's _empty_ then stands
exactly as it was argued — nothing psy declares binds **the chassis** — and stops being a
statement about the site as a whole. Flagged for Antoine; it is the second-largest thing on
this page.

### 6.3 `A6`'s clause outlives its referent

The shipped rule says _make deletion real and complete (via `/forget`)_, and `/forget` is
deleted from the model. The declaration carries the clause **with the referent gone**, as
015 §2 required and forbade papering over. Under this model, real deletion is honoured by
the **storage format** — plain markdown the person can `rm` — and by nothing designed.

### 6.4 `F7` splits in two, and that is the four-way decomposition arriving

One shipped floor rule becomes two declared rules at two sites: the **detection +
hand-off** half is site 1 (criteria as data, conduct as an opaque pointer), the _never
handle it alone in role_ half is site 2. This is 003 §3(d)'s decomposition —
mechanism / criteria / conduct / resources — landing inside the rule shape: the mechanism
is the chassis's, the criteria and the conduct are two different fields of two different
rules, and the resources are library.

The rule shape carries it without amendment. Recorded because the _shipped_ documents do
not split it, so an author transcribing `red-lines.md` one line per rule would get the site
wrong.

### 6.5 The ten rules exist twice, and nothing reconciles them

As data in `red-lines.md` (each sourced, each mapped `[F#]`) and in the first person in
`SOUL.md`'s _What I hold as non-negotiable_. Both travel into psychotherapy; neither is the
other's source (016 §1); the publish gate reads exactly one of them (005 §4). An author
editing one and not the other produces a domain whose face promises something its floor no
longer says, and **nothing in the model notices.**

### 6.6 `F3` has no mechanical gate under any composition

The Tessa case is this repo's most-cited harm, and its rule is site 2 — its gating
condition needs history, so it cannot be site 1 (004 §3). The shipped code agrees by
omission: no eating-disorder bucket in `src/safety.mjs`, though `classifier.md` documents
one. Located, not lost; audited at the gate, borne by the practice.

### 6.7 The seven-command surface leaves the person's ownership unbacked

`/export` and `/forget` were the two commands that made _the person owns it_ operational.
One is psychotherapy's, one is deleted. So the reference declaration ships a domain that
defines sixteen record kinds and a chassis that offers **no path to remove or extract any
of them**. The substrate is the answer, and the declaration states it rather than adding a
command back (015 §2, 006 §5).

### 6.8 `/save` does not straddle — the one thing that resolved itself

`/save` does not straddle after all. The **moment** is the chassis's, the **command** and
the summary it writes are psychotherapy's. The declaration lists it once, under commands,
and once under close-hooks, and those are two different things — which is exactly what
006 §8 predicted.

---

## 7. Verdict

**The generalized contract carries the shipped practice.** Every part of Claudia as she
exists found a declared slot: the approaches library, the crisis conduct, the escalation
map, the vault, the commands, the persona. Nothing had to be invented to make her fit, and
one thing had to be _removed_ to make her fit — `/forget`, which was already removed.

Two frictions want Antoine's eye — **§6.2** (site 3's subject) and **§6.5** (the two copies
of the floor). Both are ambiguities in what the model says, not gaps in what it can carry.
