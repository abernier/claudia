# How skills.sh ships a distributable unit

Research note. Question: how does `npx skills` (the skills.sh CLI) ship a unit someone
else can install, and what of it transposes to a **domain**?

Every finding below is tagged with how it is known:

- **[doc]** — stated in official documentation; URL cited.
- **[src]** — read in the CLI's own source, `vercel-labs/skills` at tag `v1.5.20`; file
  and symbol cited.
- **[obs]** — observed on this machine; path cited.
- **[untested]** — not settled; said plainly.

`skills` CLI v1.5.20 (published 2026-07-22), Agent Skills spec as of 2026-07-26.
The CLI is MIT, GitHub `vercel-labs/skills`, catalogued at <https://skills.sh>.

## Verdict

**skills.sh ships one thing: a folder with a `SKILL.md` in it.** There is no unit larger
than a skill. A repository that is a Claude Code plugin gets _read_ — the CLI parses
`.claude-plugin/plugin.json` and `marketplace.json` to find more skills — but what it
installs is still the individual skill folders, one at a time, and the plugin name is kept
only as a **display grouping**. [src `plugin-manifest.ts`, `add.ts:1219`, `list.ts:183`]
A plugin's `hooks/`, `agents/`, `commands/` are never installed.

So `npx skills add` **cannot install a domain**, and never will without a change of shape:
a domain carries hooks, agents, commands, a persona and a safety floor, and skills.sh has
no representation for any of that. Its relevance to this map is as **prior art**, not as a
delivery mechanism — the delivery mechanism is the plugin path that
[#8](https://github.com/abernier/claudia/issues/8) already settled.

As prior art it is worth a lot, and it corroborates two decisions already on the map:

- Its install mechanism is **one canonical copy plus a symlink per host** — the same trick
  #8 landed on for mounting a vault-resident domain. Two independent designs converged.
- Its update is a **destructive re-copy** of the unit folder. That ratifies the two-roots
  rule from the other side: a toolkit root can only be safely updated if it holds no
  person's data.

And it warns about three things a domain must do _differently_: it has **no version
concept at all**, a **flat global namespace where a name collision silently overwrites**,
and **zero verification at install time** — with the confirmation prompt automatically
skipped when the installer detects it is running inside an agent.

---

## 1. What the unit is

**A skill is a directory whose only required member is `SKILL.md`.** [doc]
Everything else is convention: [doc, [spec](https://agentskills.io/specification)]

```
skill-name/
├── SKILL.md          # required: frontmatter + instructions
├── scripts/          # optional: executable code
├── references/       # optional: documentation
├── assets/           # optional: templates, resources
└── ...               # any additional files or directories
```

The "any additional files" is real, not aspirational: install copies the source directory
**verbatim and recursively**, excluding only `metadata.json`, `.git`, `__pycache__` and
`__pypackages__`. [src `installer.ts` `EXCLUDE_FILES` / `EXCLUDE_DIRS` / `copyDirectory`]
File modes are preserved (`chmod(destPath, sourceStats.mode & 0o777)`), so a script that
was executable in the repo arrives executable on disk. [src `installer.ts:495`] Symlinks
inside a skill are dereferenced — copied as their target, not as links — and broken ones
are skipped with a warning rather than failing the install. [src `installer.ts:487-508`]

There is **no archive format, no tarball, no package**. The unit is a directory in a git
repository, and the transport is `git clone`. [src `git.ts`, `add.ts`]

### The unit has no container

This is the finding that decides the ticket. The CLI knows about plugins in exactly two
places, and both are read-only:

- `getPluginSkillPaths()` reads `.claude-plugin/marketplace.json` and
  `.claude-plugin/plugin.json` to learn **where else to look for `SKILL.md` files**. It
  returns search directories. [src `plugin-manifest.ts`]
- `getPluginGroupings()` reads the same files to build a `Map<skillDir, pluginName>`, used
  to print skills under a heading in the picker and in `skills list`, and stored as an
  optional `pluginName` string in the lock file. [src `plugin-manifest.ts`, `add.ts:1219`,
  `list.ts:183`, `skill-lock.ts:37`]

Nothing else in the codebase consumes `pluginName`. There is no install of a plugin, no
resolution of a plugin's hooks or agents, no plugin-level version, no plugin-level
removal. [src — searched `src/*.ts`; `hooks` appears nowhere outside the README's
compatibility table]

## 2. What the unit declares about itself

The declaration is the YAML frontmatter of `SKILL.md`. The Agent Skills spec — originally
Anthropic's, now an open standard at <https://agentskills.io> — defines the whole of it:
[doc]

| Field           | Required | Constraint                                                                                                            |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `name`          | yes      | 1–64 chars, lowercase `a-z0-9` and `-`, no leading/trailing hyphen, no `--`, **must match the parent directory name** |
| `description`   | yes      | 1–1024 chars, non-empty; what it does _and_ when to use it                                                            |
| `license`       | no       | license name, or a reference to a bundled license file                                                                |
| `compatibility` | no       | ≤500 chars, **free text**: intended product, system packages, network access                                          |
| `metadata`      | no       | arbitrary string→string map                                                                                           |
| `allowed-tools` | no       | space-separated pre-approved tools (experimental)                                                                     |

The CLI reads a strict subset: `name`, `description`, and `metadata.internal` (a boolean
that hides the skill from discovery unless `INSTALL_INTERNAL_SKILLS=1`). [doc README;
src `skills.ts`] It parses frontmatter with a deliberately minimal YAML-only parser that
**refuses `---js` / `---javascript` blocks**, with the reason stated in the source: to
avoid the `eval()`-based RCE that gray-matter's JS engine allows. [src `frontmatter.ts`]

Two things are notably absent from the format:

- **There is no `version` field.** The spec's own example smuggles one into the free-form
  `metadata` map (`metadata: { version: "1.0" }`), which is arbitrary client data that the
  CLI never reads. [doc spec; src]
- **There is no machine-readable compatibility gate.** `compatibility` is a prose string
  for a human or a model to read. Nothing validates it, and the CLI never looks at it.
  The README's per-agent feature matrix (`allowed-tools`, `context: fork`, hooks) is hand-
  maintained documentation, not a check. [doc README; src]

The CLI's actual model of "which host can run this" lives on the _installer_ side, not in
the unit: a registry of ~75 agent types, each with a project `skillsDir` and an optional
`globalSkillsDir`. [src `agents.ts`, `types.ts` `AgentType`] Compatibility is the
installer's knowledge of where files go, never the unit's declaration of what it needs.

## 3. Versions, refs, and how "up to date" is decided

**There is no version resolution anywhere in the CLI.** The three mechanisms that stand in
for it:

**Address.** A source is a git location: `owner/repo` shorthand, a full GitHub or GitLab
URL, `git@…`, or a local path. Optional refinements: a subpath (`owner/repo/path/to/skill`
or a `/tree/<ref>/<path>` URL), a skill filter (`owner/repo@skill-name`), and a ref
fragment (`owner/repo#v2` — and `#ref@skill` combines both). [src `source-parser.ts`;
doc README] GitHub is the registry; skills.sh is a catalogue over it, not a gatekeeper.

**Pinning.** The lock records the `ref` used at install, and update re-fetches at that same
ref. [src `skill-lock.ts` `SkillLockEntry.ref`; `update.ts:344,382,588`] So a **tag pins
and a branch floats** — the only pinning primitive is git's, and by default (no fragment)
you are on the default branch, floating.

**Freshness.** Not a version comparison — a content hash comparison:

- Global installs store `skillFolderHash`, the **GitHub tree SHA of the skill folder**,
  fetched via the Trees API; it changes when any file in the folder changes.
  [src `skill-lock.ts:26-31`, `blob.ts`]
- Project installs store `computedHash`, a **SHA-256 over the files on disk**, because the
  project lock is meant to be diffable and checked in. [src `local-lock.ts`]

`update` re-clones (or re-reads the tree), compares hashes, and reinstalls what differs.
[src `update.ts:374,411`] When a skill cannot be checked at all, the CLI prints a reason;
the catch-all string is literally `'No version tracking'`. [src `update.ts:183`]

### The two lock files

|                 | global                                                                     | project                          |
| --------------- | -------------------------------------------------------------------------- | -------------------------------- |
| Path            | `~/.agents/.skill-lock.json`, or `$XDG_STATE_HOME/skills/.skill-lock.json` | `<project>/skills-lock.json`     |
| Schema version  | 3                                                                          | 1                                |
| Checked in?     | no (machine state)                                                         | **yes, by design**               |
| Freshness field | `skillFolderHash` (GitHub tree SHA)                                        | `computedHash` (SHA-256 of disk) |
| Timestamps      | `installedAt`, `updatedAt`                                                 | **none**, deliberately           |
| Also holds      | `dismissed` prompts, `lastSelectedAgents`                                  | nothing                          |

[src `skill-lock.ts`, `local-lock.ts`]

The project lock's design note is worth quoting, because it is a distribution decision
disguised as a formatting one: _"Intentionally minimal and timestamp-free to minimize merge
conflicts. Two branches adding different skills produce non-overlapping JSON keys that git
can auto-merge cleanly."_ [src `local-lock.ts:8-12`] Entries are sorted alphabetically on
write for the same reason.

An old global lock is **wiped, not migrated**: `readSkillLock()` returns an empty lock
whenever `version < CURRENT_VERSION`. [src `skill-lock.ts:94`] The installed skills stay on
disk; only the record of where they came from is lost.

[obs] This machine's lock, `~/.agents/.skill-lock.json`, is version 3 with 41 skills, 40
from `mattpocock/skills` and one from `vercel-labs/skills`; 23 carry
`pluginName: "mattpocock-skills"`. No entry has a `ref` — everything is floating on a
default branch.

## 4. Install: where files land

Two layers, and the second is optional.

**Canonical copy.** `<root>/.agents/skills/<sanitized-name>/`, where root is the project
directory or `~` with `-g`. [src `installer.ts` `getCanonicalSkillsDir`, `constants.ts`]
The directory is `rm -rf`'d and recreated before the copy. [src `installer.ts`
`cleanAndCreateDirectory`]

**Per-host symlink.** For each selected agent, a symlink at that agent's skills directory
pointing at the canonical copy — relative on POSIX, a junction on Windows.
[src `installer.ts:251-258`] So on this machine:

```
~/.claude/skills/wayfinder -> ../../.agents/skills/wayfinder
```

[obs — `~/.claude/skills/` holds 38 such links, all into `~/.agents/skills/`]

Refinements, all in `installer.ts`:

- **Universal agents** — those whose skills directory _is_ `.agents/skills` (Amp, Cursor,
  Codex, Gemini CLI, Copilot, Cline, Zed…) — get no symlink; the canonical copy is already
  their path, _"which prevents redundant symlinks and double-listing of skills"_.
  [src `agents.ts:845` `isUniversalAgent`, `installer.ts:113-119,362`; doc README agent table]
- `--copy` skips the canonical layer and copies independently per agent, for filesystems
  without symlinks. A failed symlink falls back to a copy and warns. [src
  `installer.ts:336,393`]
- At project scope, an agent whose config directory does not exist is skipped rather than
  created — **except `claude-code`, which is always linked**. [src `installer.ts:374-388`]
- Scope: project by default, `~` with `-g`. [doc README]

Nothing is written outside these directories and the lock file.

## 5. Update and removal

**Update** = re-fetch at the recorded ref, compare hash, reinstall. Because reinstall calls
`cleanAndCreateDirectory`, an update **destroys the installed folder and rewrites it**.
[src `installer.ts:359`] Any local edit inside an installed skill is lost. This is
correct for a stateless unit and a landmine for a stateful one.

**Removal** (`skills remove`, alias `rm`): [src `remove.ts`]

1. Scans every known agent directory — all ~75, not only detected ones, explicitly _"to
   ensure ghost symlinks are cleaned up"_ — and deletes the skill's symlink or copy at
   each. [src `remove.ts:182-185`]
2. Deletes the canonical copy **only if no remaining installed agent still points at it**,
   so removing from one agent does not break another. [src `remove.ts:262-279`]
3. Deletes the lock entry (global or project, per scope).
4. `--all` also sweeps **stale lock entries whose folder is already gone**. [src
   `remove.ts:120-128`]

What is left behind: nothing of the unit itself. But the CLI has **no concept of data a
skill produced**. Anything a skill wrote outside its own folder — state, config, output —
is invisible to it and survives removal, unmentioned.

## 6. Namespacing and collisions

**The namespace is flat and global per scope, and the key is the frontmatter `name`,
sanitized.** `sanitizeName()` lowercases, replaces every run of characters outside
`[a-z0-9._]` with a single `-`, strips leading/trailing dots and hyphens, truncates to 255
chars, and falls back to `unnamed-skill`. [src `installer.ts:50-65`] It is a security
control as much as a naming one: `../` becomes `-`.

Consequences:

- **Two skills named `save` from two different sources collide.** The second overwrites the
  first. The CLI computes which agents would be overwritten and prints
  `overwrites: <agents>` in the pre-install summary, then asks for confirmation.
  [src `add.ts:797-832`] It is a warning, not a refusal.
- **Plugin-scoped names are flattened.** A skill named `ce:review` becomes the folder
  `ce-review` while the lock keeps the raw key `ce:review` — `remove.ts` carries an
  explicit note about reconciling the two. [src `remove.ts:26-38`] So the plugin prefix
  survives only as characters in a name, never as a real namespace.
- **Discovery shadows by first-seen name.** Within a source repo, `discoverSkills()` keeps
  a `seenNames` set; the first skill found with a given name wins and later ones are
  dropped, with shallower locations searched first. [src `skills.ts:179,269-273`]

## 7. What is verified at install time, and how trust is framed

**Nothing about the content is verified.** No signatures, no publisher identity, no
checksum against a registry, no allowlist, no scanning. The hash in the lock is written
_after_ install, to detect drift later — it is not checked against anything at install.

Trust is entirely _"you typed the owner/repo"_. The hardening that does exist is
defensive-by-construction, not verification:

- YAML-only frontmatter parsing, refusing `---js` to avoid eval-based RCE.
  [src `frontmatter.ts`]
- Path-traversal containment in three places: subpaths (`sanitizeSubpath`, rejecting `..`
  segments), plugin manifest paths (`isContainedIn` + a rule that declared paths must start
  with `./`), and install names (`sanitizeName`).
  [src `source-parser.ts:106`, `plugin-manifest.ts:8,19`, `installer.ts:50`]
- Git protocol allowlist and a clone timeout. [src `git.ts:10-11`]

Two facts sharpen the trust picture:

- **The confirmation is auto-skipped inside an agent.** Both `add` and `remove` call
  `detectAgent()` and, if they are running inside one, set `options.yes = true` and say so:
  _"Agent detected — installing non-interactively"_. [src `add.ts:1056-1079`,
  `remove.ts:63-71`] So a skill installed by an agent never shows a human the
  `overwrites:` warning that a human at a terminal would have seen.
- **File modes are preserved on copy**, so executable scripts inside an unverified unit
  arrive executable. [src `installer.ts:495`]

Telemetry is on by default (auto-disabled in CI, opt-out via `DISABLE_TELEMETRY` or
`DO_NOT_TRACK`). [doc README] `gh auth token` is spawned only as a last resort after an
unauthenticated request hits a rate limit, with a one-time notice, because that subprocess
call is flagged by some corporate endpoint security tools as credential extraction.
[src `skill-lock.ts:134-178`]

---

## 8. What transposes to a domain

### Transposes

**The folder is the unit, and its manifest is a file inside it.** No external index, no
registry entry required, no build step. A domain is already specified this way; skills.sh
is evidence the shape holds up across ~75 hosts.

**A tiny, load-bearing declaration.** `name` + `description`, where the description is what
the agent reads at startup to decide relevance — progressive disclosure. The same
constraint applies to a domain: whatever the chassis reads to _pick_ a domain is paid for
in every session's context, so it must stay small.
[→ [What a domain declares about itself](https://github.com/abernier/claudia/issues/15),
[Who picks the active domain, and when](https://github.com/abernier/claudia/issues/12)]

**Git as the registry, `owner/repo` as the address, local path as a first-class source.**
Exactly the install path this map keeps in scope, and it needs nothing built: a git URL and
a local path cover third-party domains without a registry.
[→ [Installing a domain from a path or a URL](https://github.com/abernier/claudia/issues/16)]

**One canonical copy, one symlink per host.** skills.sh converged independently on the
mechanism #8 arrived at for mounting a vault-resident domain. That is corroboration: the
symlink mount is a known-good pattern at scale, not a trick.

**An install record: source, ref, content hash, timestamps.** And the split is instructive
— a merge-friendly checked-in lock for the shared thing, a machine-local lock for machine
state. A domain install wants the same record, but the analogous split is different: a
domain is installed **per person**, not per project, so its record belongs in the vault.
[→ #16]

**The sanitization rules, verbatim.** Name sanitization, `..` rejection in every declared
path, `./`-prefix requirement, YAML-only frontmatter. A domain install script should copy
these rather than re-derive them.

**Destructive update ratifies the two-roots rule.** skills.sh can `rm -rf` and re-copy an
installed unit precisely because the unit holds no state. A domain toolkit root can only
afford that same simple update if the person's artifacts live elsewhere — which is the
rule the map already fixed. Evidence for an existing decision, from the opposite direction.

### Does not transpose

**There is no unit larger than a skill, so this is not a delivery mechanism.** A domain
carries hooks, agents, commands, a persona and a safety floor; `npx skills add` installs
none of those. Whatever a domain install looks like, it is not `npx skills add`.

**No version, no compatibility gate — a domain needs both.** The format has none; pinning
is git-ref-only; freshness is a folder-hash diff. A domain that ships a **safety floor**
cannot be "whatever is on the branch today", and a chassis cannot silently run a domain
built against an older contract. skills.sh offers **no prior art here at all** — the prior
art is `plugin.json`, which has a real `version` that _pins_ (omit it and Claude Code falls
back to the commit SHA, so every commit is a new version) and a `dependencies` array taking
semver ranges. [doc [plugins-reference](https://code.claude.com/docs/en/plugins-reference)]
That contrast is the sharpest thing this research hands to #15 — and it collides directly
with the trade-off in
[#19](https://github.com/abernier/claudia/issues/19): a vault-resident domain gets no
version machinery from the plugin system either, so someone has to write it.

**A flat namespace where a collision silently overwrites.** Two domains are far more likely
to collide than two skills: every domain wants to own `save`, `config`, `backup`. Under
"exactly one active domain" the runtime collision is sidestepped, but the _toolkit root_
(`~/.claudia/domains/<domain>/`) makes it a directory-name collision at install time, and
skills.sh's answer — overwrite, warn, proceed — is the wrong default for a folder holding
someone's therapist. A domain identity probably has to be owner-qualified, or the install
has to refuse rather than warn. [→ #15, #16]

**No verification, and confirmation auto-skipped inside an agent.** For a psy domain the
posture "an agent may install this unattended, having shown the human nothing" is not
acceptable — even though registry-level trust is explicitly out of this map's scope,
_whether installing a domain is a human act_ is a property of the local install path, which
is in scope. [→ #16, "what install does beyond copying"]

**No concept of the data a unit produced.** Removal cleans what it installed and is silent
about everything else. A domain's removal has the harder version of this problem — the
notes must outlive the toolkit — and skills.sh offers no pattern to copy. #16 already
names this; the finding is only that there is nothing to borrow.

## Sources

- Agent Skills specification — <https://agentskills.io/specification>,
  <https://agentskills.io>
- `skills` CLI source, `vercel-labs/skills` at `v1.5.20` (MIT) —
  <https://github.com/vercel-labs/skills>; README, `src/{constants,frontmatter,plugin-manifest,skill-lock,local-lock,source-parser,installer,skills,add,update,remove,git,types,agents}.ts`
- Claude Code plugins reference (for the version/dependency contrast) —
  <https://code.claude.com/docs/en/plugins-reference>
- skills.sh catalogue and CLI docs — <https://skills.sh>, <https://www.skills.sh/docs/cli>
- This machine: `~/.agents/.skill-lock.json`, `~/.agents/skills/`, `~/.claude/skills/`
