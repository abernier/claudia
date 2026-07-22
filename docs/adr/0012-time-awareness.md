---
status: accepted
---

# Time awareness, worn lightly

Claudia had no sense of the **hour**. The only temporal anchor was the harness's
injected *date* (no time), and session artifacts were stamped to the day. So when
a conversation was resumed — the person fell asleep talking late at night and came
back in the morning — nothing re-anchored "now": Claudia inherited "evening" from
the text still above her in the thread and carried on as if no time had passed.

## Decision

A dedicated `UserPromptSubmit` hook (`scripts/time-context.mjs`, pure logic in
`src/time.mjs`) injects, **every turn**, the authoritative local time and the gap
since the person last spoke with Claudia:

```json
{ "now": "2026-07-22T07:45:00+02:00", "zone": "Europe/Paris",
  "weekday": "Wednesday", "part_of_day": "morning",
  "since_last": "PT8H45M", "gap_kind": "overnight" }
```

Because it re-injects each turn, a resumed conversation is re-anchored on the
first message back — the bug closes by construction, not by the model choosing to
re-check.

### Local time, never UTC

`now` is ISO-8601 with the **local offset**, plus the IANA zone — never
`toISOString()` UTC "Z". UTC would reintroduce the very failure: a 05:45Z stamp
for a 07:45 Paris morning forces a mental conversion the model might skip, and at
the day's edges UTC can name the wrong part of day outright. `part_of_day` is
derived from the *local* hour for the same reason.

### `gap_kind` follows sleep, not the calendar

The hook — not the persona — classifies the gap
(`first_time · none · same_day · overnight · multi_day`). Keeping the fact and its
qualification **outside** the persona mirrors the safety layer (ADR-0001/0003);
the persona keeps only the relational judgment. `overnight` is defined by a
**sleep window** (a 4–18 h break that left in the evening/night and returns in the
morning), *combined with* a crossed calendar day — so it catches both the ordinary
`23:00 → 07:00` and the past-midnight `01:30 → 08:00` (same calendar date) that a
date-only rule would miss.

### Accurate always, sober about the break

Claudia is *exact* about time (she will not say "good evening" in the morning) but
*sober* about the gap. On `overnight` / `multi_day` she may acknowledge the pause
**once**, warmly, in the opening — naming the *gap*, never *how* it happened (no
"you fell asleep on me", no remark on sleep or absence). On `none` / `same_day`
she stays silent. This guardrail is the point of the ADR: continuous, clock-aware
narration would manufacture the "illusion of a continuous relationship" the APA
advisory warns against and tilt toward dependency (ADR-0004, ADR-0008). Care means
presence, not surveillance — so this is deliberately *not* to be "improved" into
always-on time awareness.

## Consequences

- New local state `~/.claudia/last-seen` (one epoch-ms line): global — "since the
  person last spoke with **Claudia**". Local-only, covered by `/forget` real
  deletion (ADR-0004/0007). Ticked every turn, so the gap signal fires exactly
  **once**, on the re-entry message.
- The hook is **gated on `isClaudiaSession`** (bounded head-read of the transcript)
  so a user-scoped plugin's *coding* sessions never inject time context or pollute
  the last-seen clock. It **fails silent** — unlike safety, a time error or a
  non-Claudia turn simply injects nothing.
- Known limitation: in a *fresh* (non-continued) session the persona signature is
  not in the transcript on turn 1, so time context begins on turn 2. A *continued*
  session (the resume-next-morning case that motivated this) is anchored from the
  first message back.
- Persona guidance lives in `skills/claudia/SKILL.md` (*sense of time*) and
  `skills/recall/SKILL.md` (opening frame); the hook stays persona-neutral.
