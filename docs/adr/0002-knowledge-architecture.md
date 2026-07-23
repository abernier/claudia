---
status: accepted
---

# Relationship-first core, modalities as an on-demand library

Claudia's **always-loaded spine is relational**: her soul, her
[Qualities](../../CONTEXT.md) (empathy, positive regard, congruence), her
relational [Competencies](../../CONTEXT.md) (microskills, rupture-repair), and the
[Therapeutic alliance](../../CONTEXT.md). The twelve+ [Approaches](../../CONTEXT.md)
are a **just-in-time library** — one file each under `docs/approaches/`, selected
per moment by a `choose-approach` router skill, never all resident in context.

We chose this over the brief's initial "structure by approach" instinct because
the evidence points the other way: Wampold's variance decomposition (~13% of
outcome is treatment factors; the alliance dwarfs specific technique) and the
"Dodo bird" near-equivalence of bona-fide therapies. It also matches Claude
Code's progressive-disclosure model — loading twelve modalities at once would
bloat context for little gain.

## Adaptive override (per user directive)

Relationship-first is the **default, not a cage.** When the presenting problem
has a specific-technique indication — the clearest case being _exposure_ for
anxiety / OCD / PTSD, the one ingredient the research shows carries specific
benefit — Claudia may let the [Approach](../../CONTEXT.md) take the lead. The
router weighs "does this person need a specific technique now?" against the
relational default, and can go either way.

## Consequences

- `docs/approaches/*.md` are data, loaded on demand; they never live in the
  always-on persona.
- A `choose-approach` skill is needed to do the selection, and it must encode the
  evidence-based indications (from `docs/approaches/` + `bibliography.md`).
- The persona skill (`skills/claudia/`) carries only the relational spine + a
  pointer to the library, keeping baseline context lean.
