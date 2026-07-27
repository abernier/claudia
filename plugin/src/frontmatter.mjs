/**
 * Claudia — the vault's frontmatter format (pure, importable, testable).
 * No filesystem, no process, no clock.
 *
 * Why this exists: every note in `~/.claudia/` opens with a YAML block, but only two
 * of them were ever specified (the theme note, the person fiche). The rest — session
 * summaries, exercises, teachings — were re-improvised by the model at every write,
 * and drifted: summaries with no block at all, a `session:` key meaning the bare id
 * in one file and the full stem in another, exercise stems pointing at sessions that
 * do not exist. This module is the one place that knows the format, so the *identity*
 * half of the block (`type`, `session`, `dates`, `created`, `slug`) can be written by
 * code instead of guessed — leaving the model only the half that is judgment
 * (`people`, `themes`).
 *
 * ## Reading is best-effort; writing is conservative
 *
 * These are the person's own notes, hand-editable by design (ADR-0018, ADR-0004). So
 * there is deliberately **no general serializer**: `stampIdentity` does line surgery,
 * replacing or inserting only the keys it was handed and leaving every other line
 * byte-identical. A parse/serialize round-trip would silently reformat comments,
 * spacing and value quoting the person chose. The safety property IS the asymmetry.
 *
 * A block we do not understand is left alone rather than rewritten — see the
 * `'malformed'` status.
 *
 * ## The YAML subset
 *
 * What the vault actually uses, and nothing more: `key: scalar` and
 * `key: [a, b, c]` inline lists. Block lists (`- item`), nesting and multi-line
 * scalars are not parsed — such lines are simply not surfaced in `data`, and are
 * preserved untouched by `stampIdentity`. Zero dependencies, on purpose: the plugin
 * ships with none and hooks run whatever `node` is on PATH (ADR-0022).
 */

/**
 * A frontmatter value in the subset above: a scalar, or an inline list.
 * @typedef {string | string[]} FrontmatterValue
 */

/**
 * The parsed view of a note.
 *
 * `status` discriminates the three cases a caller must handle differently:
 *  - `'present'`  — a well-formed block; `data` holds it, `body` is everything after.
 *  - `'absent'`   — no leading fence; `data` is empty and `body` is the whole file.
 *  - `'malformed'`— a leading `---` with no closing fence. `body` is the whole file
 *                   and writers MUST refuse to touch it: prepending a block would
 *                   corrupt a note we demonstrably cannot read.
 *
 * @typedef {object} Frontmatter
 * @property {'present' | 'absent' | 'malformed'} status
 * @property {Record<string, FrontmatterValue>} data  parsed keys (best-effort; unparseable lines are skipped)
 * @property {string} body  the content after the closing fence — the whole file unless `status` is `'present'`
 */

/** A fence line: `---`, tolerating trailing whitespace. */
const FENCE = /^---[ \t]*$/;

/** `key: value` — the only line shape this subset reads. */
const KEY_LINE = /^([A-Za-z_][\w-]*)[ \t]*:[ \t]*(.*)$/;

/**
 * Split into lines while remembering the file's own line ending, so a rewrite does
 * not silently convert CRLF to LF on someone's hand-edited note.
 * @param {string} text
 * @returns {{ lines: string[], eol: string }}
 */
function splitLines(text) {
  return { lines: text.split(/\r?\n/), eol: text.includes("\r\n") ? "\r\n" : "\n" };
}

/**
 * Strip one layer of matching surrounding quotes (`"x"` / `'x'` → `x`).
 * @param {string} s
 * @returns {string}
 */
function unquote(s) {
  return s.length >= 2 && /^(["']).*\1$/s.test(s) ? s.slice(1, -1) : s;
}

/**
 * A raw value into the subset: `[a, b]` becomes a list, anything else a scalar.
 * A scalar keeps its commas — only a bracketed value is a list.
 * @param {string} raw
 * @returns {FrontmatterValue}
 */
function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => unquote(s.trim()))
      .filter(Boolean);
  }
  return unquote(v);
}

/**
 * The key a block line declares, or null when the line is not `key: value`
 * (a comment, a block-list item, a continuation — all preserved, never parsed).
 * @param {string} line
 * @returns {string | null}
 */
function keyOf(line) {
  const m = KEY_LINE.exec(line);
  return m ? /** @type {string} */ (m[1]) : null;
}

/**
 * Render one key back to a line, in the vault's own style: inline lists, no quoting.
 * @param {string} key
 * @param {FrontmatterValue} value
 * @returns {string}
 */
