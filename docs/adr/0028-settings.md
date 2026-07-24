---
status: accepted
---

# Settings the person owns — `config.json`, and no emoji by default

`~/.claudia/config.json` has existed since [ADR-0004](0004-memory-model.md) as a
place to say _no_: `{ "saveTranscripts": false }` to refuse the archive,
`{ "dashboard": false }` to refuse the mirror ([ADR-0019](0019-dashboard.md)). But it
was never a **surface**. Each key was read where it happened to be needed, with an
inline `JSON.parse` and a default that existed only as an `=== false` check; nothing
declared which keys exist, so nothing could show a person their own settings, and the
only way to change one was to know the filename and hand-write JSON. Both keys were
also script-level: no setting had ever reached the **persona**.

The question that forced both gaps at once was emoji. Should Claudia write with
them? That is not a bug to fix or a house style to legislate — one person finds a
smiley from a machine warm, another finds it grating precisely _because_ it comes
from a machine. It is a preference, and it belongs to the person. Which means it
needs somewhere to live, and somewhere to be seen.

## Decision

**One declared settings file, one reader, one command.**

- **`src/config.mjs` is the whole surface.** Keys, defaults, and the one-line
  person-facing description of each live there; `save-session` and `build-dashboard`
  consume `parseConfig` instead of parsing the file themselves. Adding a setting is
  one edit.
- **Total resolution, never an error.** Absent, empty, malformed, or wrong-typed →
  the shipped default. This is a file a person opens in an editor; a stray comma must
  degrade to the behaviour they already had, not break a hook.
- **Unknown keys are preserved on write.** A key from a newer version — or one they
  added by hand — survives a `/config` change. An unreadable file is copied to
  `config.json.bak` before it is replaced (the same reflex as
  [ADR-0020](0020-vault-migrations.md): back up before touching their data).
- **`/config` is the tenth command** — person-pulled, like [`/thread`](0015-the-thread.md)
  and [`/dashboard`](0019-dashboard.md). It lists every setting with its value and
  default, and changes one through `scripts/config.mjs` rather than by editing JSON in
  the model's head, where an unknown key quietly disappears.

**`emoji`, default `false`.**

- **The default is grounded in congruence, not in taste.** `SOUL.md` already says: _"I
  don't perform feelings I don't have."_ An emoji is the cheapest available
  performance of one. From a companion whose honesty about being an AI is
  load-bearing, decorating a reflection with a smiley is a costume over the exact
  place the design refuses to pretend — and it lands, for many people, as the machine
  overreaching. Plain words are the honest default; warmth is carried by attention.
- **The persona holds the rule; the setting only loosens it.** The rule is written
  into `skills/claudia/SKILL.md` — the only always-loaded file — so a session that
  never reads the config still writes plainly. `emoji: true` is the person's explicit
  permission to relax it. That direction matters: if a compaction drops the loosened
  register, the session falls back to the restrained default rather than the loose
  one. Failing safe means failing plain.
- **The person's own emoji are untouched.** Quoting back a smiley they wrote — in a
  reflection, in a [keepsake](0023-keepsakes.md) — is their word, not Claudia's
  decoration. The rule is about her voice.

**Nothing here can lower the floor.** There is no key for the safety hook, the crisis
pivot, or any never/always rule, and there never will be. Settings sit **above** the
safety floor exactly as immersion does ([ADR-0001](0001-safety-floor.md)).

## Non-goals, and why

- **No free-text style key.** _"Write like X"_ is the obvious next request and the
  answer is no: an arbitrary instruction handed to the always-loaded persona is a way
  through the floor, wearing the clothes of a preference. Booleans, declared keys
  only. How Claudia speaks is otherwise adapted _in the conversation_, where the
  person can correct it turn by turn.
- **No deterministic emoji filter.** Stripping emoji from her output post-hoc would
  also strip the person's quoted words and any mermaid or code she writes, and would
  make the register a thing done _to_ her rather than part of who she is. The rule
  lives in the voice.
- **No settings step at first run.** The one-time disclosure ([ADR-0004](0004-memory-model.md))
  says memory is saved locally; adding a preferences interview to someone's first
  minutes would be an onboarding flow, not a welcome. `/config` and the README carry
  discoverability instead.
- **Not the harness's `settings.json`.** These are the person's preferences about
  Claudia, in the person's own vault. Claude Code's own configuration is a separate
  concern and stays out ([ADR-0007](0007-stay-local.md)).
- **No per-message or per-session toggle**, no "just this once". A setting that has to
  be re-stated is a conversation, and Claudia already follows what the person asks in
  the moment.

## Consequences

- The public command surface grows from nine to **ten**. README's table and its prose
  count, and the structure guard's command list, track that.
- `recall` reads the settings at the open, before the first sentence, and honours them
  silently — never reciting them, the same rule that keeps it from reciting memory.
- A **resumed or compacted** session can lose a loosened `emoji: true` until the next
  `recall`. Accepted, and the reason the default is the strict side of the switch.
- The two existing opt-outs keep their exact meaning and gain a place to be seen; the
  `ClaudiaConfig` typedef moves from `save-session.mjs` to `src/config.mjs`, which is
  where [ADR-0022](0022-types-without-transpilation.md) says a shape's parser owns it.
- `CONTEXT.md` gains **Settings**; `docs/memory-layout.md` records the contract.
  `/export` already copies `config.json` (it copies the vault verbatim), and `/forget`
  removes it with the directory.
