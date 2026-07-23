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
import {
  resolveTranscriptPath,
  isClaudiaSession,
  renderMarkdown,
  sessionIdFrom,
  sessionDays,
} from "../src/session.mjs";
import { stampIdentity } from "../src/frontmatter.mjs";

/**
 * Shape of ~/.claudia/config.json (external boundary — the person edits this by
 * hand). Every reader checks `=== false`, so an absent field means default-on.
 * Also consumed (type-only) by scripts/build-dashboard.mjs for its `dashboard`
 * opt-out; this script, first in the lifecycle to read the file (ADR-0004), owns it.
 * @typedef {object} ClaudiaConfig
 * @property {boolean} [saveTranscripts]  opt-out for transcript archiving
 * @property {boolean} [dashboard]  opt-out for the dashboard mirror
 */

/**
 * Read all of stdin (the hook payload). The 3s timeout resolves with whatever
 * arrived so a wedged pipe can never hang the hook (a second resolve is a no-op).
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 3000);
  });
}

/**
 * Local date stamp, "YYYY-MM-DD".
 * @returns {string}
 */
function todayStamp() {
  const d = new Date();
  /** @param {number} n */
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * SessionEnd hook entrypoint. Always exits 0 — a hook must never break the host.
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const raw = await readStdin();
    /** @type {import("../src/session.mjs").TranscriptHookPayload} */
    let payload = {};
    try {
      // SessionEnd sends exactly the transcript-locator subset — no wider typedef needed.
      payload = /** @type {import("../src/session.mjs").TranscriptHookPayload} */ (JSON.parse(raw || "{}"));
    } catch {
      /* tolerate */
    }

    const transcriptPath = resolveTranscriptPath(payload, os.homedir());

    // One-time, non-sensitive diagnostic (field NAMES only, never content).
    await fs
      .writeFile(
        path.join(os.tmpdir(), "claudia-sessionend-diag.json"),
        JSON.stringify({ keys: Object.keys(payload), resolved: transcriptPath || null, at: todayStamp() }, null, 2),
      )
      .catch(() => {});

    if (!transcriptPath) return process.exit(0);

    /** @type {string} */
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
      const cfg = /** @type {ClaudiaConfig} */ (JSON.parse(await fs.readFile(path.join(root, "config.json"), "utf8")));
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
      (n) => /\.transcript\.(md|jsonl)$/.test(n) && n.slice(0, n.indexOf(".transcript.")).endsWith(`-${shortId}`),
    );
    const stem = existing ? existing.slice(0, existing.indexOf(".transcript.")) : `${stamp}-${shortId}`;

    // Deferred distillation (ADR-0016): drop the dirty-flag marker FIRST, before
    // any transcript/asset write. The invariant: even a failed or partial archive
    // write leaves the session flagged for distillation at the next recall — if
    // the marker came after, a throw below would exit 0 silently and the close
    // would never be distilled, breaking the contract exactly when it matters
    // most. `recall` distills at the next open and clears the marker — so a
    // session resumed after it was distilled is re-distilled, and its stale
    // summary refreshed.
    // The marker also CARRIES the session's identity frontmatter. These keys are facts
    // this hook holds and the model would only be guessing at: `dates` comes from the
    // transcript's own timestamps, so a conversation that ran past midnight reports
    // both days exactly. `distill-session` writes the judgment half (`people`,
    // `themes`) and `finish-distillation.mjs` stamps this block onto the summary, so
    // identity is never re-improvised. `src/pending.mjs` keys on the marker's
    // EXISTENCE alone, so this content is free.
    // A transcript with no usable timestamps falls back to the stem's own date — the
    // same rule migration 0002 applies, so both agree on the degenerate case.
    const days = sessionDays(jsonl, Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    const identity = {
      type: "session",
      session: stem,
      dates: days.length ? days : [/^\d{4}-\d{2}-\d{2}/.exec(stem)?.[0] ?? stamp],
    };
    await fs
      .writeFile(
        path.join(sessionsDir, `${stem}.pending-summary`),
        stampIdentity(`needs distillation — see ADR-0016 (flagged ${stamp})\n`, identity),
      )
      .catch(() => {});

    // Images the person pasted and documents that entered the conversation live
    // inline in the JSONL as base64. renderMarkdown (pure) names them, links them
    // relative to <stem>.assets/, and hands the bytes back for us to decode and
    // write here — the core stays side-effect-free (ADR-0021). Re-extraction each
    // close is idempotent: same names, same bytes.
    const assetsDir = `${stem}.assets`;
    const { markdown, assets } = renderMarkdown(jsonl, stamp, { assetsDir });
    if (markdown) {
      await fs.writeFile(path.join(sessionsDir, `${stem}.transcript.md`), markdown);
      if (assets.length) {
        const dir = path.join(sessionsDir, assetsDir);
        await fs.mkdir(dir, { recursive: true });
        for (const asset of assets) {
          await fs.writeFile(path.join(dir, asset.name), Buffer.from(asset.data, "base64"));
        }
      }
    } else {
      await fs.writeFile(path.join(sessionsDir, `${stem}.transcript.jsonl`), jsonl);
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
