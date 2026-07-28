---
status: accepted
---

# The vault seam: one resolver, entry functions, the CLI as adapter

The person's Memory root (`~/.claudia/`) was resolved independently at nine call
sites across `scripts/`, and only one of them (`finish-distillation.mjs`)
honoured the `CLAUDIA_ROOT` override — so a dev run or a test could reach the
person's real vault through any of the other eight. The tests compensated with
four competing faking patterns: spawning with `HOME` overridden, spawning with
`CLAUDIA_ROOT`, passing a positional root argument, and importing an entry
function to inject a root directly. Nothing named the boundary, so nothing
guarded it.

## Decision

The boundary gets a name — the **vault seam** — and three rules make it real:

- **One resolver.** `src/vault.mjs` owns Memory-root resolution:
  `resolveVaultRoot(env, home)` returns the `CLAUDIA_ROOT` override when set,
  else `.claudia` under the home directory. It is the only place in the
  codebase allowed to join a home directory with `.claudia`.
- **Entry functions, options-bag, `root` explicit.** Every script under
  `scripts/` that touches the vault exposes an entry function taking an
  options-bag with `root`. Below the entry function, the root is data — nothing
  resolves it again. The CLI `main` (guarded by `isEntrypoint`) is the sole
  production adapter: it calls the resolver, then the entry function.
- **One test adapter.** The shared throwaway-vault fixture
  (`src/vault.fixture.ts`, grown from the backup suite's builder) is how tests
  build a vault. Seam tests import the entry function and pass a throwaway
  root; spawning a real process is reserved for tests where process semantics
  are the behaviour under test — stdin parsing, exit codes, environment
  handling.

No DI container, no runtime dependencies, no build step: the seam is a
parameter plus one resolver module, inside ADR-0022's rules (runtime `.mjs`,
JSDoc types, TypeScript tests beside the file they cover).

## Consequences

- A test or dev run can never touch the real vault by accident: fake the seam
  (`root`), not the machinery behind `os.homedir()`.
- `CLAUDIA_ROOT` now works everywhere, not just in one script — the demo rig
  and the dev loop override the root without overriding `HOME`.
- Scripts that accept a positional root argument keep it; the resolver only
  supplies the default, so explicit arguments still win.
