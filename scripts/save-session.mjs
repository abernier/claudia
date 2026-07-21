#!/usr/bin/env node
/**
 * Claudia — save the session (SessionEnd hook).
 *
 * Writes the person's dated transcript to their local archive under ~/.claudia/
 * (default-on; ADR-0004), as a READABLE markdown file. Deterministic and
 * local-only — nothing is ever uploaded. The distilled *summary* (the layer
 * recall reads) is produced by the `distill-session` skill at close, not here.
 *
 * The person stays in control: `{ "saveTranscripts": false }` in
 * ~/.claudia/config.json opts out of the verbatim archive.
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
    setTimeout(() => resolve(data), 2000);
  });
}

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Pull readable text out of a Claude Code transcript entry, tolerantly.
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
    if (role !== "user" && role !== "assistant") continue; // skip tool/meta events
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

    const transcriptPath = payload.transcript_path || payload.transcriptPath;
    if (transcriptPath) {
      try {
        const jsonl = await fs.readFile(transcriptPath, "utf8");
        const md = renderMarkdown(jsonl);
        if (md) {
          // Append if today's file exists, so multiple sessions in a day accrue.
          const dest = path.join(sessionsDir, `${todayStamp()}.transcript.md`);
          await fs.appendFile(dest, md + "\n\n---\n\n");
        } else {
          // Parsing yielded nothing → keep the raw record rather than lose it.
          await fs.appendFile(path.join(sessionsDir, `${todayStamp()}.transcript.jsonl`), jsonl);
        }
      } catch {
        /* transcript unreadable — nothing to archive */
      }
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
