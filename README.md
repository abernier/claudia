# Claudia — the project

This repository builds **Claudia**, a warm, generalist companion for reflection
and emotional support, distributed as an installable Claude Code plugin.

- **What Claudia is, what she does, and how to install her** —
  [`plugin/README.md`](plugin/README.md), which is also what the plugin browser
  shows on her card.
- **The landing** — <https://claudia-site-theta.vercel.app>

This file is for whoever works on the repo.

## Layout

The root is the **project**; it owns none of the three directories under it.

```
plugin/           the payload — exactly what an install copies
  structure.test.ts  the payload's own integrity check
  .claude-plugin/ plugin.json (the marketplace entry stays at the root)
  SOUL.md         who Claudia is (loaded by the persona skill)
  CONTEXT.md      the project glossary
  skills/         Claudia's capabilities
  commands/       the command surface
  agents/         the ephemeral specialists
  hooks/          the per-turn safety hook + session hooks
  src/            pure logic, and its tests beside it
  scripts/        the thin wrappers a hook, skill or command calls, + tests
  docs/           adr/ approaches/ safety/ qualities/ competencies/
                  bibliography.md memory-layout.md person-fiche-template.md
site/             the landing (its own Vite project and lockfile)
demo/             the recording rig and its fixture vault
docs/             maintainer material: ARCHITECTURE.md, agents/
scripts/          repo tooling: dev-link, dev-unlink, sync-version, and the
                  release-notes extractor over its own pure changelog.mjs
```

**What goes down and what stays up:** what addresses Claudia or the person goes
into `plugin/`; what addresses the maintainer or the agent that codes stays at
the root. Tests are the one deliberate exception — a test lives beside the module
it covers, which outranks the rule and costs 196 KB in the payload.

`plugin/` is not merely a folder — it is the published tarball, and there is no
exclude mechanism anywhere in the install path (no `.claudeignore`, no
`ignorePatterns`, no `files` field), so the directory is the only boundary
available. `plugin/structure.test.ts` asserts the consequences that matter:
no `package.json` under `plugin/`, nothing above the installer's 50:1 compression
ratio, and every `${CLAUDE_PLUGIN_ROOT}` path it cites resolving.

## Development

The plugin itself needs no runtime dependencies. Tests (Vitest) cover the
deterministic logic — the safety classifier, session archiving, and repo
integrity — plus a deterministic "simulated conversation" that runs scripted
turns through the real safety/archiving pipeline (no model call). The model's
natural-language _quality_ is out of scope here; that belongs in a separate,
non-deterministic eval.

```
npm install
npm test          # vitest run
npm run test:watch
```

Pure logic lives in `plugin/src/` (imported by the thin hook wrappers in
`plugin/scripts/`), so it is unit-testable without spawning a process or calling
a model. **A test sits beside the file it covers** — `plugin/src/safety.mjs`
and `plugin/src/safety.test.ts`, and so on — which is the same collocation rule
ADR-0022 already applies to shared types. There is no `tests/` directory on
either side of the boundary. The payload's tests are therefore published with
it — a deliberate trade for keeping each directory self-contained, and cheap:
163 KB, nothing in them anywhere near the installer's compression cap.

### Live / hot-reload development (edit without reinstalling)

A CLI install is a cached, versioned copy, so repo edits don't show up until you
bump the version and update. For development, **link the payload in place**
instead: Claude Code then loads it live from your working tree as
`claudia@skills-dir`, and your edits are picked up with no reinstall.

```
./scripts/dev-link.sh        # symlink plugin/ into ~/.claude/skills (hot, in place)
./scripts/dev-unlink.sh      # revert to the packaged install
```

The link points at `plugin/`, not at the repo — so what you develop against is
shaped exactly like what an install copies.

`dev-link.sh` also removes any cached CLI install first, to avoid duplicate hooks.
How "hot" each edit is:

| You changed                                | To apply                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `plugin/scripts/*.mjs`, `plugin/src/*.mjs` | nothing — run fresh on the next turn / session end              |
| `SOUL.md`                                  | re-invoke the `claudia` skill (new session) — it's read on load |
| a `SKILL.md` / `commands/*.md` body        | `/reload-plugins`                                               |
| `plugin/hooks/hooks.json` or `plugin.json` | restart Claude Code                                             |

Ship for real with the marketplace install ([`plugin/README.md`](plugin/README.md));
use the link for dev.

### Releasing (semver via changesets)

Versioning uses [changesets](https://github.com/changesets/changesets), kept in
sync across `package.json`, `plugin/.claude-plugin/plugin.json`, and the
marketplace entry at the repo root:

1. `npx changeset` — describe the change and pick a bump (patch / minor / major).

   **Write it for the person using Claudia, not for a contributor.** The body becomes
   the GitHub Release notes verbatim, so: what changed, and what it means for them —
   then cite the ADR by number for the _why_. Do not re-argue the decision here; the
   ADR already carries it, in full, and duplicating it is what turned v0.11.0 into
   ~1,960 words of unbroken prose. One to three sentences per point, a short bold
   lead, and a `**Digest.**` line at the top of the version section summarising the
   release in one sentence. `scripts/changelog.test.ts` caps a changeset at 150 words.

2. `npm run release:version` — bumps `package.json` + writes `CHANGELOG.md`, then
   syncs the version into both manifests (`scripts/sync-version.mjs`).
3. Review, commit, push. Tag the release: **`claude plugin tag plugin --push`**
   (creates `claudia--vX.Y.Z` and pushes it). The path argument is required —
   the manifest lives under `plugin/` now, and a bare `claude plugin tag` looks
   for `.claude-plugin/plugin.json` at the repo root and fails.

Pushing the tag triggers `.github/workflows/release.yml`, which publishes the
GitHub Release automatically — titled `vX.Y.Z`, with the notes taken
from the matching `CHANGELOG.md` section (`scripts/changelog-extract.mjs`). The
tag's own message is annotation only; it no longer becomes the title, so what the
release _means_ is said once, in its `**Digest.**` line. No
manual `gh release create`.

Installed users update with `claude plugin update claudia@claudia`.
