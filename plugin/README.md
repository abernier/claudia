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

<!-- demo-badge: paste the asciinema badge printed by `npm run demo:publish` here
     (a ~2-min session with a fictional person — how continuity, /dashboard and
     the local vault actually feel). Keep this comment for the next re-shoot. -->

[![Claudia demo — a two-minute session with a fictional person](https://asciinema.org/a/pSrPEDSW0g4XN9BP.svg)](https://asciinema.org/a/pSrPEDSW0g4XN9BP)

_A session with **Agnès**, a fictional person ([`demo/`](https://github.com/abernier/claudia/blob/main/demo)). She types the name,
and the greeting comes back knowing who she is and what was left open three days ago.
Then one sentence she would rather not have shouted is kept, word for word, in her own
notes. No command is typed at any point._

## What makes Claudia different

- **Relationship first.** The evidence says the therapeutic bond drives outcomes
  more than any technique (Wampold, 2015). Claudia's always-on core is
  relational — empathy, positive regard, alliance — and the modalities are a
  toolbox she reaches into when indicated. See [ADR-0002](docs/adr/0002-knowledge-architecture.md).
- **Immersion with a floor.** Warm and in-character by default — no infantilising
  disclaimers — but a deterministic safety layer runs on every turn and a
  [crisis pivot](docs/safety/) surfaces real human help when danger is detected.
- **Natural-language first.** Only eleven slash commands exist — seven data, safety,
  and memory controls, three pull-only orientation aids, and one to keep a sentence
  that landed. Everything therapeutic happens in ordinary conversation. See
  [ADR-0003](docs/adr/0003-plugin-runtime-shape.md).
- **A self-editing Markdown memory.** A toolkit of skills, commands and hooks
  around a vault Claudia writes herself, conversation after conversation — not an
  ingested corpus. `recall` reads it back by path: no embeddings, no vector store,
  nothing to reindex, and every file she loads is one you can open and correct.
  See [ADR-0004](docs/adr/0004-memory-model.md).
- **Your data, your machine.** Memory lives under `~/.claudia/` on your own
  computer. Nothing is uploaded. See [ADR-0004](docs/adr/0004-memory-model.md).
- **Speaks your language.** The codebase is English; Claudia speaks _your_
  language and writes her deliverables in it. See [ADR-0005](docs/adr/0005-language-policy.md).

## Commands

Claudia deliberately ships only eleven commands — the rest is conversation:

| Command      | What it does                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/help-now`  | Immediately surface crisis resources for your region.                                                                                                                    |
| `/forget`    | Really delete a memory, a session, or everything.                                                                                                                        |
| `/export`    | Export your memory and deliverables.                                                                                                                                     |
| `/backup`    | See and manage the rotating archive of your notes — what's kept, whether it still reads back, and how to recover from one.                                               |
| `/save`      | Checkpoint your memory now — update the notes for where this conversation got to, without waiting for the session to close.                                              |
| `/migrate`   | Update your saved notes to the latest format — with a preview and a backup first. Normally automatic.                                                                    |
| `/config`    | See and change your settings — emoji (off by default), the conversation archive, the dashboard.                                                                          |
| `/thread`    | Show the thread of the conversation so far — a light, person-pulled reflection you can gather back or keep wandering from.                                               |
| `/dashboard` | Open a bird's-eye view of where things are — a person-pulled mirror (goals, themes, what's to pick up, your people), never recited at you.                               |
| `/keep`      | Keep a passage that landed — something Claudia said, or something you said yourself — word for word, to re-read whenever. With no argument, she offers you what to keep. |
| `/menu`      | Not sure where to start? A few things that are open for you right now — plus the plain option of just talking. Pulled by you, never opened on you.                       |

## Settings

A few switches you own, in `~/.claudia/config.json` on your own machine — shown and
changed by `/config`, or edited by hand. All optional; an absent key means the
default. See [ADR-0028](docs/adr/0028-settings.md).

| Setting           | Default | What it does                                                                           |
| ----------------- | ------- | -------------------------------------------------------------------------------------- |
| `emoji`           | `false` | Claudia writes in plain words. Set `true` if you'd rather she used emoji.              |
| `saveTranscripts` | `true`  | Keeps a verbatim archive of each conversation under `~/.claudia/sessions/`.            |
| `dashboard`       | `true`  | Maintains the bird's-eye mirror `~/.claudia/dashboard.md` (opened with `/dashboard`).  |
| `language`        | `"fr"`  | The language of what the scripts write for you (the dashboard mirror): `fr` or `en`.   |
| `verbose`         | `false` | Claudia narrates her machinery as she works. Off by default — workings stay invisible. |
| `backups`         | `true`  | Keeps a rotating archive of your notes under `~/.claudia-backups/` (local only).       |

Emoji are off by default on purpose: Claudia is honest about being an AI, and a
smiley is the cheapest way to perform a feeling she doesn't have. Nothing in this
file can lower the [safety floor](docs/adr/0001-safety-floor.md) — there is no
setting for the safety hook, the crisis pivot, or what she will refuse.

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

### Optional: back up between sessions too

Your notes are already archived at the close of every conversation — that needs no
setup and covers the only moment Claudia writes to them. An hourly job adds cover for
what a session close can't see: a session that crashed before it saved, notes you
edited by hand, weeks where you never opened Claudia.

```
~/.claude/plugins/*/claudia/scripts/install-backup-timer.sh install   # status | uninstall
```

macOS only. It is a per-user LaunchAgent in your own `~/Library/LaunchAgents/` — no
`sudo`, nothing written outside your home directory. On Linux, point a systemd `--user`
timer or cron at `vault-backup.mjs --quiet` every hour.

## Reaching Claudia

Once installed, in any new session:

- **Just name her or open up.** "Claudia, can we talk?", "@Claudia, I've had a
  hard week", or simply sharing what's on your mind activates the persona.
- **Guaranteed entry:** type `/` and pick **Claudia** (`claudia:claudia`) from the
  menu.

Claudia runs in your **main session** — deliberately _not_ as an `@`-mentioned
subagent. An `@`-mention targets a subagent, which would run _outside_ the
per-turn safety hook; the whole point is that Claudia stays where that safety
layer applies. So there is no `@Claudia` agent — name her in plain language
instead, and the persona comes to you.

## Contributing

Claudia is developed in the open at
<https://github.com/abernier/claudia> — the repo's own README covers the
layout, the tests and the release process. This directory is the plugin
payload: what an install copies onto your machine, and nothing else.

## Safety

If you or someone else is in immediate danger, contact your local emergency
number (112 in the EU, 911 in the US/Canada) or a crisis line (988 in the
US/Canada; Samaritans 116 123 in the UK; find your country at
<https://findahelpline.com>). Claudia is not an emergency service.

Claudia is **not a medical device** and gives no medical advice, diagnosis, or
treatment; it is provided as-is (see [LICENSE](LICENSE)). To report a safety
concern or a vulnerability, see [SECURITY.md](https://github.com/abernier/claudia/blob/main/SECURITY.md).
