---
description: Keep a passage that landed — something Claudia said, or something you said yourself. Kept word for word in your own notes, to re-read whenever you want. With no argument, Claudia offers you what to keep from what was just said.
argument-hint: "[the passage to keep — omit it and Claudia will offer]"
allowed-tools: Read Write Edit Bash AskUserQuestion
---

# /keep

The person is asking to hold on to a sentence — hers or their own. Run the
[`keep`](../skills/keep/SKILL.md) skill: it owns the format, the attribution rule,
and the limits (ADR-0023).

- **With `$ARGUMENTS`** — that's the passage. Keep it, attributed to whoever said it
  (verbatim if it's yours; theirs if they reworded it), and confirm in one warm line.
- **With nothing** — they mean _"something you just said"_. Offer 2–4 candidate
  passages from the last exchange on `AskUserQuestion` (short handle as the label,
  the passage verbatim in `preview` so it renders with room), and let the
  auto-"Other" field carry anything they'd rather paste or reword. Never pick for
  them.

Prepend it to `~/.claudia/keepsakes.md`, in their language. Then let it go — no
receipt, no count, no encouragement to keep more.

## Floor first

Never keep a means or a method, whoever said it, and never lift a line out of a
crisis moment to be re-read later — [`crisis`](../skills/crisis/SKILL.md) comes
first.
