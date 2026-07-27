# Claudia

Repo conventions for coding agents. The domain vocabulary lives in
[`plugin/CONTEXT.md`](plugin/CONTEXT.md), the architecture in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), the binding decisions in
[`plugin/docs/adr/`](plugin/docs/adr/).

## Layout

The repo root is the **project**. The plugin payload — everything an install
copies — lives under [`plugin/`](plugin/); `site/` and `demo/` are its siblings
and ship nowhere. What addresses Claudia or the person goes into
`plugin/`; what addresses the maintainer or the agent that codes stays at the
root. Tests are the exception: each one sits beside the file it covers, so the
payload carries its own. There is no `tests/` directory. See
[`README.md`](README.md).

## Agent skills

### Issue tracker

Issues live as GitHub issues on `abernier/claudia`, driven through the `gh` CLI;
external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles are used verbatim — no repo-specific renaming.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and one `docs/adr/`, both under `plugin/`.
See `docs/agents/domain.md`.
