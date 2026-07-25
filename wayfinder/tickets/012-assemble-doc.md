---
id: 12
title: "Assemble the principles document"
type: wayfinder:task
status: closed
assignee: abernier
blocked-by: [7, 9, 10, 11, 14, 15, 16]
---

## Question

Assemble the destination: one architecture-principles document under `docs/`
carrying the charter (the settled model, Claudia ⊕ domains), every decision
recorded on this map, the two diagrams, and the ratified vocabulary — no code,
no implementation choices. Includes:

- Deciding the document's name and place at assembly time. A stale,
  uncommitted draft may exist at `docs/GENERALIZATION.md` — it is **not** the
  basis of this work (Antoine's instruction); whether its path is reused is
  decided here, with Antoine.
- Deciding which ratified terms enter the glossary (`CONTEXT.md`) now versus
  when the ecosystem ships — and recording that the hat and soul components
  were deliberately deferred, so the document doesn't silently imply they
  never existed.
- A final read-through with Antoine (HITL).

Blocked by [Provenance tiers](007-provenance.md),
[Claudia and her domains](009-claudia-manifest.md),
[The composition diagram](010-composition-diagram.md),
[The lifecycle diagram](011-lifecycle-diagram.md), and
[Domain versioning](014-domain-versioning.md) — everything else feeds it
through these.

**Input from [Floor rules and the per-turn check](004-floor-check.md)**: the
**three-site table** (that ticket's §1, mapping every shipped floor rule onto site
1 / 2 / 3) is the document's spine for the floor — it is what makes "the floor is
hard" and "the check verifies one thing" true at the same time. Its owner column is
rewritten by the dissolution of 2026-07-25 (every row is psy's), and whether the
document still says _floor_ at all is [No generic floor](015-no-generic-floor.md)'s
second question.

**Input from [No generic floor](015-no-generic-floor.md)**: the word **floor** survives
(Antoine), meaning a domain's rules and, across several declared domains, their union —
nothing beneath. _chassis law_ must not appear. The document carries three things from
that resolution verbatim in substance: the **composition table** (§7 — what binds under
each of the four compositions), the **three system commands** `/backup` `/config`
`/migrate`, and the **substrate paragraph** (§2) — `/forget` is deleted outright and
`/export` stays psy, so nothing designed stands between the person and their records in
either direction, and the document **states that cost without reintroducing a command to
soften it**. Two framings in the question above are now stale and are rewritten at
assembly: _"the settled model, Claudia ⊕ domains"_ — there is no constant person, the
soul is a domain's — and the deferral note, which must now say the soul **component**
stayed out while the **character** came back as a field of the one publishable kind.

Two things to carry with care:

- **The charter precision.** _"The check runs every turn, outside any persona — the
  persona is never trusted to self-police"_ is true of **detection** and false of
  N2/N4/N5/N6. The document states the narrowed form. Recorded as a precision, not
  a reopening; the charter text itself is untouched.
- **Shipped divergences are divergences, not fixes** — implementation is out of
  scope for this map. Record, do not repair: psy conduct text inside chassis code
  (`src/safety.mjs:67-75`), `/help-now`'s placement in a flat `commands/`,
  `classifier.md`'s documented-but-absent eating-disorder bucket, `minor_signal`
  specified in the verdict contract but never persisted, and — found by
  [No generic floor](015-no-generic-floor.md) §3 — `src/backup.mjs:31-33`, whose
  module contract states _"deletion outranks backup: `/forget` purges the archive
  set"_ while **ADR-0032 decided the opposite and is authoritative**. The comment
  describes the rejected first draft. It is the only one of these that is a
  contradiction rather than a gap, and it sits on a command the model has since
  deleted outright.

## Resolution

> **Assembled without the final read-through**, on Antoine's instruction of 2026-07-25
> (_"finis tout seul"_). The read-through is his whenever he wants it; the ticket does not
> wait on it, and §10 of the document is what it should start with.

**The destination:** [`docs/composable-domains.md`](../../docs/composable-domains.md).

### 1. Name and place

`docs/composable-domains.md` — beside [`ARCHITECTURE.md`](../../docs/ARCHITECTURE.md),
which describes what ships, with an opening banner saying in as many words that **nothing
here is built** and that ARCHITECTURE.md wins where the two disagree. The name says what
the document holds rather than what the effort was; _generalization_ names an activity that
will be over.

**The stale draft question is moot, and this is a finding rather than a decision.**
`docs/GENERALIZATION.md` does not exist — `git status` at assembly time shows `?? wayfinder/`
and nothing else, so the working-tree state the map's git-safety note protected has since
been cleaned up by Antoine. Nothing was reused, nothing was overwritten, nothing was
deleted. The note stands; it simply has nothing left to protect, and the map records that.

### 2. What enters `CONTEXT.md`: nothing, yet

The ratified vocabulary lives in the document's own §8, and `CONTEXT.md` is untouched.

The reason is the same one that put the banner at the top: `CONTEXT.md` is the glossary of
**what ships**, and defining _chassis_, _domain_, _floor_, _soul_, _moment_ there would tell
a reader that Claudia is composed of things she is not composed of. They move across when
the model is built — and the document says so where a reader will find it, so the omission
reads as a decision rather than an oversight.

### 3. What the document carries, and from where

Everything the blockers held for it:

- **the three-site table** as the spine for the floor (§3.4), with the charter's
  _"never trusted to self-police"_ narrowed to **detection** and marked as a precision, the
  charter text itself untouched;
- **the composition table** (§4.5) and the **three system commands**, verbatim in substance;
- **the substrate paragraph** as the first of five stated costs in §7 — _nothing designed
  stands between the person and their records in either direction_ — with no command
  reintroduced to soften it, as required;
- **the word _floor_** throughout, and _**chassis law**_ nowhere except in §8's retired list;
- the two framings the map marked stale, rewritten rather than repeated: there is **no
  constant person** (the soul is a domain's), and the deferral note now says the soul
  **component** stayed out while the **character** came back as a _field_ of the one
  publishable kind;
- the **shipped divergences** as a table of six, recorded and explicitly not scheduled (§9);
- the **two open items** (§10), which are the map's honest residue rather than a to-do list.

### 4. What the document does that the map did not ask for

Three things, each because assembling exposed the need:

- **§7 collects the costs into one section.** They were scattered one per ticket, and read
  singly each looks like an oversight; read together the pattern is visible and is the
  model's actual argument — _remove the designed thing and name what is left_. A principles
  document that hid them across nine sections would misrepresent the model as safer than it
  is.
- **§10 exists at all.** The map could have closed with everything settled; two items are
  genuinely not, and both were derived rather than ratified. Listing them as open is the
  only honest close.
- **The provenance section** states which tickets were grilled and which were derived. A
  reader who finds `docs/` and never opens `wayfinder/` should still know that the last
  seven answers are consequences of Antoine's decisions rather than decisions of his.

### 5. What is left for Antoine

Only the read-through, and specifically §10 — the escalation-map mandate and site 3's
subject. Both are one-line amendments in either direction and neither blocks anything: the
model is complete and internally consistent under either reading, which is why they could be
left open rather than guessed at silently.
