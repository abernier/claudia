#!/usr/bin/env node
/**
 * Claudia — save the session (SessionEnd hook entrypoint).
 *
 * Thin wrapper around ../src/session.mjs. Writes the person's transcript to their
 * local archive under ~/.claudia/ (default-on; ADR-0004) as readable markdown —
 * but ONLY for real Claudia conversations (the plugin may be enabled at user scope,
 * so this fires for every session; the gate now keys on genuine skill *activation*,
 * not a stray persona string). One file **per session** (`<date>-<session_id>`,
 * ADR-0017), OVERWRITTEN on each resume/close so a conversation never piles up as
 * duplicate re-dumps. Local-only; nothing uploaded. Opt-out:
 * `{ "saveTranscripts": false }` in ~/.claudia/config.json.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveTranscriptPath, isClaudiaSession, renderMarkdown, sessionIdFrom } from "../src/session.mjs";

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

    const sessionId = sessionIdFrom(payload);
    if (!sessionId) return process.exit(0); // can't key the archive → skip rather than mis-file
    const shortId = sessionId.slice(0, 8); // enough to disambiguate a person's own sessions; keeps names readable

    // One file per session (ADR-0017), OVERWRITTEN each close. Reuse the stem of an
    // existing archive for this session so its first-seen date prefix stays stable
    // across resumes (and across midnight), instead of spawning a new dated file.
    const stamp = todayStamp();
    const existing = (await fs.readdir(sessionsDir).catch(() => [])).find(
      (n) => /\.transcript\.(md|jsonl)$/.test(n) && n.slice(0, n.indexOf(".transcript.")).endsWith(`-${shortId}`)
    );
    const stem = existing ? existing.slice(0, existing.indexOf(".transcript.")) : `${stamp}-${shortId}`;

    // Images the person pasted live inline in the JSONL as base64. renderMarkdown
    // (pure) names them, embeds relative links into <stem>.assets/, and hands the
    // bytes back for us to decode and write here — the core stays side-effect-free
    // (ADR-0021). Re-extraction each close is idempotent: same names, same bytes.
    const assetsDir = `${stem}.assets`;
    const { markdown, images } = renderMarkdown(jsonl, stamp, { assetsDir });
    if (markdown) {
      await fs.writeFile(path.join(sessionsDir, `${stem}.transcript.md`), markdown);
      if (images.length) {
        const dir = path.join(sessionsDir, assetsDir);
        await fs.mkdir(dir, { recursive: true });
        for (const img of images) {
          await fs.writeFile(path.join(dir, img.name), Buffer.from(img.data, "base64"));
        }
      }
    } else {
      await fs.writeFile(path.join(sessionsDir, `${stem}.transcript.jsonl`), jsonl);
    }

    // Deferred distillation (ADR-0016): every close drops the dirty-flag marker.
    // `recall` distills at the next open and clears it — so a session resumed after
    // it was distilled is re-distilled, and its stale summary refreshed.
    await fs
      .writeFile(path.join(sessionsDir, `${stem}.pending-summary`), `needs distillation (${stamp})\n`)
      .catch(() => {});

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
