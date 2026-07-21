#!/usr/bin/env node
/**
 * Claudia — save the session (SessionEnd hook entrypoint).
 *
 * Thin wrapper around ../src/session.mjs. Writes the person's dated transcript to
 * their local archive under ~/.claudia/ (default-on; ADR-0004) as readable
 * markdown — but ONLY for real Claudia conversations (the plugin may be enabled
 * at user scope, so this fires for every session). Local-only; nothing uploaded.
 * Opt-out: `{ "saveTranscripts": false }` in ~/.claudia/config.json.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveTranscriptPath, isClaudiaSession, renderMarkdown } from "../src/session.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 3000);
  });
}

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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

    const transcriptPath = resolveTranscriptPath(payload, os.homedir());

    // One-time, non-sensitive diagnostic (field NAMES only, never content).
    await fs
      .writeFile(
        path.join(os.tmpdir(), "claudia-sessionend-diag.json"),
        JSON.stringify({ keys: Object.keys(payload), resolved: transcriptPath || null, at: todayStamp() }, null, 2)
      )
      .catch(() => {});

    if (!transcriptPath) return process.exit(0);

    let jsonl;
    try {
      jsonl = await fs.readFile(transcriptPath, "utf8");
    } catch {
      return process.exit(0);
    }

    // GATE: only archive real Claudia conversations.
    if (!isClaudiaSession(jsonl)) return process.exit(0);

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

    const stamp = todayStamp();
    const md = renderMarkdown(jsonl, stamp);
    if (md) {
      await fs.appendFile(path.join(sessionsDir, `${stamp}.transcript.md`), md + "\n\n---\n\n");
    } else {
      await fs.appendFile(path.join(sessionsDir, `${stamp}.transcript.jsonl`), jsonl);
    }

    await fs
      .writeFile(path.join(sessionsDir, `${stamp}.pending-summary`), "distill-session did not confirm a summary\n")
      .catch(() => {});

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
