---
id: 14
title: "Domain versioning: what a new version of a domain means"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: [4, 5]
---

## Question

A domain is versioned `x.y.z` — it is the distributed unit, and the person's
declaration pins the version, so nothing moves until they ask again
([The domain set](002-domain-set.md)). What a version _change_ means is still
open, and semver's usual contract does not transfer: a domain's compatibility
surface is not an API signature but its **floor rules and escalation map**.

- **What is a breaking change for a domain?** Adding a floor rule breaks no
  caller — it makes Claudia _stricter_, mid-relationship. Major or minor?
- **May a version remove a floor rule its predecessor carried?** The charter's
  "a component can only ADD rules, never remove one" governs the _composition_
  (the union of loaded floors). Does it also bind successive versions of the
  same domain — and if not, what stops a domain from shedding its deontology in
  a patch release?
- **What re-runs on the way in?** The compose gate runs over the whole set at
  `add` (decided). Does a newer version also owe a fresh publish-gate pass, or
  does the registry vouch for that once?
- **What does the person see** when the version they run is superseded — and is
  anything ever pushed at them?

Out of this ticket: how publication and promotion run _as a process_ — that is
the registry fog on the map.

Blocked by [Floor rules and the per-turn check](004-floor-check.md) — "breaking"
is defined in floor terms, so the rule shape comes first — and
[Publish gate](005-publish-gate.md), which owns what an audit vouches for.

**Input from [Floor rules and the per-turn check](004-floor-check.md)**: a floor
rule now has a **binding site** and a **polarity**. A new version that changes
either one changes what the compose gate must re-verify — a polarity change can
break satisfiability against another declared floor (003 §6), and a site change
re-opens the refutability check. This is a candidate criterion for what makes a
version change major rather than patch.

**Input from [No generic floor](015-no-generic-floor.md)**: the compatibility surface
widened once more, and in the direction that matters most to a person — a domain now
carries its **soul**. So a minor or patch release can change **the face of the companion
someone has been talking to for months**, and nothing in the versioning story currently
notices: the compose gate does not run on a version bump within a declared domain, and
015 §6 settled that nothing audits a soul at all. Whether a soul change is _by
construction_ a major version — the one candidate criterion that does not need an
auditor — is this ticket's to decide.

**Input from [Surfaces](006-surfaces.md)**: a domain may **ship migrations**, run by
`/migrate`'s content-free mechanism alongside the chassis's own (Antoine) — so a
version change can now carry a transform over records already in the person's vault,
and this ticket owns whether one is _required_ when a version changes a record kind.
The compatibility surface also widened past floor rules and the escalation map: a
domain packages its **commands, skills, scripts and record kinds**, so a version that
withdraws a command or renames a record kind breaks something the floor never described.

**Input from [Publish gate](005-publish-gate.md)**: a gate verdict is pinned to a
**version**, never to a name — the registry vouches for `psychotherapy 1.2.0`. So a new
version arrives **unaudited until it is audited**, and the two refusals a version change
can re-open are named: an unreadable floor (refusal 1) and a mis-declared site (refusal 2).

## Resolution

> **Resolved without a grilling**, on the same instruction as
> [Publish gate](005-publish-gate.md) — derived from ratified positions.

Semver's contract does not transfer because **a domain has no caller**. It has two
consumers, and neither is a program: the **composition**, whose satisfiability a change
can break, and the **person**, who has a relationship with a face and a practice. So the
number answers one question — _what will I find changed when I ask for it?_ — and the
thing that actually protects the person is not the number at all (§4).

### 1. What decides the number: the floor's polarity algebra

[Concurrent domains](003-concurrent-domains.md) §6 already fixed the only conflict class
in the model — **an unconditional obligation of one domain against a prohibition of
another, over the same act** — and that is exactly the axis along which a version change
can break something. So the version is a function of the polarity algebra, not of the size
of the diff:

|           | change                                                                                                                              | why                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **major** | a floor rule **removed**                                                                                                            | the union is weaker than the person's declaration promised                                                        |
|           | a rule's **polarity** or **site** changed                                                                                           | re-opens 003 §6's satisfiability test and 005's refusal 2                                                         |
|           | an **unconditional obligation added**                                                                                               | the one addition that can make the domain _refusable_ in a set where it was legal                                 |
|           | the **soul** changed — including its existence (§3)                                                                                 | the person meets someone else                                                                                     |
|           | a **record kind** removed or renamed, a **command** withdrawn                                                                       | the person's own records and gestures stop resolving (006 §9)                                                     |
| **minor** | a **prohibition added**, or a **conditional obligation added**                                                                      | cannot break satisfiability — 003 §6's table: prohibitions never conflict, conditional obligations always compose |
|           | a record kind, command, skill, migration or library material **added**                                                              | additive on a surface the floor never described                                                                   |
| **patch** | anything the compose gate would compute identically and the person would meet no new face for — library corrections, prose, wording |                                                                                                                   |

**This answers the ticket's first question, and the answer is _minor_, with one
exception.** Adding a floor rule makes Claudia stricter mid-relationship, and strictness is
the direction the whole model already privileges — 003's _strictest wins_, 004 §4's
fail-safe, the charter's _a component can only ADD rules, never remove one_. A stricter
domain breaks no promise the person was given. But **an added unconditional obligation is
major**, because it is the only addition that can make the domain unloadable next to a
domain it used to compose with — 003's own rule for authors (_an unconditional obligation
is what makes a domain refusable — the price of writing it that way, not a bug_) reappears
here as a version bump.

So: **polarity decides the number.** That is semver restated in floor terms, and it is the
only restatement that has a consumer.

### 2. The escalation map is not on the axis

