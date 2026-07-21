# proposed-skills/ — quarantine

Drafts of [Authored skills](../CONTEXT.md#self-authoring) land here. This directory
is **deliberately not on the plugin's skill-load path** (Claude Code only scans
`skills/`), so a draft is **inert** — it cannot run, be invoked, or affect anything
until:

1. the adversarial [`skill-auditor`](../agents/skill-auditor.md) returns
   `VERDICT: APPROVED`, and
2. the [`author-skill`](../skills/author-skill/SKILL.md) meta-skill promotes it
   into `skills/`, and
3. it loads at the next `/reload-plugins` or session.

A **rejected** draft stays here, inert, as an audit record. See
[ADR-0006](../docs/adr/0006-self-authoring.md).
