/**
 * Migration 0001 — rewrite Obsidian `[[wikilinks]]` to plain relative markdown links.
 *
 * Pure and importable (no fs, no process): given the vault's files as
 * `{ relPath: content }`, return `{ relPath: newContent }` for the files that CHANGE.
 * The runner (`scripts/migrate-vault.mjs`) does the reads/writes and the backup.
 *
 * Idempotent by construction: once rewritten there are no `[[…]]` left, so a second
 * pass matches nothing and returns `{}` — which is how the runner's ledger stays honest
 * and how `recall`'s auto-apply becomes a safe no-op after the first run.
 *
 * Resolution (computed from each file's own directory):
 *  - `[[<date>-<id>]]`                 → `sessions/<stem>.summary.md`
 *  - `[[Name]]` matching an existing file → that file's relative path
 *  - `[[theme-slug]]` with no file      → the `themes.md` index (plain text at its
 *                                          define-site inside `themes.md`)
 *  - frontmatter list wikilinks         → plain names (`["[[x]]"]` → `x`)
 *  - the literal `[[<date>-id>]]` format placeholder → the new tag-format string
 * Space-bearing destinations are wrapped in angle brackets. `*.transcript.md`
 * (the verbatim archive) is never rewritten.
 */
import path from "node:path";

export const id = "0001-wikilinks-to-relative";
export const description = "Rewrite Obsidian [[wikilinks]] to relative markdown links";

const WIKILINK = /\[\[\s*([^\]|#]+?)\s*(#[^\]|]+?)?\s*(?:\|\s*([^\]]+?)\s*)?\]\]/g;
const FM_WIKILINK = /["']?\[\[\s*([^\]|#]+?)\s*\]\]["']?/g;
const SESSION = /^\d{4}-\d{2}-\d{2}-\S+$/;

const isMd = (rel) => rel.endsWith(".md") && !rel.endsWith(".transcript.md");

/** Relative POSIX path from a file's directory to a vault-relative target. */
function relTo(fromDir, target) {
  const base = fromDir === "." || fromDir === "" ? "" : fromDir;
  return path.posix.relative(base, target) || path.posix.basename(target);
}

/** Build `basename-no-ext → vault-relative path` for every linkable markdown file. */
function buildIndex(files) {
  const index = new Map();
  for (const rel of Object.keys(files)) {
    if (isMd(rel)) index.set(path.posix.basename(rel.replace(/\.md$/, "")), rel);
  }
  return index;
}

function rewriteFile(content, rel, index) {
  const fromDir = path.posix.dirname(rel);
  const base = path.posix.basename(rel);

  const body = (text) =>
    text.replace(WIKILINK, (_m, target, heading, label) => {
      const name = String(target).trim();
      const anchor = heading ? String(heading).trim() : "";
      const display = String(label || name).trim();
      if (name.includes("<") || name.includes(">")) return "[<stem>](sessions/<stem>.summary.md)";
      let targetRel;
      if (SESSION.test(name)) targetRel = `sessions/${name}.summary.md`;
      else if (index.has(name)) targetRel = index.get(name);
      else {
        if (base === "themes.md") return display; // define-site → plain text, not a self-link
        targetRel = "themes.md";
      }
      let dest = relTo(fromDir, targetRel);
      dest = /\s/.test(dest) ? `<${dest}${anchor}>` : `${dest}${anchor}`;
      return `[${display}](${dest})`;
    });

  const fm = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  return fm ? fm[1].replace(FM_WIKILINK, "$1") + body(fm[2]) : body(content);
}

/**
 * @param {Record<string,string>} files  vault-relative path → content (any files; only
 *        markdown is considered, transcripts excluded).
 * @returns {Record<string,string>} changed files only (empty when nothing to do).
 */
export function migrate(files) {
  const index = buildIndex(files);
  const out = {};
  for (const [rel, content] of Object.entries(files)) {
    if (!isMd(rel)) continue;
    const next = rewriteFile(content, rel, index);
    if (next !== content) out[rel] = next;
  }
  return out;
}
