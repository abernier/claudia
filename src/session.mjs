/**
 * Claudia — session archiving logic (pure, importable, testable).
 *
 * The hook entrypoint (scripts/save-session.mjs) is a thin wrapper around this.
 * No filesystem or process side effects live here.
 */

import path from "node:path";

/** Claude Code encodes a project dir by replacing "/" and "." with "-". */
export function projectDirFor(cwd) {
  return String(cwd).replace(/[/.]/g, "-");
}

/** Best-effort extraction of readable text from a transcript entry's content. */
export function textFromContent(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text.trim())
      .join("\n\n")
      .trim();
  }
  return "";
}

/** Filename extension for an image block's media type (`image/png` → `png`). */
function extFromMediaType(mediaType) {
  const m = /^image\/([a-z0-9.+-]+)$/i.exec(String(mediaType || ""));
  return m ? m[1].toLowerCase() : "bin";
}

/**
 * Ordered renderable parts of a message's content: text, and the images the person
 * pastes. Text blocks are trimmed (empty ones dropped). Image blocks are kept as
 * base64 — `{ kind: "image", mediaType, data }` — both top-level images (a pasted
 * screenshot) and any nested one level inside a `tool_result` (future-proof: a tool
 * that returns an image). A `tool_result`'s *text* stays dropped on purpose — only
 * its images surface — so this mirrors `textFromContent` and keeps the claudia gate
 * intact (reading a file never counts as a Claudia turn).
 */
export function partsFromContent(content) {
  if (typeof content === "string") {
    const t = content.trim();
    return t ? [{ kind: "text", text: t }] : [];
  }
  if (!Array.isArray(content)) return [];
  const asImage = (b) =>
    b && b.type === "image" && b.source && b.source.type === "base64"
      ? { kind: "image", mediaType: b.source.media_type || "", data: b.source.data || "" }
      : null;
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

export function isClaudiaSession(jsonl) {
  const lines = String(jsonl || "").split("\n").filter(Boolean);
  for (const line of lines) {
    let e;
    try {
      e = JSON.parse(line);
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
 * The stable identity of a session: `session_id` from the hook payload, else the
 * basename of its transcript path (`<session_id>.jsonl`). Returns null when neither
 * is available. Used to key the archive by session rather than by date, so a
 * resumed conversation overwrites its own file instead of piling up duplicates.
 */
export function sessionIdFrom(payload) {
  if (payload && payload.session_id) return String(payload.session_id);
  const direct = payload && (payload.transcript_path || payload.transcriptPath || payload.transcript);
  if (direct) return path.basename(String(direct)).replace(/\.jsonl$/i, "");
  return null;
}

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
 */
export function renderMarkdown(jsonl, dateStamp, { assetsDir = "assets" } = {}) {
  const lines = String(jsonl || "").split("\n").filter(Boolean);
  const out = [`# Session — ${dateStamp}`, ""];
  const images = [];
  let rendered = 0;
  for (const line of lines) {
    let e;
    try {
      e = JSON.parse(line);
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
 * Returns null when it cannot be resolved.
 */
export function resolveTranscriptPath(payload, homedir) {
  const direct = payload.transcript_path || payload.transcriptPath || payload.transcript;
  if (direct) return direct;
  if (payload.session_id && payload.cwd) {
    return path.join(homedir, ".claude", "projects", projectDirFor(payload.cwd), `${payload.session_id}.jsonl`);
  }
  return null;
}
