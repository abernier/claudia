---
description: See and manage the rotating archive of your notes — what's kept, whether it still reads back, and how to recover from one.
argument-hint: "[status | now | check | restore <date> | off]"
allowed-tools: Read Bash AskUserQuestion
---

# /backup

Your notes exist in one place on one machine (ADR-0004). A rotating archive under
`~/.claudia-backups/` is the standing safety net: a snapshot at the close of each
session and every hour, pruned to a tiered ladder — every archive from the last two
days, then one per day for a fortnight, one per week for two months, one per month
for a year, one per year kept for good.

Everything is local. This compresses files into a folder beside your notes; nothing
is uploaded anywhere.

`$ARGUMENTS` picks the action; with none, do **status**.

## status

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs" --list
"${CLAUDE_PLUGIN_ROOT}/scripts/install-backup-timer.sh" status
```

Lead with what is already true, because it is the answer to the question actually
being asked: **their notes are copied at the close of every conversation, with no
setup at all.** Then how many archives there are and how far back they reach.

The hourly job is an **extra, never the baseline**. It adds cover only for what a
session close misses: a session that crashed before it could save, notes edited by
hand, stretches where Claudia was never opened. So mention it once, plainly, and only
here — someone reading `/backup` is already standing in front of their backups. If
they'd rather not, that is a complete answer; the safety net works without it.

**Never raise it mid-conversation.** A background job on their machine is not a
subject to carry into a conversation someone came to have about their life, and a
companion that asks to install system things is a companion that feels like software.

It needs no admin rights — it is a per-user LaunchAgent in their own home directory,
the same kind of thing ordinary apps install, and it is removable in one command:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/install-backup-timer.sh" install
"${CLAUDE_PLUGIN_ROOT}/scripts/install-backup-timer.sh" uninstall
```

## now

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs"
```

An immediate snapshot — before a migration, before an experiment, before anything
they'd rather be able to undo. It says "unchanged" when nothing has moved since the
last one; that is the normal answer, not a failure.

## check

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs" --verify
```

Reads every archive back and compares it against its manifest. A backup nobody has
ever opened is a guess. If any archive is reported broken, say which and that the
others still stand.

## restore

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs" --restore <date-or-latest>
```

Unpacks to a **new folder** (`~/claudia-restore-<stamp>/`) and never touches the live
notes — so this can be run to look, not only to recover. Tell them where it landed
and that moving anything back is their move to make, not yours. Do not copy files
over their vault on your own initiative.

## off

Backups are a setting they own — `{ "backups": false }` in `config.json`, via
`/config`. Turning them off stops new snapshots; it does not delete the ones already
taken. If they want those gone too, that is a deletion, so it goes through the same
confirmation everything else does:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs" --purge --yes
```

## What an archive is, and what it is never used for

An archive is a **dated record of what was true when it was taken** — not a mirror of
what the person wants today. Nothing rewrites one: `/forget` deletes from their notes
and leaves `~/.claudia-backups/` alone, so an archive can legitimately still contain a
session they later chose to forget, until it rotates out (ADR-0032).

That is only tenable because of the rule that comes with it: **never reach into an
archive to bring back something they chose to forget.** Not to check a fact, not to
fill a gap, not because it would be useful. Never offer it as a way to undo a
`/forget`. The archive keeps it; you do not go and get it.

If they want those older copies gone, that is theirs to say, here, and it is the one
place that does it:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vault-backup.mjs" --purge --yes
```
