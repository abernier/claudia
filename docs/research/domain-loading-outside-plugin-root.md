# Loading a domain toolkit from outside the plugin root

Research note. Question: can Claude Code load a plugin's `skills/`, `commands/`,
`agents/` and `hooks/hooks.json` from a directory **outside** the plugin root —
e.g. from `~/.claudia/domains/<domain>/`?

Every finding below is tagged with how it is known:

- **[doc]** — stated in the official docs; URL cited.
- **[obs]** — observed on this machine; path or command cited.
- **[untested]** — not settled; said plainly.

Claude Code v2.1.220, macOS, 2026-07-26.

## Verdict

**No, not by configuration — yes, by filesystem.** No field in `plugin.json` or
`marketplace.json` can point at a path outside the plugin root: every component
path field is validated as relative, `./`-prefixed, no `..`, no absolute path, no
`~`, no `${VAR}`. But a directory _anywhere on disk_ that carries its own
`.claude-plugin/plugin.json` loads as a **complete plugin** — skills, commands,
agents, hooks, MCP — the moment it is reachable from a skills directory. One
symlink does it: `~/.claude/skills/psy -> ~/.claudia/domains/psy` loads as
`psy@skills-dir`. Verified end-to-end here, hook included.

For the proposed layout this means: `~/.claudia/domains/<domain>/` is viable, but
**each domain is a plugin, not a folder the chassis reads**. The domain owns a
`.claude-plugin/plugin.json`; the chassis never mounts it — a symlink (or
`--plugin-dir`) does, i.e. an install script, exactly the trick
`scripts/dev-link.sh` already uses for the whole repo. And the dependency arrow
only runs one way: a `@skills-dir` domain can require the marketplace chassis; a
marketplace chassis cannot require a `@skills-dir` domain.

## 1. Discovery mechanics

