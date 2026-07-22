---
description: Maintainer gate — run all three test tiers (Vitest, strict validate, model-quality evals) and report a single verdict. Deliberate and heavy; the eval tier costs tokens.
argument-hint: "[skip-evals | ablation | case=<glob>]"
allowed-tools: Bash Read
disable-model-invocation: true
---

# /selftest

This is a **maintainer** command, not part of the therapeutic surface: it runs
the full quality gate for the plugin — deliberately, on demand, never in fast
CI. The eval tier calls the real model and **costs tokens**, which is why this
is a punctual gesture, budget-capped, and never automatic.

Run the three tiers **in order**, keep going even if an early tier fails (the
maintainer wants the whole picture), then render one verdict.

## Guard

First confirm you are in the claudia repo checkout: `.claude-plugin/plugin.json`
exists and its `name` is `"claudia"`. If not, stop and say so — this command
must be run from the repository, not from an installed copy.

## Tier 1 — deterministic suite

```
npm test
```

Exit 0 ⇒ **PASS**; anything else ⇒ **FAIL** (quote the failing test names).

## Tier 2 — strict manifest validation

```
claude plugin validate . --strict
```

Exit 0 ⇒ **PASS**; anything else ⇒ **FAIL** (quote the errors).

## Tier 3 — model-quality evals (`evals/`)

The only engine for this tier is the `claude plugin eval` CLI. If `$ARGUMENTS`
contains `skip-evals`, report the tier **SKIPPED (deliberate)** and move on.

Otherwise run (from the repo root):

```
claude plugin eval . \
  --judge-model haiku \
  --max-cost-usd 1 \
  --report evals/report.html
```

- Append `--ablation with-without` only if `$ARGUMENTS` contains `ablation`
  (the baseline arm roughly doubles the cost).
- If `$ARGUMENTS` contains `case=<glob>`, pass it through as `--case <glob>`
  for a targeted rerun.

Interpret the outcome **conservatively — never fake a pass**:

- Output contains "early access" (the run is feature-gated and did nothing) ⇒
  **SKIPPED — `claude plugin eval` not enabled in this environment**. This is
  NOT a pass.
- Exit 0 with real results ⇒ **PASS** (every case at threshold 1.0).
- Exit 1 ⇒ **FAIL** — one or more cases scored below threshold; name them and
  point to the report.
- Exit 2 ⇒ **BLOCKED** — the cost ceiling aborted the run; results are
  partial. NOT a pass.
- Any other error (subcommand missing, crash) ⇒ **SKIPPED/BLOCKED** with the
  reason. NOT a pass.

Artifacts land in `evals/report.html` and `evals/results/<timestamp>/` (both
gitignored).

## Verdict

Finish with a table — one row per tier (`PASS` / `FAIL` / `SKIPPED` /
`BLOCKED`, plus a one-line detail) — then a single overall line:

- **GATE PASS** — only if all three tiers PASS.
- **GATE FAIL** — any tier FAILed.
- **GATE INCOMPLETE** — no tier failed but tier 3 was SKIPPED or BLOCKED: the
  deterministic surface is green, and the model-quality signal is missing. Say
  that plainly; shipping on an incomplete gate is a conscious human decision,
  not a default.

Point to `evals/report.html` for the receipts. And if the human running this is
not okay — this command is tooling; `/help-now` exists.
