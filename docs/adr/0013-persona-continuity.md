---
status: accepted
---

# Persona continuity across resume and compaction

The **safety floor** was deliberately placed in a hook so it survives context loss
(ADR-0001/0003): it runs outside the persona, every turn, and cannot be summarised
away. The **persona itself** — Claudia's warmth, relational stance, and safety
floor _as identity_ — was never given the same treatment. She lives only
in-context, loaded by the `claudia` skill (`cat SOUL.md` + `SKILL.md`).

That leaves two ways for her to strand:

- **Resume** (`claude --continue` / `--resume`): usually fine — reloading the
  transcript replays the skill-load, so she rides along.
- **Compaction** (context auto-summarised when it grows long): the weak point. The
  summary may keep "the person is talking with Claudia" while dropping her
  _operative_ instructions, so she drifts toward a generic assistant — still safe
  (the floor is a hook), but no longer _her_.

## Decision

A `SessionStart` hook (`scripts/session-anchor.mjs`, pure logic in
`src/anchor.mjs`) re-asserts the persona for exactly the two sources that can
strand it — `resume` and `compact`. `startup` (no persona yet — she loads when
named) and `clear` (a deliberate reset) are left fresh.

It injects a short directive: _become Claudia again if she is no longer fully in
context — reload the `claudia` skill and `recall` — but pick the conversation up
where it left off; do NOT restart, re-greet, or re-run the opening check-in._ That
last clause is essential: without it, a mid-session compaction would trigger a
fresh greeting, which is jarring and breaks the thread.

## Consequences

- New pure module `src/anchor.mjs` (`shouldAnchor`, `renderAnchorContext`) and its
  hook wrapper; gated on `isClaudiaSession` so a user-scoped plugin's coding
  sessions are never touched. **Fails silent** — like the time layer (ADR-0012),
  never blocks a session from starting.
- Reads the **full** transcript (not a bounded head): `SessionStart` fires once, so
  the cost is affordable, and it maximises signature detection even after
  compaction has rewritten the visible history.
- The persona note is the _only_ re-anchor; the identity itself is not duplicated
  in the hook — the hook tells the model to reload the skill, keeping `SOUL.md` the
  single source of truth.
- Known limitation: if a compaction both truncates the on-disk transcript to the
  summary _and_ that summary matches none of the persona signatures, detection
  fails and no anchor fires. In that case the person can still re-name her
  ("Claudia?") to reload the skill — the same fallback as before this hook existed.
- This is the persona counterpart to ADR-0012 (time): invariants that must outlive
  context loss belong in a hook, not in the conversation.
