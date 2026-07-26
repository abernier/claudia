import { describe, it, expect, afterEach } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/time-context.mjs");

const line = (o: object): string => JSON.stringify(o) + "\n";
const activation = line({
  type: "user",
  message: { role: "user", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" },
});
// One pasted image, as Claude Code writes it: a single ~600 KB line. This is the shape
// that used to push the activation past the hook's 256 KB head-read (ADR-0012).
const pastedImage = line({
  type: "user",
  message: {
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/webp", data: "A".repeat(600 * 1024) } },
      { type: "text", text: "regarde" },
    ],
  },
});

/** Run the hook against `transcript`, with `home` standing in for the vault's home. */
const run = (home: string, transcript: string): SpawnSyncReturns<string> =>
  spawnSync(process.execPath, [script], {
    encoding: "utf8",
    input: JSON.stringify({ session_id: "abcdef12-3456-7890-abcd-ef1234567890", transcript_path: transcript }),
    env: { ...process.env, HOME: home },
  });

describe("time-context (UserPromptSubmit hook) — the Claudia gate", () => {
  const tmps: string[] = [];
  afterEach(async () => {
    for (const t of tmps.splice(0)) await fs.rm(t, { recursive: true, force: true });
  });

  /** @returns a fresh fake home plus a transcript path inside it. */
  async function fixture(jsonl: string): Promise<{ home: string; transcript: string }> {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-home-"));
    tmps.push(home);
    const transcript = path.join(home, "session.jsonl");
    await fs.writeFile(transcript, jsonl);
    return { home, transcript };
  }

  it("still anchors the turn when a pasted image sits before the activation (ADR-0012 regression)", async () => {
    const { home, transcript } = await fixture(pastedImage + activation);

    const r = run(home, transcript);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain("[CLAUDIA TIME]");
    expect(r.stdout).toContain("authoritative");
    // The clock ticks too, so the NEXT turn measures its gap from this one.
    const lastSeen = await fs.readFile(path.join(home, ".claudia", "last-seen"), "utf8");
    expect(Number.parseInt(lastSeen, 10)).toBeGreaterThan(Date.now() - 60_000);
  });

  it("reports the gap since the person last spoke — the resumed-next-morning case", async () => {
    const { home, transcript } = await fixture(activation);
    await fs.mkdir(path.join(home, ".claudia"), { recursive: true });
    await fs.writeFile(path.join(home, ".claudia", "last-seen"), String(Date.now() - 9 * 3_600_000));

    const r = run(home, transcript);

    expect(r.stdout).toContain("PT9H");
    expect(r.stdout).toMatch(/gap_kind: (overnight|same_day)/); // which one depends on the wall clock the test runs at
  });

  it("stays silent — and touches no clock — in a session that never activated Claudia", async () => {
    const { home, transcript } = await fixture(
      line({ type: "user", message: { role: "user", content: "fix the CI" } }),
    );

    const r = run(home, transcript);

    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    await expect(fs.readFile(path.join(home, ".claudia", "last-seen"), "utf8")).rejects.toThrow();
  });
});
