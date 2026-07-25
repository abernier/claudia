---
label: wayfinder:map
created: 2026-07-25
---

# Generalizing Claudia into a composable-expert ecosystem

> **Arrived, 2026-07-25.** No open ticket, no fog. The destination is
> [`docs/composable-domains.md`](../docs/composable-domains.md), with its two plates and the
> reference declaration under [`assets/`](assets/). The last seven tickets were resolved
> without Antoine, on his instruction; see the Notes.
>
> **The two ⚠ are settled by default.** Put to him and declined (_"juste finis et passe à
> l'impl"_): the **escalation map is not mandatory**, and **site 3 means the machinery,
> whosever it is** — the chassis's or the domain's own. Recorded in the document's §10 as
> settled-by-default rather than ratified, one line to reverse either way. Implementation
> follows as a **fresh effort**, not a resumption of this map: it is out of scope here, and
> a redrawn destination means a new charter.

Open tickets are not listed here — they are the open files under
[`tickets/`](tickets/), found by the frontier query in
[`TRACKER.md`](TRACKER.md). There are none.

## Destination

The generalization is decision-complete and written down: an
architecture-principles document under `docs/` that fixes the pluggable-domain
model — an empty chassis taking one or several published competency domains
(from a registry that may start as a local folder), each domain carrying its
own knowledge, its rules and optionally its character, over person-owned
memory — with the domain's contract specified at principle level, plus the two
generalized diagrams: the composition, and the session lifecycle invariant
under any domain set. No code, no implementation choices.

_Amended 2026-07-25 (see the soul banner below): the original framing —
"Claudia, as she ships, taking domains" — no longer describes the model. There
is no constant person; **Claudia is what the psychotherapy domain declares**.
The deliverable is unchanged: one document, two diagrams._

## Notes

- **The charter below is settled, except where its reopening banner says
  otherwise.** Only Antoine reopens an acquis, and explicitly; when he does,
  the banner records it and a ticket carries the question — tickets never
  reopen the charter on their own. Still untouched: danger conduct is 100%
  psy-domain and the generic level is silent on danger — decided, never
  re-litigated, and **generalized** by the chassis law's dissolution (banner
  below): the generic level is silent on _everything_, because it holds no rules
  at all. A pass that finds itself re-arguing what the chassis owes the person
  has missed that banner.
