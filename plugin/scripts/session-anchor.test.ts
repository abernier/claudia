/**
 * The persona re-anchor, one module tested at both its natures (ADR-0013):
 * `sessionAnchor` for the decision — payload in, note or null out, direct
 * import — and a spawn pass for the hook contract (stdin parsing, SessionStart
 * injection, exit 0 no matter what), the hybrid rule's reserved case.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sessionAnchor } from "./session-anchor.mjs";
import { cleanupVaults, throwawayHome } from "../src/vault.fixture.ts";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./session-anchor.mjs");

afterEach(cleanupVaults);

const line = (o: object): string => JSON.stringify(o) + "\n";
// The genuine-activation shape: the skill loader's preamble as a user message.
const claudiaJsonl = line({
  type: "user",
  message: { role: "user", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" },
});

/** Write a transcript into a throwaway home; return its path. */
async function transcriptOf(jsonl: string): Promise<string> {
  const p = path.join(await throwawayHome(), "session.jsonl");
  await fs.writeFile(p, jsonl);
  return p;
}

describe("sessionAnchor — the decision at its interface", () => {
  it("re-anchors a resumed Claudia session: identity, continuity, no fresh greeting", async () => {
    const note = await sessionAnchor({
      payload: { source: "resume", transcript_path: await transcriptOf(claudiaJsonl) },
    });
    expect(note).toContain("You are Claudia");
    expect(note).toContain("has been resumed");
    expect(note).toContain("CONTINUING");
    expect(note).toContain("do NOT restart");
    expect(note).toContain("not the person");
  });

  it("names a compaction distinctly from a resume", async () => {
    const note = await sessionAnchor({
      payload: { source: "compact", transcript_path: await transcriptOf(claudiaJsonl) },
    });
    expect(note).toContain("compacted");
    expect(note).not.toContain("has been resumed");
  });

  it("leaves a fresh startup and a deliberate clear alone, even in a Claudia session", async () => {
    const transcript = await transcriptOf(claudiaJsonl);
    expect(await sessionAnchor({ payload: { source: "startup", transcript_path: transcript } })).toBeNull();
    expect(await sessionAnchor({ payload: { source: "clear", transcript_path: transcript } })).toBeNull();
  });

  it("never anchors a non-Claudia (e.g. coding) session", async () => {
    const transcript = await transcriptOf(line({ type: "user", message: { role: "user", content: "fix the bug" } }));
    expect(await sessionAnchor({ payload: { source: "resume", transcript_path: transcript } })).toBeNull();
  });

  it("reads a missing transcript, an absent source, or an empty payload as a silent no", async () => {
    expect(await sessionAnchor({ payload: { source: "resume", transcript_path: "/no/such/one.jsonl" } })).toBeNull();
    expect(await sessionAnchor({ payload: {} })).toBeNull();
  });
});

describe("session-anchor (SessionStart hook) — the wire", () => {
  it("emits the SessionStart injection for a resumed Claudia session, exit 0", async () => {
    const transcript = await transcriptOf(claudiaJsonl);
    const r = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      input: JSON.stringify({ source: "resume", transcript_path: transcript }),
      env: { ...process.env },
    });

    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(out.hookSpecificOutput.additionalContext).toContain("You are Claudia");
  });

  it("stays silent on garbage stdin — fail-silent, exit 0", () => {
    const r = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      input: "not json at all",
      env: { ...process.env },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });
});
