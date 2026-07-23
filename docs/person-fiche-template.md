# Person fiche — the common template

Every person fiche (`~/.claudia/people/<name>.md`) follows this shared outline, so
they cross-reference cleanly and read consistently. A fiche is a **reflective
mirror** — the person's own experience of the relationship — **not** a profile of
the third party. See [ADR-0011](adr/0011-person-fiches.md) and
[`docs/competencies/curiosity-and-questions.md`](competencies/curiosity-and-questions.md).

## Structure

<!-- the aligned comment column is what makes this template readable -->
<!-- prettier-ignore -->
```markdown
---
type: person
name: Liliana                 # the file's canonical name (person's own language)
aliases: [Lili]               # other names I use for her (my own reference)
relationship: partner         # brother, mother, friend, manager, ex…
closeness: high               # how close it feels — the person's word
felt_quality: warm-but-tense  # the felt tone, in the person's words
support_direction: mutual     # gives / receives / mutual / draining
status: active                # active | dormant | estranged | deceased
first_noted: 2026-07-21
last_reflected: 2026-07-22
themes: [trust, conflict-avoidance]
tags: [family]
---

# Liliana

> One line, in my words: who she is to me.

## Who they are to me
Relationship, how we're connected, the plainest facts — as I'd describe them.

## How it feels
The felt tone of the bond, right now and over time. My experience, not a verdict.

## Patterns I notice
(CCRT, in plain words — tentative, always mine to correct:)
- **What I tend to want from them:** …
- **What I usually experience back:** …
- **How I respond:** …

## Key moments
- 2026-07-21 — the dinner where I couldn't bring up the money thing. → [2026-07-21](../sessions/2026-07-21-9113d5d7.summary.md)
- …each dated, each linking its **session summary** (never the raw transcript).

## What I'm working on here
The thread this relationship touches → [trust](../themes/trust.md), [boundaries](../themes/boundaries.md).

## Connections
- [Marie](Marie.md) — her sister, my closest friend
- [Sam](Sam.md) — my manager (unrelated, but they've met)

## Open questions
- Things I'm still wondering about, gently.
```

## Rules

- **First person, tentative, correctable.** Every line is _my_ experience ("I felt
  dismissed when…"), never a label on the other person ("she is …"). Update
  `last_reflected` when it changes.
- **Link generously but earn each link** (the one-sentence rule). Use **relative
  markdown links** — a fiche lives in `people/`, so link another person as
  `[Marie](Marie.md)`, a session as `[2026-07-21](../sessions/<stem>.summary.md)`, a
  thread as `[trust](../themes/trust.md)` (the [`themes`](../skills/themes/SKILL.md)
  layer, ADR-0015), and the working understanding as
  `[understanding](../understanding.md)`. Wrap any path containing spaces in angle
  brackets — `[the inner critic](<../themes/the inner critic.md>)`. **Reach a
  transcript only through its summary.**
- **Top of every fiche links back to the index** (`MEMORY.md`), which lists people by
  circle and doubles as the memory root.
- **Never a dossier.** No diagnosis of anyone; Claudia never contacts or discloses to
  the third party; deletion removes the file and de-links it; use `status:` when a
  relationship ends rather than erasing the person's own record — their call.

_Grounding: CCRT (Luborsky); genogram/ecomap attributes; Zettelkasten / Maps of
Content / evergreen notes; collateral-information ethics (Reamer, 2023)._
