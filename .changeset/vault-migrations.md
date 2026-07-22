---
"claudia": minor
---

Add **reusable vault migrations** (ADR-0020) — a safe, repeatable way to bring a person's
existing `~/.claudia/` notes up to date when the format changes between versions. Each
migration is a pure, idempotent transform under `src/migrations/NNNN-<slug>.mjs` behind an
ordered registry (a future migration is one new file + one line); `scripts/migrate-vault.mjs`
runs the pending ones — read → **backup first** (`~/.claudia.bak-<date>`) → apply → record
a `.migrations` ledger → rebuild the dashboard — and **never touches the verbatim
transcripts**. Migrations apply **automatically and quietly at `recall`** (background upkeep,
like deferred distillation), disclosed plainly only when they actually change something, and
a no-op after the first run (ledger + idempotency). A new **`/migrate`** command is the manual
surface: preview with a dry-run, or apply on demand. The first registered migration rewrites
the old Obsidian `[[wikilinks]]` to relative links, so upgrading users are carried forward
without hand-editing. The command surface grows from five to six.