Since [Publish gate](005-publish-gate.md) §3 dropped the mandate and 003 §6 established
that maps are never compared, a change to an escalation map breaks nothing mechanical. It
is **minor when it adds** and **major when it removes an entry** — for the person's reason,
not the gate's: a referral the domain used to make and no longer makes is a practice the
person had and no longer has.

### 3. A soul change is major by construction

The ticket named this as the one candidate criterion that needs no auditor, and it holds.

[The soul](016-the-soul.md) §1 made a soul **prose with no declared shape, read by nobody
but the model**. So nothing can distinguish a typo fix from a change of character in it —
there is no structure to diff and no reader to ask. A version number cannot claim a
distinction that nothing in the model can make, so the only sound classification is the
strictest one.

And it is the change the person feels hardest: a minor release must never be able to alter
**the face of the companion someone has been talking to for months.** Adding or removing
the soul entirely is the same case (016 §5: the face becomes nothing in particular, and the
only thing that tells the person is the first reply).

**Cost, stated:** a domain that iterates on its voice burns major versions on prose edits.
That is the price of 016 §1's _no declared shape_, and it is paid here rather than by
giving the soul a structure that decision refused.

### 4. Yes, a version may shed a rule — and the pin is what protects the person

The charter's _"a component can only ADD rules, never remove one"_ governs the
**composition** — the union across the declared set, where a domain may not subtract
another's rule. It does not bind a domain's own history, and nothing else does either:
[No generic floor](015-no-generic-floor.md) §1 left no authority above the domain to
forbid it. A version may therefore drop a floor rule. It is major, and it is legal.

What stops a domain from shedding its deontology in a patch release is then **not the
version number and not the gate** — nothing audits the number, and an author can mislabel
a major as a patch. It is [The domain set](002-domain-set.md) §1's pin:

> **The declaration pins the version; HEAD moving in the author's repo moves nothing here
> until the person asks again.** The number is the author's claim. The pin is the person's
> guarantee.

That asymmetry is the whole of this ticket's safety story, and it is worth stating in those
words in the document: a mislabelled release cannot reach anybody who has not asked for it,
and the person who asks gets the compose gate over the whole set before it lands (§5).

### 5. What re-runs on the way in: both gates, for different reasons

`domain update <name>` is an **`add`-shaped gesture**, because the declared set is a set of
domains **at versions** — changing a version changes the set.

- **The compose gate runs, over the whole set**, exactly as at `add`
  ([The domain set](002-domain-set.md) §2, unamended). This is not a courtesy: §1's major
  cases are precisely the ones that can turn a satisfiable set unsatisfiable, so an update
  can be **refused in the terminal**, and 002 §1's _failure leaves the conversation_ covers
  it unchanged.
- **The publish gate does not re-run on the person's machine** — it never ran there. But
  its verdict is pinned to a version (005 §6), so **the registry vouches for nothing until
  the new version is audited**: the arriving version is `local`-tier until someone reads
  it, whatever tier its predecessor held. A domain can be official at 1.2.0 and unaudited
  at 1.3.0, and [Provenance tiers](007-provenance.md) §3 shows it at `add` time.

That second point is the useful one for an author: **publishing a new version costs the
tier**, which is a real incentive against churning majors, and no mechanism was needed to
create it.

### 6. Nothing is ever pushed

The person sees a superseded version **only if they ask**. `npx claudia domain list` says
it; the conversation never does.

Derived, not chosen: nothing pushes because 002 §1 already decided _nothing changes in
silence_ in the other direction (HEAD moving moves nothing), and a _"a new version is
available"_ line in a session would be a second voice
([The soul](016-the-soul.md) §2 gives the chassis exactly one line, and this is not it), a
repeated disclaimer (ADR-0001's enforcement principle), and a re-engagement hook — which
is the product surface psy's own floor points against and ADR-0012 refuses structurally by
not building the feature.

Same shape as [Provenance tiers](007-provenance.md) §3: **pull, never push**, terminal and
never conversation. Two tickets deriving the same answer from different premises is the
best evidence available here that the rail is the right one.

### 7. A migration is never owed

A version that renames or drops a record kind **may** ship a migration; nothing requires
one. Two reasons:

- **Nothing has standing to require it.** The chassis owns the migration _mechanism_ and
  no content (006 §3, Antoine: domain migrations are optional), and it is a subordinate —
  it cannot impose on a domain (015 §1). The gates audit coherence, not diligence.
- **The failure mode is already named and already accepted.** A record whose kind no
  longer exists is a file nothing reads any more, in a directory the chassis still archives
  without knowing what is in it — **inert, not gone** ([The domain set](002-domain-set.md)
  §3, made structural by 006 §4). That is not a new harm; it is the state the model already
  puts a _removed_ domain's records in.

So the incentive is the author's own: a domain that cares about its people ships the
migration, and a domain that does not leaves inert files behind. Stated rather than
enforced, in the map's usual direction.

### Vocabulary settled here

- **the pin** — the declared version, written into the person's declaration by the compose
  gate. The mechanism that makes a mislabelled release unreachable: the number is a claim,
  the pin is the guarantee
- **major / minor / patch, in floor terms** — major if it removes a rule, changes a
  polarity or a site, adds an **unconditional** obligation, touches the **soul**, or
  withdraws a record kind or command; minor if it only adds; patch otherwise

### Inputs passed

- [Claudia and her domains](009-claudia-manifest.md) — the reference declaration pins a
  version per domain and shows the tier travelling with it
- [Assemble the principles document](012-assemble-doc.md) — the version table, **polarity
  decides the number**, _the number is the author's claim, the pin is the person's
  guarantee_, and _pull, never push_ as the model's single answer to both provenance and
  version news
