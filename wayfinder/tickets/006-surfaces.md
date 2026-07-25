---
id: 6
title: "Surfaces: who contributes activities, and what organizes them"
type: wayfinder:grilling
status: closed
assignee: abernier
blocked-by: []
---

## Question

The chassis carries the activity surfaces (person model, themes, people,
timeline, deliverables, retrieval practice…). The hat used to set their
salience; since the hat's removal, what organizes activity?

- Is the surface set owned and closed by the chassis (extensible only by
  chassis releases, since the chassis is not publishable), or can a published
  domain contribute surfaces?
- If domains bring their own deliverable kinds (exercises, explainers…),
  where is the line between a _surface_ (chassis) and a _deliverable kind_
  (domain)?
- Salience, hat-free: is every surface simply offered equally, does Claudia's
  persona or the domain set rank them, or does salience just disappear as a
  concept from this effort?

The answer decides how much a new domain can change what a session with
Claudia offers, without a chassis release.

**Input from [The domain set](002-domain-set.md)**: "belongs to" split three
ways on the `safety.md` case — the domain **defines** the record (what a flag
is, when one is written), the chassis **stores** it (a domain has no storage of
its own), the person **owns** it (privacy and real deletion — psy's rules since
the map's banner of 2026-07-25, binding a machine the domain does not own: see
[No generic floor](015-no-generic-floor.md) §1). A
domain that leaves takes nothing. If that split holds generally, it is this
ticket's line between a surface and a deliverable kind.

**Input from [Concurrent domains](003-concurrent-domains.md)**: only **one** domain
is practised at a time, and the pattern that decision produced elsewhere is
_practice exclusive, everything else cumulative_ — the floor unions over the whole
declared set regardless of which domain is active. That poses this ticket a question
it did not have before:

- **Are surfaces gated by the active domain?** Software-dev is active and the person
  opens their dashboard: do psy's themes, person model, timeline and deliverables
  still show? By analogy with the floor, records and surfaces would be cumulative and
  visible while **contributing** a new activity is a practice act, hence the active
  domain's alone. Worth testing against the _inert, not gone_ rule: a domain that is
  merely _not active_ is in a weaker state than one that has left, so whatever a
  removed domain's records still do, a non-active domain's must do at least as much.
- **Salience**, hat-free, now also has to answer whether the active domain ranks
  surfaces — which would be a domain reaching into the persona's stance, exactly what
  that ticket forbade when it retired _mode of engagement_ (a declared mode changes
  her face; identity constancy says a switch may change only her competence).

**Settled by Antoine (2026-07-25), not this ticket's to re-argue — the command
surface is psy's, minus three.** `/help-now` was decided psy on
[Floor rules and the per-turn check](004-floor-check.md) §4 and read there as a
special case; Antoine generalized it the same day: _"toutes les commandes, à part
backup, migrate (éventuellement), config — en gros les commandes système — sont
celles du domaine psy à venir."_

| level       | commands                                                                              | why                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **chassis** | `/backup`, `/config`, `/migrate` _(the last one "éventuellement")_                    | they act on the **store** — rotate an archive, flip a switch, upgrade a format. None of them opens a note                        |
| **psy**     | `/dashboard`, `/export`, `/forget`, `/keep`, `/menu`, `/save`, `/thread`, `/help-now` | they act on the **content**, in categories psy defines — a session, a theme, a passage that landed, the thread of a conversation |

The criterion is [The domain set](002-domain-set.md)'s split applied to commands: the
domain **defines** the record, the chassis **stores** it, the person **owns** it — so a
command that must know what a record _means_ is the domain's. Eight of eleven leave
with psy, and Claudia ⊕ {} is a persona over a machine with three commands. The flat
`commands/` directory is the shipped shape that masks all of it.

What this ticket still owes, since it owns the surface line:

- **`/forget` and `/export` contradict _the person owns it_.** 002 says a removed
  domain's records are **inert, not gone**, and that the person owns them. If the
  deletion and export commands leave with psy, the person is left owning records they
  can no longer delete or export — under Claudia ⊕ {}, or simply after dropping psy.
  Either these two act on the store after all (whoever defined its contents), or the
  ownership rule needs a deletion path that does not depend on a declared domain.
  Same knot as [No generic floor](015-no-generic-floor.md) §1, from the other end:
  psy declares _real deletion_, and the machine that performs it is not psy's.
- **`/save` straddles.** The lifecycle — recall, check, conversation, save, deferred
  distillation — is charter-level chassis machinery, invariant under every
  composition. `/save` is the person-pulled trigger of a chassis step whose _product_
  (a distilled session summary) is a psy record. The step is the machine's; the
  command and what it writes are psy's. Worth stating explicitly, or the document will
  read as if the lifecycle itself left with the domain.
