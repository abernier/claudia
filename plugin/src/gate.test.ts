/**
 * The gate every hook passes first (ADR-0036): a transcript, a payload, or a prompt
 * goes in, "is this a Claudia session?" comes out. What counts as an activation is
 * pinned in ./session.test.ts; this file covers the streaming read, the payload
 * adapter's never-throw contract, and what addressing her means (a mention is not).
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isClaudiaHookPayload, isClaudiaTranscript, addressesClaudia } from "./gate.mjs";
import { projectDirFor } from "./session.mjs";
import { cleanupVaults, throwawayHome } from "./vault.fixture.ts";

afterEach(cleanupVaults);

const line = (o: object): string => JSON.stringify(o) + "\n";
const userLine = (content: unknown): string => line({ type: "user", message: { role: "user", content } });
const activation = userLine("Base directory for this skill: /plug/skills/claudia\n# You are Claudia");
const pastedImage = userLine([
  { type: "image", source: { type: "base64", media_type: "image/webp", data: "A".repeat(600 * 1024) } },
]);

/** A transcript file in a throwaway home; returns both. */
async function transcript(jsonl: string): Promise<{ home: string; file: string }> {
  const home = await throwawayHome();
  const file = path.join(home, "session.jsonl");
  await fs.writeFile(file, jsonl);
  return { home, file };
}

describe("isClaudiaTranscript()", () => {
  it("finds the activation behind a pasted image, streaming (ADR-0012 regression)", async () => {
    const { file } = await transcript(pastedImage + activation);
    expect(await isClaudiaTranscript(file)).toBe(true);
  });

  it("reads an unrelated session to the end and says no", async () => {
    const { file } = await transcript(userLine("the squashed character screams AAAAaaaah") + pastedImage);
    expect(await isClaudiaTranscript(file)).toBe(false);
  });

  it("rejects on a missing file — the payload adapter is where that turns into a no", async () => {
    await expect(isClaudiaTranscript("/no/such/transcript.jsonl")).rejects.toThrow();
  });
});

describe("isClaudiaHookPayload()", () => {
  it("true for a payload whose transcript activated Claudia", async () => {
    const { home, file } = await transcript(activation);
    expect(await isClaudiaHookPayload({ transcript_path: file }, home)).toBe(true);
  });

  it("self-locates the transcript from session_id + cwd under the injected home", async () => {
    const home = await throwawayHome();
    const dir = path.join(home, ".claude", "projects", projectDirFor("/work/space"));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "s1.jsonl"), activation);
    expect(await isClaudiaHookPayload({ session_id: "s1", cwd: "/work/space" }, home)).toBe(true);
  });

  it("false — never a throw — when it cannot tell", async () => {
    const home = await throwawayHome();
    expect(await isClaudiaHookPayload(null, home)).toBe(false);
    expect(await isClaudiaHookPayload({}, home)).toBe(false);
    expect(await isClaudiaHookPayload({ transcript_path: path.join(home, "not-yet.jsonl") }, home)).toBe(false);
  });

  it("false for a session that never activated her", async () => {
    const { home, file } = await transcript(userLine("fix the CI"));
    expect(await isClaudiaHookPayload({ transcript_path: file }, home)).toBe(false);
  });
});

describe("addressesClaudia() — speaking to her, not about her (ADR-0036)", () => {
  it("hears a direct address", () => {
    for (const t of [
      "Claudia, I can't go on",
      "Hey Claudia!",
      "salut Claudia\nça va pas fort",
      "bonjour Claudia, tu es là ?",
      "hey, claudia: can we talk",
      "Claudia? are you there",
      "Claudia. I need to talk.",
      "Claudia — I'm scared",
      "Claudia - help",
      "CLAUDIA",
      "  dear Claudia,  ",
      "@Claudia tu es là ?",
      "I need to talk, @claudia",
      "is this thing on (@Claudia)",
      "so tired. @Claudia.",
    ])
      expect(addressesClaudia(t), t).toBe(true);
  });

  it("does not hear a mention — the coding sessions, including this very repo", () => {
    for (const t of [
      "Claudia's safety hook is broken",
      "Claudia doesn't trigger on resume",
      "fix claudia/plugin",
      "cd ~/code/claudia",
      "the claudia skill",
      "`claudia`",
      "claudia:crisis is the skill that fires",
      "open claudia.md",
      "Claudia.md has a typo",
      "claudia-backups is huge",
      "claudia_root is unset",
      "mail user@claudia.dev",
      "npm i @claudia/plugin",
      "ping @Claudia_bot",
      "x@Claudia hi",
      "Claudiane est passée",
      "hey claudias",
      "why does Claudia fire here",
      "",
    ])
      expect(addressesClaudia(t), t).toBe(false);
    expect(addressesClaudia(null)).toBe(false);
  });
});