function formatLine(key, value) {
  return `${key}: ${Array.isArray(value) ? `[${value.join(", ")}]` : value}`;
}

/**
 * True for a value with nothing to say — an empty list or a blank scalar. Such keys
 * are skipped rather than written as `key: []`, which is noise in a person-facing note.
 * @param {FrontmatterValue} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return Array.isArray(value) ? value.length === 0 : String(value).trim() === "";
}

/**
 * Index of the closing fence, or -1 when there is none (a malformed block).
 * @param {string[]} lines
 * @returns {number}
 */
function closingFence(lines) {
  for (let i = 1; i < lines.length; i++) {
    if (FENCE.test(/** @type {string} */ (lines[i]))) return i;
  }
  return -1;
}

/**
 * Read a note's frontmatter. Never throws: anything unrecognised degrades to
 * `'absent'` or `'malformed'` with the full text as `body`.
 *
 * @param {string | null | undefined} content  the note's full contents
 * @returns {Frontmatter}
 */
export function parseFrontmatter(content) {
  const text = String(content ?? "");
  const { lines, eol } = splitLines(text);
  if (!lines.length || !FENCE.test(/** @type {string} */ (lines[0]))) {
    return { status: "absent", data: {}, body: text };
  }
  const close = closingFence(lines);
  if (close === -1) return { status: "malformed", data: {}, body: text };

  /** @type {Record<string, FrontmatterValue>} */
  const data = {};
  for (const line of lines.slice(1, close)) {
    const m = KEY_LINE.exec(line);
    if (m) data[/** @type {string} */ (m[1])] = parseValue(/** @type {string} */ (m[2]));
  }
  return { status: "present", data, body: lines.slice(close + 1).join(eol) };
}

/**
 * Write the derived (identity) keys into a note's frontmatter and return the new
 * contents — the same string when nothing needed changing, which makes this
 * **idempotent** and lets callers skip a pointless write.
 *
 * Guarantees, in order of importance:
 *  - a `'malformed'` block is returned **untouched** — we never rewrite what we
 *    could not read;
 *  - every line other than the keys in `derived` is preserved byte-identical,
 *    including comments, spacing, quoting, block lists and the line ending;
 *  - a key already present is replaced **in place**, so the person's own ordering
 *    survives; a missing key is inserted following the order of `derived` itself,
 *    relative to whichever of its siblings are already there.
 *
 * `derived` carries the vocabulary, not this module: callers pass
 * `{ type, session, dates }` for a summary, `{ type, created, slug, session }` for an
 * exercise. Keys with an empty value are skipped, so a caller can hand over a
 * best-effort object without filtering it first.
 *
 * @param {string | null | undefined} content  the note's full contents
 * @param {Record<string, FrontmatterValue>} derived  keys to enforce, in the order they should appear
 * @returns {string} the note's new contents (identical to the input when already correct)
 */
export function stampIdentity(content, derived) {
  const text = String(content ?? "");
  const parsed = parseFrontmatter(text);
  if (parsed.status === "malformed") return text;

  const entries = Object.entries(derived).filter(([, v]) => !isEmpty(v));
  if (!entries.length) return text;

  const { lines, eol } = splitLines(text);

  if (parsed.status === "absent") {
    const block = ["---", ...entries.map(([k, v]) => formatLine(k, v)), "---", ""];
    return block.join(eol) + text;
  }

  const close = closingFence(lines);
  const block = lines.slice(1, close);
  const order = entries.map(([k]) => k);

  for (const [key, value] of entries) {
    const line = formatLine(key, value);
    const at = block.findIndex((l) => keyOf(l) === key);
    if (at !== -1) {
      block[at] = line;
      continue;
    }
    // No such key yet: place it after the nearest preceding sibling from `derived`
    // that IS present, so a partially-stamped block fills in rather than reshuffles.
    let insertAt = 0;
    for (let i = order.indexOf(key) - 1; i >= 0; i--) {
      const prev = block.findIndex((l) => keyOf(l) === order[i]);
      if (prev !== -1) {
        insertAt = prev + 1;
        break;
      }
    }
    block.splice(insertAt, 0, line);
  }

  // The fences themselves are reused verbatim, not re-emitted, so trailing
  // whitespace a person left on them survives too.
  const open = /** @type {string} */ (lines[0]);
  const shut = /** @type {string} */ (lines[close]);
  const out = [open, ...block, shut, ...lines.slice(close + 1)].join(eol);
  return out === text ? text : out;
}
