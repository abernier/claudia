---
status: accepted
---

# Claudia's skills load only when she is addressed

[ADR-0036](0036-every-hook-is-gated.md) closed one door: the hooks. The other stayed
open. The plugin is installed at user scope, so every skill and command description
it ships sits in the context of **every** Claude Code session on the machine, and the
model reads each one as an invitation. The persona's said to trigger on emotional
disclosure ("I feel…", "I've been struggling…", "I don't know what to do") and
whenever the person named Claudia. A coding session where someone writes "I don't
know what to do with this test" matches the first; a session working on this very
repository, where "Claudia" is a path, a skill name and the subject of every other
sentence, matches the second all day long. The sub-skills carried generic triggers of
their own — "remind me to…", "quiz me", "keep that", "look something up" — and the
commands were model-invocable too: "save your memory" in any session could run
`/save`. Loading the persona is also what opens every hook's gate (ADR-0036), so a
mistaken load does not stay contained: it turns the whole session into hers.

## Decision

**Claudia activates only when the person addresses her, and nothing of hers runs
outside a session where she is active.**

- **The persona loads on an address, never on a mention or a mood.** The `claudia`
  skill's description names the same shapes `addressesClaudia` recognises
  (ADR-0036): a message that opens with her name as a vocative ("Claudia, …", "Hey
  Claudia!", "Claudia" alone), `@Claudia` as a standalone word — plus an explicit
  wish to talk to her, or a slash command naming the skill. It says in so many words
  that her name anywhere else is a mention (a repo, a path, a skill, a sentence about
  her) and that emotional content alone is not an address, and tells the model to
  carry on with the work at hand.
- **Every other skill is scoped to her session.** Each sub-skill description opens
  with the same clause — _Only inside an active Claudia session (the claudia skill
  already loaded)_ — so its triggers are read as things said to her, in her
  conversation. The persona is the only door; the rooms behind it are reached
  through it.
- **The crisis skill is in her session like the rest.** It stays model-invocable:
  inside a Claudia session it fires on the danger itself and whenever the per-turn
  safety hook's `[CLAUDIA SAFETY]` note says to, and that hook only ever runs in a
  Claudia session. Outside one, the model's own safety behaviour answers a person
  in danger; routing them into a companion they never asked for is not the answer.
- **Commands are typed, never chosen for the person.** Every file in `commands/`
  carries `disable-model-invocation: true`. They were always person-pulled (ADR-0019,
  ADR-0027), no skill invokes one, and the flag makes that true by construction
  rather than by the model's restraint. `/help-now` stays one keystroke away in any
  session.
- `structure.test.ts` guards all four: the persona's description names the address
  and carries none of the old disclosure triggers, every other skill opens with the
  scope clause, the crisis skill still answers the safety note, and every command
  carries the flag.

## Why not another lever

- **`disable-model-invocation` on the persona.** Zero leakage, but the person would
  have to type a slash command to reach her. "Claudia, …" as the first words of a
  conversation is how she is meant to be met (the demo opens exactly so), and it is
  the same signal the safety gate already trusts on turn one.
- **Keeping the disclosure trigger.** It is the one that fires in unrelated work, and
  a person who wants her can say her name. Someone who opens up to a plain Claude
  session is answered by Claude, as anywhere else.
- **Hiding the sub-skills from the model** (`user-invocable: false`, or making them
  user-invoked). The persona reaches them on her own mid-conversation — `recall` at
  the open, `crisis` on the safety note, `todo` when a step is agreed — so they must
  stay model-invocable; a description can scope them, a flag cannot.

## Consequences

- A description is a pointer the model weighs, not a gate code enforces. This makes
  a mistaken load much less likely; it cannot make it impossible. The hooks stay
  behind ADR-0036's deterministic gate either way, so a stray sub-skill load writes
  nothing and injects nothing.
- ADR-0036's accepted gap now reads more narrowly still: a first message in crisis
  that does not address Claudia gets no Claudia at all, from the hook or from a skill.
  Its note that the `crisis` description "triggers on the danger itself" holds inside
  a Claudia session only.
- A person who opens with "I've been struggling…" and nothing else is answered by
  Claude, not by Claudia. Saying her name is the whole door.
