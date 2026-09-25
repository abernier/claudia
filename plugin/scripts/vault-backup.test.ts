/**
 * The SessionEnd path of the rotating archive (ADR-0032 · ADR-0036): under `--hook`
 * the payload arrives on stdin and only a Claudia session is archived. Spawn-based
 * on purpose — the flag, stdin, and the `--detach` fork ARE process semantics. The
 * archive pass itself is pinned in ../src/backup.test.ts.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVE_SUFFIX } from "../src/backup.mjs";
import { cleanupVaults, makeVault, throwawayHome } from "../src/vault.fixture.ts";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./vault-backup.mjs");

afterEach(cleanupVaults);

const line = (o: object): string => JSON.stringify(o) + "\n";
const userLine = (content: string): string => line({ type: "user", message: { role: "user", content } });
const activation = userLine("Base directory for this skill: /plug/skills/claudia\n# You are Claudia");

/** A vault, an archive dir beside it, and a SessionEnd payload for `jsonl`. */
async function setup(jsonl: string): Promise<{ home: string; root: string; dest: string; payload: string }> {
  const home = await throwawayHome();
  const root = await makeVault(home);
  const file = path.join(home, "session.jsonl");
  await fs.writeFile(file, jsonl);
  return { home, root, dest: path.join(home, "backups"), payload: JSON.stringify({ transcript_path: file }) };
}

const run = (home: string, args: string[], input: string) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8", input, env: { ...process.env, HOME: home } });

const archives = async (dest: string): Promise<string[]> =>
  (await fs.readdir(dest).catch(() => [] as string[])).filter((f) => f.endsWith(ARCHIVE_SUFFIX));

describe("vault-backup --hook — the SessionEnd gate (ADR-0036)", () => {
  it("archives nothing, and creates nothing, when the closing session was not Claudia's", async () => {
    const { home, root, dest, payload } = await setup(userLine("render the squash-and-stretch pass"));

    const r = run(home, [root, "--dest", dest, "--quiet", "--hook"], payload);

    expect(r.status).toBe(0);
    await expect(fs.access(dest)).rejects.toThrow();
  });

  it("archives when it was", async () => {
    const { home, root, dest, payload } = await setup(activation);

    const r = run(home, [root, "--dest", dest, "--quiet", "--hook"], payload);

    expect(r.status).toBe(0);
    expect(await archives(dest)).toHaveLength(1);
  });

  it("gates before --detach forks: the child archives a Claudia session without re-reading stdin", async () => {
    const { home, root, dest, payload } = await setup(activation);

    const r = run(home, [root, "--dest", dest, "--quiet", "--detach", "--hook"], payload);
    expect(r.status).toBe(0);

    // The detached child works on its own clock. Wait for its last write — the log
    // line — so the fixture cleanup never races a child still writing.
    const log = () => fs.readFile(path.join(dest, "log.txt"), "utf8").catch(() => "");
    const deadline = Date.now() + 8000;
    while (!/archived/.test(await log()) && Date.now() < deadline) await new Promise((res) => setTimeout(res, 100));
    expect(await archives(dest)).toHaveLength(1);
  });

  it("without --hook it needs no payload — the timer and /backup archive unconditionally", async () => {
    const { home, root, dest } = await setup("");

    const r = run(home, [root, "--dest", dest, "--quiet"], "");

    expect(r.status).toBe(0);
    expect(await archives(dest)).toHaveLength(1);
  });
});