- **Does a command's departure obey _inert, not gone_?** `/help-now` was decided to
  vanish outright — _not an empty slot, no command at all_ (004 §4). Records stay,
  commands disappear. That asymmetry is right (a command is practice, a record is the
  person's) but it should be said, not assumed.

**Second input from [Floor rules and the per-turn check](004-floor-check.md)**:
**standing flags stay persona-facing.** `safety.md` holds them,
`recall` reads them, the persona consumes them; the per-turn check never does (it is
stateless, a pure function of the declaration and the turn). A surface that carries
floor-relevant state is read by the practice, not by the floor.

## Resolution

**The premise is refuted.** This ticket opened on _"the chassis carries the activity
surfaces"_ and asked how much of that set a domain may extend. There is nothing to
extend: **the chassis carries no surface at all.** The same move that made the ten
rules psy's, danger conduct psy's and eight commands psy's applies once more, and
this time it takes the notes with it — _"oui c'est le domaine psy, même les notes !!
le chassis c'est comme une coquille vide, simplement backup, migrate (éventuellement)
et config POINT BARRE"_ (Antoine, 2026-07-25), restated when the resolution tried to
soften it: _"les notes SONT du domaine psy ! comme tout (coquille vide !)"_.

The evidence was in the chassis code, in the same shape ticket 004 found for the
hardcoded psy conduct string. `src/dashboard.mjs` does not merely store files: it
knows the **kinds**, their **order** and their **labels** — `keepsake`,
`whereWeAre` → `understanding.md`, `goals`, `themes`, `pickUp` → `todo.md`,
`world` → `people.md`, `lifeMarkers` → `timeline.md`. Chassis code choosing the
salience of psy surfaces and naming them. And the surfaces themselves were never
generic: `goals.md` is _"agreed therapy goals (alliance: goal consensus)"_,
`understanding.md` is ADR-0008, `people.md` an ecomap→genogram, `timeline.md`
trauma-informed, `themes.md` person-ratified. Psychotherapy artefacts promoted to a
generic level by the accident of Claudia shipping one domain — the third time that
diagnosis has been made on this map, and the last level it had left to eat.

### 1. The surface set is the domain's, notes included

Applying [The domain set](002-domain-set.md)'s split to surfaces gives the answer the
ticket was chartered to find: the domain **defines** the record, the chassis
**stores** it, the person **owns** it. A _surface_ is a record kind — it says what a
"theme" is, what a timeline entry means, when a flag is written. That is a criterion,
and since the dissolution the chassis holds none. So the whole vault vocabulary —
person model, goals, todo, keepsakes, understanding, people, timeline, themes,
standing flags, session summaries, teachings, exercises, handovers — is psy's.

`src/dashboard.mjs` and `scripts/build-dashboard.mjs` are therefore **psy code sitting
in the chassis**, to be moved into the domain's own structure (Antoine: _"ce code doit
être déplacé ds le domain psy"_). Implementation is out of scope; the relocation is
recorded as the consequence, not planned here.

### 2. The surface / deliverable-kind line dissolves

The ticket asked where the line runs between a _surface_ (chassis) and a _deliverable
kind_ (domain). There is no line, because there is nothing on one side of it: both are
the domain's. The question was an artefact of the level being asked to hold something.

### 3. What the chassis is: three commands, two of them mechanisms without content

- **`/config`** — declared keys, closed value sets, nothing that reads a note.
- **`/backup`** — see §4.
- **`/migrate`** — kept, and kept **empty**, in exactly the shape 004 gave the per-turn
  check: the chassis owns the _mechanism_ (backup first, the applied-migrations ledger,
  ADR-0020's disclosure discipline), the content is somebody else's. Antoine sharpened
  it past the recommendation: it runs **the chassis's own migrations and the domain's,
  the latter optional** — _"migrate sert à la fois à passer des migrations du chassis et
  de leur domain s'ils fournissent des migrations (optionnel)"_. So the chassis does have
  a format of its own to evolve — `config.json`, the set declaration, the root layout —
  and it is content-free. A domain that ships no migrations is not a special case; it
  simply contributes nothing to the pass.

_Mechanism without content_ is now the chassis's general form, holding at three
independent sites: the per-turn check (004), migration (here), and the lifecycle (§8).

### 4. The store: one root, archived whole — and no note system is required

`/backup` archives **a single root** (`~/.claudia/`) as a block, without ever opening
it. Rejected on the way: having each domain declare where its data lives. The chassis
does not need to be told — it archives a directory, full stop.

And the deeper point, which goes past storage: **nothing says a domain has a note system
at all.** _"Ça le regarde, rien ne dit qu'un domain aura un système de notes."_ Where a
domain keeps its records, in what shape, whether it keeps any — its own business. 002's
_"a domain has no storage of its own"_ survives only in its weak reading: no domain gets
a store from the chassis. It gets a directory it does not have to use.

This is what makes _inert, not gone_ structural rather than promised. A removed domain's
records are files nothing reads any more, in a directory the chassis will still archive
without knowing what is in it.

### 5. `/forget` and `/export` stay with psy — the cost, unmitigated, _pour l'instant_

Recommended back to the chassis and **refused**: _"non, elle reste pour l'instant ds
psy !"_. The recommendation rested on both being blind to content — `vault-export.mjs`
copies everything verbatim, `/forget` deletes by path — but only two of `/forget`'s three
scopes are: erasing _a topic_ means knowing which lines of `person.md` / `goals.md` are
concerned, and its partial-delete branch rebuilds the dashboard. It is not a store
command wearing a domain's clothes; it is a domain command that happens to end in a
filesystem call.

The cost stands, and the document states it plainly rather than resolving it: under
Claudia ⊕ {}, or after dropping psy, **the person owns records with no command to delete
or export them.** What is left is the fact that they were always plain markdown on their
own machine (ADR-0004) — the filesystem, not a designed path — plus `/backup`, which
still holds the archives. Marked _pour l'instant_ by Antoine: revisitable, not settled
against. This closes the knot [No generic floor](015-no-generic-floor.md) §1 handed
here, in a direction that sharpens rather than dissolves it: the rule (_real deletion_)
and the command are now **both** psy's, and only the disk underneath is the chassis's.

### 6. Declared beats active — the surface question the two clocks posed

003's pattern holds without amendment: **practice exclusive, everything else
cumulative.** Software-dev is active, the person types `/dashboard` — a psy command —
and it works. A declared domain's commands and records stay reachable whichever domain
is being practised; only what Claudia _mobilises when she speaks_ is exclusive.
Consulting one's own notes is not practising.

This satisfies the test the ticket set itself: a merely non-active domain is in a weaker
state than one that has left, and it is — a departed domain's records survive as inert
files, a non-active domain's survive as live, readable, commandable records.

### 7. Salience dissolves

Not a generic notion any more, and nothing at the shared level ranks anything. Each
domain orders what it defined; the psy dashboard's ordering is psy's own, an internal
matter of one domain — _"le dashboard n'est pas dans le chassis, c'est une fonctionnalité
du domain psy !"_. The question the hat's removal left open is answered by dissolution,
not by reassignment: there is no shared level for a ranking to live on, and 003's
prohibition on a domain reaching into the persona's stance is untouched, since ordering
one's own notes is not a stance.

### 8. The lifecycle is **moments**

Charter-level machinery, re-read under the empty shell: recall reads psy notes,
distillation writes a psy summary. What is chassis is the **moments** — session open,
every turn, session close. The chassis fires them; domains hook what they want onto
them. Under Claudia ⊕ {} the moments still fire and **nothing happens** — the exact
analogue of 004's _present and idle_ check, and the same form as §3's migration pass.

So the charter's _"opening with memory recall … closing with save then deferred
distillation"_ is invariant as a **topology of moments**, not as content. `/save` stops
straddling: the moment is the chassis's, the command and the summary it writes are psy's.

### 9. Commands leave, records stay — a consequence of packaging, not a mechanism

A removed domain's commands **disappear outright** — no command, not an empty slot
(the `/help-now` decision of 004 §4, now the general rule). No machinery is needed for
that, because a domain is a distributed unit that carries its **own package**: its
commands, its skills, its scripts, its record kinds, its optional migrations. Removing
the domain removes the directory, and its commands go with it _because they were never
in the chassis's `commands/`_. Antoine's own read: _"idéalement il faudrait ranger les
artefacts ailleurs que les commandes/scripts"_ — the flat `commands/`, `scripts/` and
`src/` of the shipped repo are the shape that masks all of this.

The asymmetry the ticket asked to have stated rather than assumed now has a reason:
the command is practice and lives in the package; the record is the person's and lives
in their vault.

### Vocabulary settled here

- **surface** — retired as a term of the model. There is no chassis surface, so the word
  named a distinction that does not exist. What it pointed at is a domain's **record
  kind**.
- **salience** — retired with it; it has no shared level to rank on.
- **moment** — the chassis's unit of lifecycle: open, each turn, close. Fired by the
  chassis, filled by whoever is declared, empty by default.
- **mechanism without content** — the chassis's general form, not a special case of the
  per-turn check.

Held for [Assemble the principles document](012-assemble-doc.md); the two diagrams draw
§8 (lifecycle as moments) and §1 (no chassis surface).
