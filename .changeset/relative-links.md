---
"claudia": patch
---

Drop Obsidian-style `[[wikilinks]]` from everything generated into `~/.claudia/` in
favour of **plain relative markdown links** (`[Marie](Marie.md)`,
`[…](../sessions/<stem>.summary.md)`). The dashboard mirror (`src/dashboard.mjs`) now
emits relative links, and the skills/template that write the person's notes (fiches,
`themes.md` + `themes/`, `timeline.md`, `todo.md`) prescribe them — computed from the
linking file's own directory, with space-bearing paths wrapped in angle brackets. As a
result the export pass no longer rewrites anything: `scripts/vault-export.mjs` copies the
vault out verbatim, and the `wikilinksToRelative` helper (`src/vault.mjs`) is removed. The
notes stay portable and legible everywhere (GitHub, any plain viewer, Obsidian) with no
rewrite step. Docs and ADRs (0011/0014/0015/0018/0019, memory-layout) updated to match.
