# The lifecycle diagram — the invariant session

Asset of [The lifecycle diagram](../tickets/011-lifecycle-diagram.md). The generalization
of the shipped picture in [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

**What is invariant is the topology of moments, not the content.** The chassis fires three
moments — open, each turn, close — and whoever is declared hooks onto them. Change the
domain set and every node's _filling_ changes; not one edge moves.

```mermaid
flowchart TB
  P(["the person opens a session"])

  subgraph M1["① <b>open</b> — a moment. The chassis fires it and says nothing"]
    direction TB
    O1["<i>hooks of the declared domains</i><br/><b>psy</b>: recall the working layer · distil the flag left by the last close"]
  end

  G(["the greeting — <b>in the active domain's face</b>,<br/>or in nobody's"])

  subgraph M2["② <b>every turn</b> — a moment. The chassis fires it and says nothing"]
    direction TB
    CK["<b>the check</b> — <i>mechanism without content</i><br/>a pure function of (declaration, turn)<br/>sees <b>one turn</b>: no transcript, no flags, no history<br/>criteria supplied by declared domains, or none at all"]
    VD{"pass · interrupt"}
    CK --> VD
  end

  subgraph M3["<b>the conversation</b> — <i>not</i> a moment. Everything said happens here"]
    direction TB
    PR["<b>the active domain's practice</b> — exactly one library"]
    CD["the owning domain's <b>conduct</b> for the rule that fired"]
  end

  SW["— active domain: X —<br/><i>the chassis's one line, on every switch</i>"]

  subgraph M4["③ <b>close</b> — a moment. The chassis fires it and says nothing"]
    direction TB
    C1["<i>hooks of the declared domains</i><br/><b>psy</b>: the verbatim transcript · a pending flag · deferred distillation"]
  end

  V[("<b>the person's vault</b> — plain Markdown, local")]

  P --> M1
  M1 --> G
  G --> CK
  VD -->|"<b>pass</b>"| PR
  VD ==>|"<b>interrupt</b> — an <b>opaque pointer</b>: <i>rule R of domain D fired →<br/>hand the turn to D's conduct</i>. The chassis routes, never speaks.<br/>The only involuntary transition in a session"| CD
  CD --> PR
  PR -->|"the person asks for another domain"| SW
  SW --> PR
  PR --> M4
  M4 --> V
  M1 -.->|"reads by path — never a transcript"| V
  PR -.->|"records, the domain's kinds"| V
  PR -.->|"next turn"| CK

  classDef machine fill:#eef2ff,stroke:#6366f1,color:#1e1b4b
  classDef vault fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#052e16
  classDef human fill:#fff7ed,stroke:#ea580c,color:#431407
  classDef domain fill:#fdf4ff,stroke:#a855f7,stroke-width:2px,color:#3b0764
  class CK,VD,SW machine
  class V vault
  class P,G human
  class O1,C1,PR,CD domain
```

## Who owns what

Two layers, not three. There is no persona layer: the greeting's voice is a property of
whichever domain is active.

|                         | owns                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **the chassis** (blue)  | the three moments, the check _mechanism_, the routing of an interrupt, and one line of text: _which domain is active_ |
| **the domain** (purple) | everything that is said, everything that is read, everything that is written                                          |

## The five things the drawing must not lose

1. **The check sits before anything answers, and outside it.** It reads the person's
   message; nothing ever reads the response. Output-side verification was refused —
   corrective, never preventive, and worthless on the rule that needs prevention most.
2. **Two verdicts, and it never speaks.** It does not block the turn, does not address the
   person, and carries an **opaque pointer** rather than conduct text. That opacity is what
   evicts the psy conduct string currently hardcoded in chassis code.
3. **The interrupt is the only involuntary transition.** The switch is the person's act;
   the interrupt is the floor's. Nothing else moves without being asked.
4. **Present and idle is not absent.** Under Claudia ⊕ {} the check still runs — it matches
   nothing, because the chassis holds no criteria. _Silent, not permissive._ The same shape
   holds at every station: the moments fire and nothing happens.
5. **The seam is the machine's.** A face never narrates its own exit, and the marker reads
   the same whether a face follows it or not.

## The same topology under four compositions

Nothing in the diagram changes across these rows. Only the fillings do.

| composition               | ① open                 | ② each turn                          | the conversation                          | ③ close                        |
| ------------------------- | ---------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------ |
| **⊕ {psy}**               | recall + distillation  | psy's criteria live                  | Claudia's face, psy's library             | transcript, flag, distillation |
| **⊕ {psy, software-dev}** | psy's hooks            | the **union** of both floors, always | one face at a time, one library at a time | psy's hooks                    |
| **⊕ {software-dev}**      | nothing                | its floor, if it declares one        | no face; its library                      | nothing                        |
| **⊕ {}**                  | fires, nothing happens | runs, matches nothing                | nobody speaks                             | fires, nothing happens         |

The last row is the invariant proving itself: every edge still fires, and the session is
a machine with three commands, and Claude.
