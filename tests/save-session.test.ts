import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/save-session.mjs");

// Mirrors the script's own local-date stamp.
const stamp = (() => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const line = (o: object): string => JSON.stringify(o) + "\n";
// Passes the genuine-activation gate (loader preamble as a user message) and
// renders to markdown (a text turn), so the script takes the `.transcript.md` path.
const activationJsonl =
  line({ type: "user", message: { role: "user", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" } }) +
  line({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Bonjour." }] } });

describe("save-session (SessionEnd hook) — deferred-distillation dirty flag", () => {
  const tmps: string[] = [];
  afterEach(async () => {
    for (const t of tmps.splice(0)) await fs.rm(t, { recursive: true, force: true });
  });

  it("drops the pending-summary marker even when the archive write fails (ADR-0016)", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-home-"));
    tmps.push(home);
    const transcript = path.join(home, "session.jsonl");
    await fs.writeFile(transcript, activationJsonl);

    const sessionId = "abcdef12-3456-7890-abcd-ef1234567890";
    const stem = `${stamp}-${sessionId.slice(0, 8)}`;
    const sessionsDir = path.join(home, ".claudia", "sessions");
    // Sabotage: BOTH archive targets are directories, so whichever form the script
    // writes (markdown or raw jsonl fallback) throws EISDIR. The marker must already
    // be down by then — that ordering is exactly what this test pins.
    await fs.mkdir(path.join(sessionsDir, `${stem}.transcript.md`), { recursive: true });
    await fs.mkdir(path.join(sessionsDir, `${stem}.transcript.jsonl`), { recursive: true });

    const r = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      input: JSON.stringify({ session_id: sessionId, transcript_path: transcript }),
      env: { ...process.env, HOME: home },
    });

    expect(r.status).toBe(0); // a hook must never break the host
    const marker = await fs.readFile(path.join(sessionsDir, `${stem}.pending-summary`), "utf8");
    expect(marker).toContain("needs distillation");
  });

  it("writes no marker for a non-Claudia session (the gate precedes the flag)", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-home-"));
    tmps.push(home);
    const transcript = path.join(home, "session.jsonl");
    await fs.writeFile(transcript, line({ type: "user", message: { role: "user", content: "just a normal coding session" } }));

    const r = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      input: JSON.stringify({ session_id: "abcdef12-0000-0000-0000-000000000000", transcript_path: transcript }),
      env: { ...process.env, HOME: home },
    });

    expect(r.status).toBe(0);
    const sessions = await fs.readdir(path.join(home, ".claudia", "sessions")).catch(() => []);
    expect(sessions.filter((n) => n.endsWith(".pending-summary"))).toEqual([]);
  });
});
