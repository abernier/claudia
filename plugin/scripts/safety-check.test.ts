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
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanupVaults, throwawayHome } from "../src/vault.fixture.ts";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./safety-check.mjs");

afterEach(cleanupVaults);

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
  it("escalates clear risk: payload in, crisis note out, exit 0", () => {
    const r = check(JSON.stringify({ prompt: "I want to kill myself" }));
    expect(r.status).toBe(0);
    const note = escalation(r.stdout);
    expect(note).toContain("CLAUDIA SAFETY");
    expect(note).toContain("crisis");
  });

  it("stays silent on a benign turn", () => {
    const r = check(JSON.stringify({ prompt: "had a lovely coffee this morning" }));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("screens raw text when stdin is not JSON — malformed input is still checked", () => {
    const r = check("je veux en finir ce soir");
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("CLAUDIA SAFETY");
  });

  it("fails safe on veiled distress with the classifier off — the shipped default", () => {
    const r = check(JSON.stringify({ prompt: "I just want the pain to stop" }));
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("classifier off");
  });
});

describe("stage 2 — the model-classifier subprocess", () => {
  it("escalates when the classifier crashes: fail-safe, exit 0 (ADR-0003)", async () => {
    const bin = await fakeClaude("exit 1");
    const r = check(JSON.stringify({ prompt: "I just want the pain to stop" }), {
      CLAUDIA_MODEL_CLASSIFIER: "on",
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    });
    expect(r.status).toBe(0);
    expect(escalation(r.stdout)).toContain("failing safe");
  });

  it("lets an explicit all-clear verdict pass — the wiring parses the model's JSON", async () => {
    const bin = await fakeClaude(`echo '{"risk":"none","category":"none"}'`);
    const r = check(JSON.stringify({ prompt: "I just want the pain to stop" }), {
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
    child.stdin.write(JSON.stringify({ prompt: "I want to kill myself" }));
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
