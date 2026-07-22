/**
 * Claudia — detecting sessions that were archived but never distilled
 * (pure, importable, testable). No filesystem or process side effects live here.
 *
 * Why this exists: distillation was a *close-time* ritual — `distill-session` had
 * to run before the conversation ended. But a person just closes the terminal, so
 * the ritual rarely fires and the working memory (`*.summary.md`, `person.md`, …)
 * never materialises; only the raw transcript is saved (ADR-0016).
 *
 * The fix defers distillation to the next session's OPEN, which is structurally
 * reliable (a Claudia conversation cannot happen without `recall`). `save-session`
 * drops a `<stem>.pending-summary` marker on every close; this module turns that
 * marker into a machine signal `recall` can act on, and clears once a summary
 * exists.
 *
 * The **stem** is the archive key: the filename minus its known suffix. It is
 * `<date>-<session_id>` for session-keyed archives (ADR-0017) and plain `<date>`
 * for the legacy date-keyed ones — this module treats both uniformly.
 */

/** `<stem>.<kind>` — the stem is everything before a recognised session suffix. */
const SESSION_FILE = /^(.+)\.(transcript\.md|transcript\.jsonl|summary\.md|pending-summary)$/;

/**
 * The per-stem record of which session artefacts exist — the value type of the
 * Map returned by {@link sessionIndex}.
 *
 * @typedef {object} SessionArtifacts
 * @property {boolean} transcript - a `transcript.md` or `transcript.jsonl` exists
 * @property {boolean} summary - a distilled `summary.md` exists
 * @property {boolean} pending - a `pending-summary` marker exists (distillation owed)
 */

/**
 * Fold a flat list of `sessions/` filenames into a per-stem record of which
 * artefacts exist. Unrelated files (teachings/, exercises/, dotfiles) are ignored.
 * Returns a Map<stem, {transcript, summary, pending}>.
 *
 * @param {string[] | null | undefined} filenames - directory listing of `sessions/`; null-ish is treated as empty
 * @returns {Map<string, SessionArtifacts>}
 */
export function sessionIndex(filenames) {
  /** @type {Map<string, SessionArtifacts>} */
  const byStem = new Map();
  for (const name of filenames || []) {
    const m = SESSION_FILE.exec(String(name));
    if (!m) continue;
    // Both groups are non-optional in SESSION_FILE, hence the two casts on `stem`.
    const [, stem, kind] = m;
    const rec = byStem.get(/** @type {string} */ (stem)) || { transcript: false, summary: false, pending: false };
    if (kind === "summary.md") rec.summary = true;
    else if (kind === "pending-summary") rec.pending = true;
    else rec.transcript = true; // transcript.md | transcript.jsonl
    byStem.set(/** @type {string} */ (stem), rec);
  }
  return byStem;
}

/**
 * Stems that carry a `pending-summary` marker — the dirty flag `save-session` drops
 * on every close and `distill-session` clears once it has (re)written the summary.
 * A distilled, untouched session has no marker and is not returned; a session that
 * was distilled and then **resumed** gets a fresh marker, so its now-stale summary
 * is refreshed rather than left behind. Sorted so a caller can distill oldest first
 * (stems begin with the date). Deterministic detection; distillation is the model's
 * job (see `recall` / `distill-session`).
 *
 * @param {string[] | null | undefined} filenames - directory listing of `sessions/`; null-ish is treated as empty
 * @returns {string[]} pending stems, sorted ascending (oldest first)
 */
export function pendingSessions(filenames) {
  const out = [];
  for (const [stem, rec] of sessionIndex(filenames)) {
    if (rec.pending) out.push(stem);
  }
  return out.sort();
}
