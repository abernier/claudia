---
id: 16
title: "The soul: what a domain's character declares, and what the face-change does"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

[No generic floor](015-no-generic-floor.md) §5 moved the character out of the chassis and
into the domain: **no soul in the chassis at all, at most one per domain, optional, worn
by the domain that is active.** That fixes where a soul lives and leaves what it _is_
wide open — and it is now on the critical path, because the reference declaration and
both diagrams have to show it.

- **What a soul declares.** Name, voice, register, what it will and will not say about
  itself? `SOUL.md` ships today as prose, not as fields — is a soul a **document** the
  domain carries (the shipped shape, unchanged except for where it lives), or a
  **declaration** with slots the way the floor is? 004 fixed _criteria are data, never
  code_ for the floor; the soul has no equivalent ruling. Note the asymmetry to justify
  or remove: a floor rule is structured so an adversarial reader can judge it, and a
  soul — which 015 §6 says **nothing audits** — would be the one part of a domain's
  package with no declared shape at all.
- **What the person sees when the face changes.** 003 made switching the **person's**
  act and the floor interrupt the **only** involuntary transition; now the switch also
  changes _who is speaking_. Is there a handover, a visible seam, nothing? Does the
  incoming soul see the conversation so far, or start clean? The shipped repo has a
  neighbouring answer worth reading before deciding — ADR-0033's handover note and
  ADR-0013 on persona continuity.
- **The soul and the notes.** 006 §6 fixed _declared beats active_ for records: psy's
  notes stay reachable while software-dev is practised. With a face-change on top, that
  now means **software-dev's soul can read psy's notes about the person's grief.** Is
  the record boundary the same as the practice boundary, or does the face bound what it
  may read? This is the nearest thing to the retired _memory contract_, arriving from a
  direction that has nothing to do with the hat — so it is in scope here whether or not
  the hat ever returns.
- **What "no face" means operationally.** A domain declaring no soul is active: 015 says
  no face at all, _present and idle_, the base model. Does anything mark the difference
  for the person between talking to a declared character and talking to nothing in
  particular — or is silence the whole answer, as it is everywhere else on this map?
- **What identity constancy still protects.** The charter's _(hard)_ rule is restated by
  015 as _one face at a time, the active domain's_. What survives of it — the person's
  memory staying put, one face per moment, something else? It is still marked hard, so
  it needs a form it can actually hold.

Context, not a question: 015 §6 settled that **nothing audits a soul** — a domain may be
published with no floor and no character, and the publish gate does not police emptiness
(_"un domain sans rien à l'intérieur, c'est juste Claude"_). The stated cost is that
nothing designed prevents a published domain from shipping a manipulative character. This
ticket may not reopen that; it decides what a soul _is_, given it.

Principle level only. `SOUL.md` as shipped is not rewritten here — this effort does not
author Claudia's character, it decides what kind of thing carries it.

## Resolution

The ticket asked what a soul _is_, given that nothing audits it. The answer is that it is
the one part of a domain with **no declared shape and no subordination** — Antoine:
_"soul fait ce qu'elle veut"_. Everything else here follows from a single line the chassis
is allowed to say: **which domain is active**. It says that, and nothing else — not who is
speaking, not that no one is.

### 1. A soul is prose, and it is subordinate to nothing

The proposal put to Antoine was a hierarchy — _the soul may echo the floor, never author a
rule_ — modelled on the relation `docs/safety/red-lines.md` already declares to ADR-0001
(_"where this file and ADR-0001 ever disagree, ADR-0001 wins — fix this file"_). It was
**refused**: a soul may say whatever it wants, normative content included.

So the asymmetry the ticket asked to justify or remove **stands, justified**. 004 fixed
_criteria are data, never code_ for the floor because two consumers read a floor rule
mechanically: the per-turn check evaluates it, and the publish gate judges it
adversarially. Neither exists for a soul (015 §6). A slot structure with no consumer is
ceremony, so the soul keeps the shipped shape — **one prose document the domain carries**,
`cat` into the context window the way `skills/claudia/SKILL.md:14` already does it. What
moved in 015 §5 is where the file lives, and nothing else about it.

The one mechanical consequence, recorded rather than mitigated: a rule written in a soul is
read by the **model** only, never by the check, which reads data. It is a promise in the
voice that nothing verifies. This is not a new cost — it is 015 §6's accepted cost
(_nothing designed prevents a published domain from shipping a manipulative character_)
arriving from the inside of the package instead of the gate. The ticket was barred from
reopening it and does not.

Consequence for the shipped repo, stated as a finding, not a change: the ten rules exist
**twice** — as data in `red-lines.md` (N1–N9 / A1–A7, each mapped `[F#]` and sourced) and
in the first person in `SOUL.md`'s _What I hold as non-negotiable (my floor)_. Both travel
into psy. Neither is now the other's source.

### 2. The face-change is marked by the machine, and by no one else

