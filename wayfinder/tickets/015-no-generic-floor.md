---
id: 15
title: "No generic floor: SOUL.md, then the domain"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

The charter banner of 2026-07-25 dissolved the chassis law: there is no generic
level with rules of its own, and the ten shipped rules (`docs/safety/red-lines.md`,
N1–N9 / A1–A7) are the **psy domain's**. Two authorities remain — `SOUL.md`, Claudia's
character, and the domain, which owns all the rules. The chassis is machine.

Most of [Floor rules and the per-turn check](004-floor-check.md) survives untouched:
it had already derived that the check is a **mechanism without content**, that the
chassis holds no criteria, and that the chassis law had **no site-1 rules** — a level
of law whose rules the check could never evaluate. Removing it costs that resolution
nothing. What it _assumed_ is what needs an answer:

- **Site 3 has no owner.** 004 §6 reserved site 3 — rules that bind the machinery —
  to the chassis law, and forbade a domain from declaring one: _"a domain cannot bind
  the machinery, because it does not own it, and the compose gate cannot verify a
  claim about the chassis."_ N8 (no sale), A6 (bounded retention, real deletion) and
  the character law's product surface (no counters, no streaks, no re-engagement) are
  all site 3 — and all psy's now. Either the site **opens to domains**, and something
  must verify a claim about a machine the domain does not own, or these **stop being
  rules** and become properties of how the chassis is built — which is already the
  repo's own answer to cumulative harm (ADR-0012: a feature that does not exist cannot
  drift; ADR-0008 designed against dependency). If the site opens: what does the
  chassis **publish about itself** so a domain can require against it, rather than
  assert into the void? The command split of the same day sharpens this from the
  other end: psy declares _real deletion_, `/forget` leaves with psy, and the machine
  that actually deletes does not — so the person can end up owning records with no
  path to remove them. **[Surfaces](006-surfaces.md) §5 has now answered its end**, and
  in the harder direction: `/forget` and `/export` were recommended back to the chassis
  and **refused** by Antoine (_"elles restent pour l'instant dans psy"_), so the rule and
  the command are **both** psy's, and only the disk underneath is the chassis's. Nothing
  designed remains between the person and their records under Claudia ⊕ {} — only the
  fact that they are plain markdown on their own machine. That is the sharpest instance
  of this ticket's third bullet, so it is this ticket that decides whether it is stated
  as an honest cost or owed something. The same resolution also empties the site-3
  examples of their chassis-side counterpart: with no chassis surface at all, _"no
  counters, no streaks, no re-engagement"_ binds a machine that now displays nothing.
- **Does the word _floor_ survive?** [Concurrent domains](003-concurrent-domains.md)
  made the floor the union of every _declared_ domain's, whichever is practised —
  a decision about domain rules binding across domains, which stands on its own and is
  not reopened. But _floor_ as a **name** now denotes only "the declared domains'
  rules": no conjunction, no chassis term, and nothing beneath. Is it still the right
  word, or does the vocabulary go domain-local (_the domain's rules_, _its
  deontology_)? [Assemble the principles document](012-assemble-doc.md) needs one
  answer, and the two diagrams draw whatever this settles.
- **What binds under Claudia ⊕ {} and Claudia ⊕ {software-dev}.** `SOUL.md` is
  irremovable ([The domain set](002-domain-set.md) §4) and already says, in its own
  words, that she is an AI and does not perform feelings she does not have. Under a
  psy-less set the **behaviour** survives in the persona and the **rule** does not —
  nothing declares it, and undeclared is inert. Is that the accepted honest cost,
  stated plainly in the document, or is something owed to the person there?
- **The rule shape.** 004 §6's `owner` field reads _"the domain, or the chassis law"_;
  the second half is void. Anything else in the three-form skeleton that referenced
  the generic level goes with it.
- **The publish gate's leverage.** With no generic level, the gate is the only thing
  between a published domain and a practice with no deontology at all. Does it check
  that a domain **declares** one — existence only, never content, the pattern 003
  already fixed for the escalation map — or does it say nothing? Antoine was offered
  this at the reopening and did not take it, so it is open, not settled. Passed to
  [Publish gate](005-publish-gate.md) as well.
- **Vocabulary sweep.** _chassis law_ must disappear as a term of the model. It
  survives only inside closed tickets, as their record, governed by the map's banner.

Principle level only. This ticket does not re-litigate what the chassis owes the
person: the answer is _nothing, it is a machine_ — it asks what that costs and what
the words become.

## Resolution

The ticket asked what the dissolution **costs** and what the **words** become. Antoine
answered by removing more, not by patching. The chassis obeys and holds no rules; the
store is nonetheless its own; and `SOUL.md` leaves it entirely. What comes out has
**one authority — the domain** — and a machine with nothing in it.

