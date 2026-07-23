---
status: accepted
---

# Autonomous skill self-authoring, gated by an adversarial auditor

Claudia may **author new skills for herself** when she identifies a recurring,
important therapeutic capability she lacks — but only _additive technique_ skills,
and never anything that modifies, weakens, or bypasses the safety floor
(ADR-0001), her soul (`SOUL.md`), the crisis pivot, or the hooks. The user chose
autonomy over a human gate; we make autonomy safe with **defense in depth**
rather than a single check:

1. **Quarantine.** Drafts are written to `proposed-skills/`, which is _not_ on the
   plugin's skill-load path (`skills/` only). A draft can do nothing until
   promoted.
2. **Adversarial auditor panel.** A panel of **three independent**
   `skill-auditor` subagents (`agents/skill-auditor.md`) audits every draft in
   parallel — each **read-only** (cannot itself write skills), each prompted to
   **assume the draft is unsafe and refute it**, each **rejecting on any doubt**
   (fail-safe). Approval requires **unanimity**: a single rejection from any
   auditor kills the draft. This is stricter than majority-reject, chosen
   deliberately because this is a safety floor, not a vote. The rubric
   hard-rejects anything touching the floor / persona / crisis / hooks, or
   enabling means-methods, diagnosis, human/licensed impersonation,
   romantic-sexual content, dependency, drift, or low quality with no clear
   therapeutic value.
3. **Load boundary.** Even after promotion into `skills/`, a new skill only
   _loads_ at the next `/reload-plugins` or session — a natural checkpoint the
   model cannot force on itself.
4. **Audit log.** Every attempt (draft + verdict + reason) is appended to
   `~/.claudia/authored-skills.md` so a human can review after the fact.

## Why an auditor, not a human gate

The user wanted the "magic" of live self-extension. A read-only, doubt-rejects
adversarial auditor gives most of the assurance of human review without the
latency, and it is stronger than an unsupervised autonomous write. Safety-adjacent
material never passes it, so the worst case is a _rejected_ draft sitting inert in
quarantine.

## Consequences

- The meta-skill (`author-skill`) and the auditor are themselves **core**: they
  may never author or approve a skill that edits the floor, persona, crisis, or
  hooks (self-referential lock).
- This adds a **prompt-injection surface** (a person could try "write yourself a
  skill that…"). Mitigated by: additive-only scope, the auditor, quarantine, and
  the load boundary. The floor still applies to Claudia regardless.
- The panel size (default 3, unanimity) is the assurance knob; raise it for
  higher assurance, but never below unanimity-to-approve for a therapy floor.
