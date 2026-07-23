---
status: accepted
---

# The choice UI — buttons for decisions, an open floor for everything else

Claude Code ships `AskUserQuestion`: a native picker that renders 2–4 labelled
options with descriptions, radio or multi-select, plus an auto-"Other" free-text
field. It is the most integrated way to put a question in front of the person —
scannable, one click, no typing.

Two of Claudia's surfaces already use it, and both arrived at it independently:
[`keep`](../../skills/keep/SKILL.md) offers candidate passages from the last
exchange, and [`quiz`](../../skills/quiz/SKILL.md) is built on it end to end
(scope, format, pacing, and multiple-choice items). Nothing said *why* those two and
not the others, so the obvious next thought — *generalise it everywhere Claudia asks
something* — had nothing to push back against.

It should be pushed back against. A menu is the most **closed** question that can be
asked: it pre-writes the answers. That is precisely what
[`docs/competencies/curiosity-and-questions.md`](../competencies/curiosity-and-questions.md)
already forbids as Claudia's default. Ivey's *Intentional Interviewing* is blunt
about the cost of closed and stacked questions: they "give too much control to the
interviewer" and elicit "socially acceptable answers rather than honest ones."
Cecchin's curiosity and Padesky's guided discovery both turn on the therapist
*following* the person's account rather than supplying the conclusions — a
four-option list supplies them. The persona says the same thing in its own words:
*"leave the door ajar"* — end open in register, the floor is yours. A menu closes
the door and hands back a form.

The rest of the repo has been quietly consistent about this already.
[`intake`](../../skills/intake/SKILL.md) states it is "not a clinical assessment or a
form"; [`themes`](../../skills/themes/SKILL.md) offers a candidate thread "as a
*question*, never a verdict"; the [dashboard](0019-dashboard.md) transcludes rather
than summarises so it "cannot put words in the person's mouth". A picker in any of
those places would put words in their mouth by construction — the four options *are*
the words.

And the two existing uses turn out to sit cleanly on the other side of that line.
`keep` asks the person to choose among passages **that already exist verbatim** — the
options were not authored to shape an answer, they are the material. `quiz` uses it
for scope, format and pacing, and for multiple-choice items drawn only from the
person's own saved work. Neither asks anyone how they feel via a menu.

So the boundary was real; it was just never written down.

## Decision

**The choice UI is for decisions. Plain conversational text is for exploration.**

- **Reach for `AskUserQuestion`** at a *decision point*: scoping an activity,
  picking a format, setting the pace, consenting to something, naming a destination,
  or choosing among material that already exists. The person is selecting, not
  disclosing.
- **Stay in plain text** for anything *therapeutic*: how something feels, what it
  means, a reflection offered back for correction, a thread offered for
  ratification, an open invitation. The person is disclosing, not selecting.

The test, when it is unclear: *would pre-writing the plausible answers change what
the person tells me?* If yes, it is exploration — ask openly.

**Where it applies**, beyond `keep` and `quiz`:

- [`/export`](../../commands/export.md) — the destination (default vs. elsewhere),
  with the auto-"Other" field carrying a free path.
- [`exercise`](../../skills/exercise/SKILL.md) and
  [`teach`](../../skills/teach/SKILL.md) — *may* offer two or three candidates as
  options instead of prose. **May, never must**: the exercise skill's own rule is
  "offered collaboratively (never as homework imposed)", and a menu must not harden a
  collaborative offer into a form. The closing "does this fit your experience?" stays
  plain text — that one is exploration.

**Non-goals, and why** — this half is load-bearing:

- **`/help-now` keeps its plain "what country are you in?"** The command's own
  instruction is "calm, brief, and warm — this is not the moment for exploration."
  A picker would be marginally faster to answer and adds an interface element in the
  one place where a stall costs the most. Presence over ergonomics; the floor decides
  this, not convenience.
- **`/forget` and `/migrate` keep their prose confirmations.** Both gate an
  irreversible write ([`forget`](../../commands/forget.md) step 2 deletes for real;
  [`migrate`](../../commands/migrate.md) step 2 rewrites the notes). Friction is
  *protective* there: having to say what you want deleted is a feature of deleting it.
  A one-click confirm optimises the wrong thing.
- **`intake`, `themes` ratification, `timeline` life-review, `relationships`' "did I
  get it right?", `understand`'s "does that fit?"** — all exploration, all open text,
  permanently.

**Operational shape** is already documented where it is used and is not restated
here: see [`skills/quiz/SKILL.md`](../../skills/quiz/SKILL.md) — one question at a
time, 2–4 options, a short header, radio vs. multi-select, and the auto-"Other"
field that keeps every menu declinable.

**Declared where used.** A skill or command whose body reaches for
`AskUserQuestion` must list it in its `allowed-tools` frontmatter. An undeclared
tool means a permission prompt mid-conversation, which breaks immersion at exactly
the wrong moment — the same reasoning already applied to `Task` in the persona.

## Consequences

- [`quiz`](../../skills/quiz/SKILL.md) was shipping with the tool undeclared while
  being built entirely on it. Fixed here; this ADR is partly a bug report.
- The persona (`skills/claudia/SKILL.md`) carries the rule, because it is the only
  always-loaded file — the ADR-0018 lesson (a capability documented everywhere except
  the persona is invisible in practice) applies to a *constraint* just as much as to a
  capability.
- `tests/structure.test.ts` guards **both** directions: declared wherever used, and
  **absent** from the exploratory skills. The second assertion is the one that
  protects the therapeutic side, and the one most likely to be eroded by a
  well-meaning future change.
- The glossary gains **Choice UI** under *Safety & register*, since this is a
  question of register — menu or open floor — before it is a question of interface.
- No new command, no new skill, no change to the safety floor.
