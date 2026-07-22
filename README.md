# Claudia

A warm, immersive, **generalist** companion for reflection and emotional support —
as an installable Claude Code plugin. Claudia draws on techniques from
evidence-based psychotherapy (person-centered, CBT, behavioral activation, ACT,
motivational interviewing, solution-focused, mindfulness & self-compassion) and
adapts to the person in front of her.

> **Claudia is not a licensed clinician, not therapy, and not a medical device**,
> and never claims to be. She is a companion for reflection and support — not a
> substitute for professional care or emergency services. She rests on a
> non-negotiable [safety floor](docs/adr/0001-safety-floor.md).

## What makes Claudia different

- **Relationship first.** The evidence says the therapeutic bond drives outcomes
  more than any technique (Wampold, 2015). Claudia's always-on core is
  relational — empathy, positive regard, alliance — and the modalities are a
  toolbox she reaches into when indicated. See [ADR-0002](docs/adr/0002-knowledge-architecture.md).
- **Immersion with a floor.** Warm and in-character by default — no infantilising
  disclaimers — but a deterministic safety layer runs on every turn and a
  [crisis pivot](docs/safety/) surfaces real human help when danger is detected.
- **Natural-language first.** Only three slash commands exist (all
  system/safety/privacy actions). Everything therapeutic happens in ordinary
  conversation. See [ADR-0003](docs/adr/0003-plugin-runtime-shape.md).
- **Your data, your machine.** Memory lives under `~/.claudia/` on your own
  computer. Nothing is uploaded. See [ADR-0004](docs/adr/0004-memory-model.md).
- **Speaks your language.** The codebase is English; Claudia speaks *your*
  language and writes her deliverables in it. See [ADR-0005](docs/adr/0005-language-policy.md).

## Commands

Claudia deliberately ships only three commands — the rest is conversation:

| Command | What it does |
|---|---|
| `/help-now` | Immediately surface crisis resources for your region. |
| `/forget` | Really delete a memory, a session, or everything. |
| `/export` | Export your memory and deliverables. |

## Install (CLI)

The repo is its own single-plugin marketplace, so you install it in two steps:
register the marketplace, then install the plugin.

**From a local checkout** (works today):

```
git clone https://github.com/abernier/claudia && cd claudia
claude plugin marketplace add .            # register the local marketplace
claude plugin install claudia@claudia --scope user
```

**From GitHub** (once published):

```
claude plugin marketplace add abernier/claudia
claude plugin install claudia@claudia --scope user
```

Then start a **new session** and just talk. Manage it with:

```
claude plugin list
claude plugin update claudia@claudia       # pull a new version
claude plugin uninstall claudia@claudia
claude plugin validate . --strict          # validate before publishing
```

> ⚠️ A CLI install is a **cached, versioned copy** — it will **not** pick up your
> repo edits until you bump `version` in `plugin.json` and run `update`. If you're
> developing the plugin, use the live / hot-reload setup below instead.

## Reaching Claudia

Once installed, in any new session:

- **Just name her or open up.** "Claudia, can we talk?", "@Claudia, I've had a
  hard week", or simply sharing what's on your mind activates the persona.
- **Guaranteed entry:** type `/` and pick **Claudia** (`claudia:claudia`) from the
  menu.

Claudia runs in your **main session** — deliberately *not* as an `@`-mentioned
subagent. An `@`-mention targets a subagent, which would run *outside* the
per-turn safety hook; the whole point is that Claudia stays where that safety
layer applies. So there is no `@Claudia` agent — name her in plain language
instead, and the persona comes to you.

## Repository layout

```
.claude-plugin/   plugin.json + marketplace.json (manifests)
SOUL.md           who Claudia is (loaded by the persona skill)
CONTEXT.md        the project glossary
docs/
  adr/            the decisions and why
  qualities/      how Claudia is (empathy, positive regard, congruence)
  competencies/   what Claudia does (microskills, alliance, rupture-repair)
  approaches/     the modality library (loaded just-in-time) + refer-only list
  safety/         crisis protocol, C-SSRS logic, localized resources, classifier
  bibliography.md the evidence base
skills/           Claudia's capabilities
commands/         the three commands
hooks/            the per-turn safety hook + session-save hook
```

## Development

The plugin itself needs no runtime dependencies. Tests (Vitest) cover the
deterministic logic — the safety classifier, session archiving, and repo
integrity — plus a deterministic "simulated conversation" that runs scripted
turns through the real safety/archiving pipeline (no model call). The model's
natural-language *quality* is out of scope here; that belongs in a separate,
non-deterministic eval.

```
npm install
npm test          # vitest run
npm run test:watch
```

Pure logic lives in `src/` (imported by the thin hook wrappers in `scripts/`), so
it is unit-testable without spawning a process or calling a model.

### Live / hot-reload development (edit without reinstalling)

A CLI install is a cached, versioned copy, so repo edits don't show up until you
bump the version and update. For development, **link the repo in place** instead:
Claude Code then loads it live from your working tree as `claudia@skills-dir`, and
your edits are picked up with no reinstall.

```
./scripts/dev-link.sh        # symlink the repo into ~/.claude/skills (hot, in place)
./scripts/dev-unlink.sh      # revert to the packaged install
```

`dev-link.sh` also removes any cached CLI install first, to avoid duplicate hooks.
How "hot" each edit is:

| You changed | To apply |
|---|---|
| `scripts/*.mjs`, `src/*.mjs` (hook logic) | nothing — run fresh on the next turn / session end |
| `SOUL.md` | re-invoke the `claudia` skill (new session) — it's read on load |
| a `SKILL.md` / `commands/*.md` body | `/reload-plugins` |
| `hooks/hooks.json` wiring or `plugin.json` | restart Claude Code |

Ship for real with the marketplace install (README top); use the link for dev.

### Releasing (semver via changesets)

Versioning uses [changesets](https://github.com/changesets/changesets), kept in
sync across `package.json`, `plugin.json`, and the marketplace entry:

1. `npx changeset` — describe the change and pick a bump (patch / minor / major).
2. `npm run release:version` — bumps `package.json` + writes `CHANGELOG.md`, then
   syncs the version into both manifests (`scripts/sync-version.mjs`).
3. Review, commit, push. Tag the release: `claude plugin tag` (creates
   `claudia--vX.Y.Z`), then `git push --tags`.

Pushing the tag triggers `.github/workflows/release.yml`, which publishes the
GitHub Release automatically — title from the annotated tag's subject line, notes
from the matching `CHANGELOG.md` section (`scripts/changelog-extract.mjs`). No
manual `gh release create`.

Installed users update with `claude plugin update claudia@claudia`.

## Safety

If you or someone else is in immediate danger, contact your local emergency
number (112 in the EU, 911 in the US/Canada) or a crisis line (988 in the
US/Canada; Samaritans 116 123 in the UK; find your country at
<https://findahelpline.com>). Claudia is not an emergency service.

Claudia is **not a medical device** and gives no medical advice, diagnosis, or
treatment; it is provided as-is (see [LICENSE](LICENSE)). To report a safety
concern or a vulnerability, see [SECURITY.md](SECURITY.md).
