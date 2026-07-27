---
status: accepted
---

# A rotating archive beside the vault — and deletion still outranks it

The vault is a few megabytes of markdown that exists in exactly one place, on one
machine, by design ([ADR-0004](0004-memory-model.md): local only, never uploaded).
That design is right, and it has a consequence nobody had written down: there is no
second copy. One bad write, one mistaken `rm`, one migration that dies halfway, and
months of a person's notes are gone — and the thing that is gone is not a build
artefact, it is what someone told a therapist companion about their life.

The reflex already existed in one place. `/migrate` copies the whole vault to
`~/.claudia.bak-<date>` before it rewrites a single file ([ADR-0020](0020-vault-migrations.md)),
because touching the person's data without a way back is not acceptable. But that
covers exactly one event. Nothing covered the ordinary ones.

The hard part is not taking a copy. It is that the two failure modes pull in
opposite directions:

- **Sudden loss** — the file is gone and you want the newest copy. Archive often.
- **Slow corruption** — something has been quietly wrong for three weeks and you
  want a copy from _before_ it started. Archiving often makes this **worse**: a flat
  "keep the last 30" rotation, fed hourly, holds barely a day of history. By the time
  anyone notices, every good copy has been evicted by a bad one — and the backup
  system has become the thing that destroyed the data.

## Decision

**A tiered ladder of compressed snapshots, in a sibling directory, subordinate to
`/forget`.**

- **Beside the vault, never inside it.** Archives live in `~/.claudia-backups/`
  (mode `0700`), not under `~/.claudia/`. A child directory would be copied by
  `/export`, walked by `/migrate`, and — worst — fed into its own next snapshot,
  compounding. A sibling is invisible to all three.

- **Retention is tiered, not flat.** Every archive from the last 48 hours, then the
  newest per day for 14 days, per ISO week for 8 weeks, per month for 12 months, and
  one per year kept forever. This is what makes the slow-corruption case survivable:
  a fortnight-old mistake still has ancestors. At this vault size a year of history
  costs a few megabytes, so the tiers are counted in _buckets that exist_ rather than
  calendar distance — someone who stops for six months and comes back finds a graded
  ladder of their last active days, not a single archive.

- **Identity is the vault's content, not the archive's bytes.** gzip stamps its
  output with the current time, so two archives of an identical vault differ
  byte-for-byte. The digest is taken over a sorted manifest of `sha256 size path`
  instead, and an unchanged vault produces no new archive — otherwise an hourly job
  would spend the whole ladder on duplicates. `.DS_Store` is excluded for the same
  reason: Finder rewrites it just from opening the folder.

- **Write, verify, then rename.** The archive is built under a temp name, listed back
  with `tar -tzf`, compared against the manifest's file count, and only then renamed
  into place. A job killed mid-write — a laptop closing, a session ending — must not
  leave a truncated file that the next prune counts as good history.

- **One refusal, everything else a warning.** An _empty_ vault is never archived:
  writing nothing over a working ladder is the one mistake no later run can undo.
  A vault that merely shrank is archived **and** flagged, because the pass cannot
  tell a corruption from a `/forget` the person asked for, and refusing the latter
  would be its own kind of broken.

- **No auto-pinning.** An earlier draft pinned the last archive whenever the vault
  shrank, so a "suspicious" deletion could never rotate out. That silently preserves
  exactly what `/forget` promises to destroy. Pins exist only as a manual affordance
  — a `.keep` sidecar the person can touch by hand.

- **An archive is a record, and `/forget` does not rewrite records.** `/forget`
  deletes from `~/.claudia/` and leaves `~/.claudia-backups/` entirely alone. An
  archive states what was true on the day it was taken; it is not a mirror of what the
  person wants today, and it is normal — not a leak — for a dated record to contain a
  memory someone later decided to delete. This is how every backup on earth behaves:
  `rm` does not reach into Time Machine, and a deleted contact stays in old photos.

  The first draft did the opposite: `/forget` purged the whole archive set at any
  scope, on the reasoning that a surviving copy makes "permanent, no undo" a lie. That
  was rejected, and the objection was the right one — **a backup a routine command can
  destroy is no longer a backup.** The failure it protects against is a deletion
  someone regrets, so wiring it to a deletion command removes the protection exactly
  when it is most needed. A safety net with a hole cut in it for the most common way
  people lose things is not a safety net.

  What the promise costs instead is **wording, and one behavioural rule**:

  - `/forget` no longer claims more than it does. It says the deletion is permanent
    _from their notes_, and states plainly, once, that dated safety copies taken
    before today still hold it until they rotate out, with `/backup` as the place to
    clear them. Stated, never turned into a second decision — someone deleting a hard
    memory should not have to run a data-retention review to do it.
  - **Claudia never reaches into an archive to bring back something the person chose
    to forget** — not to check a fact, not to fill a gap, never offered as a way to
    undo a `/forget`. The archive keeps it; she does not go and get it. This rule is
    what makes leaving the archives alone compatible with honouring the deletion, and
    it is the reason the purge was not needed to keep the promise honest.

  **Surgical redaction** was rejected on its own merits and remains rejected: forgetting
  a _topic_ means editing lines inside `person.md` and `goals.md`, so it is not a file
  deletion but a redaction replayed against every past version of every affected file,
  each with different surrounding text. A redaction that is 95% right is
  indistinguishable from one that worked — the worst possible property for a guarantee.
  `--purge` therefore stays a **whole-set, person-invoked** operation, reachable from
  `/backup`, never a partial rewrite and never automatic.