- **Language**: sessions with Antoine run in French; every artifact (map,
  tickets, document, diagrams) is English. Ratified terms: the **person**
  (never "user"), **contributor**, **domain**, **soul** (a domain's character —
  ratified 2026-07-25, when it moved into the domain's package), **floor** (a
  domain's rules; across several declared, their union), **store** vs
  **content**. Retired: **chassis law**, **surface**, **salience**, **mode of
  engagement**. Still deferred with their component: **expert**, **hat** (FR
  _casquette_), **memory contract**.
- **Skills**: grilling tickets run `/grilling` + `/domain-modeling`; diagram
  and manifest tickets run `/prototype` (diagrams in mermaid).
- **Execution override**: this map carries producing the destination document
  and its two diagrams (the invocation asks for them), not only the decisions.
- **Git safety** (Antoine's standing instruction): never `git reset --hard`;
  pre-existing uncommitted working-tree files — a stale draft at
  `docs/GENERALIZATION.md`, edits to `CONTEXT.md` — are **ignored, not
  deleted**, and are _not_ part of this charter. Nothing under `wayfinder/` is
  committed unless Antoine asks. _(Checked at assembly, 2026-07-25: neither
  exists any more — `git status` shows `?? wayfinder/` and nothing else. The
  instruction stands; it simply has nothing left to protect.)_
- **The last seven tickets were resolved without a grilling**, on Antoine's
  explicit instruction of 2026-07-25: _"je t'en supplie, finis tout seul, arrête
  de me poser des questions, j'ai suffisamment répondu pour que tu infères la
  fin."_ Their answers are **derived** from positions he ratified, never new
  positions of his; each resolution carries the banner, states its live
  alternatives, and marks the choice as the agent's. **One derivation overturns a
  written charter clause** and is flagged for him below.

<details>
<summary><b>Charter — the settled model</b> (from the invocation; reopened only where the banner below says)</summary>

> **Two components removed from this effort (Antoine, 2026-07-25).** First the
> **hat** (reopened in two steps — optional, then possibly unnecessary — then
> scoped out: _too abstract for now_), then the **soul** (_generalize only the
> competency domain; Claudia takes one or several, from a registry that may
> start as a local folder_). The model charted here is **Claudia ⊕ domains**:
> Claudia as she ships — persona, consult, memory machinery untouched — over a
> generalized, publishable domain kind. Everything only those components
> carried (publishable characters, the character-law publish audit, soul-swap
> identity, memory contracts as declarations, salience, mode of use, the live
> switch) leaves with them: see _Out of scope_.
>
> **Concurrency withdrawn (Antoine, 2026-07-25).** `Domain (publishable,
*concurrent*)` below no longer holds: _"Claudia agira selon 1 domaine de
> compétence à la fois"_. Domains do not combine in one response — contradiction
> between them is made impossible by construction instead of caught at a gate. The
> refusal applies to the **practice** only: the floor stays the union of every
> _declared_ domain's, so a switch never opens a hole in it. See
> [Concurrent domains](tickets/003-concurrent-domains.md), which also retires
> _mode of engagement_ as a declared property. The acquis _danger is 100%
> psy-domain_ was examined head-on in the course of that ticket, at Antoine's
> request, and **stands** — moving danger into the chassis law would have rescued
> only the imminent-risk slice of the floor.
>
> **The chassis law dissolves — there is no generic floor (Antoine, 2026-07-25).**
> _"On déporte toutes ces règles dans le domain. Pas de règle de chassis — tout est
> domain specific. C'est beaucoup plus simple : juste un `SOUL.md`, et après c'est
> l'histoire du domain."_ The bullet **The floor (hard)** below no longer holds where
> it makes the floor `chassis law ⊕ union of the loaded domains' floors` and
> enumerates a chassis law of three rules: **there is no chassis law, and no generic
> floor for one to compose into.** The model keeps exactly two authorities —
> `SOUL.md`, Claudia's character, shipped with her and un-generalized (this effort
> does not touch it), and **the domain**, which owns its knowledge and _all_ of its
> rules. The chassis is machine only: lifecycle, memory machinery, surfaces, the
> per-turn check _mechanism_, the gates, settings. It authors no rule, holds no
> criterion, carries no conduct.
>
> **All ten shipped rules belong to the psy domain (Antoine, same day).**
> `docs/safety/red-lines.md`'s N1–N9 / A1–A7 — honesty about her nature, no romantic
> or sexual engagement, no sale of emotional history, bounded retention and real
> deletion included — are psychotherapy deontology and leave with psy. The evidence
> was in the file all along: every rule's `_Rationale:_` cites a psy source
> (Character.AI/Setzer, APA, Stanford FAccT, Tessa/NEDA, GDPR Art. 9 _special-category
> mental-health data_). The chassis law was psy deontology promoted to a generic level
> by the accident of Claudia shipping one domain. And _danger is 100% psy-domain_
> stops being an exception carved out of a generic level: it was the **general case**.
>
> Retaining part of psy's rules as a residual floor was proposed and **refused
> explicitly** — _"y'a pas ! juste un `SOUL.md` et après c'est l'histoire du domain"_.
> [No generic floor](tickets/015-no-generic-floor.md) carries what this forces open.
> Closed tickets keep their text; wherever they say _chassis law_, this banner
> governs.
>
> **And the commands go with them (Antoine, same day).** _"Toutes les commandes, à
> part backup, migrate (éventuellement), config — en gros les commandes système —
> sont celles du domaine psy à venir."_ Eight of the eleven shipped commands leave
> with psy: `/dashboard`, `/export`, `/forget`, `/help-now`, `/keep`, `/menu`,
> `/save`, `/thread`. The chassis keeps `/backup`, `/config` and `/migrate`. The
> criterion under Antoine's list: those three act on the **store** — rotate an
> archive, upgrade a format, flip a switch — while every other command acts on the
> **content**, and the content is the domain's, by [The domain set](tickets/002-domain-set.md)'s
> own split (_the domain defines the record, the chassis stores it, the person owns
> it_). `/help-now` was decided this way on
> [Floor rules and the per-turn check](tickets/004-floor-check.md) §4 and read as a
> special case; it was the general one. So Claudia ⊕ {} is a persona over a machine
> with three commands. [Surfaces](tickets/006-surfaces.md) carries what it leaves
> open — chiefly `/forget` and `/export`, whose departure leaves the person owning
> records they can no longer delete or export.
>
> **And the surfaces, and the notes (Antoine, same day).** _"Oui c'est le domaine psy,
> même les notes !! Le chassis c'est comme une coquille vide, simplement backup,
> migrate (éventuellement) et config POINT BARRE."_ The **Components** bullet below no
> longer holds where it lists _activity surfaces_ among the chassis's parts, and the
> **Three altitudes** bullet's runtime line survives only as a **topology of moments**:
> the chassis fires session-open, each-turn and session-close, and whoever is declared
> hooks onto them — recall reads psy notes, distillation writes a psy summary. The whole
> vault vocabulary (person model, goals, themes, timeline, entourage, understanding,
> keepsakes, flags, summaries, deliverables) is the psy domain's, and nothing says a
> future domain has a note system at all. _Surface_ and _salience_ retire as terms of
> the model; **mechanism without content** — first derived for the per-turn check —
> becomes the chassis's general form, holding for migration and the lifecycle too. See
> [Surfaces](tickets/006-surfaces.md), which refuted its own premise.
>
> **The soul leaves the chassis too — identity constancy restated (Antoine, 2026-07-25).**
> _"pas 2 souls : plus aucun ds le chassis ! seulement 1 par domain qui prend la main qd
> actif"_ — then, on the concrete switch, **optional**. The **Identity constancy (hard)**
> bullet below no longer holds where it reads _"Claudia never changes face"_: the rule
> becomes **one face at a time, the active domain's**, and the soul rides 003's _practice_
> clock while commands and records keep riding the _declared_ set. `SOUL.md` is no longer
> shipped beside the domains — it is **inside psy**, and "Claudia" is the name of psy's
> soul. So the _two authorities_ of the dissolution banner is superseded within the day:
> there is **one authority, the domain**, and the **Three altitudes** bullet's _"one
> constant person — Claudia as she ships"_ is void, with the Destination amended above.
> What does **not** return is the soul _component_: a character is a **field** of the
> domain package, not a second publishable kind — the registry keeps exactly one. The
> **Components** bullet's _"Claudia's shipped persona (`SOUL.md`) stays as-is,
> un-generalized"_ goes with it. See [No generic floor](tickets/015-no-generic-floor.md) §5
> and [The soul](tickets/016-the-soul.md).
>
> **And `/forget` is deleted (Antoine, same day).** _"non forget juste dégage ! on le
> supprime complètement !"_ — offered as a move to the system side, refused. Ten commands
> remain: three system (`/backup`, `/config`, `/migrate`) and seven psy.
> [Surfaces](tickets/006-surfaces.md) §5's cost is now permanent and doubled — `/export`
> stays psy, so **nothing designed stands between the person and their records in either
> direction.** What is left is the substrate: plain markdown on their own machine
> (ADR-0004, ADR-0007), plus `/backup --purge` for the archives.
>
> **⚠ Derived, not ratified — the escalation map stops being mandatory.** The
> **Components** bullet below says a domain carries _"a mandatory escalation map"_, and
> [Publish gate](tickets/005-publish-gate.md) §3 drops the mandate: a required field needs
> a **consumer**, and 003 §6 established that maps are never compared, only added — so the
> requirement is ceremony, and 015 §6's _"the gate does not require a deontology at all"_
> forecloses it anyway, a map being a deontological artifact. **This is the one clause on
> the map overturned with nobody in the room**, and it is marked as such rather than filed
> as an acquis. The live alternative — keep the map as the single structural obligation of
> every domain, _existence only, never content_ — costs one line to reinstate and disturbs
> no other decision. What survives either way: **composing never discharges an
> escalation** (a domain is a library, not a credential).

- **Three altitudes.** _Runtime_: the session lifecycle — opening with memory
  recall, a safety check every turn outside any persona, the conversation,
  closing with save then deferred distillation — invariant under every
  composition. _Claudia and her domains_: one constant person — Claudia as she
  ships — taking one or several competency domains, over local memory that
  belongs to the person. _The ecosystem_: a registry of **one** publishable
  kind (the domain — a local folder is an acceptable first registry), two
  adversarial audit gates, tiered provenance.
- **Components.** **Soul** and **Hat** — both removed from this effort (see
  the banner above); Claudia's shipped persona (`SOUL.md`) stays as-is,
  un-generalized. **Domain** (publishable, _concurrent_): a body of knowledge
  with its deontology — on-demand library, its own floor rules, a mandatory
  escalation map ("beyond me → this real profession"); Claudia takes one or
  several; how they combine is the _Concurrent domains_ ticket.
  **Chassis**: the shared machine (lifecycle, memory machinery, activity
  surfaces, per-turn check mechanism, audit gates, settings) plus the chassis
  law; not publishable, not composable.
- **Identity constancy (hard).** Claudia never changes face. Adding a domain =
  the same Claudia, extended (after audit); the person's memory stays put and
  stays theirs. Claudia's
  colleague consultation (no memory access — secrecy by construction) keeps
  shipping as-is; theorizing it is deferred with the hat component.
- **Memory contracts — deferred with the hat component.** The firewall idea
  (what one mode of relation knows never leaks into another; content crosses
  only in the person's own hands) leaves this effort with its carrier. The
  shipped consult secrecy is unaffected.
- **The floor (hard).** Conjunctive: chassis law ⊕ union of the loaded
  domains' floors, strictest rule wins; a component can only ADD rules, never
  remove one. The check runs every turn, outside any persona — the
  persona is never trusted to self-police. The chassis law is limited to: honesty about
  being an AI (when seriously asked or when welfare depends on it), privacy
  and real deletion, and the character law — no dependence-farming (guilt on
  absence, jealousy, counters), no parasocial substitution for human bonds, no
  romantic/sexual engagement (absolute with a minor). Expressive style is free
  above the law; claiming a performed feeling is real is what is banned.
  Expressive restraint ("I don't perform feelings I don't have") is a trait of
  Claudia's shipped persona, not the law.
- **Danger is 100% psy-domain (settled).** Detection, crisis conduct,
  resources: all belong to the psy domain. The generic level is silent on
  danger — silent, not permissive; "crisis" and "hand-off" do not exist
  generically. Accepted consequence: a composition without psy has no
  _designed_ danger conduct — only the base model's own behavior remains.
  Claudia is unaffected: she ships psy, so its danger rules follow her under
  every hat.
- **The ecosystem.** Two adversarial gates: at _publication_ (a domain audited
  against its own deontology — the registry's only kind) and at _composition_
  (the domain set checked whole when it changes — floor union, domain × domain
  compatibility; the old "directive posture over the psy domain dies at the
  gate" example must be reformulated — see the _Concurrent domains_ ticket).
  Tiered provenance (official / community-audited / local) never weakens the
  gates — and the registry may start as a local folder. The _internal
  referral_ is deferred with the hat component; a domain's floor still decides
  when its practice comes first.
- **Claudia is the reference** — the registry's first consumer, and
  psychotherapy its first entry: Claudia ⊕ {psychotherapy, + software-dev
  later}.

</details>

## Decisions so far

- [The domain set: how Claudia declares, adds, and drops domains](tickets/002-domain-set.md)
  — the set is a **declaration** in the person's vault, written by the machine as
  the compose gate's _output_ (one gesture, skills.sh-shaped; undeclared = inert);
  a domain versions `x.y.z` as the distributed unit; the gate runs on the **whole
  set** at `add`/`remove`, never at session open; a domain that leaves takes
  nothing — _inert, not gone_ — because it **defines** its records, the chassis
  **stores** them, the person **owns** them; and the set may be **empty**, with no
  exception for Claudia.
- [Concurrent domains: how loaded domains combine](tickets/003-concurrent-domains.md)
  — the premise was refused, not answered: **one domain practised at a time**, so two
  libraries never speak in one response. The split is between two clocks — **the
  floor is a function of the declaration, the practice a function of the moment**:
  the floor is the union of every _declared_ domain's, whichever is active, because a
  prohibition that only binds the practice that authored it is not a prohibition.
  Switching is the **person's** act (Claudia detects and proposes at most, capped
  there by config); _mode of engagement_ dissolves, a declared mode being forbidden
  by identity constancy; a **floor may interrupt the active practice** and never the
  reverse; and the compose gate compares exactly one thing — an unconditional
  obligation of one floor against a prohibition of another, over the same act.

- [Floor rules and the per-turn check: shape, union, routing](tickets/004-floor-check.md)
  — the check is a **mechanism without content**: the chassis owns the machine, every
  criterion and every conduct is authored by the level that authored the rule, and an
  interrupt carries an **opaque pointer**, never conduct text (which evicts the psy
  conduct string found hardcoded in chassis code). The floor binds at **three sites** —
  the person's turn, the only one the check verifies; Claudia's response, borne by the
  practice and audited at the gate; the machinery, structural and verified at build — and
  mapping the shipped floor onto them leaves **exactly one rule at site 1**. The check is
  a pure function of _(declaration, turn)_: stateless, two verdicts (**pass / interrupt**),
  never blocking and never speaking to the person. That statelessness makes the site
  **decidable rather than declared** — site 1 iff decidable on one turn — so the gate can
  refute a mis-declared site instead of believing it. Output-side verification is refused:
  corrective, never preventive. A rule's shape is **three forms on one skeleton**, its
  fields conditioned by site; criteria are **data, never code**; site 3 is reserved to the
  chassis law _(void since the dissolution — [No generic floor](tickets/015-no-generic-floor.md)
  §1 re-decides who may bind the machinery)_. And **A0 is derived, not conceded** — the
  chassis holds no criteria, so on
  the empty set the check cannot detect at all: _silent, not permissive_ means the
  mechanism runs and matches nothing. Two clarifications ride along: the charter's _"the
  persona is never trusted to self-police"_ is narrowed to **detection** (a precision, not
  a reopening), and `/help-now` is **psy, not chassis** (Antoine) — it leaves with the
  domain, so a domain may contribute a command _(the special case of a general rule,
  generalized to the whole command surface the same day — see the banner)_.

- [Surfaces: who contributes activities, and what organizes them](tickets/006-surfaces.md)
  — the premise was refuted: **there is no chassis surface at all**, and the notes go with
  the rest — the whole vault vocabulary is psy's, and _nothing says a domain has a note
  system_. `src/dashboard.mjs` was the evidence, knowing the record kinds, their order and
  their labels — psy code in the chassis, the same shape 004 evicted. **Mechanism without
  content generalizes** from the per-turn check to the chassis's whole form: `/migrate`
  stays but empty, running the chassis's own migrations _and the domain's, optional_
  (Antoine); `/backup` archives **one root in a block** without opening it; and the
  lifecycle is a **topology of moments** — open, each turn, close — that fire empty under
  Claudia ⊕ {}, which retires `/save`'s straddle (the moment is the machine's, the summary
  psy's). 003's pattern extends unamended: **declared beats active** — a declared domain's
  commands and records stay reachable whichever domain is practised, since consulting one's
  notes is not practising. **Salience and _surface_ retire** as terms: no shared level
  remains for a ranking to sit on, each domain orders what it defined. Commands vanish with
  their domain while records stay — no mechanism, just **packaging**: a domain carries its
  own commands, skills, scripts, record kinds and migrations, so they were never in the
  chassis's `commands/`. `/forget` and `/export` were recommended back to the chassis and
  **refused** — _"elles restent pour l'instant dans psy"_ — so the cost is stated, not
  resolved: the person owns records with no command to delete or export them, the
  filesystem being what is left.

- [No generic floor: SOUL.md, then the domain](tickets/015-no-generic-floor.md)
  — the answer was to remove more, not to patch. **A domain binds the machine**, and 004
  §6's refusal falls for a reason that is rank, not verification: the chassis is a
  **subordinate, not a party**, so nothing checks a site-3 rule and a chassis manifest is
  rejected. But obedience is not ownership — the **store** is the chassis's (the archive
  ladder's numbers included), the **content** is the domain's, so psy's _bounded
  retention_ binds only what psy writes. `/forget` is **deleted outright**, which leaves
  the site-3 story **open and empty** — the right exists, no rule occupies it — and makes
  006 §5's cost permanent and double: nothing designed stands between the person and their
  records in either direction, only the substrate. **floor** keeps its name. And the
  largest move: **no soul in the chassis**, at most one per domain, optional, worn by the
  **active** one — one authority (the domain), identity constancy restated as _one face at
  a time_, `SOUL.md` becoming psy's property and "Claudia" the name of psy's soul, with
  004 §2's consolation (_the bearer can never disappear_) falsified. The publish gate
  requires **no deontology at all**: a domain with nothing inside is just Claude, and a
  manipulative published character is an accepted, stated cost.

- [The soul: what a domain's character declares, and what the face-change does](tickets/016-the-soul.md)
  — a soul is **subordinate to nothing** (_"soul fait ce qu'elle veut"_): the proposed
  hierarchy — echo the floor, never author a rule, on `red-lines.md`'s own relation to
  ADR-0001 — was refused, so a soul may carry normative prose and the check will never read
  it. That justifies the asymmetry 004 left open rather than removing it: **criteria are data
  because two consumers read them**, and a soul has none, so it keeps the shipped shape — one
  **prose document**, at most one per domain, optional, its only structured fact being whether
  it exists. Everything else follows from the single line the chassis may say — **which domain
  is active**: the face-change is marked by the **machine and by no one else** (no face
  comments its own exit), and **no face is marked by nothing** at all. The boundary question
  splits, and not where the map expected: the **live conversation is shared** — the incoming
  face sees the forty minutes on the person's father, because the conversation is the
  _person's_ and hiding would be a mechanism in a shell meant to have none — while **records
  are partitioned**, a face reading only the kinds its own domain defined. So the line is
  **authorship**, neither practice nor declaration: shared because no one authored it,
  partitioned because someone did — and it costs **no mechanism**, being 006's packaging, not
  the retired memory contract under a new name. 006 §6's _declared beats active_ is untouched:
  it governed the **person's** reach to their notes, never a face's. Accepted cost, stated: a
  face can practise psy with psy's live material (the floor still binds, the practice has no
  guard). And **identity constancy** finally gets a form it can hold — not a constant person
  but two guarantees: the face never changes without the person's act **and** without a mark,
  and the records stay put.

- [Publish gate: auditing a domain](tickets/005-publish-gate.md)
  — the gate has **no external reference**: it never asks whether a domain is good
  psychotherapy, only whether the package **is what it says it is**. _"Against its own
  deontology"_ is literal — a **coherence audit, never a conformity audit** — because a
  registry holding a reference deontology per profession is 003 §3's _psy domain in disguise_
  one level out, and because a gate that cannot require _a_ deontology (015 §6) cannot require
  a particular one. Five refusals, all internal: an **unreadable** floor (a parse, not a
  judgement — polarity is what the compose gate computes on), a **mis-declared site** (004 §3's
  predicate), **criteria as code**, a **conduct pointer that leaves the package**, and a
  **package contradicting its own declaration** — so the gate refutes the _label_, never the
  _conduct_, at any site. The **escalation map stops being mandatory** ⚠ (a required field needs
  a consumer; maps are never compared) — the map's one derivation overturning a charter clause
  unratified, flagged, reversible in a line. A soul is **not read** — the gate records only that
  it exists, so of the two copies of psy's ten rules it reads exactly one. The posture
  generalizes `author-skill`'s shipped panel — fail-closed, reject on doubt, **unanimous among
  whoever reads** — which makes provenance **monotone**: a tier adds readers to a fixed posture,
  so it can only ever reject more. And the verdict is pinned to a **version**, never a name.

- [Provenance tiers: what official / community / local change operationally](tickets/007-provenance.md)
  — a tier is **a claim about who read, not about what was read**: the criteria and the posture
  are identical everywhere, so _community-audited_ names witnesses, not a different audit. The
  charter's _never weakens the gates_ stops being a promise and becomes **unstatable** —
  unanimity makes the ladder monotone. The two gates answer the local-domain question
  differently: the **compose gate is tier-blind** and always runs on the person's machine, while
  the publish gate is a _publication act_ a local domain never performs — so **parse always,
  read only where someone read**, and what a local domain misses is exactly the check that
  substitutes for knowing the author. The person sees a tier **at `add`, in the terminal, and
  never in conversation** (the chassis's one line is already spoken for — 016 §2; a badge is a
  repeated disclaimer and a second voice — 004 §4): **pull, never push**. A tier **gates
  nothing** — it would be a fourth authority — and this is where 015 §6's accepted cost comes to
  rest: the only thing between a person and a manipulative published character is one line
  telling them who read it, or that nobody did.

- [Domain versioning: what a new version of a domain means](tickets/014-domain-versioning.md)
  — semver does not transfer because a domain has **no caller**; it has two consumers, the
  composition and the person. So **polarity decides the number**: adding a prohibition or a
  conditional obligation is **minor** (strictness is the direction the model already
  privileges), adding an **unconditional obligation** is **major** — the one addition that can
  make a domain refusable where it used to compose (003 §6). Major also covers a removed rule, a
  changed polarity or site, a withdrawn record kind or command, and **any soul change, by
  construction**: nothing can tell a typo from a change of character in unaudited prose (016 §1),
  so the strictest classification is the only sound one. A version **may** shed a rule — no
  authority above the domain forbids it — which makes the safety story rest elsewhere: **the
  number is the author's claim, the pin is the person's guarantee** (002 §1). An update is an
  `add`-shaped gesture, so the **compose gate re-runs over the whole set** and can refuse in the
  terminal, while the new version arrives **unaudited until audited** — publishing costs the
  tier. Nothing is ever pushed, and a migration is never owed: a record whose kind is gone is
  **inert, not gone**, which the model already accepts.

- [Claudia and her domains: the reference declaration](tickets/009-claudia-manifest.md)
  — asset: [`reference-declaration.md`](assets/reference-declaration.md). **The contract carries
  the shipped practice**: the approaches library, the crisis conduct, the escalation map, the
  whole vault, the commands and the persona each found a declared slot, nothing had to be
  invented, and the one thing that had to be removed had already been removed. The traps held —
  `SOUL.md` survives being a domain's property without a word changing, software-dev declares no
  note system, and the floor visibly binds a _future_ domain's practice because its rules are
  written against **acts, not speakers**. The reference domain turns out to be **refusable**: it
  declares exactly one obligation and it is unconditional. Seven frictions, none papered over,
  two wanting Antoine — **site 3 is not empty** (⚠ _"the machinery"_ never said whose: bounded
  retention binds what psy writes, and _no counters_ binds `/dashboard`, which is psy's own
  command now), and **the ten rules exist twice** with nothing reconciling `red-lines.md` against
  `SOUL.md`. Plus: `F8` is the mechanism so the floor declares **nine**, `F7` **splits** across
  two sites (003's four-way decomposition landing in the rule shape), `A6`'s clause outlives its
  referent, and sixteen record kinds ship against no command to delete or export them. One thing
  resolved itself: **`/save` does not straddle** — the moment and the command are two objects.

- [The composition diagram](tickets/010-composition-diagram.md)
  — asset: [`composition-diagram.md`](assets/composition-diagram.md). One authority in one
  colour; the chassis drawn as four parts that author nothing. **The two clocks became two arrow
  weights** — thick from the _whole declared set_ to the floor, dotted to the _single active
  domain_ — which is what made the picture tractable. The switch enters the active-domain box
  from the person and the records edge leaves the declared set, so it cannot be read as a switch
  that moves someone's notes; the interrupt edge has **nothing the other way**, drawn by absence
  rather than by a crossed arrow. The compose gate sits **outside** the registry (it is the
  person's gate, tier-blind) and its refusal returns to the terminal, never to the conversation.
  Claudia ⊕ {} is deliberately **not** a fifth drawing — one line instead, since a variant would
  imply the topology changes.

- [The lifecycle diagram](tickets/011-lifecycle-diagram.md)
  — asset: [`lifecycle-diagram.md`](assets/lifecycle-diagram.md). The generalization of
  `docs/ARCHITECTURE.md`'s plate, and the comparison is the fastest proof of what this map did:
  the shipped diagram names `skills/recall`, `skills/crisis` and `SOUL.md` **inside chassis
  boxes**, the generalized one names **moments** and every one of those names moves into a hook.
  Only the moments are numbered — the conversation is not one. The three-layer legend collapsed
  to **two**: blue owns the moments, the check mechanism, the routing and one line of text; purple
  owns everything said, read and written. The interrupt edge is labelled with the pointer's exact
  content, so _routes, never speaks_ is visible instead of claimed. **Invariance is drawn as a
  four-row table rather than four diagrams** — drawing variants would have argued against the
  point — and _present and idle_ is a row in it, not a footnote.

- [Assemble the principles document](tickets/012-assemble-doc.md)
  — **the destination, delivered**: [`docs/composable-domains.md`](../docs/composable-domains.md),
  beside `ARCHITECTURE.md`, opening with a banner that nothing in it is built. The stale-draft
  question is **moot** — `docs/GENERALIZATION.md` no longer exists and `CONTEXT.md` is clean, so
  nothing was reused or overwritten. **Nothing enters `CONTEXT.md` yet**, on the reason that it is
  the glossary of _what ships_: the document carries its own §8 and says when the terms move
  across. It carries what every blocker held for it — the three-site spine, the composition table,
  the three system commands, the substrate cost with no command reintroduced, _floor_ everywhere
  and _chassis law_ only in the retired list, the deferral note rewritten (the soul **component**
  stayed out, the **character** came back as a field), and the six shipped divergences recorded
  and explicitly not scheduled. Three things it does that were not asked for: **§7 gathers the
  five costs into one section** (read singly each looks like an oversight; read together they are
  the model's argument), **§10 keeps two items open** rather than guessing them, and a
  **provenance section** tells a reader who never opens `wayfinder/` which answers were grilled
  and which derived.

## Not yet specified

_Empty._ The last patch — **the registry as a process** — had its principle content
absorbed by [Publish gate](tickets/005-publish-gate.md) and
[Provenance tiers](tickets/007-provenance.md), and what remained of it was ruled out of
scope rather than graduated (see below). The fog is cleared: no in-scope question is left
unspecified between here and the destination.

## Out of scope

- **Implementation and migration** — code, storage formats, plugin or
  marketplace mechanics, and migrating the current Claudia codebase onto the
  generalized model. The invocation excludes them: principles and diagrams
  only.
- **Authoring the software-dev domain** — Claudia's second domain comes after
  this map, not on it.
- **Building the ecosystem tooling** — the registry and the gates as running
  software.
- **The registry as a process (ruled out of scope 2026-07-25, was fog)** —
  submission workflow, panel recruitment, promotion between tiers. Its
  _principle_ content was absorbed by
  [Publish gate](tickets/005-publish-gate.md) and
  [Provenance tiers](tickets/007-provenance.md): the criteria are fixed, the
  posture is fixed, the readers are the only variable, verdicts are per version,
  tiers inform and never gate. What is left is operational and sits past a
  destination that is _principles only_ — the same side of the line as the
  tooling entry above. Not a decision on the route: no ticket ever existed for
  it, and it graduates to nothing.
- **The hat component (deferred by Antoine, 2026-07-25)** — modes of practice,
  memory contracts as published declarations, activity salience, mode of use,
  the internal referral and the live switch: removed as too abstract for now
  (_generalize the competency domains first_). Its three tickets — the hat
  question itself, the memory contract, the live switch — were closed out of
  scope and their files deleted at Antoine's request (ids 1, 8, 13; the gaps
  in ticket numbering are their trace). Returns, if ever, as a fresh effort
  with a redrawn destination. The shipped colleague consultation is
  untouched.
- **The soul component (deferred by Antoine, 2026-07-25)** — publishable
  character packages, the character-law publish audit, soul-swap identity
  semantics, and "expert" as a design term: removed the same day (_generalize
  only the competency domain_). No dedicated ticket existed; the soul halves
  of the manifest and publish-gate tickets were cut in their rewrite.
  Claudia's shipped persona (`SOUL.md`) is untouched — and since the chassis
  law's dissolution the same day, it is one of the model's **two authorities**,
  the other being the domain. The character rules are psy's to declare;
  `SOUL.md` is what carries them when Claudia speaks.

  **Partly reversed the same evening, and this entry is kept for the record.**
  The _component_ stays out — no publishable character kind, no soul-swap
  semantics, no memory contracts, no live switch, and the registry still has
  exactly **one** publishable kind. But the **character itself came back in**, as
  a _field_ of the domain package: no soul in the chassis, at most one per
  domain, optional, worn by the active one. So `SOUL.md` is **not** untouched and
  is **not** a second authority — it is psy's. See the soul banner in the charter,
  [No generic floor](tickets/015-no-generic-floor.md) §5, and
  [The soul](tickets/016-the-soul.md), which is in scope.
