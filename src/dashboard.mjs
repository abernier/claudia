/**
 * Claudia — the dashboard mirror (pure, importable, testable).
 *
 * `dashboard.md` is a DERIVED, person-facing bird's-eye view of the working
 * memory (ADR-0019). It is a MIRROR, never a source of truth: this module only
 * ever **transcludes** what a source file already says (a list, a mermaid block,
 * a kept blockquote, the items under a heading) or **points** to it with a relative
 * markdown link. It NEVER summarises or paraphrases — a deterministic script cannot read therapeutic
 * prose without risking putting words in the person's mouth, so it does not try
 * ("transclude or point, never guess"). The two prose surfaces — the working
 * understanding and each session summary — are therefore *linked*, never excerpted.
 *
 * `safety.md` is deliberately absent from the mirror: a standing safety flag shown
 * at every glance would reduce the person to a risk profile and re-expose crisis
 * content (ADR-0019). The safety net lives elsewhere (the safety-check hook,
 * `/help-now`, `recall` reading `safety.md` first).
 *
 * No filesystem or process side effects here; `scripts/build-dashboard.mjs` does
 * the reads/writes and honours the opt-out.
 */

import { sessionIndex } from "./pending.mjs";

/** @typedef {import("./config.mjs").MirrorLanguage} MirrorLanguage */

const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s+\S/;
const HEADING = /^#{1,6}\s/;

/**
 * Everything the mirror says in its own voice, per shipped language (ADR-0029).
 * The person's content is transcluded verbatim and never translated — these are
 * only the headings, glue words and day format the deterministic builder must
 * choose itself. The keys of this table ARE the `language` enum in `src/config.mjs`;
 * adding a language means adding a table here and a value there, together.
 *
 * @type {Record<MirrorLanguage, {
 *   title: string, lastSession: string,
 *   cadences: Record<CadenceKey, string>,
 *   keepsake: string, whereWeAre: string, provisional: string,
 *   goals: string, themes: string, pickUp: string,
 *   threads: string, distilling: string, world: string, lifeMarkers: string,
 *   mirrorNote: string, generated: string,
 *   day: (y: string, m: string, d: string) => string,
 * }>}
 */
const STRINGS = {
  fr: {
    title: "Vue d'ensemble",
    lastSession: "dernière session",
    cadences: { daily: "~quotidien", weekly: "~hebdo", monthly: "~mensuel", sparse: "~espacé" },
    keepsake: "## Ce que tu gardes",
    whereWeAre: "## Là où on en est",
    provisional: "*(provisoire)*",
    goals: "## Objectifs",
    themes: "## Thèmes vivants",
    pickUp: "## À reprendre",
    threads: "## Derniers fils",
    distilling: "*en cours de distillation*",
    world: "## Ton monde",
    lifeMarkers: "## Repères de vie",
    mirrorNote: "*Ce fichier est un reflet, tenu à jour tout seul — tes vraies notes vivent dans les fichiers liés.*",
    generated: "généré le",
    day: (y, m, d) => `${d}/${m}`,
  },
  en: {
    title: "Overview",
    lastSession: "last session",
    cadences: { daily: "~daily", weekly: "~weekly", monthly: "~monthly", sparse: "~occasional" },
    keepsake: "## What you keep",
    whereWeAre: "## Where we are",
    provisional: "*(provisional)*",
    goals: "## Goals",
    themes: "## Living themes",
    pickUp: "## To pick up",
    threads: "## Recent threads",
    distilling: "*being distilled*",
    world: "## Your world",
    lifeMarkers: "## Life markers",
    mirrorNote: "*This file is a mirror, kept up to date on its own — your real notes live in the linked files.*",
    generated: "generated",
    day: (y, m, d) =>
      `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${Number(d)}`,
  },
};

/**
 * Group physical lines into whole list items. A **wrapped** bullet — one whose
 * text spills onto the next physical line(s) without a blank line — is captured in
 * full, so the mirror never truncates a goal to a dangling half-sentence. An item
 * runs from its `- ` line until the next list item, heading, or blank line.
 *
 * @param {string[]} lines
 * @param {number} [max]
 * @returns {string[]}
 */
