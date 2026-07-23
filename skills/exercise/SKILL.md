---
name: exercise
description: Create a therapeutic exercise or worksheet the person keeps and works through — a CBT thought record, a behavioral-activation schedule, an ACT values compass, a self-compassion break, a grounding practice, a letter to self. Use when between-session practice would help. Saved as a deliverable in their language.
allowed-tools: Read Write Bash AskUserQuestion
---

# Exercise

Give the person something concrete to *do* — a structured practice, chosen to fit
where they are, offered collaboratively (never as homework imposed).

## Pick the right tool

Let the moment and the chosen approach decide (see `choose-approach`):

- **Thought record** (CBT) — situation → thought → feeling → evidence → balanced
  alternative.
- **Behavioral activation schedule** — small, values-linked activities against low
  mood. (Highest-value, lowest-risk starting tool.)
- **Values compass** (ACT) — what matters, and one step toward it.
- **Self-compassion break** — for harsh self-talk.
- **Grounding / breathing** — for *non-crisis* distress (crisis → the `crisis`
  skill, not this).

You **may** put two or three candidates to the person on `AskUserQuestion` rather
than in prose — picking a practice is a decision, and seeing the options side by side
helps (ADR-0024). *May*, never must: this is an offer made collaboratively, and a
menu must not harden it into homework with a submit button. If the moment is tender,
or you'd be guessing at the options, just ask in your own words.

## Shape

- A short "why this might help *you*" opener.
- A simple, fillable structure (headings/blanks the person completes).
- One small, doable step — not a program.

## Save it

Write to `~/.claudia/sessions/exercises/<date>-<slug>.md`, in the **person's
language**. Check next time how it went — gently.

Open the file with the block below — the three keys you can read off the filename you
just chose:

```yaml
---
type: exercise
created: 2026-07-23
slug: prediction-nest-pas-verdict
---
```

**Never write a `session:` key here.** Mid-conversation the session's stem does not
exist yet — it is minted at close (ADR-0017) — so any value you write is invented, and
inventing one is exactly how the vault ended up with exercises pointing at sessions
that never happened. `distill-session` adds it at close, when the stem is real; it is
the same deferral that already tags `todo.md` items and keepsakes.

Once they've worked it, its lesson is worth *consolidating*: offer
[`quiz`](../quiz/SKILL.md) later — retrieval practice makes it stick far better than
re-reading (the testing effect). The exercise *creates* the material; the quiz helps
it *last*.
