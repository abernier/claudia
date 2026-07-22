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
 * Render a JSONL transcript into readable markdown. Pure: the date stamp is
 * passed in (no hidden clock), and unparseable / non-message events are skipped.
 * Returns null if nothing renderable was found.
 */
export function renderMarkdown(jsonl, dateStamp) {
  const lines = String(jsonl || "").split("\n").filter(Boolean);
  const out = [`# Session — ${dateStamp}`, ""];
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
    const text = textFromContent(msg.content);
    if (!text) continue;
    out.push(role === "user" ? `**You:**` : `**Claudia:**`, "", text, "");
    rendered++;
  }
  return rendered > 0 ? out.join("\n") : null;
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
