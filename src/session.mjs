/**
 * Claudia — session archiving logic (pure, importable, testable).
 *
 * The hook entrypoint (scripts/save-session.mjs) is a thin wrapper around this.
 * No filesystem or process side effects live here.
 */

import path from "node:path";
import { localDay, zonedParts } from "./time.mjs";

/**
 * Claude Code encodes a project dir by replacing "/" and "." with "-".
 * @param {string} cwd
 * @returns {string}
 */
export function projectDirFor(cwd) {
  return String(cwd).replace(/[/.]/g, "-");
}

/**
 * One block of a message's `content` array. Deliberately one loose all-optional
 * shape, not a discriminated union: transcript data is external, and the code
 * narrows defensively (`b && b.type === "text" && …`) rather than trusting it.
 * @typedef {object} ContentBlock
 * @property {string} [type]  "text" | "image" | "tool_result" | anything else (ignored)
 * @property {string} [text]  present on text blocks
 * @property {{ type?: string, media_type?: string, data?: string }} [source]  present on image blocks (base64)
 * @property {string | ContentBlock[]} [content]  present on tool_result blocks — nested blocks, or a raw string in real transcripts (hence the Array.isArray narrowing)
 */

/**
 * Best-effort extraction of readable text from a transcript entry's content.
 * @param {string | ContentBlock[] | null | undefined} content
 * @returns {string}
 */
export function textFromContent(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter(
        /** @returns {b is ContentBlock & { text: string }} */ (b) =>
          b && b.type === "text" && typeof b.text === "string",
      )
      .map((b) => b.text.trim())
      .join("\n\n")
      .trim();
  }
  return "";
}

/**
 * Filename extension for an image block's media type (`image/png` → `png`).
 * @param {string} mediaType
 * @returns {string}
 */
function extFromMediaType(mediaType) {
  const m = /^image\/([a-z0-9.+-]+)$/i.exec(String(mediaType || ""));
  return m ? /** @type {string} */ (m[1]).toLowerCase() : "bin";
}

/**
 * One renderable part of a message, discriminated on `kind` (the render loop
 * switches on it — here a strict union IS right). Image `data` is base64.
 * @typedef {{ kind: "text", text: string } | { kind: "image", mediaType: string, data: string }} MessagePart
 */

/**
 * Ordered renderable parts of a message's content: text, and the images the person
 * pastes. Text blocks are trimmed (empty ones dropped). Image blocks are kept as
 * base64 — `{ kind: "image", mediaType, data }` — both top-level images (a pasted
 * screenshot) and any nested one level inside a `tool_result` (future-proof: a tool
 * that returns an image). A `tool_result`'s *text* stays dropped on purpose — only
 * its images surface — so this mirrors `textFromContent` and keeps the claudia gate
 * intact (reading a file never counts as a Claudia turn).
 * @param {string | ContentBlock[] | null | undefined} content
 * @returns {MessagePart[]}
 */
export function partsFromContent(content) {
  if (typeof content === "string") {
    const t = content.trim();
    return t ? [{ kind: "text", text: t }] : [];
  }
  if (!Array.isArray(content)) return [];
  /**
   * @param {ContentBlock | null | undefined} b
   * @returns {MessagePart | null}
   */
  const asImage = (b) =>
    b && b.type === "image" && b.source && b.source.type === "base64"
      ? { kind: "image", mediaType: b.source.media_type || "", data: b.source.data || "" }
      : null;
  /** @type {MessagePart[]} */
  const parts = [];
  for (const b of content) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "text" && typeof b.text === "string") {
      const t = b.text.trim();
      if (t) parts.push({ kind: "text", text: t });
      continue;
    }
    const img = asImage(b);
    if (img) {
      parts.push(img);
      continue;
    }
    if (b.type === "tool_result" && Array.isArray(b.content)) {
      for (const inner of b.content) {
        const innerImg = asImage(inner);
        if (innerImg) parts.push(innerImg);
      }
    }
  }
  return parts;
}

