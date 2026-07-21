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

/** A transcript is a Claudia conversation only if it carries the persona signature. */
export const CLAUDIA_SIGNATURE = /You are Claudia|unconditional positive regard|skills\/claudia|"name"\s*:\s*"claudia"/;

export function isClaudiaSession(jsonl) {
  return CLAUDIA_SIGNATURE.test(String(jsonl || ""));
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
