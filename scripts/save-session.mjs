#!/usr/bin/env node
/**
 * Claudia — save the session (SessionEnd hook).
 *
 * Writes the person's dated transcript to their local archive under ~/.claudia/
 * (default-on; ADR-0004) as READABLE markdown. Deterministic and local-only.
 * The distilled *summary* (the layer recall reads) is produced by the
 * `distill-session` skill at close, not here.
 *
 * Because the plugin may be enabled at user scope, this hook fires for EVERY
 * session — including unrelated coding sessions. So it only archives a session
 * that was actually a Claudia conversation (persona signature present); it never
 * pollutes ~/.claudia with anything else.
 *
 * Opt-out: `{ "saveTranscripts": false }` in ~/.claudia/config.json.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 3000); // safety net only
  });
}

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Claude Code encodes a project dir by replacing "/" and "." with "-".
function projectDirFor(cwd) {
  return cwd.replace(/[/.]/g, "-");
}

function textFromContent(content) {
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

// Is this transcript actually a Claudia conversation? (persona signature)
const CLAUDIA_SIGNATURE = /You are Claudia|unconditional positive regard|skills\/claudia|"name"\s*:\s*"claudia"/;

function renderMarkdown(jsonl) {
  const lines = jsonl.split("\n").filter(Boolean);
  const out = [`# Session — ${todayStamp()}`, ""];
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

async function main() {
  try {
    const raw = await readStdin();
    let payload = {};
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      /* tolerate */
    }

    // Locate the transcript: honour whatever field is provided, else self-locate
    // from session id + cwd (robust to the exact payload shape).
    let transcriptPath =
      payload.transcript_path || payload.transcriptPath || payload.transcript;
    if (!transcriptPath && payload.session_id && payload.cwd) {
      transcriptPath = path.join(
        os.homedir(),
        ".claude",
        "projects",
        projectDirFor(payload.cwd),
        `${payload.session_id}.jsonl`
      );
    }

    // One-time, non-sensitive diagnostic (field NAMES only, no content) so we can
    // confirm the payload shape without ever exposing the conversation.
    await fs
      .writeFile(
        path.join(os.tmpdir(), "claudia-sessionend-diag.json"),
        JSON.stringify(
          { keys: Object.keys(payload), resolved: transcriptPath || null, at: todayStamp() },
          null,
          2
        )
      )
      .catch(() => {});

    if (!transcriptPath) return process.exit(0);

    let jsonl;
    try {
      jsonl = await fs.readFile(transcriptPath, "utf8");
    } catch {
      return process.exit(0); // can't read it — nothing to archive
    }

    // GATE: only archive real Claudia conversations. Never pollute ~/.claudia
    // with unrelated (e.g. coding) sessions.
    if (!CLAUDIA_SIGNATURE.test(jsonl)) return process.exit(0);

    const root = path.join(os.homedir(), ".claudia");
    const sessionsDir = path.join(root, "sessions");
    await fs.mkdir(sessionsDir, { recursive: true });

    // Respect the person's opt-out.
    try {
      const cfg = JSON.parse(await fs.readFile(path.join(root, "config.json"), "utf8"));
      if (cfg.saveTranscripts === false) return process.exit(0);
    } catch {
      /* no config → default-on */
    }

    const md = renderMarkdown(jsonl);
    if (md) {
      await fs.appendFile(path.join(sessionsDir, `${todayStamp()}.transcript.md`), md + "\n\n---\n\n");
    } else {
      await fs.appendFile(path.join(sessionsDir, `${todayStamp()}.transcript.jsonl`), jsonl);
    }

    // Crash-safety marker: a summary is pending if the close ritual didn't run.
    await fs
      .writeFile(path.join(sessionsDir, `${todayStamp()}.pending-summary`), "distill-session did not confirm a summary\n")
      .catch(() => {});

    process.exit(0);
  } catch {
    process.exit(0); // never break session teardown
  }
}

main();