/**
 * A transcript is a *genuine* Claudia conversation only if the `claudia` skill was
 * actually ACTIVATED — its loader preamble appears as a user-authored message:
 *   "Base directory for this skill: <plugin>/skills/claudia\n# You are Claudia …"
 *
 * The old gate grepped the raw blob for persona strings, which false-positived on
 * any dev session that merely *read* SOUL.md / a skill file (the text lands in a
 * `tool_result`) or ran `/grill-me` about Claudia. This gate only fires on true
 * activation: `textFromContent` drops tool_result/tool_use blocks, so reading a
 * file never counts, and `/grill-me` loads `…/skills/grilling`, not `…/skills/claudia`.
 */
export const CLAUDIA_ACTIVATION = /Base directory for this skill:[^\n]*\/skills\/claudia(?:\/|\b|$)/;

/**
 * One parsed JSONL transcript line. Two shapes exist — the envelope form
 * (`{ type, message: { role, content } }`) and the flat legacy form
 * (`{ role, content }`) — and `const msg = e.message || e` must cover both.
 * @typedef {object} TranscriptEntry
 * @property {string} [type]  envelope event type ("user", "assistant", …)
 * @property {{ role?: string, content?: string | ContentBlock[] }} [message]  envelope form
 * @property {string} [role]  flat form
 * @property {string | ContentBlock[]} [content]  flat form
 * @property {string} [timestamp]  ISO-8601 instant the entry was recorded (envelope form only)
 */

/**
 * True when the transcript contains a genuine Claudia activation (see the gate above).
 * @param {string} jsonl  raw JSONL transcript contents
 * @returns {boolean}
 */
export function isClaudiaSession(jsonl) {
  const lines = String(jsonl || "")
    .split("\n")
    .filter(Boolean);
  for (const line of lines) {
    let e;
    try {
      e = /** @type {TranscriptEntry} */ (JSON.parse(line));
    } catch {
      continue;
    }
    const msg = e.message || e;
    if ((msg.role || e.type) !== "user") continue;
    if (CLAUDIA_ACTIVATION.test(textFromContent(msg.content))) return true;
  }
  return false;
}

/**
 * The LOCAL calendar days a conversation touched, ascending and deduplicated — the
 * `dates:` a session summary carries.
 *
 * This is a **fact, computed**, not something the model should be asked to recall: the
 * JSONL stamps every entry with an ISO instant, so a conversation that ran past
 * midnight (or was resumed the next afternoon) yields both days exactly. One file per
 * session means one summary can legitimately span days (ADR-0017), which is why the
 * field is a list and not a single date.
 *
 * Local, never UTC, for the reason ADR-0012 gives: at the edges of a day UTC names the
 * wrong one outright. The zone is passed in — no hidden clock, no hidden locale.
 *
 * Counts the same entries `renderMarkdown` renders (user and assistant turns), so the
 * days reported are the days the transcript actually shows. Entries with no usable
 * timestamp are skipped; a transcript with none at all yields `[]`, and callers fall
 * back to the stem's date.
 *
 * @param {string} jsonl  raw JSONL transcript contents
 * @param {string} timeZone  IANA zone name (e.g. "Europe/Paris")
 * @returns {string[]} `YYYY-MM-DD`, ascending; empty when nothing was datable
 */
export function sessionDays(jsonl, timeZone) {
  /** @type {Set<string>} */
  const days = new Set();
  for (const line of String(jsonl || "")
    .split("\n")
    .filter(Boolean)) {
    let e;
    try {
      e = /** @type {TranscriptEntry} */ (JSON.parse(line));
    } catch {
      continue;
    }
    const msg = e.message || e;
    const role = msg.role || e.type;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof e.timestamp !== "string") continue;
    const at = new Date(e.timestamp);
    if (Number.isNaN(at.getTime())) continue;
    days.add(localDay(zonedParts(at, timeZone)));
  }
  return [...days].sort();
}

/**
 * The transcript-locator subset of a Claude Code hook payload — SessionEnd sends
 * exactly this; SessionStart / UserPromptSubmit payloads extend it. All fields
 * optional: hooks parse external stdin and fall back to `{}`.
 * @typedef {object} TranscriptHookPayload
 * @property {string} [session_id]
 * @property {string} [transcript_path]  canonical field
 * @property {string} [transcriptPath]  alternate spelling, honoured best-effort
 * @property {string} [transcript]  alternate spelling, honoured best-effort
 * @property {string} [cwd]  used with `session_id` to self-locate the transcript
 */

