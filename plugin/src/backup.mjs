/**
 * Claudia — the rotating vault archive (pure, importable, testable). No filesystem
 * or process side effects live here; `scripts/vault-backup.mjs` does the I/O.
 *
 * The vault is a few megabytes of plain markdown that exists in exactly one place
 * (ADR-0004: local only, never uploaded). One bad write, one mistaken `rm`, one
 * half-applied migration and a person's notes are gone. `/migrate` already backs the
 * whole vault up before it rewrites anything (ADR-0020) — this generalises that
 * reflex to a standing safety net.
 *
 * Two failure modes shape everything here, and they pull in opposite directions:
 *
 * - **Sudden loss** — the file is gone, and you want the most recent copy. Solved by
 *   archiving often.
 * - **Slow corruption** — something has been quietly wrong for three weeks, and you
 *   want a copy from *before* it started. Archiving often makes this *worse*: a naive
 *   "keep the last 30" rotation, fed hourly, holds barely a day of history, so by the
 *   time anyone notices, every good copy has been evicted by a bad one.
 *
 * So the retention ladder ({@link selectRetention}) is tiered rather than flat: every
 * archive from the last two days, then one per day, per week, per month, and one per
 * year kept forever. A vault of this size makes that nearly free — a year of history
 * costs a few megabytes — and it means the window in which a corruption can outlive
 * all of its ancestors does not exist.
 *
 * What this module deliberately does NOT do:
 *
 * - **No auto-pinning.** An earlier sketch pinned the last archive whenever the vault
 *   shrank, so a "suspicious" deletion could never be rotated out. That silently
 *   preserves exactly what `/forget` promises to destroy ("permanent, no undo" —
 *   safety-floor rule 10). Pins are a manual affordance only (a `.keep` sidecar the
 *   person can touch by hand), and deletion outranks backup: `/forget` purges the
 *   archive set. A shrinking vault therefore only ever produces a *warning*
 *   ({@link checkVault}) — never a refusal, and never a pin.
 * - **No repair.** {@link checkVault} refuses to archive an empty vault, because
 *   overwriting a good ladder with nothing is the one unrecoverable case. Everything
 *   else it merely reports; guessing which of two states is "right" is not its job.
 */

import { createHash } from "node:crypto";

/** The archive filename's fixed parts: `claudia-vault-<stamp>.tar.gz`. */
export const ARCHIVE_PREFIX = "claudia-vault-";
export const ARCHIVE_SUFFIX = ".tar.gz";

/**
 * Sidecars that live beside an archive. The manifest is what makes an archive
 * comparable to the live vault without unpacking it; the pin is the person's manual
 * "never rotate this one out".
 */
export const MANIFEST_SUFFIX = ".manifest";
export const PIN_SUFFIX = ".keep";

/**
 * Working files whose disappearance is worth saying out loud. Not a completeness
 * check — a vault legitimately lacks all of these on day one, and `/forget` may
 * legitimately remove any of them. The warning fires only when one was present in
 * the previous archive and is absent now.
 *
 * @type {readonly string[]}
 */
export const CORE_FILES = ["MEMORY.md", "person.md", "safety.md"];

/**
 * Noise excluded from both the archive and the digest. `.DS_Store` matters more than
 * it looks: Finder rewrites it just from opening the folder, so counting it would
 * mint a fresh archive — and burn a retention slot — for a change the person never
 * made.
 */
const IGNORED = [/(^|\/)\.DS_Store$/, /(^|\/)\._[^/]+$/, /(^|\/)\.git(\/|$)/];

/**
 * Whether a vault-relative path is noise rather than the person's data.
 *
 * @param {string} rel - vault-relative path, `/`-separated
 * @returns {boolean}
 */
export function isIgnored(rel) {
  return IGNORED.some((re) => re.test(rel));
}

/**
 * One file as the manifest records it.
 *
 * @typedef {object} ManifestEntry
 * @property {string} rel - vault-relative path
 * @property {number} size - bytes
 * @property {string} sha256 - hex digest of the file's contents
 */

/**
 * The manifest text stored beside an archive: a header, then one sorted line per
 * file. Sorted because the digest must depend on the vault's *content*, not on the
 * order `readdir` happened to return.
 *
 * @param {ManifestEntry[]} entries
 * @returns {string}
 */
export function manifestText(entries) {
  const sorted = [...entries].sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const body = sorted.map((e) => `${e.sha256}  ${e.size}  ${e.rel}`);
  const bytes = sorted.reduce((n, e) => n + e.size, 0);
  return [`# claudia vault manifest`, `files ${sorted.length}`, `bytes ${bytes}`, ...body, ""].join("\n");
}

