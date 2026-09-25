/**
 * The per-turn safety floor at its process seam (ADR-0003): a hook payload goes
 * in on stdin, an escalation note (or silence) comes out on stdout, and the exit
 * code is 0 no matter what — the check must never block the turn. Spawn-based on
 * purpose: stdin parsing, the fail-safe, and the read-window race ARE process
 * semantics here. The decision logic itself is pinned in ../src/safety.test.ts;
 * this file covers the wiring around it.
 *
 * Stage-2 tests put a fake `claude` first on PATH, so no test can ever reach the
 * real CLI (or bill a real model call).
 *
 * The gate (ADR-0036) is covered by importing safetyCheck directly: which sessions
 * are screened at all is a decision, not process semantics.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanupVaults, throwawayHome } from "../src/vault.fixture.ts";
import { safetyCheck } from "./safety-check.mjs";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./safety-check.mjs");

afterEach(cleanupVaults);

const line = (o: object): string => JSON.stringify(o) + "\n";
const userLine = (content: string): string => line({ type: "user", message: { role: "user", content } });
const activation = userLine("Base directory for this skill: /plug/skills/claudia\n# You are Claudia");

/** A transcript in a throwaway home; returns its path. */
async function transcript(jsonl: string): Promise<string> {
  const file = path.join(await throwawayHome(), "session.jsonl");
  await fs.writeFile(file, jsonl);
  return file;
}

/** A UserPromptSubmit payload for `prompt` in a session that activated Claudia. */
const inClaudia = async (prompt: string): Promise<string> =>
  JSON.stringify({ prompt, transcript_path: await transcript(activation + userLine("bonjour")) });

/** Run the hook to completion: payload in (stdin closed), stdout + exit out. */
const check = (input: string, env: NodeJS.ProcessEnv = {}) =>
  spawnSync(process.execPath, [script], {
    encoding: "utf8",
    input,
    env: { ...process.env, CLAUDIA_MODEL_CLASSIFIER: "", ...env },
  });

/** A fake `claude` CLI in a throwaway bin dir, to prepend to PATH. */
async function fakeClaude(body: string): Promise<string> {
  const bin = path.join(await throwawayHome(), "bin");
  await fs.mkdir(bin, { recursive: true });
  const file = path.join(bin, "claude");
  await fs.writeFile(file, `#!/bin/sh\n${body}\n`);
  await fs.chmod(file, 0o755);
  return bin;
}

