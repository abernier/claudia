# demo/ — the recording kit

Everything needed to shoot (and later re-shoot) the "how Claudia works" video:
a fictional pre-seeded vault, a fake `$HOME` to run it in, and the
record → render pipeline. Nothing in here is product code.

## The immersive home — `/Users/nora`

On-screen paths should read `/Users/nora/…`, not `/Users/you/.claudia-demo/…`.
Create the immersive home once (a plain directory, not a macOS account):

```bash
sudo mkdir -p /Users/nora && sudo chown "$(id -un)":staff /Users/nora
```

Every demo script auto-prefers `/Users/nora` when it exists and is writable
(explicit `$DEMO_HOME` still wins; otherwise fallback is `~/.claudia-demo`).
Remove it anytime with `sudo rm -rf /Users/nora`.

## Why a fake `$HOME`

The real `~/.claudia` holds real personal sessions. Instead of a vault-path
option, the demo runs Claude Code with `HOME=$DEMO_HOME`: `os.homedir()` (all
hook scripts) and the `~` in skill prose both follow `$HOME`, so the entire
plugin redirects to the scratch vault at once — isolation is structural, not
disciplinary. The fake home lives at `~/.claudia-demo` (outside the repo, so the
demo session doesn't inherit the project's CLAUDE.md/git context).

## The fixture (`vault/`)

**Nora**, mid-30s graphic designer in Portland — partner **Devon**, sister
**Tess**, friend **Priya**; themes _the jury_ (her inner critic, in her words)
and _what steadies me_. Three distilled sessions, goals, todos, a keepsake, an
ecomap, a timeline. English content, `{ "language": "en" }` (ADR-0029).

- **All names are invented and grep-verified absent from the repo.** Never reuse
  a name that already appears anywhere in the repo (doc examples, test fixtures) —
  invent fresh ones and verify with `grep -rniE '\b<name>\b'` before use.
- Dates are evergreen: `{{TODAY-N}}` tokens in content and `TODAY-N-` filename
  prefixes are rendered at seed time, so the last session always reads as three
  days ago, whenever you re-shoot.
- The fixture ships a complete `.migrations` ledger and no `.pending-summary`
  markers, so a session opens with zero migration/distillation noise.
- When the vault format evolves, run the fixture through
  `scripts/migrate-vault.mjs` (point `HOME` at the seeded copy), fold the result
  back into `vault/`, and re-tokenize the dates.

## Shooting

```bash
npm run demo:setup       # once — builds ~/.claudia-demo, links the plugin, seeds the
                         # vault AND Claude Code's own state (onboarding done, desk/
                         # trusted, account linked — no wizard, no login)
npm run demo             # dry-run: a Claudia session in the fake home
npm run demo:take        # AUTO-PILOT take — re-seeds everything, drives the whole
                         # scenario against the real TUI, saves the .cast (tmux)
npm run demo:record      # manual take — re-seeds, then asciinema rec (you type)
npm run demo:render      # .cast → .gif → .mp4 (brew install asciinema agg ffmpeg)
```

Both take commands re-seed the vault AND the rig's Claude Code state on every
run, so each take starts from the same clean slate.

(`npm run demo:seed` re-seeds the scratch vault on its own — useful between manual
dry-runs; `demo:record` already does it before every take. Pass a take name with
`npm run demo:record -- take2`.)

The scenario lives in **`scenario.take`** — the single source of truth: the
auto-pilot performs it, a manual take follows its `type` lines by hand, and its
comments carry the shot-by-shot intent. Edit it, validate with
`DRY_RUN=1 ./demo/drive-take.sh`, re-take. The `.cast` in `recordings/` is
committed (editing source); `.gif`/`.mp4` are gitignored (regenerable).

When a take is the keeper: `npm run demo:publish` uploads the `.cast` to
asciinema.org and prints the README badge — paste it over the `demo-badge`
placeholder comment near the top of the main `README.md`. Publishing is a
deliberate act (it makes the take public); the fixture is fictional by
construction, but only publish a take you've watched.

If `claude` isn't found inside the recording shell, add its directory to
`~/.claudia-demo/.zshrc` — the fake home's shell doesn't read your real rc files.

## Safety rails

- `seed-vault.mjs` refuses to write to the real `~/.claudia`.
- `seed-claude-config.mjs` copies only account _metadata_ (`oauthAccount`,
  `userID`) into the fake home — credentials stay in the macOS Keychain; the fake
  home is outside the repo and never committed.
- The keychain itself is reached through `$HOME` too, so `setup-home.sh` links
  `$DEMO_HOME/Library/Keychains` → `~/Library/Keychains` — same user, same
  binary, same keychain; the link only restores what faking `$HOME` hid (without
  it, the demo claude asks for `/login`).
- The fake home ships a `.claude/settings.json` whose PreToolUse **guard hook**
  decides every tool call: DENY anything referencing the real vault, allow the
  rest — prefix rules can't cover the ad-hoc shell the skills compose (any
  `$var` expansion prompts regardless of allowlists), and a permission dialog
  mid-take ruins the video. Explicit `permissions.deny` rules on the real vault
  back the guard up. Still: a **rig, not a daily driver**.
- **Never `~` in the rig's permission config.** Claude Code expands `~` there
  against the passwd home, not the faked `$HOME` — an earlier
  `additionalDirectories: ["~/.claudia/"]` mounted the REAL vault into a demo
  session. Every path the seed writes is absolute, and the guard computes the
  real home passwd-side (`os.userInfo().homedir`) so `$HOME` faking can't fool
  it either.
- Recording never mutates `vault/` — every take starts from a fresh seed.
- Verify isolation after a dry-run: nothing under the real `~/.claudia` should
  be newer than your pre-run marker (`touch /tmp/marker` … `find ~/.claudia -newer /tmp/marker`).
