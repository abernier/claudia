# The composition diagram — the chassis and its domains

Asset of [The composition diagram](../tickets/010-composition-diagram.md). Draws **one
authority — the domain** — over a chassis that authors nothing, with the registry and its
two gates at the edges.

The domain dimension reads generically: _one or several_. Psychotherapy and software-dev
are the drawn instance, not the model.

```mermaid
flowchart TB
  A(["a domain author"])
  P(["<b>the person</b>"])

  subgraph REG["the registry — exactly one publishable kind, indexed, never a store"]
    direction TB
    PG{{"<b>publish gate</b> — per version<br/>is this domain what it says it is?<br/><i>coherence, never conformity</i><br/>fail-closed · reject on doubt · unanimous"}}
    TIER["<b>provenance tier</b><br/>local · community-audited · official<br/><i>who read — never what was checked</i>"]
    PG --> TIER
  end

  CG{{"<b>compose gate</b> — at add / remove, over the WHOLE set<br/>are the declared floors jointly satisfiable?<br/><i>tier-blind: it runs on every domain, published or not</i>"}}

  DECL[/"<b>the declaration</b> — written by the machine, in the person's vault<br/>domain @ version + tier · the compiled floor<br/><i>undeclared is inert</i>"/]

  subgraph SET["<b>the declared set</b> — one or several, possibly none"]
    direction LR
    D1["<b>psychotherapy</b> 1.0.0<br/><br/>soul: <i>Claudia</i><br/>floor · escalation map · library<br/>commands · record kinds · migrations · hooks"]
    D2["<b>software-dev</b> 0.2.1<br/><br/>soul: <i>none</i><br/>library<br/><i>no floor, no commands, no records</i>"]
  end

  FLOOR["<b>the floor</b><br/>the union of every <b>declared</b> domain's rules<br/>compiled once, at add / remove"]
  ACT["<b>the active domain</b> — exactly one<br/>its library is what is practised<br/>its soul is the face"]
  FACE(["<b>the face</b> — the active domain's soul,<br/>or nobody at all"])

  subgraph CH["<b>the chassis</b> — machine only. Authors no rule, holds no criterion, carries no conduct"]
    direction LR
    CK["the <b>per-turn check</b><br/><i>mechanism without content</i><br/>runs always · matches only<br/>what a declared domain supplied"]
    MO["the <b>three moments</b><br/>open · each turn · close<br/><i>fired empty by default</i>"]
    SYS["<b>/backup · /config · /migrate</b>"]
    MARK["the one line it may say:<br/><i>— active domain: X —</i>"]
  end

  V[("<b>the person's vault</b><br/>the domain <b>defines</b> the record,<br/>the chassis <b>stores</b> it,<br/>the person <b>owns</b> it")]

  A -->|"publishes a version"| PG
  TIER -.->|"informs, never gates"| P
  P -->|"<b>domain add</b> — the person's own act"| CG
  REG -.->|"a name and a version, or a local folder"| CG
  CG -->|"writes, on ✓"| DECL
  CG -.->|"on ✗, refuses in the terminal —<br/>failure never reaches the conversation"| P
  DECL --> SET

  SET ==>|"every declared domain, whichever is practised"| FLOOR
  SET -.->|"exactly one at a time"| ACT
  P ==>|"<b>the switch</b> — the person's act.<br/>Claudia may detect and propose, capped there by config.<br/>Never the chassis"| ACT

  FLOOR ==> CK
  CK ==>|"<b>interrupt</b> — an opaque pointer to the owning<br/>domain's conduct. The only involuntary transition"| ACT
  ACT --> FACE
  FACE <-->|"the conversation — <b>the person's</b>,<br/>shared across a face-change"| P
  ACT -->|"marks every transition"| MARK
  MO -.->|"whoever is declared hooks on"| SET
  SET -->|"records, partitioned by <b>authorship</b>:<br/>a face reads only the kinds its own domain defined"| V
  SYS --- V
  MO --- V

  classDef machine fill:#eef2ff,stroke:#6366f1,color:#1e1b4b
  classDef vault fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#052e16
  classDef human fill:#fff7ed,stroke:#ea580c,color:#431407
  classDef domain fill:#fdf4ff,stroke:#a855f7,stroke-width:2px,color:#3b0764
  classDef gate fill:#fef2f2,stroke:#dc2626,color:#450a0a
  class CK,MO,SYS,MARK,DECL machine
  class V vault
  class P,A,FACE human
  class D1,D2,ACT,FLOOR domain
  class PG,CG,TIER gate
```

## How to read it

**The purple layer is the only authority.** Knowledge, floor, commands, record kinds,
migrations _and_ character all hang off the domain. The blue layer authors nothing: it
fires moments, runs a check with no criteria of its own, keeps three commands that never
open a note, and says one line.

**Two clocks, two arrow weights.** The thick arrow from the whole declared set to the
floor is the **declaration** clock — the floor gathers from every declared domain, whichever
one is being practised, because _a prohibition that only binds the practice that authored
it is not a prohibition_. The dotted arrow to the active domain is the **practice** clock —
exactly one, a property of the conversation and not of the declaration.

**One edge is missing on purpose.** There is an arrow from the floor into the active
practice and **none the other way**: a floor may cut a practice, a practice may never
soften a floor.

**The switch comes from the person and from nowhere else.** Claudia may detect and propose;
the chassis never moves it. The only transition the person did not ask for is the floor
interrupt.

**The face follows the active domain; the records follow the declared set.** A switch moves
the face and moves nothing on disk — psychotherapy's commands and notes stay reachable
while software-dev is practised, because consulting one's notes is not practising.

**Claudia ⊕ {} is this same picture with the purple gone**: the moments fire and nothing
happens, the check runs and matches nothing, the three commands remain, and nobody speaks.