### 1. A domain binds the machine: the chassis is a subordinate, not a party

004 §6's _"a domain cannot bind the machinery, because it does not own it, and the
compose gate cannot verify a claim about the chassis"_ is **overturned**. Antoine:
_"si psy demande ça alors il faut le faire"_ — then, offered a verification story:
_"mais personne bordel, si c'est psy le domaine actif, le chassis obéit !"_

The reason is not verification, it is **rank**. A rule is a contract between
**separable** parties; the chassis is not a party at all, it is a subordinate. So
nothing checks a site-3 rule, and nothing needs to.

- **Rejected — a chassis manifest**: the chassis publishing what it guarantees, a
  domain requiring against it, the compose gate comparing, `add` failing on a gap. It
  invents a whole declaration surface immediately after [Surfaces](006-surfaces.md)
  spent itself emptying the chassis of content, and it models the chassis as a peer
  that could _fail_ a requirement. A subordinate does not fail a requirement; it is
  built to it.
- The `owner` field's second half (004 §6: _"the domain, or the chassis law"_) is not
  replaced but **deleted**: owner is **the domain**, always, at every site.
- **Site 3 stops being reserved.** A domain declares all three sites.

### 2. The store is the chassis's — and `/forget` is deleted outright

Obedience is not ownership. Antoine: _"forget doit pas être relié aux archives qui elles
seront system !"_ The line is the map's own already-ratified criterion, from the
command-split banner: **the domain owns the content, the chassis owns the store.** The
archive is store.

- **The retention ladder's numbers are the chassis's** — 48 h / 14 days / 8 weeks /
  12 months / one a year kept forever (`src/backup.mjs:291`). **Rejected**: the domain
  setting them, on the argument that _mechanism without content_ extends to constants.
  It does not. 006's principle empties the chassis of the **domain's** content; it does
  not empty the store of its **own** mechanics. A ladder is how an archive works, not a
  deontological position.
- **Psy's A6 "bounded retention" therefore binds only what psy writes** — how long a
  session summary is worth keeping in the vault. It says nothing about the archives,
  and `yearly: Infinity` does not violate it.
- **`/forget` is deleted.** Not moved to the chassis — removed from the model
  altogether: _"non forget juste dégage ! on le supprime complètement !"_ (offered as a
  migration to the system side, and refused). Ten shipped commands remain: three system
  (`/backup`, `/config`, `/migrate`) and seven psy.

**So the site-3 story ends where §1 opened it: the site is open, and it is empty.** A
domain _may_ bind the machine — nothing forbids it — and not one of the four candidate
rules occupies it. _Bounded retention_ binds what psy writes. _Real deletion_ has no
command left to bind. _Never sell_ has nothing to sell on a local-only machine
(ADR-0007). _No counters, no streaks, no re-engagement_ binds a chassis that, since 006,
displays nothing at all. **Present and idle**, exactly like the per-turn check (004 §5)
and the three moments (006 §8): the right exists, no one exercises it.

**The cost, whole, and this ticket states it rather than mitigating it.** 006 §5 left the
person owning records with no command to delete or export them, and marked it _pour
l'instant_. Deleting `/forget` makes it permanent and doubles it: **nothing designed
stands between the person and their records, in either direction.** What remains is not a
feature but the **substrate** — plain markdown in a directory on their own machine
(ADR-0004, ADR-0007), which they may read, copy or `rm` without asking anything — plus
`/backup --purge`, which still clears the archive set, since `/backup` is system.

Read against the map's own pattern this is the same move as _"un domain sans rien à
l'intérieur, c'est juste Claude"_: remove the designed thing and what is left is the
substrate. Psy's A6 is then honoured not by a mechanism but by the storage format. Worth
naming plainly because the psy rule as shipped says _"make deletion real and complete (via
`/forget`)"_ — the rule keeps its clause and loses its referent, and
[Assemble the principles document](012-assemble-doc.md) must not quietly restore it.

### 3. A repo correction this ticket forced

`src/backup.mjs:31-33` states, as the module's own contract: _"deletion outranks backup:
`/forget` purges the archive set."_ **ADR-0032 decided the opposite and is
authoritative**: _"An archive is a record, and `/forget` does not rewrite records…
`/forget` deletes from `~/.claudia/` and leaves `~/.claudia-backups/` entirely alone."_
The purge was the **rejected first draft** — _"a backup a routine command can destroy is
no longer a backup"_ — and `commands/backup.md` and `commands/forget.md` both ship the
ADR's version. The comment is stale, on precisely the rule this ticket turns on.

Recorded also for what it is **not**. Read quickly it looks like the third instance of
psy deontology found sitting in the chassis (after `src/safety.mjs` in 004 and
`src/dashboard.mjs` in 006). It is not: ADR-0032's conclusion **is** the content/store
line, which is the chassis's own. Only the behavioural rule that makes it honest —
_"never reach into an archive to bring back something they chose to forget"_ — is psy's,
at site 2.

