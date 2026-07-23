---
status: accepted
---

# Strict TypeScript checking without transpilation

The plugin's runtime is ~2,300 lines of plain ESM JavaScript (`src/`, `scripts/`),
executed directly by the person's own `node` — hooks run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/*.mjs"` on whatever Node the person has, with
no install step, no build step, no runtime dependencies. That code handles the most
sensitive material in the project: paths under `~/.claudia/`, external JSON
boundaries (hook stdin payloads, `config.json`, transcript JSONL), regex over
personal notes. Exactly the terrain where `null`/`undefined` surprises live — and
it was entirely untyped.

## Decision

TypeScript enters as a **dev-only checker, never a compiler**. The latest
TypeScript (7.x, the native compiler) is a devDependency; nothing about the
runtime contract changes.

- **Runtime files stay `.mjs`.** Any Node, no build, no shims, no new
  requirement on the person's machine. The `package.json` promise — "the plugin
  itself needs no runtime deps" — holds bit-for-bit.
- **Typing lives in JSDoc**, verified by `tsc --noEmit` with `checkJs` +
  `strict: true` + `noUncheckedIndexedAccess` (`tsconfig.json` covers `src/`,
  `scripts/`, `tests/`). The extra flag is deliberate: this codebase lives in
  `Record<string, string>` maps of vault files, exactly the class of indexed
  access where a created-not-rewritten file yields a silent `undefined`.
- **No escape hatches.** No `@ts-nocheck`, no `@ts-ignore`;
  `@ts-expect-error` only with a written justification. External JSON is cast
  once, at its parse site, to a documented typedef.
- **Shared types are collocated.** The module that *parses* a shape owns its
  exported `@typedef` — hook payloads in the script that reads that event,
  `config.json` in its reader, migration records in `src/migrations/index.mjs`.
  Consumers write `import('./x.mjs').TypeName`. No central `types.d.ts`:
  provenance stays readable in the import.
- **Tests are real TypeScript** (`tests/*.test.ts`). They never run on the
  person's machine; Vitest executes them natively. Real TS syntax where it is
  free, JSDoc only on the boundary that must remain executable JS.
- **Enforcement is local**: `npm run typecheck`, and `npm test` runs the
  typecheck before Vitest — one reflex covers both, including before a release
  tag. (No CI gate — deliberate; it matches the repo's hand-cut release flow.)

## Alternatives considered

- **Native `.mts` + Node type stripping.** Stable since Node 22.18/24.3 and
  default in every maintained Node line — but the person's *installed* Node is
  uncontrolled and unenforceable: Claude Code plugins have no `engines`
  mechanism, no install-time validation, and hooks run whatever `node` is on
  PATH. On an older Node, a `.mts` file dies **at parse time**, before a single
  line runs — hooks silently disabled, transcripts silently no longer saved,
  the safety-floor context silently no longer injected. A guarded variant (one
  plain-JS launcher checking `process.features.typescript`, then dynamically
  importing `.mts` entries) makes that failure loud instead of silent, but
  still degrades the safety floor on old Node, and renames/moves ripple through
  `hooks.json`, seven commands, two skills, the tests and the docs — all to buy
  nicer annotation syntax. Revisit once pre-22.18 Node is extinct in the wild:
  the JSDoc annotations transpose mechanically, and by then no launcher would
  be needed at all.
- **`tsc` build with a committed `dist/`.** Works on any Node, but trades the
  "no build step" property for permanent source/dist drift risk and PR noise.
- **Chosen: checking without transpilation.** It delivers the actual value of
  TypeScript — strict compile-time verification with the latest compiler,
  autocompletion, safe refactors — at zero runtime risk, and it is the only
  option whose worst-case failure mode is a red `npm test` rather than a person
  quietly losing their memory archive.
