---
"claudia": patch
---

Strict TypeScript checking without transpilation (ADR-0022). Runtime stays pure
`.mjs` — no build, no new Node requirement for the person. TypeScript 7 (native
compiler) joins as a dev-only checker: full strict JSDoc annotations across
`src/` and `scripts/`, tests converted to real TypeScript (`tests/*.test.ts`),
and `npm test` now typechecks (`tsc --noEmit`) before running Vitest.
