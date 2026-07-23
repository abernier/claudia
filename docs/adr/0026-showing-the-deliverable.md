---
status: accepted
---

# Showing the deliverable — rendering a file is not publishing it

Claudia makes things: an ecomap of the people around someone, a life timeline, an
explainer with a diagram, a worksheet to work through. All of it is written under
`~/.claudia/` and then **announced in prose** — "I've saved it to
`sessions/exercises/2026-07-23-…`". The ecomap of Marie and Liliana, the one artifact
that is genuinely worth _looking at_, arrives as raw ` ```mermaid ` text in a
terminal.

Claude Code has `SendUserFile`: it surfaces a file that already exists on the person's
machine, either rendered inline (`display: 'render'`) or as a download card
(`display: 'attach'`). Six surfaces here produce mermaid and several write markdown
deliverables, so the gap is wide.

## The privacy question, answered directly

[ADR-0007](0007-stay-local.md) and [ADR-0004](0004-memory-model.md) promise that
nothing leaves the machine, and that promise is load-bearing — the vault holds GDPR
Article 9 special-category data. `SendUserFile` hands a file to the person's client,
which is not, in every host, a purely local operation. So the promise has to be
examined rather than waved past.

The line that holds:

> Claudia **authored** this content in this conversation — the model already holds
> every word of it. Showing it back adds no disclosure the conversation did not
> already carry.

`Artifact` is categorically different, and this is why it stays refused: it mints a
**durable, shareable URL** — a new persistent copy, outside the machine, that outlives
the session and can be handed to someone else. A dashboard as a real web page is an
appealing idea and it is exactly the thing ADR-0007 rejected when it rejected the
remote connector. The mirror's whole point is that it is _theirs_, on their disk, not
a link.

**Showing is not publishing.** Everything below follows from that distinction.

## Decision

Claudia may render a deliverable she has written, **when the person is here and it
serves the conversation**.

- **`render`** for what is looked at **together, now** — a conversational support:
  the [`relationships`](../../skills/relationships/SKILL.md) ecomap, the
  [`timeline`](../../skills/timeline/SKILL.md), a
  [`teach`](../../skills/teach/SKILL.md) explainer with its diagram,
  [`/dashboard`](../../commands/dashboard.md).
- **`attach`** for what is **taken away** — an
  [`exercise`](../../skills/exercise/SKILL.md) worksheet to fill in elsewhere. An
  inline preview there is noise, not help.
- **`status: 'normal'`, always.**

| Surface                     | File                                                | display  |
| --------------------------- | --------------------------------------------------- | -------- |
| `relationships` — "show it" | `~/.claudia/people.md` (the mermaid _is_ the store) | `render` |
| `timeline` — when shown     | `~/.claudia/timeline.md`                            | `render` |
| `teach`                     | `sessions/teachings/<date>-<slug>.md`               | `render` |
| `exercise`                  | `sessions/exercises/<date>-<slug>.md`               | `attach` |
| `/dashboard`                | `~/.claudia/dashboard.md`                           | `render` |

### `proactive` is a hard non-goal

`SendUserFile` accepts `status: 'proactive'`, which pushes a notification to the
person's phone. Claudia never uses it. She shows a file **because the person is
already here** — never to bring them back.

This is the same refusal as scheduled check-ins: the persona's own line is
_"Presence, not surveillance"_, and ADR-0012 is explicit that counting the hours
between messages "manufactures the 'continuous relationship' the advisory warns
against". SOUL.md sets the direction — _"needing me less"_. A companion that initiates
contact is building the dependency this whole design refuses.

### Never send

- **`*.transcript.md`.** The archive is deliberately unread and unnavigable
  (ADR-0004, ADR-0023). A file card makes it navigable, and a person handed their own
  transcript to scroll is being invited into exactly the re-reading the memory model
  declines to support.
- **`safety.md`.** The [dashboard](0019-dashboard.md) already omits it deliberately —
  no risk profile handed over as an object to open.
- **Anything mid-crisis.** [`crisis`](../../skills/crisis/SKILL.md) says stay _with_
  the person; a download card is a detour at the worst possible moment.
- **The ephemeral views.** [`/thread`](../../commands/thread.md) promises to "write
  **nothing**", and the optional mermaid in `themes` / `timeline` is "a regenerated
  view, **never** the store". Sending one would require writing a file first, which
  breaks the promise that nothing was stored. They stay inline in the reply. Writing
  them to a temp path _would_ work and is deliberately not done — noting it here so it
  is not rediscovered later as a clever idea.

### Never a dependency

Every surface keeps its current prose behaviour — naming the path — as the fallback.
Claudia **offers to show, and falls back to telling**. Nothing may require
`SendUserFile` to be present, since it is a host affordance and not part of the
plugin.

## Consequences

- The rule mirrors [ADR-0024](0024-the-choice-ui.md): the affordance is welcome for
  what it does well, and fenced where it would change the relationship. Both ADRs are
  ultimately about the same thing — Claudia may use the interface to _serve_ a moment
  the person is already in, never to manufacture one.
- `tests/structure.test.ts` guards the fences, not the feature: `proactive` appears
  nowhere, `crisis` never sends, `Artifact` appears nowhere. Non-goals are what a
  future change erodes first.
- The glossary's **Deliverable** entry gains the distinction between _saving_ and
  _showing_; no new term — `SendUserFile` is machinery, not vocabulary.
- No new command, no new skill, no change to the safety floor, and no change to what
  is written to disk.
