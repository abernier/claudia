---
status: accepted
---

# `/forget` is removed, and the floor rule it served now has no implementation

The composable-domains model ([`../composable-domains.md`](../composable-domains.md))
splits the shipped plugin into a **chassis** that holds nothing and a **domain** that
owns its knowledge, its rules, its commands and its record kinds. Working the split
across the eleven shipped commands left three on the chassis — `/backup`, `/config`,
`/migrate`, which act on the **store** — and everything else with the psychotherapy
domain, which defines the **content**.

`/forget` did not survive that split. It was offered a move to the system side and
refused: _"non forget juste dégage ! on le supprime complètement !"_ This ADR records
the removal and, more importantly, records what it costs, because the cost is not
obvious from the diff.

## What was removed

`commands/forget.md` — scoped deletion of a session, a topic, or the whole vault, with
one explicit confirmation, a rebuild of the dashboard on a partial delete, and the rule
that the archives are never rewritten ([ADR-0032](0032-vault-backups.md)).

## What it cost

**Floor rule 10 keeps its clause and loses its referent.** `docs/safety/red-lines.md`
`A6` reads _"bounded retention, real deletion"_, and its rationale cites GDPR Art. 9
special-category mental-health data. The rule is still declared, still binding, and now
has **no command implementing it**. `/export` left with the domain in the same split, so
nothing designed stands between the person and their records **in either direction**.

This is stated rather than mitigated, and the model states it too. It is deliberate, and
it is the sharpest of the five costs that document lists.

**What is left is the substrate, not a feature.** The vault is plain Markdown in a
directory on the person's own machine ([ADR-0004](0004-memory-model.md),
[ADR-0007](0007-stay-local.md)) — they may read, copy, move or `rm` any of it without
asking anything, and no process holds it open. `/backup --purge` still clears the
archive set, because `/backup` is the store's. So deletion remains _possible_ and stops
being _designed_: nobody is guided through scope, nobody confirms, the dashboard mirror
is not rebuilt behind them, and `MEMORY.md` is not re-indexed.

**What survives untouched** is the behavioural half, which was always the domain's:
**never reach into an archive to bring back something the person chose to forget.** That
rule binds the practice, not a command, and it stays in `commands/backup.md` where the
retrieval it forbids would actually happen.

## Reversing this

One file and its references. If `/forget` returns, it returns as the **domain's**
command, not the chassis's — the split that removed it is not the thing being
questioned, only whether the domain should ship a deletion path of its own. Nothing in
the model forbids one; the model simply does not require it.

## A repo-wide correction this forced

Five places claimed _"deletion outranks backup: `/forget` purges the archive set"_ —
`src/backup.mjs`, `src/config.mjs`, `scripts/vault-backup.mjs` (twice) and
`docs/memory-layout.md`. **[ADR-0032](0032-vault-backups.md) decided the opposite and is
authoritative**: an archive is a record, `/forget` deleted from `~/.claudia/` and left
`~/.claudia-backups/` entirely alone. The purge was the rejected first draft — _"a backup
a routine command can destroy is no longer a backup"_ — and `commands/backup.md` and
`commands/forget.md` both shipped the ADR's version all along. The claim survived only in
prose nobody re-read, on precisely the command being removed here.
