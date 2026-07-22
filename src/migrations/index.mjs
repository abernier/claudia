/**
 * Claudia — the vault-migration registry (ADR-0020).
 *
 * An ordered list of migrations. Each module exports `{ id, description, migrate(files) }`
 * where `migrate` is a pure `{ relPath: content } → { relPath: newContent }` transform
 * (changed files only, idempotent). Adding a future migration is one new
 * `NNNN-<slug>.mjs` file + one line here — that is the whole reusable pattern.
 *
 * The runner (`scripts/migrate-vault.mjs`) walks this list, skips ids already in the
 * vault's `.migrations` ledger, and applies the rest (backup first). `recall` runs the
 * same runner as benign background upkeep.
 */
import * as m0001 from "./0001-wikilinks-to-relative.mjs";

/**
 * One vault migration, as exported by an `NNNN-<slug>.mjs` module.
 * @typedef {object} Migration
 * @property {string} id  ledger id, `NNNN-<slug>` (matches the module's filename stem)
 * @property {string} description  one-line human summary shown by the runner
 * @property {(files: Record<string, string>) => Record<string, string>} migrate  pure transform: `{ relPath: content }` in, changed files only out
 */

/** @type {ReadonlyArray<Migration>} */
export const migrations = [m0001];