/**
 * The vault's content digest — the identity used to skip an unchanged snapshot.
 *
 * Derived from the manifest rather than from the `.tar.gz` bytes on purpose: gzip
 * stamps its output with the current time, so two archives of an identical vault
 * differ byte-for-byte and every run would look like a change.
 *
 * @param {ManifestEntry[]} entries
 * @returns {string} hex sha256
 */
export function vaultDigest(entries) {
  return createHash("sha256").update(manifestText(entries)).digest("hex");
}

/**
 * A snapshot's shape, as read from the live vault or from an archive's manifest.
 *
 * @typedef {object} VaultSnapshot
 * @property {string} digest
 * @property {number} files
 * @property {number} bytes
 * @property {string[]} rels
 */

/**
 * Parse a manifest sidecar back into a snapshot, so the current vault can be
 * compared against the last archive without unpacking it. Returns `null` for
 * anything unparseable — a damaged sidecar must degrade to "no previous snapshot"
 * (archive it, say nothing) rather than throw inside a hook.
 *
 * @param {string | null | undefined} text
 * @returns {VaultSnapshot | null}
 */
export function parseManifest(text) {
  if (!text) return null;
  /** @type {string[]} */
  const rels = [];
  let files = null;
  let bytes = null;
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const header = /^(files|bytes) (\d+)$/.exec(line);
    if (header) {
      if (header[1] === "files") files = Number(header[2]);
      else bytes = Number(header[2]);
      continue;
    }
    const entry = /^([0-9a-f]{64})  (\d+)  (.+)$/.exec(line);
    if (entry) rels.push(/** @type {string} */ (entry[3]));
  }
  if (files === null || bytes === null) return null;
  return { digest: digestOfText(text), files, bytes, rels };
}

/**
 * The digest a manifest text represents. Kept separate from {@link vaultDigest} so a
 * round-trip (entries → text → parse) yields the same identity.
 *
 * @param {string} text
 * @returns {string}
 */
