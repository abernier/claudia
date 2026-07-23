---
status: accepted
---

# A pulled menu — `/menu`

[ADR-0024](0024-the-choice-ui.md) drew the line — _buttons for decisions, an open
floor for everything else_ — and the obvious follow-up question arrived immediately:
should Claudia **open** a conversation with a picker (_resume a past session · do an
exercise · …_) to guide someone who doesn't know what to do with her?

No. That is the case ADR-0024 forbids, at the worst possible moment. Its own test —
_would pre-writing the plausible answers change what the person tells me?_ — is
answered loudest at the opening: someone arriving with an acute worry, shown four
tidy options, clicks one instead of saying what is wrong. Two further reasons that
are specific to the opening:

- **It would displace something better.** The opening is not a blank prompt.
  [`recall`](../../skills/recall/SKILL.md) has already read `person.md`, `goals.md`,
  `todo.md` and the last summary, and the persona turns that into **one** warm,
  specific check-in — _"how did the dinner with Liliana go?"_. A generic list is a
  downgrade, and a recital of four threads is the "dossier" feeling the whole design
  resists (ADR-0019).
- **The safety hook reads prompts, not clicks.** `safety-check.mjs` runs on
  `UserPromptSubmit` (`hooks/hooks.json`). A first turn spent selecting an option
  arrives as a tool result rather than a submitted prompt, so the per-turn net has
  nothing to read on the turn where it matters most — and `safety.md` may hold a
  standing flag that the persona already requires be met with attunement, not a list.

But the need underneath the question is real: a person who opens Claudia and doesn't
know what she can do with them. The resolution is **who pulls it**.

## Decision

A ninth command, **`/menu`** — person-pulled, like [`/thread`](0015-the-thread.md)
and [`/dashboard`](0019-dashboard.md).

- **Pulled, never pushed.** The person types it. That single fact settles the
  ADR-0024 question: they asked to be shown the options, so the options pre-write
  nothing, and the request itself passes through the safety hook as an ordinary
  prompt. Claudia may **name** it — once, lightly — when someone says they don't know
  where to begin; she never opens it on them.
- **The options are the person's own material, not a capability list.** Labels are
  their threads in their words (an open Follow-up, a `todo.md` item, a goal, one
  unfinished thread from the last summary); an activity appears incarnated in that
  material (_"the evening-thoughts worksheet, noted last time"_) or not at all.
  `SOUL.md` opens by saying Claudia is who she is, _not a list of features_ — a menu
  of skills would make her exactly that.
- **The open door is always the last option.** _"Just talk about now."_ It is what
  keeps the menu declinable from inside, alongside the auto-"Other" free-text field
  that every `AskUserQuestion` carries.
- **Thin memory, short menu.** Fewer than two live threads → two options, not four
  padded ones. An invented option is a suggestion the person never made.
- **One question, then back to conversation.** No second level, no drill-down: a
  navigation tree is an app, and the point is to return to the floor quickly.
- **Reads only.** It writes nothing to `~/.claudia/`; it is a view onto memory, like
  the dashboard mirror, and it is regenerated live rather than stored.

## Non-goals, and why

- **No menu at the opening**, ever — the whole first half of this ADR. Recorded as an
  explicit non-goal in ADR-0024 too, so the next person to have this idea finds the
  answer where they'd look for it.
- **No dated list of past sessions to browse.** The tempting version of "resume a
  previous session" is a picker of the last _n_ conversations. That turns memory into
  an archive and feeds the "illusion of a continuous relationship" the APA advisory
  warns against (ADR-0004); `recall` deliberately surfaces **one** thread, never a
  list, and `/menu` holds the same limit.
- **No catalogue of capabilities**, for the `SOUL.md` reason above. Discoverability of
  the toolkit is a real need, but it is the README's job and the first-run
  disclosure's — not a therapist's opening move.

## Consequences

- The public command surface grows from eight to **nine**. README's table and its
  prose count, and the structure guard's command list, track that.
- `tests/structure.test.ts` guards both directions, as with ADR-0024: `/menu`
  declares `AskUserQuestion`, and the exploratory skills still must not.
- The glossary gains **Menu** under _Safety & register_, next to **Choice UI** — it is
  the same question of register, resolved by who initiates.
- No change to the safety floor, to `recall`, or to the opening ritual. The persona
  gains one sentence: the indecision cue, and permission to name the command.
