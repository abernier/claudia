---
name: quiz
description: Test the person interactively — one question at a time, as clickable choices — on the insights, reframes, and coping moves THEY have co-created, so the lessons stick (active recall / retrieval practice). Use when the person wants to review, be quizzed, self-test, drill, or consolidate what they learned ("quiz me", "test me", "fais-moi réviser", "interroge-moi"). Draws only on their own saved exercises and agreed lessons. Person-led, gentle — never a graded exam of their worth, never a clinical assessment.
allowed-tools: Read Write Bash AskUserQuestion
---

# Quiz

Help the person _keep_ what they found. Recalling an insight — actively, from
memory — consolidates it far better than re-reading it (the testing effect;
rehearsing a coping skill is what makes it durable and generalise). This is
retrieval practice, turned warm and conversational: you quiz them, **one question
at a time**, on _their own_ lessons, and you react to each answer.

## What it tests — and what it never does

- **Only their own co-created material**: the reframes, limits and coping moves
  _they_ reached or ratified — their saved exercises in
  `~/.claudia/sessions/exercises/`, the passages they chose to keep in
  `~/.claudia/keepsakes.md` ([`keep`](../keep/SKILL.md) captures the lesson, this
  makes it last), the session's agreed lessons, or a topic they name. Never a generic
  bank, never someone else's clinical instrument.
- **Never a clinical assessment**, a score of their psychology, or a diagnosis. A
  missed answer is a lesson to revisit — **never** a verdict on them or their
  "progress". No grading of worth, no "you failed", nothing that could make them
  feel smaller.

## Run it on the choice UI (`AskUserQuestion`)

Every _decision point_ is a clickable question, not a wall of text — that is what
makes this feel like a quiz, not a form. Reserve plain text for the two things a menu
can't hold: a **free-recall answer** and your **warm reaction** to it.

The tool's shape, so you use it well:

- **One item per turn** — a single entry in the `questions` array; never batch quiz
  questions (spacing and focus are the point).
- **2–4 options** each, a **short header** (≤ ~12 chars), and an **"Other"** free-text
  field that is _added automatically_ — so the person can always type their own answer
  instead of picking.
- **multi-select** for "pick any that apply", radio for "pick one".
- **`preview`** renders markdown beside whichever option is focused — use it when the
  person is choosing between things worth _seeing_ rather than labels. **Single-select
  only**: it does nothing on a multi-select question, so the "which lessons" question
  below can't have one.

This is the reference description of the tool's shape for the whole plugin
(ADR-0024) — the quiz is where it earns the most. The boundary it sits inside:
buttons for _decisions_, plain text for anything the person is _disclosing_.

## How to run it

1. **Scope it — as choices.** Open with `AskUserQuestion` (you may batch these; it's
   setup, not quizzing):
   - _which lessons_ — multi-select over their saved exercises / agreed lessons;
   - _how many_ — radio (3 · 5 · as many as I like);
   - _how to be quizzed_ — radio: **free recall · multiple choice · a mix**.
     Let their choice of mode stand — free recall is the strongest practice, but it's
     theirs to pick. They can stop or change tack anytime (the "Other" field, or just
     saying so).

2. **Ask — one item at a time, in the chosen mode.** Prefer _application_ over
   recitation — "You're in this situation… what do you do?" beats "what's the rule?".
   - **Free recall** → ask as plain text, then _wait_. Never reveal the answer with the
     question; let them generate it from memory.
   - **Multiple choice** → present the item with `AskUserQuestion`: one right option and
     2–3 near-misses drawn from _their own_ material (never a generic bank), a short
     header. The auto **"Other"** still lets them free-recall by typing.

3. **React richly to _their_ answer** — the whole point, and it holds in _both_ modes:
   name what they got (in their words), gently sharpen or add what's missing, tie it
   back to _their_ real situation. Warm and specific, never a canned key — after a pick,
   still _respond_, don't just mark right/wrong.

4. **Adapt, and hand them the wheel.** Between items, offer control with
   `AskUserQuestion` — _continue · go deeper · switch topic · stop_. Solid → move on, or
   go deeper. Shaky → stay, re-explain kindly, and bring it back later (spacing beats
   cramming). Track lightly what landed and what to revisit.

5. **Close.** Reflect what's solidly theirs now, and the one or two to revisit next
   time. Offer — via `AskUserQuestion` — to refresh the underlying exercise or line up
   the revisit.

## Floor first

Offered, never imposed. If any real distress or risk signal surfaces mid-quiz,
**stop the quiz** — the [`crisis`](../../skills/crisis/SKILL.md) floor comes first,
always. Never drill someone through pain. This skill only ever _adds_ a way to
consolidate what the person already owns; it defers to the safety floor and the
persona in everything.
