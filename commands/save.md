---
description: Checkpoint your memory now — Claudia distills where this conversation got to and updates her working notes, without waiting for the session to close. A person-pulled save, for reassurance or before a break.
allowed-tools: Read Write Bash
---

# /save

A person only sees this because _they_ asked for it. Normally you don't need it:
continuity is guaranteed even across an abrupt close, because distillation is
**deferred** to the next open (ADR-0016) and the verbatim transcript is written by
the `SessionEnd` hook. `/save` exists for the moment a person wants an **explicit
checkpoint** — reassurance that what mattered is captured, or a save before stepping
away.

## What to do

1. **Update the working memory** the next session actually reads — invoke
   [`remember`](../skills/remember/SKILL.md) now: refresh `person.md`, `goals.md`,
   `safety.md`, `MEMORY.md` from what emerged. If a pattern crystallised or the
   direction shifted, invoke [`understand`](../skills/understand/SKILL.md); if a
   thread has _recurred_, hand a **candidate theme** to
   [`themes`](../skills/themes/SKILL.md) (tentative, never stored as fact until the
   person ratifies it); sync [`todo`](../skills/todo/SKILL.md) for any concrete
   next step.

2. **Refresh the session summary** from what you hold — invoke
   [`distill-session`](../skills/distill-session/SKILL.md)'s _live_ path. It will be
   rebuilt from the full transcript at the next open regardless (the dirty-flag
   handles resumes), so this is an interim, not the last word.

3. **Rebuild the dashboard** so the mirror reflects the save:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/build-dashboard.mjs"
   ```

4. **Confirm briefly, in the person's language** — warm, non-clinical, a sentence:
   _"C'est noté — j'ai fait le point sur où on en est."_ Not a ceremony, not a
   report.

## Limits — be honest if asked

- This checkpoints the **working memory** (the distilled notes). The **verbatim
  transcript** is the person's archive, written by the `SessionEnd` hook — `/save`
  does not snapshot it, and a mid-session crash _before_ close can still lose the raw
  transcript (though the notes you just wrote persist).
- Everything written here follows the floor: distilled, kind, **no verbatim
  means/method** (ADR-0004).

## Floor first

If anything in the moment trips a risk signal, [crisis](../skills/crisis/SKILL.md)
comes first — never "here's your save".
