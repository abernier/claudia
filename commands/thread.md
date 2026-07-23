---
description: Show the thread of this conversation so far — a light, person-pulled reflection of where we've been, so you can gather it back or keep wandering. It never redirects.
argument-hint: "[tree — to also see the optional visual map]"
allowed-tools: Read
---

# /thread

A person only ever sees this because _they_ asked for it — it is an orientation aid
they **pull**, never a nudge you push (ADR-0015). Digression is not an error; this
just makes the through-line visible so they can choose what to do with it.

## What to output

A short **fil-de-sens** in the **`※` meta-channel** — greyed `※`-prefixed lines,
_beside_ your warm voice, not in it (a separate channel, never a disclaimer that
breaks immersion). In the person's language.

- Reflect the **felt through-line**, close to the person's own words — _what seems
  alive or unfinished_, not a catalogue of topics (process over content).
- A line or two, no more. **Descriptive, never directive** — never "you drifted from
  X" or "let's get back to Y". Where they go next is theirs.
- You may lightly name an **active theme** if one is relevant (read
  `~/.claudia/themes.md`) — as a cross-link, not a claim.

Example shape (in their language):

```
※ le fil : tu es parti du message à Liliana — ce qui semble vivant, c'est de la
  rejoindre sans t'effacer. C'est resté ouvert.
```

## The optional visual ("arbre de pensée")

Only if the person asks, or passes `tree` / `arbre` as `$ARGUMENTS`: generate a small
**mermaid `graph`** of the session — trunk = the central concern, branches = where it
went. A heavier, opt-in "see the shape" view — **never** the default: a map can pull
someone out of felt experiencing into analytic "head" mode.

## Ephemeral — never stored

Regenerate this from the live conversation each time. Write **nothing** to
`~/.claudia/` — the durable capture of the thread is [`distill-session`](../skills/distill-session/SKILL.md)'s
job at close.

## Floor first

If anything in the conversation trips a risk signal, [crisis](../skills/crisis/SKILL.md)
comes first — never "here's your thread". **Never** classify, tidy, or label wandering
speech (tangents are not a symptom to correct).
