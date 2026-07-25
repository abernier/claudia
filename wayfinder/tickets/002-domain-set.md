---
id: 2
title: "The domain set: how Claudia declares, adds, and drops domains"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

Claudia takes one or several competency domains. The set itself needs a
principle-level definition (no file formats):

- Where the set is declared, and by whom — composing is the person's own act.
- What check runs when the set changes: the floor union recomputed, domain ×
  domain compatibility re-verified — the compose gate's residue after the
  hat's and soul's removal. Adding a domain = the same Claudia, extended,
  after audit: what exactly re-runs?
- Dropping a domain: its floor rules and escalation map leave — what happens
  to the deliverables and memory made under it, which stay the person's?
- Can the set be empty — is psychotherapy detachable from Claudia, or pinned
  as her reference domain? (The charter accepts that a composition without
  psy has no designed danger conduct; this ticket decides whether _Claudia_
  can ever be that composition.)

## Resolution

The domain set is a **declaration in the person's vault**, written by the machine
as the _output_ of the compose gate — never hand-maintained, and never a setting.

**Not a setting** (ruled out before the decision): `config.json` carries declared
keys with closed value sets and no free text (ADR-0028, `src/config.mjs`), and
settings sit _above_ the floor — none may soften a rule. The domain set does the
opposite: it _changes_ the floor, which is the union of the loaded domains'. It
cannot live there whatever else is decided.

Command shapes below are illustrative — the gesture is what is decided, not the
CLI.

### 1. Where the set is declared, and by whom

One command, with the ergonomics of an established public registry — skills.sh:
`npx skills add <owner/repo>`, a registry that _indexes_ while the content stays in
the author's repo, with provenance tiers ("Official") and security audits already
in evidence there.

    $ npx claudia domain add antoine/software-dev
      → placed in the person's domain folder
      → compose gate over the WHOLE set {psychotherapy, software-dev}   ✓
      → declared: software-dev 0.2.1, 2026-07-25

Composing is the person's own act and it is a **single gesture**; the declaration
is what the command _writes_ when the gate passes, not a chore it demands first.

Three properties follow from the declaration existing at all:

- **Undeclared is inert.** A folder copied in by hand does not play. This is the
  in-house `proposed-skills/` precedent exactly: a draft is inert _because it is
  not on the load path_ — presence without membership.
- **Failure leaves the conversation.** A domain the gate refuses is refused in the
  terminal, at `add` time — never mid-session.
- **Nothing changes in silence.** The declaration pins the version; HEAD moving in
  the author's repo moves nothing here until the person asks again.

**A domain is versioned `x.y.z`.** The rule is _what ships alone versions alone_:
no skill in this repo declares a version (frontmatter is `name` + `description`
only) because a skill never travels alone — the plugin does, and the plugin is what
carries `0.12.0`. A domain is published to a registry, audited and installed on its
own, so it is a distributed unit and versions like one. What a version _change_
then means is a separate question — see
[Domain versioning](014-domain-versioning.md).

### 2. What runs when the set changes

The compose gate runs **at `add`/`remove`**, over the **whole set** (charter: _the
domain set checked whole when it changes_), never over the added domain alone.

At session open there is no re-audit — only a **cheap coherence check**: does the
declaration still match what is on disk? The discipline is ADR-0020's, the vault
migrations: applied quietly at recall, _disclosed plainly when it acts, silent when
there is nothing to do_. A domain whose folder no longer matches its declaration
falls back to inert, and Claudia says one line.

_What_ the gate compares is not decided here — it belongs to
[Concurrent domains](003-concurrent-domains.md).

### 3. Dropping a domain: inert, not gone

Nothing under the person's vault is touched. A domain that leaves removes the
**practice**, never the **record** — exercises, explainers, the handover page,
keepsakes stay readable and exportable; Claudia simply can no longer perform the
move. Nothing in this repo erases itself: `/forget` deletes _because the person
asked_, and leaves the archives alone.

This required splitting what "belongs to" means, on the sharpest case, `safety.md`:

|                | who            | what that covers                                                                                         |
| -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| **defines it** | the psy domain | what a flag _is_, when one is written, what it triggers — 100% domain, like detection and crisis conduct |
| **stores it**  | the chassis    | the memory machinery; a domain has no storage of its own                                                 |
| **owns it**    | the person     | chassis law: privacy and real deletion. Always                                                           |

So "safety belongs to the psy domain" is true of the first row and false of the
third — and it is the third that governs removal. **A domain that leaves takes
nothing, because it never owned anything.**

With psy removed, `safety.md` is text in the person's notes: nothing interprets it,
nothing read or erased it, no new exposure — same file, same place. And the escape
hatch never leaves with a domain: `/forget` is chassis, so real deletion is
available under any set, including the empty one.

Re-adding a domain therefore _restores_ nothing — it makes an untouched record
legible again. No re-consent prompt on the way back in: a question Claudia raises
about her own past record hands the person work they did not ask for.

The defines / stores / owns split generalises past this ticket (deliverable kinds,
surfaces) — passed as input to [Surfaces](006-surfaces.md).

### 4. The set may be empty — no exception for Claudia

`domain remove psychotherapy` succeeds. Claudia ⊕ {} is a legal composition:
_"une Claudia sans domain, c'est juste Claude — et c'est possible"_ (Antoine,
2026-07-25). One rule for everyone; the reference instance gets no special case.

Rejected on the way: pinning psy to Claudia by **identity constancy**. That charter
rule (_Claudia never changes face_) protects the face and the person's memory, not
the competence. Emptying the set does not change her face — it leaves her with
nothing to say. Different thing, and legal.

Two things survive the empty set, so "just Claude" is slightly more than Claude:

- **The persona.** `SOUL.md` ships and sits outside composition in this charter (the
  _soul_ component was removed from the effort), so nothing can remove it.
  Claudia ⊕ {} keeps the voice and loses the practice.
- **The floor.** Chassis law still runs every turn — honesty about being an AI,
  privacy and real deletion, the character law. The empty set is not an unfloored
  state; it is an _incompetent_ one.

Danger conduct leaves with psy, as the charter already accepts. One line says so at
removal, in ADR-0020's discipline — a fact, not a guardrail:

    $ npx claudia domain remove psychotherapy
      → removed. Your memory and your documents stay where they are.
      → no domain left: no crisis conduct, no escalation map. Claudia goes on
        talking, without a practice.

### Vocabulary settled here

- **domain set** — the _declared_ set, not whatever happens to be installed
- **declaration** — the machine-written record of the set: domain, version, date,
  compose-gate verdict
- **inert** — installed, or left behind, but not in play. The state a domain and its
  records fall to; never deletion

Held for [Assemble the principles document](012-assemble-doc.md), which decides what
enters `CONTEXT.md` and when.