function collectItems(lines, max = Infinity) {
  /** @type {string[]} */
  const out = [];
  /** @type {string | null} */
  let cur = null;
  const flush = () => {
    if (cur != null) out.push(cur.replace(/[ \t\n]+$/, ""));
    cur = null;
  };
  for (const line of lines) {
    if (LIST_ITEM.test(line)) {
      flush();
      cur = line;
    } else if (cur != null) {
      if (line.trim() === "" || HEADING.test(line)) flush();
      else cur += "\n" + line; // lazy continuation of the current bullet
    }
  }
  flush();
  return max === Infinity ? out : out.slice(0, max);
}

/**
 * Whole markdown list items (bullets, numbered, checkboxes), wrapped lines included, right-trimmed.
 *
 * @param {string | null | undefined} md
 * @param {{ max?: number }} [opts]
 * @returns {string[]}
 */
export function listItems(md, { max = Infinity } = {}) {
  if (!md) return [];
  return collectItems(String(md).split(/\r?\n/), max);
}

/**
 * The whole list items under the first `#…` heading matching `headingRe`, until the next heading.
 *
 * @param {string | null | undefined} md
 * @param {RegExp} headingRe
 * @param {{ max?: number }} [opts]
 * @returns {string[]}
 */
export function sectionItems(md, headingRe, { max = Infinity } = {}) {
  if (!md) return [];
  const section = [];
  let inSection = false;
  for (const line of String(md).split(/\r?\n/)) {
    if (HEADING.test(line)) {
      if (inSection) break; // reached the next heading
      inSection = headingRe.test(line);
      continue;
    }
    if (inSection) section.push(line);
  }
  return collectItems(section, max);
}

/**
 * Contiguous blockquote blocks (`>` runs), verbatim, in file order — the shape a
 * keepsake takes: the kept words, then its `> — who · [session]` attribution, then
 * an optional note, all inside one quote (ADR-0023). A blank (unquoted) line ends
 * the block. Verbatim is the whole point here, so nothing is reflowed or trimmed
 * beyond trailing whitespace.
 *
 * @param {string | null | undefined} md
 * @param {{ max?: number }} [opts]
 * @returns {string[]}
 */
export function quoteBlocks(md, { max = Infinity } = {}) {
  if (!md) return [];
  /** @type {string[]} */
  const out = [];
  /** @type {string | null} */
  let cur = null;
  const flush = () => {
    if (cur != null) out.push(cur.replace(/[ \t\n]+$/, ""));
    cur = null;
  };
  for (const line of String(md).split(/\r?\n/)) {
    if (/^\s*>/.test(line)) cur = cur == null ? line : cur + "\n" + line;
    else flush();
  }
  flush();
  return max === Infinity ? out : out.slice(0, max);
}

/**
 * The first fenced ```mermaid``` block, verbatim (fences included), or null.
 *
 * @param {string | null | undefined} md
 * @returns {string | null}
 */
export function mermaidBlock(md) {
  if (!md) return null;
  const m = String(md).match(/```mermaid\b[\s\S]*?```/);
  return m ? m[0] : null;
}

/**
 * The person's name — extracted ONLY from an unambiguous shape, else null. We
 * never guess a name out of free prose: a wrong name on the title line is worse
 * than none. Accepts a labelled field (`Nom: …` / `Name: …` / `Prénom: …`,
 * optionally bold), or a short first-line H1 (`# Antoine`, ≤ 4 words, no sentence
 * punctuation — a title, not a sentence).
 *
 * @param {string | null | undefined} md
 * @returns {string | null}
 */