### 4. _Floor_ keeps its name

_"garde floor, c'est le floor du domain c'est tout"_. No conjunction, nothing beneath;
across several declared domains it is the union of theirs (003, unamended). **chassis
law** disappears as a term of the model.

### 5. No soul in the chassis: at most one per domain, optional, worn by the active one

The ticket asked what binds under Claudia ⊕ {} when `SOUL.md` carries the behaviour and
nothing declares the rule. Antoine refused the framing and moved the file: _"pas 2
souls : plus aucun ds le chassis ! seulement 1 par domain qui prend la main qd actif"_ —
then, on the concrete switch, **optional**: a domain declaring no soul leaves, when
active, **no face at all**.

So the model has **one authority: the domain** — knowledge, floor, commands, record
kinds, migrations, and now the character. The chassis is a machine with nothing in it.

What this **overturns**, each load-bearing somewhere:

- **Identity constancy (charter, hard)** — _"Claudia never changes face"_ becomes **one
  face at a time, the active domain's**. The soul rides 003's **practice** clock, not its
  declaration clock: declared-beats-active (006 §6) governs commands and records, never
  the face.
- **002 §4** — _"Claudia ⊕ {} keeps the voice and loses the practice"_, and both things
  it said survive the empty set. Neither does. _"Une Claudia sans domain, c'est juste
  Claude"_ is now literal.
- **004 §1's table** — N1/A5 and N5 routed to _"chassis law → `SOUL.md`"_. There is no
  chassis-side `SOUL.md`; they are psy's soul's and travel with psy.
- **004 §2's closing argument** — _"site 2's bearer for the chassis law is `SOUL.md`,
  which 002 §4 made irremovable… The bearer can never disappear, not even on the empty
  set."_ **False now**: the bearer disappears with its domain. 004's derivation survives;
  this consolation does not.
- **"Claudia" becomes the name of psy's soul**, not of the assembly. The map's framing —
  _one constant person taking domains_ — no longer describes the model; the Destination is
  amended accordingly (map banner).

What it does **not** do: resurrect the soul component. A character is a **field of the
domain's package**, not a second publishable kind — the registry still has exactly one.
Soul-swap identity semantics, memory contracts as declarations and the live switch stay
out of scope. What the soul _declares_, and what the person sees when the face changes,
is [The soul](016-the-soul.md).

### 6. The publish gate says nothing about deontology

_"je m'en fous, un domain sans rien à l'intérieur, c'est juste Claude."_ A domain may be
published with no floor and no soul; the gate does not police emptiness. Provenance
informs the person; the gate does not stand in for a level that no longer exists.

Honest cost, stated rather than mitigated: **nothing designed prevents a published domain
from shipping a manipulative character.** The character law — no dependence-farming, no
parasocial substitution — is psy's now, so it binds psy and nothing else, and the gate was
the last place it could have been made general. Refused. Passed to
[Publish gate](005-publish-gate.md) as a settled input, not a question.

### 7. What binds under each composition

| composition           | floor                              | face                                               | commands                          |
| --------------------- | ---------------------------------- | -------------------------------------------------- | --------------------------------- |
| ⊕ {psy}               | psy's ten rules                    | Claudia — psy's soul                               | the system three + psy's seven    |
| ⊕ {psy, software-dev} | union of both, always              | psy's or software-dev's, per the **active** domain | the system three + both domains'  |
| ⊕ {software-dev}      | software-dev's, if it declares any | none, if it declares none                          | the system three + software-dev's |
| ⊕ {}                  | none                               | none                                               | the system three                  |

The last row is the model in one line: **a machine with three commands, and Claude.**
Present and idle at every station — the check runs and matches nothing (004 §5), the
three moments fire and nothing happens (006 §8), and now there is no one there to speak.

### Vocabulary settled here

- **soul** — a domain's character. At most one per domain, **optional**, worn while that
  domain is the active one. Ratified as a term (it was deferred with the removed soul
  component).
- **floor** — kept, redefined: a domain's rules; across several declared domains, their
  union. Nothing beneath it.
- **chassis law** — retired. Survives only inside closed tickets, governed by the map's
  banner.
- **the store / the content** — the chassis owns the **store** (the vault directory, the
  archives, migrations); the domain owns the **content** (what a record is, how long it
  is worth keeping, what may be said).
- **identity constancy** — restated: one face at a time, the active domain's.

Held for [Assemble the principles document](012-assemble-doc.md): the three system
commands (`/backup`, `/config`, `/migrate`), the composition table above, and the
substrate paragraph in §2 — the document states the deletion/export cost, and does not
reintroduce a command to soften it.