- **Restore never overwrites.** `--restore` unpacks to a _new_ folder and leaves the
  live vault untouched, so it can be run to look rather than only to recover. Moving
  files back is the person's move, not the tool's.

- **Two triggers, because each covers the other's blind spot.** A `SessionEnd` hook
  (last, after `save-session` and `build-dashboard`, so it captures the distilled
  state) and an hourly launchd job. The hook misses sessions that die before their
  hooks run; the timer misses nothing but also knows nothing — together they cover
  crashes, hand edits, and the days Claude Code was never opened. The hook runs
  `--quiet` and is a **benign layer**: it always exits 0, because a failed backup must
  never take down the conversation the person just had.

  Dropping the timer and living with the hook alone was considered. The exposure it
  leaves is narrow — a session killed before its hooks run leaves its changes in the
  vault, uncopied, until the next clean close — but it is real, and it is the one
  window where the ladder cannot give anything back. The timer costs ~120 lines of
  shell and is opt-in; the coverage is worth more than the line count.

- **The hook detaches; it never makes the person wait.** `--detach` forks the work to
  a background child and returns — measured at ~35 ms against ~95 ms for the
  synchronous pass on a 3.3 MB vault. The number matters less than its shape: the
  detached cost is a fork and does not grow with the vault, while the synchronous one
  scales with every transcript ever written. Closing a conversation should not be
  where that bill comes due. If the machine dies mid-archive, the temp-then-rename
  dance means the child leaves nothing behind to clean up.

- **A lock on the archive directory, because "outside" means "concurrent".** The hook
  and the timer can fire in the same second — as can two Claude Code windows closing
  together, or `/backup` run by hand while a detached child is still working. Any two
  of those compute the _same_ temp path (stamps are second-resolution), interleave
  their writes, and rename the mixture into place as though it were history. Detaching
  the hook makes the overlap likelier, so the two shipped together.

  `writeFile` with the `wx` flag is the whole mechanism: create-if-absent is atomic, so
  exactly one racer wins. A lock whose holder has died, or that has been held past ten
  minutes, or that cannot be parsed, is broken and taken — a crash must not disable
  backups permanently, which would leave the person with a safety net that is silently
  gone. A dry run takes no lock: inspecting must never block a real backup.

- **Refusable, like every other copy.** `{ "backups": false }` in `config.json`
  ([ADR-0028](0028-settings.md)), default on. A safety net you have to remember to
  switch on is not a safety net; but a person who does not want more copies of their
  notes on disk gets to say no. Turning it off stops new snapshots and does not delete
  old ones — that is a deletion, and deletions go through `/forget`'s confirmation.

- **One clause in the existing disclosure — never a moment of its own.** The plugin
  already tells the person, once, that their notes live locally and can be exported or
  deleted ([ADR-0004](0004-memory-model.md), `remember`). The archive rides in that
  same breath: another copy, same machine, same rules, destroyed by `/forget`. A
  separate "may I keep backups?" prompt was rejected — a companion that stages consent
  moments about its own machinery is a companion that feels like software, and the
  question would alarm far more than the fact it discloses.

- **The hourly job is an extra, and is never proposed in conversation.** The
  `SessionEnd` hook needs no installation and already covers the only moment Claudia
  writes to the vault, so out of the box a person is protected without ever hearing the
  word launchd. The timer only adds the abnormal cases, so it is mentioned in the
  README (a developer audience, where `launchctl` is an ordinary sentence) and inside
  `/backup` (where the person is already looking at their backups) — never volunteered
  mid-conversation. This is also why backups stay out of the persona entirely: nothing
  about a background job belongs in a conversation someone came to have about their
  life.

- **`/backup` is the eleventh command.** Same reasoning as `/migrate`: a mechanism
  that touches the person's data automatically needs a manual control and somewhere
  to _look_. "Never lose anything" is not a property you can have without a way to
  check, so the command shows what is kept, re-reads every archive on demand
  (`--verify`), and can restore one.

## Consequences

The archive directory is not itself backed up anywhere. This covers corruption,
bad writes and mistaken deletion — **not** the loss of the disk. That is a deliberate
stopping point: pushing therapy notes off the machine is a privacy decision that
belongs to the person, not a default this plugin should make for them. Anyone who
wants off-machine durability should encrypt first and point their own tooling at
`~/.claudia-backups/`.

The launchd plist stores an absolute path to both `node` and the plugin's script.
A plugin directory that moves, or an nvm Node that is pruned, silently breaks the
timer — `install-backup-timer.sh status` reports that case, and re-running `install`
fixes it. Without the timer installed, the archive only advances when a conversation
closes cleanly: a session killed before its hooks run leaves its changes in the vault,
uncopied, until the next normal close.
