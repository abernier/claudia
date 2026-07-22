---
status: accepted
---

# Vault migrations — versioned, idempotent, backed-up format upgrades

The person's `~/.claudia/` note format evolves. When it does — the first case was
Obsidian `[[wikilinks]]` → plain relative markdown links (ADR-0011) — the notes a person
*already* wrote need bringing up to date. The derived `dashboard.md` self-heals (it is
rebuilt every session), but the hand-written working files — fiches, `themes.md` +
`themes/`, `timeline.md`, `todo.md`, the session summaries — do not. Doing that by hand,
per person, per change, is exactly the kind of one-off surgery that goes wrong on someone's
real data. This establishes a **repeatable, safe pattern** instead, and battle-tests it on
that first (simple) case.

Non-goal: a general migration engine. This is proportionate to a **local-first,
one-vault-per-person** plugin — a registry, a small runner, and a ledger.

## Decision

- **A numbered migration registry.** `src/migrations/NNNN-<slug>.mjs`, each exporting a
  **pure, idempotent** `migrate(files)` — `{ relPath: content } → { relPath: newContent }`,
  changed files only — plus `id` and `description`. `src/migrations/index.mjs` is the
  ordered list. **A future migration is one new file + one registry line.** That *is* the
  reusable pattern.

- **Idempotency is the source of truth; the ledger is audit/optimization.** A transform
  applied to already-migrated content returns `{}`. A `~/.claudia/.migrations` ledger
  records applied ids so the runner never needlessly re-scans — and so `recall`'s
  auto-apply is a cheap no-op after the first run — but correctness never depends on it.

- **The runner does the fs work, safely.** `scripts/migrate-vault.mjs`: read → (dry-run
  preview | **full backup** → apply → append ledger → rebuild dashboard). It **never reads
  or writes `*.transcript.md`** (the verbatim archive), and takes the backup *before*
  writing anything, to `~/.claudia.bak-<timestamp>` beside the vault — so every migration
  is reversible.

- **Applied automatically at `recall`, disclosed, backed-up.** A pending migration runs as
  part of the background upkeep `recall` already does at open (deferred distillation,
  dashboard rebuild). It is a **benign layer**: fails silent (never blocks recall), runs
  **once per format change** (ledger), and — **only when it actually migrates files** —
  Claudia **discloses it plainly, once**, and says where the backup is. Transparency about
  touching the person's data is the floor's rule (ADR-0004); the backup makes it safe.

- **`/migrate` is the manual surface.** Preview via `--dry`, re-run, or apply on demand —
  the person's explicit control over what is otherwise quiet housekeeping.

## Consequences

- Same floor guarantees as the rest of the working layer (ADR-0004): strictly local,
  never uploaded; the verbatim transcript is untouchable; a full backup precedes every
  change. Recorded in `docs/memory-layout.md`.
- The intent of the removed `wikilinksToRelative` export converter returns as a **testable
  transform** (`src/migrations/0001-wikilinks-to-relative.mjs`) — pure transforms are
  unit-tested (resolution + idempotency + transcript exclusion), the runner is
  integration-tested over a fixture vault.
- The public command surface grows from **five to six** (`/migrate` joins the deterministic
  data actions). README, the structure guard, and the command-count prose track that.
- The `.migrations` ledger is carried by `/export` (the audit trail travels with the vault)
  and removed with the directory on "forget everything" (ADR-0004).