export function personName(md) {
  if (!md) return null;
  const labelled = String(md).match(/^\s*[-*]?\s*\*{0,2}\s*(?:nom|name|pr[ée]nom)\s*\*{0,2}\s*[:：]\s*(.+?)\s*$/im);
  if (labelled) return clean(/** @type {string} */ (labelled[1]));
  const firstLine = String(md)
    .split(/\r?\n/)
    .find((l) => l.trim() !== "");
  const h1 = firstLine && firstLine.match(/^#\s+(.+?)\s*$/);
  if (h1) {
    const t = clean(/** @type {string} */ (h1[1]));
    if (t && t.split(/\s+/).length <= 4 && !/[.!?:;,]/.test(t)) return t;
  }
  return null;
}

/**
 * @param {string} s
 * @returns {string | null}
 */
function clean(s) {
  return (
    String(s)
      .replace(/^\*{1,2}|\*{1,2}$/g, "")
      .replace(/[`_]/g, "")
      .trim() || null
  );
}

/**
 * One `sessions/` record as the mirror shows it.
 *
 * @typedef {object} MirrorSession
 * @property {string} stem — archive key: `<date>-<shortId>` (ADR-0017) or legacy `<date>`
 * @property {string | null} date — the stem's `YYYY-MM-DD` prefix, or null when it has none
 * @property {boolean} hasSummary — a `<stem>.summary.md` exists to link to
 */

/**
 * Parse `sessions/` filenames into recent-first session records for the mirror.
 *
 * @param {string[] | null | undefined} filenames
 * @param {{ max?: number }} [opts]
 * @returns {MirrorSession[]}
 */
export function sessionsForMirror(filenames, { max = Infinity } = {}) {
  /** @type {MirrorSession[]} */
  const out = [];
  for (const [stem, rec] of sessionIndex(filenames)) {
    const date = /^(\d{4}-\d{2}-\d{2})/.exec(stem)?.[1] || null;
    out.push({ stem, date, hasSummary: rec.summary });
  }
  out.sort((a, b) => (a.stem < b.stem ? 1 : a.stem > b.stem ? -1 : 0)); // recent first
  return max === Infinity ? out : out.slice(0, max);
}

/**
 * A coarse, non-clinical cadence rhythm — semantic keys; which label a key becomes
 * is the mirror's business, in the mirror's language (ADR-0029).
 *
 * @typedef {'daily' | 'weekly' | 'monthly' | 'sparse'} CadenceKey
 */

/**
 * The coarse cadence key from the gaps between session dates (or null).
 *
 * @param {MirrorSession[] | null | undefined} sessions
 * @returns {CadenceKey | null}
 */
export function cadence(sessions) {
  // filter(Boolean) drops the nulls but TS cannot narrow it — hence the cast.
  const dates = /** @type {string[]} */ ((sessions || []).map((s) => s.date).filter(Boolean)).sort();
  if (dates.length < 2) return null;
  const span =
    (Date.parse(/** @type {string} */ (dates[dates.length - 1])) - Date.parse(/** @type {string} */ (dates[0]))) /
    86_400_000;
  const avg = span / (dates.length - 1);
  if (!Number.isFinite(avg) || avg <= 0) return null;
  if (avg <= 1.5) return "daily";
  if (avg <= 10) return "weekly";
  if (avg <= 40) return "monthly";
  return "sparse";
}

/**
 * A short person-facing day from an ISO date prefix, in the mirror's language
 * (`22/07` in French, `Jul 22` in English); falls back to the input unchanged.
 *
 * @param {string | null} iso — nullable so `MirrorSession.date` flows in as-is; dated callers pre-filter
 * @param {MirrorLanguage} language
 * @returns {string}
 */
function formatDay(iso, language) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  if (!m) return String(iso);
  const [, y = "", mo = "", d = ""] = m; // the regex guarantees all three; defaults narrow the index type
  return stringsFor(language).day(y, mo, d);
}

/**
 * The string table for a language — total: an unshipped value degrades to the
 * old behaviour (French), same direction as every config fallback (ADR-0029).
 *
 * @param {MirrorLanguage} language
 */
function stringsFor(language) {
  return STRINGS[language] || STRINGS.fr;
}

/**
 * The already-read source strings {@link buildDashboard} assembles from — all
 * optional (destructured with defaults). `null` means "the file does not exist"
 * and is load-bearing: the corresponding section is omitted.
 *
 * @typedef {object} DashboardInput
 * @property {string | null} [name]
 * @property {MirrorSession[]} [sessions]
 * @property {string | null} [goals]
 * @property {string | null} [themes]
 * @property {string | null} [todo]
 * @property {string | null} [keepsakes]
 * @property {string | null} [people]
 * @property {string | null} [timeline]
 * @property {boolean} [understandingExists]
 * @property {string | null} [generatedAt]
 * @property {MirrorLanguage} [language]  the mirror's own words (ADR-0029) — defaults to French, the behaviour every earlier vault had
 */

/**
 * Assemble the dashboard markdown from already-read source strings. A `null`
 * source means "the file does not exist" → its section is omitted (no dangling
 * link); a present-but-unparsable source falls back to a bare relative link.
 * The two prose surfaces are never excerpted — only linked.
 *
 * dashboard.md lives at the vault root, so links to root files are bare
 * (`goals.md`) and links to session summaries are `sessions/<stem>.summary.md`.
 *
 * @param {DashboardInput} [input]
 * @returns {string}
 */
export function buildDashboard(input = {}) {
  const {
    name = null,
    sessions = [],
    goals = null,
    themes = null,
    todo = null,
    keepsakes = null,
    people = null,
    timeline = null,
    understandingExists = false,
    generatedAt = null,
    language = "fr",
  } = input;
  const S = stringsFor(language);
  /** @param {string | null} iso */
  const day = (iso) => formatDay(iso, language);

  /** @type {string[]} */
  const L = [];
  /** @param {...string} xs */
  const push = (...xs) => L.push(...xs);
  /**
   * @param {string} heading
   * @param {string | null} source
   * @param {string[]} items
   * @param {string} link
   */
  const emit = (heading, source, items, link) => {
    if (source == null || String(source).trim() === "") return; // file absent → no section
    push(heading, ...(items.length ? [...items, ""] : [`→ ${link}`, ""]));
  };

  push(`# ${S.title}${name ? ` — ${name}` : ""}`, "");

  // Vitals — computed from session dates; no relative "il y a N jours", no mood/progress score.
  // Sort recent-first here too, so the mirror is correct regardless of caller order.
  const dated = sessions.filter((s) => s.date).sort((a, b) => (a.stem < b.stem ? 1 : a.stem > b.stem ? -1 : 0));
  const vitals = [];
  if (dated[0]) vitals.push(`${S.lastSession} · ${day(dated[0].date)}`);
  if (sessions.length) vitals.push(`${sessions.length} session${sessions.length > 1 ? "s" : ""}`);
  const cad = cadence(sessions);
  if (cad) vitals.push(S.cadences[cad]);
  if (vitals.length) push(`*${vitals.join(" · ")}*`, "");

  // What you keep — the newest kept passage as an epigraph, verbatim (ADR-0023).
  // Exactly ONE: the mirror is a glance at what they're carrying, not the collection —
  // and it is never counted (no "12 keepsakes"), which would turn re-reading into scoring.
  emit(S.keepsake, keepsakes, quoteBlocks(keepsakes, { max: 1 }), "[keepsakes](keepsakes.md)");

  // Where we are — the working understanding is prose; link it, never excerpt it.
  if (understandingExists) push(S.whereWeAre, `→ [understanding](understanding.md) ${S.provisional}`, "");

  emit(S.goals, goals, listItems(goals), "[goals](goals.md)");
  emit(S.themes, themes, listItems(themes), "[themes](themes.md)");

  // Either heading pair works regardless of the setting (ADR-0029): a vault that
  // changed language keeps its whole history readable.
  const open = sectionItems(todo, /ouvert|open/i);
  emit(S.pickUp, todo, open.length ? open : listItems(todo), "[todo](todo.md)");

  // Recent threads — dates + links; a not-yet-distilled session says so, never an excerpt.
  const fils = dated
    .slice(0, 2)
    .map((s) =>
      s.hasSummary
        ? `- ${day(s.date)} → [${s.stem}](sessions/${s.stem}.summary.md)`
        : `- ${day(s.date)} · ${S.distilling}`,
    );
  if (fils.length) push(S.threads, ...fils, "");

  // Your world — the ecomap verbatim, else the names list, else a link.
  const eco = mermaidBlock(people);
  if (eco) push(S.world, eco, "");
  else emit(S.world, people, listItems(people), "[people](people.md)");

  // Life markers — the last three dated items.
  emit(S.lifeMarkers, timeline, listItems(timeline).slice(-3), "[timeline](timeline.md)");

  // Footer nav — only the surfaces that actually exist (no dangling links).
  const nav = [
    understandingExists && "[understanding](understanding.md)",
    goals != null && "[goals](goals.md)",
    themes != null && "[themes](themes.md)",
    keepsakes != null && "[keepsakes](keepsakes.md)",
    people != null && "[people](people.md)",
    timeline != null && "[timeline](timeline.md)",
  ].filter(Boolean);
  push("---", "");
  if (nav.length) push(`→ ${nav.join(" · ")}`, "");
  push(S.mirrorNote);
  if (generatedAt) push("", `*(${S.generated} ${day(generatedAt)})*`);

  return (
    L.join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t\n]+$/, "") + "\n"
  );
}
