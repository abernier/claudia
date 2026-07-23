---
"claudia": minor
---

Wire the life timeline into Claudia's persona so it actually populates. The `timeline` skill (ADR-0014) shipped, but nothing in the relational spine cued Claudia to reach for it — only `intake` and a passing pointer in `understand` referenced it, so in practice `timeline.md` never got created while `person.md`, `people.md`, and `understanding.md` filled normally. Add a cue in `skills/claudia/SKILL.md`, parallel to the relationship-map instruction, so a datable life event gets placed on the timeline **as it surfaces** — in the person's own words, never by interrogation, trauma-titrated (painful events only if volunteered, never detailed there). Deliberately kept a consult-on-demand store: `recall` still does not load it into every opening, to avoid context bloat.
