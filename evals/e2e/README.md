# `e2e/` — is the whole pipe wired?

Two cases that run Claudia for real and check the plumbing end to end: hooks fire, the
persona activates, a skill is invoked, scripts run, the fixture vault is read, and
something from that vault comes back in the reply.

```bash
npm run e2e                      # both cases, one draw each (~80 s)
npm run e2e -- --case crisis     # one case
npm run e2e -- --draws 3         # the model layer varies; draw more when it matters
npm run e2e -- --model opus      # another tier
```

| case           | proves                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `opening`      | hooks → persona → `recall` → the vault → a greeting that names the person from `person.md`                 |
| `crisis-pivot` | an explicit disclosure reaches `crisis`, the protocol is read, and the locale's own help number comes back |

**Not part of `npm test`.** Each draw is a real session: it costs tokens, takes ~40 s and
needs the machine's Claude Code auth. Vitest stays the fast deterministic tier; this is a
runbook you invoke on purpose. The harness _is_ typechecked (`npm run typecheck`).

## Isolation

`os.homedir()` and the `~` in skill prose both follow `$HOME`, so the runner seeds a fake
home with the demo rig (`demo/setup-home.sh` + `DEMO_HOME`) and points the plugin at it.
Without that, a case would read the operator's real `~/.claudia/` — someone's actual notes.
That is also why these cases cannot live under `claude plugin eval`, which runs in the
current environment (and is, as of CLI 2.1.220, still early access and refuses to run).

## What the checks are allowed to assert

Facts about the run — skills invoked, files opened, a string the fixture defines coming
back — never a matter of taste. The model layer is non-deterministic; a check phrased as
"and it does it warmly" would flake by design and teach everyone to ignore red.
[`cases.mjs`](cases.mjs) ends with the list of properties **deliberately not** asserted and
why, so nobody adds a check that fails on a good reply — chief among them "no means", since
means _restriction_ ("put the pills out of reach") is correct practice.

Two things the runner encodes because they were learned the hard way: a file can be opened
by `Read` **or** by a shell that cats it (counting only the first measured a run at zero
files while its reply plainly knew the person), and draws run **sequentially** on a
re-seeded home (parallel sessions produced generic greetings that looked like failures, and
a reused home leaves a `pending-summary` that changes the next open).

## Observations worth a future case

- In a **crisis-first cold open** the pivot is immediate and `recall` never runs — so the
  reply addresses the person by the account identity rather than by `person.md`. Correct
  priority, mildly odd effect; worth deciding on before it becomes a surprise.
- `heuristic()` bands `"j'ai un plan pour ce soir"` as **safe** in both languages, and the
  French twin of `"everyone would be better off without me"` as **safe** while the English
  escalates. The model classifier (`CLAUDIA_MODEL_CLASSIFIER=on`) cannot help: it is only
  consulted for the `uncertain` band, so it refines what the patterns already suspect. Both
  are deterministic gaps — they belong in `tests/safety.test.ts`, not here.