**Discovery is rooted at the plugin directory.** [doc] The components are found
by fixed directory convention under the plugin root
([plugins-reference, File locations reference](https://code.claude.com/docs/en/plugins-reference#file-locations-reference)):

| Component   | Default location             |
| ----------- | ---------------------------- |
| Manifest    | `.claude-plugin/plugin.json` |
| Skills      | `skills/`                    |
| Commands    | `commands/`                  |
| Agents      | `agents/`                    |
| Hooks       | `hooks/hooks.json`           |
| MCP servers | `.mcp.json`                  |
| Executables | `bin/`                       |

The manifest is optional: "If omitted, Claude Code auto-discovers components in
default locations and derives the plugin name from the directory name." And the
components must sit at the root, not beside the manifest — "All other directories
(commands/, agents/, skills/, workflows/, output-styles/, themes/, monitors/,
hooks/) must be at the plugin root, not inside `.claude-plugin/`." [doc]

**Indirection exists, but only within the root.** [doc] The manifest has
component path fields (`skills`, `commands`, `agents`, `hooks`, `mcpServers`,
`outputStyles`, `workflows`, `lspServers`, `experimental.*`) that redirect the
scan. `commands`/`agents`/`workflows`/`outputStyles` _replace_ the default
directory; `skills` _adds_ to it. But the constraint is flat
([Path behavior rules](https://code.claude.com/docs/en/plugins-reference#path-behavior-rules)):

> All paths must be relative to the plugin root and start with `./`

A marketplace entry can declare the same component paths inline (and with
`"strict": false` it becomes the entire definition), but the rule is unchanged —
"Paths are relative to the plugin root."
([plugin-marketplaces, Advanced plugin entries](https://code.claude.com/docs/en/plugin-marketplaces#advanced-plugin-entries))

**There is one root that is not a plugin folder you installed.** [doc] Any
directory containing `.claude-plugin/plugin.json` that sits under a _skills
directory_ becomes a plugin in place
([Skills-directory plugins](https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins)):

> Any folder under a skills directory that contains a `.claude-plugin/plugin.json`
> manifest is loaded as a plugin named `<name>@skills-dir` on the next session,
> with no marketplace and no install step. […] Unlike a marketplace install, the
> plugin is discovered in place rather than copied into the plugin cache.

The two skills directories are `~/.claude/skills/` (personal, every project) and
`<cwd>/.claude/skills/` (project, gated by the workspace trust dialog). This
in-place discovery is what makes the whole question answerable at all — see §3.

## 2. `${CLAUDE_PLUGIN_ROOT}` and manifest fields

**`${CLAUDE_PLUGIN_ROOT}` is an output, not an input.** [doc] It "Resolves to:
Absolute path to the plugin's installation directory". Nothing sets it; it is
exported to hook processes and MCP/LSP subprocesses, and substituted inline only
in: skill and agent _content_, hook and monitor _commands_, MCP `command`/`args`/
`env` (or `url`/`headers`/`headersHelper`), and LSP `command`/`args`/`env`/
`workspaceFolder`
([Environment variables](https://code.claude.com/docs/en/plugins-reference#environment-variables)).
Manifest component-path fields are **not** in that list.

**No manifest field takes an outside path. Tested.** [obs] Throwaway plugins were
built in the scratchpad and run through `claude plugin validate`:

| `plugin.json` field value                       | Result                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `"skills": "../../outside/…/skills/"`           | fail — `Path contains ".." which could be a path traversal attempt`         |
| `"skills": "/private/tmp/…/skills/"` (absolute) | fail — `skills: Invalid input`                                              |
| `"skills": "~/.claudia/domains/psy/skills/"`    | fail — `skills: Invalid input` + `Path not found: ~/.claudia/…`             |
| `"skills": "${CLAUDE_PLUGIN_ROOT}/../../…"`     | fail — `Path contains ".."` (the variable is taken literally, not expanded) |
| `"hooks": "../../outside/…/hooks.json"`         | fail — `Path contains ".."`                                                 |

The `~` case is the sharpest: the loader neither expands the tilde nor accepts the
shape — it reports both a schema error and a literal `Path not found: ~/...`. The
docs agree in the troubleshooting table: "Path errors | Absolute paths used | All
paths must be relative and start with `./`". [doc]

**And an installed plugin cannot reach outside its root at runtime either.** [doc]
([Path traversal limitations](https://code.claude.com/docs/en/plugins-reference#path-traversal-limitations))

> Installed plugins cannot reference files outside their directory. Paths that
> traverse outside the plugin root (such as `../shared-utils`) will not work after
> installation because those external files are not copied to the cache.

**`userConfig` does not open a door.** [doc] `userConfig` supports `directory` and
`file` types, so a plugin _can_ prompt the user for a path — but the value
substitutes only as `${user_config.KEY}` in MCP/LSP configs, exec-form hook
commands, and skill/agent content. It is rejected in shell-form hook commands, and
it is not a component-discovery mechanism. A hook script can read a
user-configured directory; the skills/agents/commands _scan_ cannot be pointed
there.

**Observed value of `${CLAUDE_PLUGIN_ROOT}` under a symlink mount.** [obs] For a
domain mounted as `<config>/skills/psy -> <real domain dir>`, a `UserPromptSubmit`
hook that echoed its environment recorded:

```
CLAUDE_PLUGIN_ROOT=…/isoconf/skills/psy
```

i.e. the **symlink path**, not the resolved target. Scripts referenced as
`"${CLAUDE_PLUGIN_ROOT}"/scripts/marker.sh` executed correctly through it.

## 3. Symlinks

Symlinks behave differently depending on whether the plugin is **copied into the
cache** (marketplace install) or **discovered in place** (`@skills-dir`,
`--plugin-dir`). This is the crux.

### (a) A symlinked plugin directory — works, and is already in production here

[obs] Live state on this machine:

```
$ ls -la ~/.claude/skills/
lrwxr-xr-x  claudia -> /Users/abernier/code/claudia

$ claude plugin list --json
claudia@skills-dir  user  enabled  /Users/abernier/.claude/skills/claudia
```

The claudia repo is not under `~/.claude` at all. A single symlink created by
`/Users/abernier/code/claudia/scripts/dev-link.sh` (`ln -sfn "$REPO"
"$HOME/.claude/skills/claudia"`) mounts the entire repo — persona skill, eleven
commands, `agents/skill-auditor.md`, `hooks/hooks.json`, `scripts/*.mjs` — as
`claudia@skills-dir`. `~/.claude/plugins/data/claudia-skills-dir/` exists as its
persistent data directory. Nothing was copied; `installPath` is the symlink.

[obs] Reproduced from scratch in an isolated `CLAUDE_CONFIG_DIR`, with a fake
domain built at `<scratch>/outside/domains/psy/` containing
`.claude-plugin/plugin.json`, `skills/psy-save/SKILL.md`, `commands/psy-save.md`,
`agents/psy-auditor.md`, `hooks/hooks.json` and `scripts/marker.sh`, then
symlinked in as `<config>/skills/psy`:

```
$ claude plugin details psy
psy 0.0.1
  Source: psy@skills-dir
Component inventory
  Skills (2)  psy-save, psy-save     # skills/ + commands/
  Agents (1)  psy-auditor
  Hooks (1)  UserPromptSubmit
```

And the hook is not merely _listed_ — it **fires**. A real (unauthenticated, so
model-free) `claude -p` run wrote the marker file before the session bailed on
login, proving the hook wiring is live in an ordinary session:

```
HOOK_RAN at 1785057031
CLAUDE_PLUGIN_ROOT=…/isoconf/skills/psy
```

This is the headline positive result: **an arbitrary directory outside the plugin
tree, mounted by one symlink, supplies skills + commands + agents + a per-turn
hook.**

### (b) Symlinked entries inside `skills/`

[doc] ([Share files within a marketplace with symlinks](https://code.claude.com/docs/en/plugins-reference#share-files-within-a-marketplace-with-symlinks)):

> - **Within the plugin's own directory:** the symlink is preserved […]
> - **Elsewhere within the same marketplace:** the symlink is dereferenced […]
> - **Outside the marketplace:** the symlink is skipped for security.
>
> For plugins installed with `--plugin-dir` or from a local path, only symlinks
> that resolve within the plugin's own directory are preserved. All others are
> skipped.

[obs] **The marketplace-install half is confirmed.** A local marketplace was
created with a plugin whose `skills/` held `mounted-outside -> <outside target>`
plus a normal `inside-skill`. After `claude plugin marketplace add` +
`claude plugin install` into an isolated config, the cache contains **only**
`skills/inside-skill/SKILL.md`. The escaping symlink was dropped. Since
`installPath` is the cache directory, that skill cannot load at runtime.
(Oddly, `claude plugin details chassis` still reported `Skills (2) inside-skill,
mounted-outside` — it appears to inventory the marketplace source rather than the
cache. Treat the cache as authoritative; see Open / untested.)

[obs] **The in-place half contradicts the docs.** With `--plugin-dir` (no copy),
symlinks pointing outside the plugin _were_ followed:

- `p-symdir` — `skills/psy-save -> <outside>/skills/psy-save`: skill loaded.
- `p-symtree` — the whole `skills/` **is** a symlink to `<outside>/skills`: skill
  loaded.
- `p-real` — control, real directory: same result.

So for in-place plugins the "All others are skipped" sentence does not describe
observed v2.1.220 behaviour. **Do not build on this.** It is an undocumented
divergence, it contradicts a security-framed rule, and it is exactly the kind of
thing that gets tightened in a patch release. The supported shape is (a): mount
the _whole domain_ as a plugin, not individual skills into someone else's plugin.

### What this rules out

A chassis published through the marketplace **cannot** ship a `skills/` symlink
that reaches into `~/.claudia/domains/`. The install copies to
`~/.claude/plugins/cache/…`, and a symlink outside the marketplace is skipped by
design. [doc] + [obs]

## 4. User-level `~/.claude/skills/` as a mount point

**As a plain skill directory it is a real but thin mount.** [doc]
([Where skills live](https://code.claude.com/docs/en/skills#where-skills-live))

> A `<skill-name>` entry in the enterprise, personal, or project locations can be
> a symlink to a directory elsewhere on disk. Claude Code follows the symlink and
> reads `SKILL.md` from the target directory, and if the same target is reachable
> from more than one location, Claude Code loads the skill once.

So `~/.claude/skills/psy-save -> ~/.claudia/domains/psy/skills/psy-save` works —
per skill. What it costs, compared with a plugin:

| Capability                               | Plugin skills                           | `~/.claude/skills/` skills                                                                                                      |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Namespacing                              | `psy:save`, cannot collide [doc]        | bare `/save`; collides across levels, resolved by precedence [doc]                                                              |
| Precedence                               | separate namespace                      | enterprise > personal > project; also overrides bundled skills [doc]                                                            |
| Agents (`agents/`)                       | yes, as `psy:auditor` [doc]             | no — user agents live in `~/.claude/agents/`, un-namespaced [doc]                                                               |
| Session-wide hooks (`UserPromptSubmit`)  | yes, via `hooks/hooks.json` [doc]       | no — only `hooks:` in skill frontmatter, "scoped to the component's lifecycle and only run when that component is active" [doc] |
| MCP / LSP servers                        | yes [doc]                               | no                                                                                                                              |
| Enable / disable as a unit               | `claude plugin disable psy@skills-dir`  | delete the directory, or `skillOverrides` per skill name [doc]                                                                  |
| Versioning / update                      | version + `plugin update` (marketplace) | none                                                                                                                            |
| Survives `strictPluginOnlyCustomization` | yes                                     | no — managed settings can block user-source skills entirely [doc]                                                               |
| Cowork / cloud sessions                  | repo-declared plugins install [doc]     | `~/.claude/skills/` is not read at all [doc]                                                                                    |

The hook line is decisive for Claudia. The safety floor rests on a per-turn
`UserPromptSubmit` hook (ADR-0003). A user-level skill folder cannot register one:
frontmatter hooks live and die with the skill's activation. A domain that carries
its own crisis wiring must therefore be a plugin.

**But the mount point upgrades.** [doc] Adding `.claude-plugin/plugin.json` to the
same folder turns it from a skill into a plugin, and every row above flips. That
is the escape hatch, not the plain-skill route.

**Not a mount point:** there is no settings key that adds extra skill directories.
`settings.json` has `skillOverrides`, `skillListingBudgetFraction`,
`skillListingMaxDescChars` — none of which add a path. [doc, by absence]
`permissions.additionalDirectories` explicitly does _not_ load skills; only the
`--add-dir` flag / `/add-dir` command loads `.claude/skills/` from an added
directory. [doc] Whether an `--add-dir` directory also mounts `@skills-dir`
_plugins_ is undocumented and untested here.

## 5. Does a domain have to be a plugin?

**Yes — it must carry `.claude-plugin/plugin.json`. No, it does not have to be a
_marketplace_ plugin.** That distinction is the whole finding, because the
marketplace route is the one that breaks the proposed layout.

### Shape A — domain as a `@skills-dir` plugin (fits the layout)

`~/.claudia/domains/psy/.claude-plugin/plugin.json`, symlinked to
`~/.claude/skills/psy`. [obs, verified]

- Loads as `psy@skills-dir`, in place, no cache copy, no install step.
- Skills namespace as `psy:save`; the bare `/save` also resolves unless taken. [doc]
- Agents namespace as `psy:auditor`. [doc]
- Its `hooks/hooks.json` registers session-wide events. [obs — the hook fired]
- `${CLAUDE_PLUGIN_ROOT}` points at the mount, so the domain's own scripts work.
- Turn off with `claude plugin disable psy@skills-dir`; remove by deleting the
  symlink. [doc]
- Cost: someone must create the symlink. That is a one-line installer — the repo
  already has one (`scripts/dev-link.sh`).
- Cost: no marketplace versioning, no `plugin update`, no independent release
  channel. Updating a domain means updating the files at
  `~/.claudia/domains/<domain>/`.
- Cost: project scope (`<cwd>/.claude/skills/`) is gated by the workspace trust
  dialog. [obs] From an untrusted project directory:
  `"1 project-scope plugin directory under ./.claude/skills/ was not loaded
because this workspace was not trusted when plugins were scanned."`

### Shape B — one marketplace plugin per domain (does not fit the layout)

- One entry per domain in `.claude-plugin/marketplace.json` (`"source":
"./domains/psy"`), install with `claude plugin install psy@claudia`. [doc]
- Independent versioning, `plugin update`, tags `psy--vX.Y.Z`, semver
  dependency ranges. [doc]
- **But the toolkit then lives in `~/.claude/plugins/cache/claudia/psy/<version>/`,
  not in `~/.claudia/domains/psy/`.** [doc + obs] The install copies. So Shape B
  is a fine distribution model and a poor match for "the domain lives in the
  person's own vault directory" — the two cannot both be true for the same files.

### Can the chassis depend on / activate a domain?

[doc] `plugin.json` has a `dependencies` array with semver ranges
([plugin-dependencies](https://code.claude.com/docs/en/plugin-dependencies)):

> `name` — Plugin name. **Resolves within the same marketplace as the declaring
> plugin.**

Cross-marketplace requires the root marketplace to list
`allowCrossMarketplaceDependenciesOn`.

[obs] Tested both directions in an isolated config:

- **Domain → chassis works.** `psy@skills-dir` with
  `"dependencies": ["chassis"]` was disabled with
  `Dependency "chassis" is not installed`, then became `enabled: true`
  automatically once `chassis@expmkt` was installed. A `@skills-dir` plugin
  resolves a bare dependency name against installed plugins.
- **Chassis → domain fails.** `chassis@expmkt` with `"dependencies": ["psy"]`
  errored with `Dependency "psy@expmkt" is not installed` — it resolved the name
  inside _its own marketplace_, never seeing `psy@skills-dir`. The failure also
  cascaded: `psy@skills-dir` then reported
  `Dependency "chassis" is disabled`.

So the wiring arrow is **domain → chassis**: a domain declares the chassis it
needs and stays inert until the chassis is present. The chassis cannot pull in a
`@skills-dir` domain, and cannot "activate" one at runtime — enablement is a
settings key (`enabledPlugins`), written by install/enable, not a call a plugin
can make. [doc]

### Cost summary

| Concern                    | Shape A (`@skills-dir`)                  | Shape B (marketplace)               |
| -------------------------- | ---------------------------------------- | ----------------------------------- |
| Toolkit lives in the vault | yes                                      | no — cache copy                     |
| Install step               | symlink (installer script)               | `claude plugin install psy@claudia` |
| Namespacing                | `psy:save`                               | `psy:save`                          |
| Independent update         | manual / whatever writes the vault       | `plugin update`, semver, tags       |
| Chassis can require it     | no                                       | yes (same marketplace)              |
| It can require the chassis | yes (observed)                           | yes                                 |
| Per-project selection      | project `.claude/skills/` + trust dialog | `enabledPlugins` per scope          |

## 6. Dynamic vs restart

[doc] ([Live change detection](https://code.claude.com/docs/en/skills#live-change-detection),
[Edit, reload, and disable a skills-directory plugin](https://code.claude.com/docs/en/plugins-reference#edit-reload-and-disable-a-skills-directory-plugin),
[commands](https://code.claude.com/docs/en/commands))

| Change                                                             | Applies                                             |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `SKILL.md` body under a watched skills dir                         | immediately, same session                           |
| Plugin `hooks/`, `.mcp.json`, `agents/`, `output-styles/`          | `/reload-plugins`                                   |
| `plugin.json` itself                                               | `/reload-plugins` (repo README says restart)        |
| Reload that changes which MCP tools load                           | `/reload-plugins --force` (else it warns and skips) |
| A _top-level skills directory_ that did not exist at session start | restart                                             |
| Plugin monitors                                                    | session restart                                     |
| `settings.json` hooks (not plugin hooks)                           | picked up by file watcher                           |

`/reload-plugins` is documented as reloading "plugins, skills, agents, hooks,
plugin MCP servers, and plugin LSP servers". [doc]

**Mounting a domain mid-session.** A newly created `@skills-dir` plugin is
documented to load "on the next session". [doc] The plugins-reference also says
`/reload-plugins` is the fix after changing directories, which implies it re-scans
the skills directories — but re-scanning for a _newly appeared_ plugin folder is
nowhere stated outright. **[untested]** — see below. Safe assumption for planning:
**mounting a new domain takes a restart**; editing an already-mounted domain's
`SKILL.md` is instant, and its hooks/agents need `/reload-plugins`.

**Switching domains mid-session** would mean disabling one plugin and enabling
another. `claude plugin enable/disable` writes `enabledPlugins` in settings; the
docs do not claim mid-session effect for a plugin toggle, and they do note that
"Disabling a plugin mid-session does not stop monitors that are already running".
[doc] Treat a domain switch as a restart-level operation. **[untested]**

The repo's own README table, written from experience, agrees with the doc split:
hook-logic `.mjs` edits are picked up on the next turn (they are spawned fresh),
`SKILL.md`/`commands/*.md` bodies need `/reload-plugins`, and `hooks/hooks.json`
or `plugin.json` need a restart. [obs — `README.md`, "Live / hot-reload
development"]

## Open / untested

1. **Does `/reload-plugins` discover a newly created `@skills-dir` plugin
   mid-session?** Needs an interactive authenticated session: mount a domain
   symlink while Claude Code is running, then `/reload-plugins`, then check
   `claude plugin list --json` and whether the domain's skills appear in `/`.
2. **Does disabling/enabling a domain plugin take effect mid-session?** Same
   method: `claude plugin disable psy@skills-dir` in another terminal, then
   `/reload-plugins`, then check whether the domain's hook still fires.
3. **Is symlink-following inside an in-place plugin's `skills/` supported?** The
   docs say such symlinks are skipped; v2.1.220 follows them (§3b). Settle by
   asking upstream or by watching whether it survives a few releases. Until then,
   treat it as an accident.
4. **`claude plugin details` for a marketplace install appears to inventory the
   marketplace source, not the cache** — it listed a skill that is provably absent
   from `installPath`. Possibly a reporting bug. Confirm by invoking the skill in a
   real session.
5. **Does `--add-dir <dir>` mount an `@skills-dir` plugin from
   `<dir>/.claude/skills/`?** Documented only for plain skills. `claude --add-dir
X plugin list --json` rejects the flag combination, so it needs a real session.
6. **Windows.** All symlink findings are macOS. The docs mention `mklink /D` and
   Developer Mode for the marketplace symlink case; the `@skills-dir` mount was not
   tested there.
7. **`CLAUDE_CODE_PLUGIN_SEED_DIR`** ("Path to one or more read-only plugin seed
   directories, separated by `:`") looks like a second, env-var-driven mount path
   for pre-populating plugins. Not investigated; may be relevant for a packaged
   installer.
8. **Skill-name collisions across two mounted domains** (e.g. `psy:save` and a
   future `<other>:save`, plus the bare `/save` fallback) were not exercised.

## Sources

**Documentation** (all under `https://code.claude.com/docs/en/`; the old
`docs.claude.com/en/docs/claude-code/` URLs 301 here):

- [plugins-reference](https://code.claude.com/docs/en/plugins-reference) —
  component locations, skills-directory plugins, manifest schema, path behavior
  rules, environment variables, path traversal limitations, symlink rules,
  caching, CLI reference, version management
- [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) —
  marketplace schema, plugin `source` types, relative-path rules, advanced plugin
  entries, strict mode
- [plugin-dependencies](https://code.claude.com/docs/en/plugin-dependencies) —
  `dependencies`, same-marketplace resolution,
  `allowCrossMarketplaceDependenciesOn`, enable/disable semantics, tags
- [skills](https://code.claude.com/docs/en/skills) — where skills live,
  precedence, symlinked skill entries, live change detection, skills from
  additional directories, command-name derivation, frontmatter reference
- [hooks](https://code.claude.com/docs/en/hooks) — hook configuration locations,
  "Hooks in skills and agents" (frontmatter hooks scoped to component lifecycle)
- [sub-agents](https://code.claude.com/docs/en/sub-agents) — agent locations,
  plugin agents ignore `hooks`/`mcpServers`/`permissionMode`
- [settings](https://code.claude.com/docs/en/settings) — `enabledPlugins`,
  `extraKnownMarketplaces`, `pluginConfigs`, `skillOverrides`,
  `strictPluginOnlyCustomization`
- [commands](https://code.claude.com/docs/en/commands) — `/reload-plugins`
- [env-vars](https://code.claude.com/docs/en/env-vars) — `CLAUDE_CONFIG_DIR`,
  `CLAUDE_CODE_PLUGIN_CACHE_DIR`, `CLAUDE_CODE_PLUGIN_SEED_DIR`

**Local paths inspected (read-only)**

- `/Users/abernier/.claude/skills/` — `claudia -> /Users/abernier/code/claudia`
- `/Users/abernier/.claude/plugins/installed_plugins.json`,
  `known_marketplaces.json`, `.install-manifests/claudia@claudia.json`
- `/Users/abernier/.claude/plugins/cache/`, `marketplaces/`, `data/`
  (`claudia-skills-dir/`, `claudia-claudia/`, `vercel-inline/`)
- `/Users/abernier/code/claudia/.claude-plugin/plugin.json`, `marketplace.json`
- `/Users/abernier/code/claudia/scripts/dev-link.sh`
- `/Users/abernier/code/claudia/README.md`, `CONTEXT.md`, `docs/ARCHITECTURE.md`

**Commands run** (`claude` 2.1.220). Everything that could write went through
`CLAUDE_CONFIG_DIR` pointed at the scratchpad; the real `~/.claude/settings.json`
and `~/.claude/plugins/known_marketplaces.json` were verified unchanged
afterwards.

- `claude plugin validate <dir>` — manifest path-field rejections
- `claude --plugin-dir <dir> plugin list --json` / `plugin details <name>`
- `claude plugin marketplace add <dir>`, `claude plugin install <p>@<m>` into an
  isolated config, then `find` over the cache
- `claude plugin list --json` from a project directory (trust-gate observation)
- `claude -p …` with a domain symlink mounted, to confirm the `UserPromptSubmit`
  hook fires