/**
 * The stable identity of a session: `session_id` from the hook payload, else the
 * basename of its transcript path (`<session_id>.jsonl`). Returns null when neither
 * is available. Used to key the archive by session rather than by date, so a
 * resumed conversation overwrites its own file instead of piling up duplicates.
 * @param {TranscriptHookPayload | null | undefined} payload
 * @returns {string | null}
 */
export function sessionIdFrom(payload) {
  if (payload && payload.session_id) return String(payload.session_id);
  const direct = payload && (payload.transcript_path || payload.transcriptPath || payload.transcript);
  if (direct) return path.basename(String(direct)).replace(/\.jsonl$/i, "");
  return null;
}

/**
 * An image lifted out of a transcript: `name` is `img-00N.<ext>`, `data` is base64
 * for the caller to decode and write into the session's assets dir (ADR-0021).
 * @typedef {object} SessionImage
 * @property {string} name
 * @property {string} mediaType
 * @property {string} data
 */

/**
 * Render a JSONL transcript into readable markdown plus the images it embeds. Pure:
 * the date stamp is passed in (no hidden clock), and there are no filesystem side
 * effects — image bytes are handed back as base64 for the caller to decode and
 * write (ADR-0021). Unparseable / non-message events are skipped.
 *
 * Returns `{ markdown, images }`:
 *  - `markdown` — the rendered transcript, or `null` if nothing was renderable.
 *  - `images` — `[{ name, mediaType, data }]` in order of appearance, named
 *    `img-001.<ext>`, `img-002.<ext>`… Each is embedded inline in `markdown` at its
 *    position as a relative link into `assetsDir` (default `"assets"`; the caller
 *    passes the session's own `<stem>.assets`). Empty when there were none.
 *
 * Numbering follows position in the append-only JSONL, so re-rendering the same
 * transcript is idempotent: the Nth image is always `img-00N`.
 * @param {string} jsonl  raw JSONL transcript contents
 * @param {string} dateStamp  date stamp for the heading (e.g. "2026-07-21")
 * @param {{ assetsDir?: string }} [options]
 * @returns {{ markdown: string | null, images: SessionImage[] }}
 */
export function renderMarkdown(jsonl, dateStamp, { assetsDir = "assets" } = {}) {
  const lines = String(jsonl || "")
    .split("\n")
    .filter(Boolean);
  const out = [`# Session — ${dateStamp}`, ""];
  /** @type {SessionImage[]} */
  const images = [];
  let rendered = 0;
  for (const line of lines) {
    let e;
    try {
      e = /** @type {TranscriptEntry} */ (JSON.parse(line));
    } catch {
      continue;
    }
    const msg = e.message || e;
    const role = msg.role || e.type;
    if (role !== "user" && role !== "assistant") continue;
    const parts = partsFromContent(msg.content);
    if (!parts.length) continue;
    out.push(role === "user" ? `**You:**` : `**Claudia:**`, "");
    for (const p of parts) {
      if (p.kind === "text") {
        out.push(p.text, "");
      } else {
        const name = `img-${String(images.length + 1).padStart(3, "0")}.${extFromMediaType(p.mediaType)}`;
        images.push({ name, mediaType: p.mediaType, data: p.data });
        out.push(`![${name.replace(/\.[^.]+$/, "")}](${assetsDir}/${name})`, "");
      }
    }
    rendered++;
  }
  return { markdown: rendered > 0 ? out.join("\n") : null, images };
}

/**
 * Resolve the transcript path from a hook payload: honour any provided field,
 * else self-locate from session id + cwd under the given home directory.
 * Returns null when it cannot be resolved — including a missing payload
 * altogether, symmetric with `sessionIdFrom` (hooks parse external stdin).
 * @param {TranscriptHookPayload | null | undefined} payload
 * @param {string} homedir  the base under which `.claude/projects` lives
 * @returns {string | null}
 */
export function resolveTranscriptPath(payload, homedir) {
  if (!payload) return null;
  const direct = payload.transcript_path || payload.transcriptPath || payload.transcript;
  if (direct) return direct;
  if (payload.session_id && payload.cwd) {
    return path.join(homedir, ".claude", "projects", projectDirFor(payload.cwd), `${payload.session_id}.jsonl`);
  }
  return null;
}
