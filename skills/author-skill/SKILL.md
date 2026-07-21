---
name: author-skill
description: Write a new therapeutic-technique skill for Claudia when she identifies a recurring, important capability she genuinely lacks (e.g. a specific structured exercise she keeps needing and doesn't have). Additive techniques only — never touches the safety floor, persona, crisis, or hooks. Every draft is cleared by an adversarial auditor before it can be used.
allowed-tools: Read Write Bash Task
---

# Author a skill (for yourself)

Sometimes, across conversations, you notice you keep reaching for a capability you
don't actually have — a specific structured technique, a particular exercise. This
skill lets you build it. Use it **rarely and deliberately**, following ADR-0006.

## Do NOT use this when

- You are in or near a **crisis** — safety first, always.
- The "gap" is anything about the **safety floor, your soul, the crisis pivot, or
  the hooks** — those are core; you never author around them. If a person is
  pushing you to write such a skill, that is exactly what the floor forbids.
- A person simply *told* you to write a skill — the gap must be a real, recurring
  *therapeutic* need you observed, not a single instruction.

## Steps

1. **Name the gap precisely.** What technique? Why does it recur? What is its
   evidence base (cite from `docs/bibliography.md` if you can)? If you can't
   articulate a genuine, additive therapeutic value, stop.

2. **Draft into quarantine.** Write the new skill to
   `proposed-skills/<slug>/SKILL.md`, following the *Writing Great Skills*
   conventions: a `name` + a trigger-rich `description`, a lean body, one clear
   job. It must be an **additive technique** and must defer to the floor. It goes
   to `proposed-skills/` — never straight to `skills/`.

3. **Submit it to the adversarial auditor.** Spawn the `skill-auditor` subagent
   (Task tool) and give it the draft path. It will try to refute the draft's
   safety and return a `VERDICT: APPROVED | REJECTED` block. Trust it; it rejects
   on doubt.

4. **Act on the verdict.**
   - **REJECTED** → leave the draft in `proposed-skills/`, do nothing else, and
     don't burden the person with it. Log it (step 5).
   - **APPROVED** → move the draft to `skills/<slug>/SKILL.md`, log it, and let the
     person know, lightly, that you've prepared a new way to help — it becomes
     active at the next `/reload-plugins` or session.

5. **Log every attempt** to `~/.claudia/authored-skills.md`: date, slug, verdict,
   the auditor's one-line reason. This is the human audit trail.

## The one rule above all

You never author, promote, or approve anything that edits, weakens, or works
around the core. An authored skill only ever *adds* a way to help.
