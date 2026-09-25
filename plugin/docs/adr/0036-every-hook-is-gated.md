---
status: accepted
---

# Every hook is gated on a Claudia session

The plugin is installed at user scope, so every command in `hooks/hooks.json` runs
in **every** Claude Code session on the machine — not just the conversations the
person has with Claudia. Three hooks already knew this and checked first
(`time-context`, `session-anchor`, `save-session`). Three did not. The per-turn
safety check screened every prompt of every session: in an animation project
whose running gag is characters squashed flat and screaming "AAAAaaaah", it
flagged "violence" and told the model to invoke the `crisis` skill — on a
background task's `<task-notification>`, which no person had typed. And at every
close, of every session, `build-dashboard` rebuilt the mirror and `vault-backup`
took a snapshot, while `save-session` wrote a diagnostic file to the temp directory
before its own gate.

## Decision

**Every hook acts only in a Claudia session, and does nothing at all elsewhere.**

- **The signal is the transcript.** A session is Claudia's when the `claudia`
  skill's loader preamble ("Base directory for this skill: …/skills/claudia")
  appears as a user-role message in its JSONL — the activation gate
  `src/session.mjs` already defined, which reading a file or loading another skill
  can never satisfy. Every hook receives the transcript's location in its payload
  (`transcript_path`, or `session_id` + `cwd`). `src/gate.mjs` owns the question
  once: `isClaudiaTranscript` streams the file with early exit (a pasted image is
  one ~500 KB line — ADR-0012's regression), and `isClaudiaHookPayload` answers
  from a payload, false rather than a throw when it cannot tell.
- **The safety hook also hears her addressed — addressed, not mentioned.** The
  `claudia` skill triggers when the person names her, so on turn one the
  activation is not in the transcript yet. A prompt that speaks _to_ her opens the
  gate for that turn, so a crisis in the very first "Claudia, …" message is
  screened. Speaking to her means one of two shapes (`addressesClaudia`):
  `@Claudia` anywhere as a standalone token, or a prompt that opens with an
  optional greeting (hey, hi, hello, dear, ok, bonjour, salut, coucou, allo), then
  "Claudia", then a vocative boundary — a comma, `!`, `?`, a `.` or `:` before
  whitespace, a dash before a space, a line break, or the end. Never next to a
  letter, digit, `/`, `\`, `.`, `_`, `-` or backtick: those are paths,
  identifiers and code spans. "Claudia's safety hook is broken", "the claudia
  skill", "cd ~/code/claudia" are mentions, and open nothing.
- **The safety hook screens the person's words only.** Harness blocks —
  `<task-notification>`, `<system-reminder>`, local-command and `!`-shell output —
  are stripped before anything else; a prompt that was nothing but harness output
  is not screened and does not count as addressing her. Slash-command arguments stay
  in: the person typed them. An unclosed or unknown wrapper stays in too.
- **Fail-safe keeps its meaning, inside the gate.** Once the session is established
  as Claudia's, any error escalates exactly as before
  ([ADR-0001](0001-safety-floor.md) rule 8, [ADR-0003](0003-plugin-runtime-shape.md)).
  A gate that cannot decide — no transcript path, a file not written yet or
  unreadable — reads as "not Claudia" unless the prompt addresses her.
- **Scripts with other callers are told when they are the hook.** `build-dashboard`
  and `vault-backup` also serve `recall`, `/dashboard`, `/backup` and the hourly
  timer, none of which has a payload. `hooks.json` passes `--hook`; only under it
  does a script read stdin and gate. An explicit flag, not a guess from whether
  stdin looks like a payload. `vault-backup` gates in the parent, before `--detach`
  forks, because the detached child has no stdin.

## Why not another signal

- **A marker file** ("this session is Claudia's") would have to be written by the
  model or by a hook that already knows — the same question, one step removed. It
  can go stale (a crash before cleanup marks the next session) and it is one more
  thing `/forget` must find.
- **The working directory.** People talk to Claudia from anywhere, and a coding
  session can run from the very directory a Claudia session used.
- **An environment variable.** Nothing sets one per conversation; Claude Code's
  hooks inherit the same environment in every session.
- **The transcript** is the ground truth: it is the conversation itself, every hook
  already receives a path to it, and the activation line in it cannot be forged by
  reading a file.

## Consequences

- **The accepted gap.** A first message carrying crisis content that neither
  addresses Claudia nor follows her activation is not screened by the hook — there is no way
  to tell it apart from any other session's first message. The model-level safety
  every Claude session has still applies, and so does the `crisis` skill's own
  description, which triggers on the danger itself. From the next turn on, once
  the `claudia` skill has activated, the hook screens every message.
- **Address, not mention — narrow on purpose.** A broader match (her name as any
  whole word) was tried first and rejected: it fires in exactly the sessions this
  decision exists to leave alone, above all coding sessions on this repository,
  where "claudia" is a path, a skill name and the subject of every other sentence.
  A crisis note injected into someone's unrelated work is the failure the person
  cares most about. The price is the same gap as above, slightly widened: a first
  message in crisis that mentions her without addressing her ("I think Claudia
  could help, I can't go on") is unscreened by the hook until the skill activates.
- A session that is not Claudia's leaves no trace: no note injected, no vault
  write, no archive, no temp file.
- `src/gate.mjs` joins `src/entry.mjs` as a module under `src/` that reads the
  filesystem, for the same reason: the question it answers is a question about a
  file. It never writes.
- `structure.test.ts` guards the wiring: the two dual-use scripts carry `--hook` in
  `hooks.json`, and every hook script reaches the gate.
