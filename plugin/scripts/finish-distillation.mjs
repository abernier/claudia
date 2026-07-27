#!/usr/bin/env node
/**
 * Claudia — close a distillation: stamp the summary's identity, then clear the marker.
 *
 * Usage: node scripts/finish-distillation.mjs <stem> [deliverable...]
 *   vault root: $CLAUDIA_ROOT, default ~/.claudia
 *   deliverable: an exercise/teaching written this session, so it gets stamped too
 *
 * Why this exists, and why it is a script rather than a line of prose:
 *
 * A note's frontmatter splits in two. The **judgment** half (`people:`, `themes:`) can
 * only come from the model — it read the conversation. The **identity** half
 * (`type:`, `session:`, `dates:`) is derivable, and every time the model was asked to
 * write it too, it drifted: summaries with no block at all, a `session:` holding the
 * bare short id in one file and the full stem in another, deliverables pointing at
 * sessions that never existed. Prose could not hold it, because nothing parses these
 * blocks — drift is invisible to the tests.
 *
 * So identity stops being the model's job. `save-session` (SessionEnd) computes it
 * from the transcript it already holds and leaves it in `<stem>.pending-summary`;
 * this script stamps it onto the summary the model just wrote.
 *
 * The enforcement is structural: `distill-session` has to clear the marker to close
 * the deferred-distillation state machine (ADR-0016), and this IS how the marker gets
 * cleared. Skipping the step leaves the marker, so `recall` simply re-flags the
 * session at the next open. The model cannot forget the frontmatter without also
 * failing to finish — and failing to finish is already self-healing.
 *
 * The same split applies to the deliverables an `exercise` or `teach` leaves behind.
 * Their `session:` key was the worst of the drift — it pointed at sessions that never
 * existed — and the cause was structural: mid-conversation, when the file is written,
 * the session's stem does not exist yet (`save-session` mints it at close), so the
 * model could only invent one. Now it doesn't have to: it passes the *path* it wrote,
 * and this script supplies the *value*. Same division as everywhere else — the model
 * knows which file, the code knows the identity.
 *
 * Fail-safe in the same direction as the rest of the layer: the marker is removed
 * ONLY after a successful stamp. A missing summary, an unreadable file, a malformed
 * block — any of these leaves the flag standing rather than losing the session.
 * Always exits 0: never break the host.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, stampIdentity } from "../src/frontmatter.mjs";

/** Leading `YYYY-MM-DD` of a stem (ADR-0017) or of a deliverable's filename. */
const STEM_DATE = /^(\d{4}-\d{2}-\d{2})/;

/** `sessions/exercises|teachings/<basename>.md` — the only paths a deliverable may live at. */
const DELIVERABLE = /^sessions\/(exercises|teachings)\/([^/]+)\.md$/;

/** Directory → the `type:` its notes carry. @type {Record<string, string>} */
const KIND = { exercises: "exercise", teachings: "teaching" };

/**
 * Stamp one deliverable with the identity derived from its own path plus the session
 * that produced it. Silently skips anything outside `sessions/{exercises,teachings}/`
 * — a path this script does not own is a caller mistake, not a licence to write.
 *
 * @param {string} root  vault directory
 * @param {string} rel  vault-relative POSIX path of the deliverable
 * @param {string} stem  the session stem to attribute it to
 * @returns {Promise<boolean>} true when the file was rewritten
 */
async function stampDeliverable(root, rel, stem) {
  const m = DELIVERABLE.exec(rel);
  if (!m) return false;
  const kind = KIND[/** @type {string} */ (m[1])];
  if (!kind) return false;
  const base = /** @type {string} */ (m[2]);
  const abs = path.join(root, rel);
  /** @type {string} */
  let content;
  try {
    content = await fs.readFile(abs, "utf8");
  } catch {
    return false;
  }
  const date = STEM_DATE.exec(base)?.[1];
  /** @type {Record<string, import("../src/frontmatter.mjs").FrontmatterValue>} */
  const identity = { type: kind };
  if (date) identity.created = date;
  identity.slug = date ? base.slice(date.length + 1) : base;
  identity.session = stem;
  const next = stampIdentity(content, identity);
  if (next === content) return false;
  await fs.writeFile(abs, next);
  return true;
}

/**
 * What `finishDistillation` did — returned rather than printed, so tests read the
 * outcome and the caller decides what (if anything) is worth saying.
 * @typedef {'stamped' | 'unchanged' | 'no-summary' | 'no-stem'} FinishStatus
 */

/**
 * Stamp `<stem>.summary.md` with the session's identity, then clear its marker.
 *
 * `dates` resolution, in order of authority:
 *  1. the marker's own `dates:` — computed by `save-session` from the transcript's
 *     timestamps, so it spans midnight correctly. Authoritative: it overwrites.
 *  2. otherwise the stem's date, but only when the summary has no `dates:` yet — a
 *     fallback must never overwrite something better. This is the live-at-close path,
 *     where the marker does not exist yet.
 *
 * @param {{ root: string, stem: string, deliverables?: string[] }} opts
 *   `deliverables` are vault-relative paths written this session (exercises, teachings);
 *   each is stamped with this stem, so no caller ever has to know one.
 * @returns {Promise<FinishStatus>}
 */
export async function finishDistillation({ root, stem, deliverables = [] }) {
  if (!stem) return "no-stem";
  const dir = path.join(root, "sessions");
  const summaryPath = path.join(dir, `${stem}.summary.md`);
  const markerPath = path.join(dir, `${stem}.pending-summary`);

  /** @type {string} */
  let summary;
  try {
    summary = await fs.readFile(summaryPath, "utf8");
  } catch {
    // Nothing was distilled: keep the flag so the next recall picks it up again.
    return "no-summary";
  }

  const marker = await fs.readFile(markerPath, "utf8").catch(() => "");

  /** @type {Record<string, import("../src/frontmatter.mjs").FrontmatterValue>} */
  const identity = { type: "session", session: stem };
  const computed = parseFrontmatter(marker).data.dates;
  if (Array.isArray(computed) && computed.length) {
    identity.dates = computed;
  } else if (!parseFrontmatter(summary).data.dates) {
    const date = STEM_DATE.exec(stem)?.[1];
    if (date) identity.dates = [date];
  }

  const stamped = stampIdentity(summary, identity);
  const changed = stamped !== summary;
  if (changed) await fs.writeFile(summaryPath, stamped);

  for (const rel of deliverables) {
    await stampDeliverable(root, rel, stem).catch(() => false);
  }

  // Only now — the summary is on disk and correct.
  await fs.rm(markerPath, { force: true }).catch(() => {});
  return changed ? "stamped" : "unchanged";
}

/** @returns {Promise<void>} always exits 0 */
async function main() {
  try {
    const stem = process.argv[2] || "";
    const deliverables = process.argv.slice(3);
    const root = process.env.CLAUDIA_ROOT || path.join(os.homedir(), ".claudia");
    const status = await finishDistillation({ root, stem, deliverables });
    // Silent on the normal paths; the abnormal ones are worth surfacing to the caller
    // (the model), because they mean the session is still owed a summary.
    if (status === "no-stem") process.stderr.write("finish-distillation: no session stem given\n");
    if (status === "no-summary") process.stderr.write(`finish-distillation: no ${stem}.summary.md — marker kept\n`);
  } catch {
    /* fail silent — the marker stays, recall retries */
  }
  process.exit(0);
}

// Run only when invoked directly, not on import (tests import finishDistillation).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