Three shapes were put up as transcripts: nothing at all, the outgoing face closing in its
own words, or a machine marker. Antoine took the marker.

```
Person        — that's enough for now, I've got a bug to fix
              — active domain: software-dev —
sw-dev's face — Go on, what's the bug?
```

The seam is a line of the **chassis's**, and it carries exactly what the chassis knows:
which domain is active. This is _mechanism without content_ (004 §5, generalized by 006)
holding at one more station — the machine marks the moment, and puts no word in any face's
mouth.

What this refuses: the outgoing face commenting on its own departure (_"Ok. I'll leave you
to it."_). A soul narrating its own exit is the shape ADR-0033 already refused for a
different reason — Claudia speaking about her own usefulness puts the person in the
position of answering for it.

### 3. The live conversation belongs to the person, not to a domain

Does the incoming face see what preceded the switch? **Yes, all of it.**

The scenario that decided it: forty minutes on the death of the person's father, then a
switch to software-dev. The incoming face sees the forty minutes.

Two reasons, one positive and one structural. The conversation is **one conversation, the
person's** — they switched inside it, and nothing in the model makes a turn the property of
the domain that happened to be active when it was spoken. And for a face _not_ to see it,
the chassis would have to **hide** — a mechanism, owned by the shell that is meant to have
none.

Accepted cost, stated: nothing prevents software-dev's face from picking up psy's material,
which is software-dev **practising psy** while psy is not the active domain — the exact
thing 003 made impossible between two _libraries_ and did not make impossible between a
face and the conversation in front of it. The floor still binds (003: the union of every
declared domain's, whichever is active), so psy's ten rules hold over that turn. What has no
guard is the _practice_.

### 4. A face reads what its own domain defined

The disk is **not** the live conversation, and the answer flips. A face reads the record
kinds its own domain defined; psy's `sessions/`, `person.md`, `safety.md` are invisible to
software-dev's face.

This costs **no mechanism**, and that is the whole argument. 002 already fixed _the domain
defines the record, the chassis stores it, the person owns it_, and 006 established that a
domain carries its own commands, skills, scripts, record kinds and migrations — **packaging,
not a mechanism**. A domain that never defined `sessions/` ships nothing that reads it.
There is no firewall here and no memory contract: simply nothing pointing software-dev at
psy's files.

It does not contradict 006 §6. **Declared beats active** was about _the person's_ reach —
psy's commands keep working while software-dev is practised, because consulting one's notes
is not practising. It never said a face may read another domain's records.

The boundary that results is therefore **not** the practice boundary and **not** the
declaration boundary: it is the **authorship** boundary. Live context is shared because no
one authored it; records are partitioned because someone did.

### 5. No face is marked by nothing

A domain declaring no soul, when active, leaves no face at all (015 §5) — and the chassis
adds nothing to its one line. The marker reads the same whether a face follows or not.

```
Claudia       — Take your time. I'm here.
Person        — right, I've got a bug to fix
              — active domain: software-dev —
              — Go on, what's the bug?
```

The chassis does not annotate what is inside a package. And silence here is the same
silence the map chose everywhere else: 015 §7's last row — _a machine with three commands,
and Claude_ — announces itself no more than this does.

Cost, stated: the voice goes from warm and named to nothing in particular, and the only
thing that tells the person is the first reply itself.

### 6. What identity constancy still protects (derived, not decided)

The charter marks it _(hard)_, 015 §5 restated it as _one face at a time, the active
domain's_, and this ticket leaves it with a form it can hold. It is no longer a claim about
sameness — it is two guarantees:

- **The face never changes without the person's act, and never without a mark.** 003 made
  switching the person's gesture (Claudia detects and proposes at most); §2 puts a chassis
  line on every transition. So the person is never _surprised_ by who is answering. The one
  involuntary transition in the model remains the floor interrupt (003), which changes no
  face.
- **The person's records stay put and stay theirs.** 002 (a domain that leaves takes
  nothing — _inert, not gone_) and §4 above: a face-change moves nothing on disk and opens
  nothing that was not already the active domain's.

What it no longer protects, and must stop being read as: a constant person, a constant
voice, or continuity of address across a switch. The Destination was already amended for
this (map banner); the charter's _Claudia never changes face_ is spent.

### Vocabulary settled here

- **soul** — a domain's character. **One prose document, at most one per domain, optional**,
  worn by the active domain, subordinate to nothing and audited by nothing. Its only
  structured fact is whether it exists.
- **floor** — narrowed by §1's refusal: a domain's **checkable** rules, the ones carried as
  data and read by the check and the gate. A soul may carry normative prose; that prose is
  not floor, and nothing reads it but the model.
- **face** — what the person is addressed by: the active domain's soul, or nothing. The
  marker names the **domain**, never the face.
- Not introduced, deliberately: any term for §4's partition. It is authorship, not a
  contract, not a firewall — the retired **memory contract** does not return under a new
  name.
