/**
 * The persona re-anchor at its process seam (ADR-0013): a SessionStart payload
 * goes in on stdin, an identity note (or silence) comes out, and the exit code
 * is 0 no matter what — a benign layer never blocks a session from starting.
 * Spawn-based on purpose: stdin parsing and the fail-silent contract ARE
 * process semantics here. What the note says is pinned in ../src/anchor.test.ts.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanupVaults, throwawayHome } from "../src/vault.fixture.ts";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./session-anchor.mjs");

afterEach(cleanupVaults);

const line = (o: object): string => JSON.stringify(o) + "\n";
// The genuine-activation shape: the skill loader's preamble as a user message.
const claudiaJsonl = line({
  type: "user",
  message: { role: "user", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" },
});

const anchor = (input: string) =>
  spawnSync(process.execPath, [script], { encoding: "utf8", input, env: { ...process.env } });

/** Assert stdout carries a SessionStart injection; return its note. */
function injected(stdout: string): string {
  expect(stdout).not.toBe("");
  const out = JSON.parse(stdout);
  expect(out.hookSpecificOutput.hookEventName).toBe("SessionStart");
  return out.hookSpecificOutput.additionalContext;
}

describe("session-anchor (SessionStart hook) — the wiring, end to end", () => {
  it("re-anchors a resumed Claudia session", async () => {
    const transcript = path.join(await throwawayHome(), "session.jsonl");
    await fs.writeFile(transcript, claudiaJsonl);

    const r = anchor(JSON.stringify({ source: "resume", transcript_path: transcript }));

    expect(r.status).toBe(0);
    expect(injected(r.stdout)).toContain("You are Claudia");
  });

  it("re-anchors after compaction, naming what happened", async () => {
    const transcript = path.join(await throwawayHome(), "session.jsonl");
    await fs.writeFile(transcript, claudiaJsonl);

    const r = anchor(JSON.stringify({ source: "compact", transcript_path: transcript }));

    expect(r.status).toBe(0);
    expect(injected(r.stdout)).toContain("compacted");
  });

  it("leaves a fresh startup alone, even in a Claudia session", async () => {
    const transcript = path.join(await throwawayHome(), "session.jsonl");
    await fs.writeFile(transcript, claudiaJsonl);

    const r = anchor(JSON.stringify({ source: "startup", transcript_path: transcript }));

    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("never anchors a non-Claudia (e.g. coding) session", async () => {
    const transcript = path.join(await throwawayHome(), "session.jsonl");
    await fs.writeFile(transcript, line({ type: "user", message: { role: "user", content: "fix the login bug" } }));

    const r = anchor(JSON.stringify({ source: "resume", transcript_path: transcript }));

    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("stays silent on a missing transcript or garbage stdin — fail-silent, exit 0", () => {
    const gone = anchor(JSON.stringify({ source: "resume", transcript_path: "/no/such/transcript.jsonl" }));
    expect(gone.status).toBe(0);
    expect(gone.stdout).toBe("");

    const garbage = anchor("not json at all");
    expect(garbage.status).toBe(0);
    expect(garbage.stdout).toBe("");
  });
});