/** Assert stdout carries a UserPromptSubmit escalation; return its note. */
function escalation(stdout: string): string {
  expect(stdout).not.toBe("");
  const out = JSON.parse(stdout);
  expect(out.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
  return out.hookSpecificOutput.additionalContext;
}

describe("safety-check (UserPromptSubmit hook) — the wiring, end to end", () => {
  it("escalates clear risk: payload in, crisis note out, exit 0", async () => {
    const r = check(await inClaudia("I want to kill myself"));
    expect(r.status).toBe(0);
    const note = escalation(r.stdout);
    expect(note).toContain("CLAUDIA SAFETY");
    expect(note).toContain("crisis");
  });

  it("stays silent on a benign turn", async () => {
    const r = check(await inClaudia("had a lovely coffee this morning"));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("stays silent, exit 0, in a session that is not Claudia's (ADR-0036)", async () => {
    const file = await transcript(userLine("fix the CI"));
    const r = check(JSON.stringify({ prompt: "I want to kill myself", transcript_path: file }));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("screens raw text when stdin is not JSON — malformed input addressing her is still checked", () => {
    const r = check("Claudia, je veux en finir ce soir");
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("CLAUDIA SAFETY");
  });

  it("fails safe on veiled distress with the classifier off — the shipped default", async () => {
    const r = check(await inClaudia("I just want the pain to stop"));
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("classifier off");
  });
});

describe("stage 2 — the model-classifier subprocess", () => {
  it("escalates when the classifier crashes: fail-safe, exit 0 (ADR-0003)", async () => {
    const bin = await fakeClaude("exit 1");
    const r = check(await inClaudia("I just want the pain to stop"), {
      CLAUDIA_MODEL_CLASSIFIER: "on",
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    });
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("failing safe");
  });

  it("lets an explicit all-clear verdict pass — the wiring parses the model's JSON", async () => {
    const bin = await fakeClaude(`echo '{"risk":"none","category":"none"}'`);
    const r = check(await inClaudia("I just want the pain to stop"), {
      CLAUDIA_MODEL_CLASSIFIER: "on",
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });
});

describe("the stdin read window", () => {
  it("answers with whatever arrived when stdin never closes (the race, off the production clock)", async () => {
    const child = spawn(process.execPath, [script], {
      env: { ...process.env, CLAUDIA_MODEL_CLASSIFIER: "", CLAUDIA_STDIN_TIMEOUT_MS: "80" },
    });
    child.stdin.on("error", () => {}); // the child may exit first; EPIPE is expected noise
    child.stdin.write(await inClaudia("I want to kill myself"));
    // stdin deliberately left open: only the window can end the read.

    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (c) => (stdout += c));
    const status = await new Promise((resolve) => child.on("close", resolve));
    child.stdin.end();

    expect(status).toBe(0);
    expect(escalation(stdout)).toContain("CLAUDIA SAFETY");
  });
});

describe("the gate (ADR-0036) — screened only in a Claudia session, only the person's words", () => {
  // The session that surfaced the bug: an animated-video project whose running gag
  // is characters squashed flat, screaming. Nothing here is a person in danger.
  const squash =
    "the anvil lands, he's squashed flat — AAAAaaaah — then we stab the timeline and kill him off in shot 12";

  it("is silent in a session that never activated Claudia, whatever the prompt says", async () => {
    const file = await transcript(userLine("render the squash-and-stretch pass") + userLine(squash));
    expect(await safetyCheck({ raw: JSON.stringify({ prompt: squash, transcript_path: file }) })).toBeNull();
    expect(
      await safetyCheck({ raw: JSON.stringify({ prompt: "I want to kill myself", transcript_path: file }) }),
    ).toBeNull();
  });

  it("is silent when it cannot tell — no transcript yet, or none located", async () => {
    const home = await throwawayHome();
    const missing = path.join(home, "not-written-yet.jsonl");
    expect(await safetyCheck({ raw: JSON.stringify({ prompt: squash, transcript_path: missing }), home })).toBeNull();
    expect(await safetyCheck({ raw: JSON.stringify({ prompt: squash }), home })).toBeNull();
    expect(await safetyCheck({ raw: squash, home })).toBeNull();
  });

  it("is silent on a coding session that mentions the claudia repo and violent words", async () => {
    const file = await transcript(userLine("look at plugin/scripts/safety-check.mjs"));
    for (const prompt of [
      `cd ~/code/claudia and fix the scene where ${squash}`,
      "Claudia's safety hook fired on 'I want to kill myself' in the test fixture",
      "the claudia skill should not see: stab him, kill him",
    ]) {
      expect(await safetyCheck({ raw: JSON.stringify({ prompt, transcript_path: file }) }), prompt).toBeNull();
      expect(await safetyCheck({ raw: JSON.stringify({ prompt }) }), prompt).toBeNull(); // no transcript at all
    }
  });

  it("never screens a background task's notification, even in a Claudia session", async () => {
    const notification =
      "<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>\n" +
      `<summary>Render done</summary>\n<result>${squash}</result>\n</task-notification>`;
    const file = await transcript(activation);
    expect(await safetyCheck({ raw: JSON.stringify({ prompt: notification, transcript_path: file }) })).toBeNull();
  });

  it("a notification that mentions her does not open the gate", async () => {
    const notification = `<task-notification><result>claudia repo: ${squash}</result></task-notification>`;
    expect(await safetyCheck({ raw: JSON.stringify({ prompt: notification }) })).toBeNull();
  });

  it("still screens what the person typed beside a harness block", async () => {
    const prompt = "<system-reminder>ctx</system-reminder>\nI want to kill myself";
    const note = await safetyCheck({ raw: await inClaudia(prompt) });
    expect(note).toContain("CLAUDIA SAFETY");
  });

  it("escalates a crisis inside an established Claudia session", async () => {
    const note = await safetyCheck({ raw: await inClaudia("I want to kill myself") });
    expect(note).toContain("CLAUDIA SAFETY");
    expect(note).toContain("crisis");
  });

  it("escalates a first turn that addresses her — the activation is not in the transcript yet", async () => {
    const file = await transcript(""); // turn one: nothing written but this prompt
    for (const prompt of ["Claudia, je veux en finir ce soir", "@Claudia I want to kill myself"]) {
      const note = await safetyCheck({ raw: JSON.stringify({ prompt, transcript_path: file }) });
      expect(note, prompt).toContain("CLAUDIA SAFETY");
    }
  });

  it("fails safe once the gate is passed: a classifier that throws escalates", async () => {
    const note = await safetyCheck({
      raw: await inClaudia("I just want the pain to stop"),
      modelClassifierEnabled: true,
      classify: async () => {
        throw new Error("boom");
      },
    });
    expect(note).toContain("failing safe");
  });
});
