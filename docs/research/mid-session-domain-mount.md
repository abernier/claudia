# Whether a domain mounts mid-session

Research note. Question: can a **domain** be mounted, or switched, without restarting
Claude Code? Settled by measurement, not by reading — the loading research
([#8](https://github.com/abernier/claudia/issues/8)) could not reach it from a headless
agent.

Every finding below is tagged with how it is known:

- **[obs]** — observed on this machine, this run; the probe that showed it is cited.
- **[doc]** — stated in Claude Code's own output or docs.
- **[untested]** — not settled; said plainly.

Observed against **Claude Code 2.1.220**, macOS 27.0.0 (Darwin), on 2026-07-26.
**This is behaviour, not contract, and it can move.** Re-run the rig below before
trusting it against a later version.

## Verdict

**A mount takes effect mid-session; an enablement does not.**

A plugin folder that appears in `<config>/skills/` _after_ a session started is picked up
by `/reload-plugins`, whole — skills, commands, agents and hooks all go live together.
Remove the folder and the same reload drops all four. But `claude plugin disable` /
`enable` is read **once at session start** and cached for the life of the process:
flipping it mid-session changes nothing in either direction, no matter how many times you
reload.

So the switch mechanism available to the chassis is the **symlink**, not the `enabled`
flag.

Two constraints ride along, and they matter more than the table:

1. **`SessionStart` never fires for a mid-session mount.** [obs]
2. **`/reload-plugins` does not exist outside the TUI.** [obs]

## The table

What a session sees, per change made while it is running:

| change made mid-session                       | takes effect         |
| --------------------------------------------- | -------------------- |
| plugin folder appears in `<config>/skills/`   | on `/reload-plugins` |
| plugin folder removed from `<config>/skills/` | on `/reload-plugins` |
| `claude plugin disable` / `enable`            | only on restart      |
| the mount alone, with no reload               | never                |

Per component type — skills, commands, agents, hooks — **all four move together**. There
is no partial load, and no type that lags behind the others. [obs]

On the reload that picks a mount up:

- `/wf20probe:wf20cmd` and `/wf20probe:wf20-probe` both appear in the `/` menu, where a
  moment earlier the same query answered `No commands match "/wf20"`. [obs]
- the session reports `1 agent type available`. [obs]
- the domain's `UserPromptSubmit` hook fires on the very next turn. [obs]
- the reload itself reports
  `Reloaded: 1 plugin · 1 skill · 7 agents · 2 hooks · 0 plugin MCP servers · 0 plugin LSP servers`. [obs]

On the reload that drops a mount, the same four go dark together and the count returns to
`0 plugins · 0 skills · 6 agents · 0 hooks`. [obs]

A counting quirk, noted so nobody reads it as a partial load: the reload line says
**1 skill** for a plugin whose `plugin details` inventory says `Skills (2)`. Both entries
are present in the `/` menu. The reload counter appears to count `skills/` entries only,
while the inventory folds `commands/` into the same bucket. Cosmetic. [obs]

## The three findings that constrain the design

### 1. `SessionStart` never fires for a mid-session mount

The probe domain carried both a `SessionStart` and a `UserPromptSubmit` hook writing to
one log. Across the whole run the log holds: [obs]

```
UserPromptSubmit phase=int-after-reload
UserPromptSubmit phase=int-after-disable
UserPromptSubmit phase=int-remount-disabled
SessionStart      phase=final-control-restart
UserPromptSubmit  phase=final-control-restart
```

`SessionStart` appears exactly once, against the one phase that was a real process start.
Three separate mid-session mounts produced `UserPromptSubmit` and no `SessionStart`.

This is the load-bearing half for Claudia specifically. `SessionStart` is where
`session-anchor.mjs` runs today, and recall hangs off it. A domain mounted mid-session
gets its per-turn hooks and **never gets its session-start hook** — so whatever a domain
needs to do "on arrival" cannot be hung on `SessionStart` if mid-session switching is ever
allowed.

### 2. `/reload-plugins` is TUI-only

In `-p` / headless mode the command is not recognised. The session answers, in full: [obs]

```
/reload-plugins isn't available in this environment.
```

It is a slash command of the interactive renderer, described there as
`Activate pending plugin changes in the current session`. [doc]

Consequence: there is **no programmatic reload**. Any path that mounts a domain without a
human in a terminal — a script, an SDK embedding, a background agent — cannot make that
mount take effect. For those, mounting is a restart-level operation regardless of what the
table says.

`/reload-plugins --force` was run and showed no difference from the plain form in any arm.
The documented difference concerns MCP-tool changes, which this probe had none of, so the
force flag is **[untested]** for its actual purpose.

### 3. The `enabled` flag is startup-cached, and the cache wins both ways

This one took four arms to pin down, because the first two readings contradict each other.

- Session A had the plugin **live**. `claude plugin disable` then `/reload-plugins` →
  still `1 plugin · 2 hooks`, and the hook still fired on the next turn. The disable did
  not take. [obs]
- Session A, plugin still live, symlink **removed**, `/reload-plugins` → `0 plugins`. The
  unmount did take. [obs]
- Session A, config still `enabled: false`, symlink **restored**, `/reload-plugins` →
  `1 plugin`, hook fires. Loaded despite the flag saying no. [obs]
- Session B started fresh with the symlink present and the flag already `false` → plugin
  absent, and `/reload-plugins` reported `0 plugins`. The flag _was_ honoured. [obs]

One model fits all four: **enablement is resolved at session start and cached; reload
re-scans the filesystem but reuses the cached enablement.** Session A started before the
folder existed, so the plugin defaulted to enabled and stayed that way in cache. Session B
read `false` at startup and kept it.

The discriminating test confirmed it: in session B, with the flag flipped back to `true`
externally, `/reload-plugins` still reported `0 plugins` and the hook stayed silent. [obs]
A cached `false` cannot be lifted mid-session any more than a cached `true` can be
dropped.

## What this does not settle

- Whether any of it holds on Linux or Windows. Measured on macOS only. **[untested]**
- Whether `/reload-plugins --force` behaves differently when MCP servers are in play.
  **[untested]**
- Whether a plugin **updated in place** (same folder, changed contents) reloads. Only
  appearance and disappearance of the folder were measured. **[untested]**

## Reproduction

The rig is four pieces, and none of it is subtle:

1. **A throwaway probe domain** — a folder with `.claude-plugin/plugin.json` and one of
   each component type: `skills/wf20-probe/SKILL.md`, `commands/wf20cmd.md`,
   `agents/wf20agent.md`, and `hooks/hooks.json` registering `SessionStart` +
   `UserPromptSubmit` against a script that appends one line per firing to a log, stamped
   with a phase name read from a file the driver rewrites between steps.

2. **A scratch `CLAUDE_CONFIG_DIR`** so nothing touches the real `~/.claude` or the vault.
   It needs its own login (`CLAUDE_CONFIG_DIR=<scratch> claude auth login`) — auth does
   not carry over from the default config dir. First-run onboarding can be skipped by
   writing `theme` into `<scratch>/settings.json` and `hasCompletedOnboarding: true` plus
   a `projects["<cwd>"].hasTrustDialogAccepted: true` entry into `<scratch>/.claude.json`.

3. **tmux, not expect.** `expect` renders the TUI but its keystrokes never reach it —
   Claude Code appears to wait on terminal capability replies that a bare pty never sends.
   A control test confirmed `expect` sends fine to `cat`, so the fault is not `expect`'s.
   `tmux new-session -d` + `send-keys` + `capture-pane` drives it correctly, and the
   session survives between shell invocations, which is exactly what "change the
   filesystem _between_ two turns" needs.

4. **Detectors that need no tool permissions.** `/wf20` typed at the prompt answers either
   `No commands match "/wf20"` or lists the entries — that is the skill and command
   detector, and it is the same `/` menu the question was originally posed about. The hook
   detector is the log file, which no model interprets. Neither needs a tool call, so the
   session's manual permission mode never gets in the way.

Headless (`claude -p --input-format stream-json`) drives multi-turn sessions fine and is
worth keeping for everything else, but it **cannot** answer this question: it has no
`/reload-plugins`. A run through it reads every arm as "only on restart", which is wrong.
