/**
 * Migration 0002 — stamp the identity keys on session summaries, exercises and teachings.
 *
 * Pure and importable (no fs, no process): given the vault's files as
 * `{ relPath: content }`, return `{ relPath: newContent }` for the files that CHANGE.
 * The runner (`scripts/migrate-vault.mjs`) does the reads/writes and the backup.
 *
 * Why: these three note kinds had no written frontmatter contract, so the model
 * re-improvised the block at every write and it drifted — summaries with no block at
 * all, a `session:` key holding the bare short id in one file and the full stem in
 * another, and exercise `session:` values pointing at sessions that never existed.
 * From now on the identity keys are written by code (`scripts/finish-distillation.mjs`);
 * this migration brings the notes already on disk up to that contract, once.
 *
 * What it enforces, per file:
 *  - `sessions/<stem>.summary.md`             → `type: session`, `session: <stem>`,
 *                                               and `dates: [<stem date>]` **only if absent**
 *  - `sessions/{exercises,teachings}/<f>.md`  → `type`, `created`, `slug` from the filename,
 *                                               and a **dead `session:` repaired** when its
 *                                               short id resolves to exactly one summary
 *
 * What it deliberately does NOT do:
 *  - never invents a `session:` for a deliverable that has none — which session
 *    produced it is not recoverable from the file;
 *  - never rewrites an existing `dates:` — that is a fact about the conversation
 *    (a session can span midnight), not about the filename;
 *  - never touches `people:` / `themes:` — the judgment half of the block stays the
 *    person's and the model's;
 *  - never guesses an ambiguous stem: zero or several candidates → left as-is, because
 *    a confidently wrong link is worse than a visibly broken one.
 *
 * Idempotent by construction: `stampIdentity` returns the input string untouched when
 * every handed key is already correct, so a second pass yields `{}` — which is how the
 * runner's ledger stays honest and how `recall`'s auto-apply is a safe no-op.
 */
import { parseFrontmatter, stampIdentity } from "../frontmatter.mjs";

export const id = "0002-vault-frontmatter";
export const description = "Stamp identity frontmatter on summaries, exercises and teachings";

/** `sessions/<stem>.summary.md` — the stem is the capture. */
const SUMMARY = /^sessions\/([^/]+)\.summary\.md$/;

/** `sessions/exercises|teachings/<basename>.md` — the deliverables a session leaves behind. */
const DELIVERABLE = /^sessions\/(exercises|teachings)\/([^/]+)\.md$/;

/** Leading `YYYY-MM-DD` of a stem or a deliverable filename. */
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

/** A session-keyed stem, `<date>-<shortId>`; the capture is the short id (ADR-0017). */
const STEM_ID = /^\d{4}-\d{2}-\d{2}-(.+)$/;

/** Directory → the `type:` its notes carry. @type {Record<string, string>} */
const KIND = { exercises: "exercise", teachings: "teaching" };

/**
 * Every stem that has a distilled summary in this vault — the set a `session:` value
 * must resolve into.
 * @param {Record<string, string>} files
 * @returns {Set<string>}
 */
function summaryStems(files) {
  /** @type {Set<string>} */
  const stems = new Set();
  for (const rel of Object.keys(files)) {
    const m = SUMMARY.exec(rel);
    if (m) stems.add(/** @type {string} */ (m[1]));
  }
  return stems;
}

/**
 * The stem a `session:` value should hold, or null to leave it alone.
 *
 * Already an existing stem → null (nothing to do). Otherwise the value's short id is
 * matched against the known stems: `2026-07-22-9113d5d7` and the bare `9113d5d7` both
 * resolve to `2026-07-21-9113d5d7`, because the id is the identity and the date prefix
 * is only the session's first-seen day (ADR-0017). Anything matching zero or several
 * stems returns null — never guessed.
 *
 * @param {string} value  the `session:` currently written in the note
 * @param {Set<string>} stems  stems that actually have a summary
 * @returns {string | null} the repaired stem, or null when it must not be touched
 */
function resolveStem(value, stems) {
  if (stems.has(value)) return null;
  const shortId = STEM_ID.exec(value)?.[1] ?? value;
  const hits = [...stems].filter((s) => s === shortId || s.endsWith(`-${shortId}`));
  return hits.length === 1 ? /** @type {string} */ (hits[0]) : null;
}

/**
 * The identity keys this file should carry, in the order they should appear, or null
 * when the file is not one this migration owns.
 *
 * @param {string} rel  vault-relative POSIX path
 * @param {string} content  the note's current contents (read to honour an existing `dates:` / `session:`)
 * @param {Set<string>} stems
 * @returns {Record<string, import("../frontmatter.mjs").FrontmatterValue> | null}
 */
function identityFor(rel, content, stems) {
  const summary = SUMMARY.exec(rel);
  if (summary) {
    const stem = /** @type {string} */ (summary[1]);
    /** @type {Record<string, import("../frontmatter.mjs").FrontmatterValue>} */
    const identity = { type: "session", session: stem };
    const date = DATE_PREFIX.exec(stem)?.[1];
    if (date && !parseFrontmatter(content).data.dates) identity.dates = [date];
    return identity;
  }

  const deliverable = DELIVERABLE.exec(rel);
  if (deliverable) {
    const kind = KIND[/** @type {string} */ (deliverable[1])];
    if (!kind) return null;
    const base = /** @type {string} */ (deliverable[2]);
    const date = DATE_PREFIX.exec(base)?.[1];
    /** @type {Record<string, import("../frontmatter.mjs").FrontmatterValue>} */
    const identity = { type: kind };
    if (date) identity.created = date;
    identity.slug = date ? base.slice(date.length + 1) : base;
    const current = parseFrontmatter(content).data.session;
    if (typeof current === "string" && current) {
      const repaired = resolveStem(current, stems);
      if (repaired) identity.session = repaired;
    }
    return identity;
  }

  return null;
}

/**
 * @param {Record<string,string>} files  vault-relative path → content (transcripts already excluded by the runner)
 * @returns {Record<string,string>} changed files only (empty when nothing to do)
 */
export function migrate(files) {
  const stems = summaryStems(files);
  /** @type {Record<string, string>} */
  const out = {};
  for (const [rel, content] of Object.entries(files)) {
    if (!rel.endsWith(".md") || rel.endsWith(".transcript.md")) continue;
    const identity = identityFor(rel, content, stems);
    if (!identity) continue;
    const next = stampIdentity(content, identity);
    if (next !== content) out[rel] = next;
  }
  return out;
}
