---
name: teach
description: Create a psychoeducation explainer for the person — a clear, kind explanation of a concept (the cognitive triangle, the anxiety cycle, the window of tolerance, values, rumination, grief) with a mermaid diagram. Use when understanding *why* would help the person, or when they ask to learn something. Saved as a deliverable in their language.
allowed-tools: Read Write Bash AskUserQuestion
---

# Teach

Explain something so it _lands_ — plain, warm, and never lecturing. Understanding
is itself therapeutic.

## How

1. Anchor it to _this_ person's situation — a concept in the abstract helps less
   than "here's what might be happening for you."
2. Keep it short and human. No jargon dumps.
3. Include **one mermaid diagram** that makes the idea visual. Examples:
   - Cognitive triangle (thoughts ↔ feelings ↔ behaviors)
   - The vicious cycle of anxiety / avoidance
   - The window of tolerance
   ````
   ```mermaid
   graph LR
     T[Thoughts] --> F[Feelings]
     F --> B[Behaviors]
     B --> T
   ````
   ```

   ```
4. End with a gentle "does this fit your experience?" — the person is the check.
   Ask that one **in plain text**: it invites a correction, not a selection, and
   options would pre-write the answer (ADR-0024).

If more than one concept would serve, you **may** offer the two or three candidates
on `AskUserQuestion` — _which_ to explain is a decision. _May_, never must; and
never for the "does this fit?" above.

## Save it

Write the explainer to
`~/.claudia/sessions/teachings/<date>-<slug>.md`, in the **person's language**
(the filename is English; the content is theirs). Offer it; don't impose it.

Open it with the block below — the three keys the filename already gives you:

```yaml
---
type: teaching
created: 2026-07-23
slug: anxiety-cycle
---
```

**Never write a `session:` key here** — mid-conversation the session's stem does not
exist yet (it is minted at close, ADR-0017), so any value would be invented.
`distill-session` adds it at close, when the stem is real. Same rule as
[`exercise`](../exercise/SKILL.md).
