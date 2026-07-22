/**
 * Claudia — vault helpers (pure, importable, testable).
 *
 * The person's `~/.claudia/` notes use Obsidian-style `[[wikilinks]]`. For plain
 * markdown portability (GitHub, simple viewers), the export pass rewrites them to
 * relative links. This module holds the rewrite; scripts/vault-export.mjs does the
 * filesystem work.
 */

// Matches [[Target]], [[Target#heading]], [[Target|label]], [[Target#h|label]].
const WIKILINK = /\[\[\s*([^\]|#]+?)\s*(#[^\]|]+?)?\s*(?:\|\s*([^\]]+?)\s*)?\]\]/g;

/**
 * Rewrite wikilinks to relative markdown links.
 * @param {string} markdown
 * @param {(name: string) => string|null} resolve  name → relative path (from the
 *        current file), or null if unknown.
 * @returns {string}
 */
export function wikilinksToRelative(markdown, resolve) {
  return String(markdown).replace(WIKILINK, (_m, target, heading, label) => {
    const name = target.trim();
    const text = (label || name).trim();
    const rel = resolve(name);
    if (!rel) return text; // unknown target → plain text, never a dangling link
    const anchor = heading ? heading.trim() : "";
    return `[${text}](${rel}${anchor})`;
  });
}

/** Extract `name` and `aliases` from a fiche's YAML frontmatter (best-effort). */
export function ficheNames(markdown) {
  const fm = String(markdown).match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return [];
  const body = fm[1];
  const names = [];
  const name = body.match(/^name:\s*(.+)$/m);
  if (name) names.push(name[1].trim().replace(/^["']|["']$/g, ""));
  const aliases = body.match(/^aliases:\s*\[(.*)\]/m);
  if (aliases) {
    for (const a of aliases[1].split(",")) {
      const v = a.trim().replace(/^["']|["']$/g, "");
      if (v) names.push(v);
    }
  }
  return names;
}
