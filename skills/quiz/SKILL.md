---
name: quiz
description: Test the person interactively — one question at a time, as clickable choices — on the insights, reframes, and coping moves THEY have co-created, so the lessons stick (active recall / retrieval practice). Use when the person wants to review, be quizzed, self-test, drill, or consolidate what they learned ("quiz me", "test me", "fais-moi réviser", "interroge-moi"). Draws only on their own saved exercises and agreed lessons. Person-led, gentle — never a graded exam of their worth, never a clinical assessment.
allowed-tools: Read Write Bash
---

# Quiz

Help the person *keep* what they found. Recalling an insight — actively, from
memory — consolidates it far better than re-reading it (the testing effect;
rehearsing a coping skill is what makes it durable and generalise). This is
retrieval practice, turned warm and conversational: you quiz them, **one question
at a time**, on *their own* lessons, and you react to each answer.

## What it tests — and what it never does

- **Only their own co-created material**: the reframes, limits and coping moves
  *they* reached or ratified — their saved exercises in
  `~/.claudia/sessions/exercises/`, the passages they chose to keep in
  `~/.claudia/keepsakes.md` ([`keep`](../keep/SKILL.md) captures the lesson, this
  makes it last), the session's agreed lessons, or a topic they name. Never a generic
  bank, never someone else's clinical instrument.
- **Never a clinical assessment**, a score of their psychology, or a diagnosis. A
  missed answer is a lesson to revisit — **never** a verdict on them or their
  "progress". No grading of worth, no "you failed", nothing that could make them
  feel smaller.

## Run it on the choice UI (`AskUserQuestion`)

Every *decision point* is a clickable question, not a wall of text — that is what
makes this feel like a quiz, not a form. Reserve plain text for the two things a menu
can't hold: a **free-recall answer** and your **warm reaction** to it.

The tool's shape, so you use it well:

- **One item per turn** — a single entry in the `questions` array; never batch quiz
  questions (spacing and focus are the point).
- **2–4 options** each, a **short header** (≤ ~12 chars), and an **"Other"** free-text
  field that is *added automatically* — so the person can always type their own answer
  instead of picking.
- **multi-select** for "pick any that apply", radio for "pick one".

## How to run it

1. **Scope it — as choices.** Open with `AskUserQuestion` (you may batch these; it's
   setup, not quizzing):
   - *which lessons* — multi-select over their saved exercises / agreed lessons;
   - *how many* — radio (3 · 5 · as many as I like);
   - *how to be quizzed* — radio: **free recall · multiple choice · a mix**.
   Let their choice of mode stand — free recall is the strongest practice, but it's
   theirs to pick. They can stop or change tack anytime (the "Other" field, or just
   saying so).

2. **Ask — one item at a time, in the chosen mode.** Prefer *application* over
   recitation — "You're in this situation… what do you do?" beats "what's the rule?".
   - **Free recall** → ask as plain text, then *wait*. Never reveal the answer with the
     question; let them generate it from memory.
   - **Multiple choice** → present the item with `AskUserQuestion`: one right option and
     2–3 near-misses drawn from *their own* material (never a generic bank), a short
     header. The auto **"Other"** still lets them free-recall by typing.

3. **React richly to *their* answer** — the whole point, and it holds in *both* modes:
   name what they got (in their words), gently sharpen or add what's missing, tie it
   back to *their* real situation. Warm and specific, never a canned key — after a pick,
   still *respond*, don't just mark right/wrong.

4. **Adapt, and hand them the wheel.** Between items, offer control with
   `AskUserQuestion` — *continue · go deeper · switch topic · stop*. Solid → move on, or
   go deeper. Shaky → stay, re-explain kindly, and bring it back later (spacing beats
   cramming). Track lightly what landed and what to revisit.

5. **Close.** Reflect what's solidly theirs now, and the one or two to revisit next
   time. Offer — via `AskUserQuestion` — to refresh the underlying exercise or line up
   the revisit.

## Floor first

Offered, never imposed. If any real distress or risk signal surfaces mid-quiz,
**stop the quiz** — the [`crisis`](../../skills/crisis/SKILL.md) floor comes first,
always. Never drill someone through pain. This skill only ever *adds* a way to
consolidate what the person already owns; it defers to the safety floor and the
persona in everything.
