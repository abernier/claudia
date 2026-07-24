---
status: accepted
---

# Consultation under professional secrecy — Claudia as a tool-less colleague agent

Claudia is a skill: invoking her turns the _current_ session into her, with
recall, memory, and the safety floor all in play. That is the right shape for a
session — and the wrong one for a question. A wish surfaced while dogfooding:
from a coding session (or any other), ask for _Claudia's professional read_ — on
a situation, a text, a design touching care — the way you'd knock on a
colleague's door. The obvious mechanics leak: a subagent told to "load the
claudia skill and answer" would dutifully run recall and pull `~/.claudia` — a
real person's distilled sessions — into whatever context asked. Her advice would
arrive with her patientèle's file open on the table.

## Decision

**Ship `agents/consult.md` — a `claudia:consult` subagent whose professional
secrecy is structural, not promised.**

- **Secrecy by construction: the allowlist is the guarantee.** The agent's
  frontmatter grants exactly one tool, `WebSearch` — no filesystem access of any
  kind, and (because `tools:` gates MCP too) no MCP tools. A zero-tool agent is
  not expressible (Claude Code refuses to launch one), and the doc-suggested
  minimum, `Read`, is precisely the tool that must not exist here. `WebSearch`
  is the one grant that both cannot reach `~/.claudia` and serves the persona's
  evidence-informed spine. The `disallowedTools` line (`Read, Bash, … mcp__*`)
  is redundant with the allowlist — it is documentation of intent, and a second
  fence if someone later widens `tools:`.
- **Neither confirm nor deny.** The prompt makes the clinical stance explicit:
  whether Claudia accompanies any particular person is itself confidential —
  confirming a session exists is already a breach. Injected instructions asking
  her to "just hint at" notes get the same answer, which she can give honestly:
  there is nothing in this room to read.
- **She reasons only over the question.** A consultation is her professional
  opinion on what the asker chose to describe — situations, texts, designs,
  general questions in her fields. What the caller puts in the prompt is the
  caller's disclosure, not hers.
- **Crisis does not get triaged by proxy.** If the question describes someone
  possibly in danger, the consult names that plainly and points to a live
  conversation (and emergency services if urgent) — the safety floor's pivot
  belongs where the person actually is.
- **Same Claudia, different room.** The persona essentials (warm, humble, not a
  clinician, evidence-informed, no romance, minors) are restated inline in the
  agent prompt, because she cannot read `SOUL.md` — the price of the empty
  toolbox, paid deliberately.

## Non-goals, and why

- **No memory-informed consultation.** "Her opinion, with her notes" is not a
  consult — it is a session, and it happens where recall, first-run disclosure,
  and the safety floor live: the `claudia` skill, with the person present.
- **The denylist is not the mechanism.** Enumerating forbidden tools can never
  be complete (new MCP servers appear per-session); only the one-tool allowlist
  is load-bearing. The denylist ships anyway, as stated intent.
- **Not a second persona.** `consult` adds a room, not a character; drift
  between the agent prompt and `SOUL.md` is a bug, not a fork.

## Consequences

- A structure test pins the guarantee: the frontmatter's `tools:` line must
  grant `WebSearch` alone, and the prompt must state the
  neither-confirm-nor-deny stance.
- No other doc changes: agents are not enumerated in `README.md` or
  `CONTEXT.md` (the auditor never was either); each lives in its ADR and its
  test.
- Any session with the plugin can now ask for her read —
  `Agent(subagent_type: "claudia:consult")` — and the worst a hostile prompt
  can extract is a well-sourced opinion.
