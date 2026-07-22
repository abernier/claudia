/**
 * Claudia — the dashboard mirror (pure, importable, testable).
 *
 * `dashboard.md` is a DERIVED, person-facing bird's-eye view of the working
 * memory (ADR-0019). It is a MIRROR, never a source of truth: this module only
 * ever **transcludes** what a source file already says (a list, a mermaid block,
 * the items under a heading) or **points** to it with a `[[wikilink]]`. It NEVER
 * summarises or paraphrases — a deterministic script cannot read therapeutic
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

const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s+\S/;
const HEADING = /^#{1,6}\s/;

/**
 * Group physical lines into whole list items. A **wrapped** bullet — one whose
 * text spills onto the next physical line(s) without a blank line — is captured in
 * full, so the mirror never truncates a goal to a dangling half-sentence. An item
 * runs from its `- ` line until the next list item, heading, or blank line.
 */
function collectItems(lines, max = Infinity) {
  const out = [];
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

/** Whole markdown list items (bullets, numbered, checkboxes), wrapped lines included, right-trimmed. */
export function listItems(md, { max = Infinity } = {}) {
  if (!md) return [];
  return collectItems(String(md).split(/\r?\n/), max);
}

/** The whole list items under the first `#…` heading matching `headingRe`, until the next heading. */
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

/** The first fenced ```mermaid block, verbatim (fences included), or null. */
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
 */
export function personName(md) {
  if (!md) return null;
  const labelled = String(md).match(
    /^\s*[-*]?\s*\*{0,2}\s*(?:nom|name|pr[ée]nom)\s*\*{0,2}\s*[:：]\s*(.+?)\s*$/im,
  );
  if (labelled) return clean(labelled[1]);
  const firstLine = String(md).split(/\r?\n/).find((l) => l.trim() !== "");
  const h1 = firstLine && firstLine.match(/^#\s+(.+?)\s*$/);
  if (h1) {
    const t = clean(h1[1]);
    if (t && t.split(/\s+/).length <= 4 && !/[.!?:;,]/.test(t)) return t;
  }
  return null;
}

function clean(s) {
  return String(s).replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/[`_]/g, "").trim() || null;
}

/** Parse `sessions/` filenames into recent-first session records for the mirror. */
export function sessionsForMirror(filenames, { max = Infinity } = {}) {
  const out = [];
  for (const [stem, rec] of sessionIndex(filenames)) {
    const date = /^(\d{4}-\d{2}-\d{2})/.exec(stem)?.[1] || null;
    out.push({ stem, date, hasSummary: rec.summary });
  }
  out.sort((a, b) => (a.stem < b.stem ? 1 : a.stem > b.stem ? -1 : 0)); // recent first
  return max === Infinity ? out : out.slice(0, max);
}

/** A coarse, non-clinical cadence label from the gaps between session dates (or null). */
export function cadence(sessions) {
  const dates = (sessions || []).map((s) => s.date).filter(Boolean).sort();
  if (dates.length < 2) return null;
  const span = (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / 86_400_000;
  const avg = span / (dates.length - 1);
  if (!Number.isFinite(avg) || avg <= 0) return null;
  if (avg <= 1.5) return "~quotidien";
  if (avg <= 10) return "~hebdo";
  if (avg <= 40) return "~mensuel";
  return "~espacé";
}

/** DD/MM from an ISO date prefix (falls back to the input unchanged). */
function fr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
  return m ? `${m[3]}/${m[2]}` : String(iso);
}

/**
 * Assemble the dashboard markdown from already-read source strings. A `null`
 * source means "the file does not exist" → its section is omitted (no dangling
 * link); a present-but-unparsable source falls back to a bare `[[wikilink]]`.
 * The two prose surfaces are never excerpted — only linked.
 */
export function buildDashboard(input = {}) {
  const {
    name = null,
    sessions = [],
    goals = null,
    themes = null,
    todo = null,
    people = null,
    timeline = null,
    understandingExists = false,
    generatedAt = null,
  } = input;

  const L = [];
  const push = (...xs) => L.push(...xs);
  const emit = (heading, source, items, wikilink) => {
    if (source == null || String(source).trim() === "") return; // file absent → no section
    push(heading, ...(items.length ? [...items, ""] : [`→ ${wikilink}`, ""]));
  };

  push(`# Vue d'ensemble${name ? ` — ${name}` : ""}`, "");

  // Vitals — computed from session dates; no relative "il y a N jours", no mood/progress score.
  // Sort recent-first here too, so the mirror is correct regardless of caller order.
  const dated = sessions.filter((s) => s.date).sort((a, b) => (a.stem < b.stem ? 1 : a.stem > b.stem ? -1 : 0));
  const vitals = [];
  if (dated[0]) vitals.push(`dernière session · ${fr(dated[0].date)}`);
  if (sessions.length) vitals.push(`${sessions.length} session${sessions.length > 1 ? "s" : ""}`);
  const cad = cadence(sessions);
  if (cad) vitals.push(cad);
  if (vitals.length) push(`*${vitals.join(" · ")}*`, "");

  // Là où on en est — the working understanding is prose; link it, never excerpt it.
  if (understandingExists) push("## Là où on en est", "→ [[understanding]] *(provisoire)*", "");

  emit("## Objectifs", goals, listItems(goals), "[[goals]]");
  emit("## Thèmes vivants", themes, listItems(themes), "[[themes]]");

  const open = sectionItems(todo, /ouvert/i);
  emit("## À reprendre", todo, open.length ? open : listItems(todo), "[[todo]]");

  // Derniers fils — dates + links; a not-yet-distilled session says so, never an excerpt.
  const fils = dated
    .slice(0, 2)
    .map((s) => (s.hasSummary ? `- ${fr(s.date)} → [[${s.stem}]]` : `- ${fr(s.date)} · *en cours de distillation*`));
  if (fils.length) push("## Derniers fils", ...fils, "");

  // Ton monde — the ecomap verbatim, else the names list, else a link.
  const eco = mermaidBlock(people);
  if (eco) push("## Ton monde", eco, "");
  else emit("## Ton monde", people, listItems(people), "[[people]]");

  // Repères de vie — the last three dated items.
  emit("## Repères de vie", timeline, listItems(timeline).slice(-3), "[[timeline]]");

  // Footer nav — only the surfaces that actually exist (no dangling links).
  const nav = [
    understandingExists && "[[understanding]]",
    goals != null && "[[goals]]",
    themes != null && "[[themes]]",
    people != null && "[[people]]",
    timeline != null && "[[timeline]]",
  ].filter(Boolean);
  push("---", "");
  if (nav.length) push(`→ ${nav.join(" · ")}`, "");
  push("*Ce fichier est un reflet, tenu à jour tout seul — tes vraies notes vivent dans les fichiers liés.*");
  if (generatedAt) push("", `*(généré le ${fr(generatedAt)})*`);

  return L.join("\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t\n]+$/, "") + "\n";
}