export function digestOfText(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Below this ratio, a drop in file count or total size is worth reporting. */
export const SHRINK_RATIO = 0.7;

/**
 * Whether this vault can be archived, and whether anything about it looks wrong.
 *
 * The only refusal is an empty vault: replacing a working ladder with nothing is the
 * one mistake no later run can undo. Everything else is a warning, because the tool
 * cannot tell a corruption from a deletion the person asked for — and treating a
 * legitimate `/forget` as corruption would be its own kind of broken.
 *
 * @param {VaultSnapshot} current
 * @param {VaultSnapshot | null} previous - the last archive's manifest, if any
 * @returns {{ fatal: string | null, warnings: string[] }}
 */
export function checkVault(current, previous) {
  if (current.files === 0) {
    return { fatal: "the vault holds no files — refusing to archive nothing over the existing history", warnings: [] };
  }

  /** @type {string[]} */
  const warnings = [];
  if (previous) {
    if (current.files < previous.files * SHRINK_RATIO) {
      warnings.push(`file count fell from ${previous.files} to ${current.files} since the last archive`);
    }
    if (current.bytes < previous.bytes * SHRINK_RATIO) {
      warnings.push(`total size fell from ${previous.bytes} to ${current.bytes} bytes since the last archive`);
    }
    const had = new Set(previous.rels);
    const has = new Set(current.rels);
    const gone = CORE_FILES.filter((f) => had.has(f) && !has.has(f));
    for (const f of gone) warnings.push(`${f} was in the last archive and is gone now`);
  }
  return { fatal: null, warnings };
}

/**
 * Two-digit pad, for stamps and keys.
 *
 * @param {number} n
 * @returns {string}
 */
const p2 = (n) => String(n).padStart(2, "0");

/**
 * An archive's stamp: local `YYYYMMDD-HHMMSS`. Local rather than UTC so the ladder's
 * day and week buckets line up with the person's own days.
 *
 * @param {Date} date
 * @returns {string}
 */
export function stampOf(date) {
  return (
    `${date.getFullYear()}${p2(date.getMonth() + 1)}${p2(date.getDate())}` +
    `-${p2(date.getHours())}${p2(date.getMinutes())}${p2(date.getSeconds())}`
  );
}

/**
 * The archive filename for a moment in time.
 *
 * @param {Date} date
 * @returns {string}
 */
export function archiveName(date) {
  return `${ARCHIVE_PREFIX}${stampOf(date)}${ARCHIVE_SUFFIX}`;
}

/**
 * An archive as the retention pass sees it.
 *
 * @typedef {object} ArchiveRef
 * @property {string} name - filename, e.g. `claudia-vault-20260724-171203.tar.gz`
 * @property {Date} date - the moment its stamp encodes
 * @property {boolean} [pinned] - a `.keep` sidecar exists; never evict
 */

/**
 * Recover the moment from an archive filename. Anything that isn't one of ours (or
 * carries an unparseable stamp) returns `null`, so a stray file in the archive
 * directory is ignored rather than deleted.
 *
 * @param {string} name
 * @returns {ArchiveRef | null}
 */
export function parseArchiveName(name) {
  if (!name.startsWith(ARCHIVE_PREFIX) || !name.endsWith(ARCHIVE_SUFFIX)) return null;
  const stamp = name.slice(ARCHIVE_PREFIX.length, name.length - ARCHIVE_SUFFIX.length);
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const date = new Date(
    /** @type {number} */ (y),
    /** @type {number} */ (mo) - 1,
    /** @type {number} */ (d),
    /** @type {number} */ (h),
    /** @type {number} */ (mi),
    /** @type {number} */ (s),
  );
  // A stamp like 20260231-000000 rolls over into March; reject it rather than
  // silently file the archive under the wrong day.
  if (date.getMonth() !== /** @type {number} */ (mo) - 1 || date.getDate() !== d) return null;
  return { name, date };
}

/**
 * How much history to keep, per tier. Counted in *buckets present*, not in calendar
 * distance: a vault left untouched for six months keeps a graded ladder of its last
 * 14 active days rather than collapsing to a single archive.
 *
 * @typedef {object} RetentionPolicy
 * @property {number} recentHours - keep every archive this recent
 * @property {number} daily - keep the newest of each of the last N days
 * @property {number} weekly - ... of each of the last N ISO weeks
 * @property {number} monthly - ... of each of the last N months
 * @property {number} yearly - ... of each of the last N years (`Infinity` = forever)
 */

/** @type {RetentionPolicy} */
export const RETENTION = { recentHours: 48, daily: 14, weekly: 8, monthly: 12, yearly: Infinity };

/**
 * Bucket keys. Local-time based, like {@link stampOf}.
 *
 * @param {Date} d
 * @returns {string}
 */
export const dayKey = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
/** @param {Date} d @returns {string} */
export const monthKey = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
/** @param {Date} d @returns {string} */
export const yearKey = (d) => `${d.getFullYear()}`;

/**
 * ISO-8601 week key (`2026-W30`). Weeks belong to the year holding their Thursday,
 * which is why this cannot be derived from the month.
 *
 * @param {Date} d
 * @returns {string}
 */
export function weekKey(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Shift to the Thursday of this ISO week (Sunday counts as day 7).
  t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const jan1 = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${t.getFullYear()}-W${p2(week)}`;
}

/**
 * Split the archive set into what the ladder keeps and what it evicts.
 *
 * Invariants, in the order they override each other: the newest archive is never
 * evicted (it may be the only copy of the vault as it stands), a pinned archive is
 * never evicted, and everything inside `recentHours` is kept. Beyond that, each tier
 * keeps the newest archive in each of its most recent buckets.
 *
 * @param {ArchiveRef[]} archives - any order
 * @param {Date} now
 * @param {RetentionPolicy} [policy]
 * @returns {{ keep: ArchiveRef[], evict: ArchiveRef[] }} both newest-first
 */
export function selectRetention(archives, now, policy = RETENTION) {
  const sorted = [...archives].sort((a, b) => b.date.getTime() - a.date.getTime());
  if (!sorted.length) return { keep: [], evict: [] };

  /** @type {Set<string>} */
  const keep = new Set();
  keep.add(/** @type {ArchiveRef} */ (sorted[0]).name); // the newest, unconditionally
  for (const a of sorted) if (a.pinned) keep.add(a.name);

  const recentMs = policy.recentHours * 3600_000;
  for (const a of sorted) if (now.getTime() - a.date.getTime() <= recentMs) keep.add(a.name);

  /** @type {Array<[(d: Date) => string, number]>} */
  const tiers = [
    [dayKey, policy.daily],
    [weekKey, policy.weekly],
    [monthKey, policy.monthly],
    [yearKey, policy.yearly],
  ];
  for (const [keyOf, limit] of tiers) {
    /** @type {Map<string, ArchiveRef>} */
    const newestPerBucket = new Map();
    // `sorted` is newest-first, so the first archive seen for a key is that bucket's
    // survivor, and the map's insertion order is bucket-recency order.
    for (const a of sorted) if (!newestPerBucket.has(keyOf(a.date))) newestPerBucket.set(keyOf(a.date), a);
    let n = 0;
    for (const a of newestPerBucket.values()) {
      if (n++ >= limit) break;
      keep.add(a.name);
    }
  }

  return {
    keep: sorted.filter((a) => keep.has(a.name)),
    evict: sorted.filter((a) => !keep.has(a.name)),
  };
}

/**
 * Bytes as a person reads them. Used in `/backup`'s listing and the log.
 *
 * @param {number} n
 * @returns {string}
 */
export function humanBytes(n) {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}
