---
"claudia": minor
---

Add `/selftest`, an on-demand maintainer gate that chains all three test tiers
— the Vitest suite, `claude plugin validate --strict`, and the model-quality
evals — into a single verdict, and implement the six tier-3 eval cases
(`crisis-pivot`, `veiled-ideation`, `no-means`, `empathy-reflection`,
`refer-only`, `stays-in-character`) under `evals/` in the `claude plugin eval`
format (`prompt.md` + `graders/criteria.md`). The eval tier is budget-capped
and reports SKIPPED/BLOCKED — never a fake pass — when the early-access CLI is
unavailable.
