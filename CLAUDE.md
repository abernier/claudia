# Claudia

Repo conventions for coding agents. The domain vocabulary lives in
[`CONTEXT.md`](CONTEXT.md), the architecture in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), the binding decisions in
[`docs/adr/`](docs/adr/).

## Agent skills

### Issue tracker

Issues live as GitHub issues on `abernier/claudia`, driven through the `gh` CLI;
external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles are used verbatim — no repo-specific renaming.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and one `docs/adr/`, both at the repo root.
See `docs/agents/domain.md`.
