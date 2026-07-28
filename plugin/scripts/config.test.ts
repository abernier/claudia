/**
 * The /config surface at the vault seam (ADR-0028 · ADR-0035): a root and argv
 * go in, `<root>/config.json` changes on disk, the report and exit code come
 * back as values. Direct import — process semantics are not the behaviour here;
 * runConfig returns what the CLI adapter would print. The parsing and rendering
 * primitives are pinned in ../src/config.test.ts; this file covers the write
 * path a person's switches actually travel.
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { runConfig } from "./config.mjs";
import { cleanupVaults, makeVault } from "../src/vault.fixture.ts";

afterEach(cleanupVaults);

const configFile = (root: string) => path.join(root, "config.json");

describe("runConfig — listing", () => {
  it("renders every setting and names the file, before any file exists", async () => {
    const root = await makeVault();
    const { code, lines } = await runConfig({ root });
    expect(code).toBe(0);
    expect(lines[0]).toContain("emoji");
    expect(lines[0]).toContain("(default off)");
    expect(lines[1]).toBe(configFile(root));
  });
});

describe("runConfig — the write path", () => {
  it("round-trips a flipped switch to disk: set, file, list all agree", async () => {
    const root = await makeVault();

    const set = await runConfig({ root, args: ["--set", "emoji=on"] });
    expect(set.code).toBe(0);
    expect(set.lines[0]).toBe("emoji: off → on");

    const onDisk = JSON.parse(await fs.readFile(configFile(root), "utf8"));
    expect(onDisk).toEqual({ emoji: true });

    const list = await runConfig({ root });
    expect(list.lines[0]).toMatch(/emoji\s+on\s+\(default off\)/);
  });

  it("preserves every other key in the file, including ones this version doesn't know", async () => {
    const root = await makeVault();
    await fs.writeFile(configFile(root), JSON.stringify({ dashboard: false, futureKey: "x" }));

    const { code } = await runConfig({ root, args: ["--set", "emoji=true"] });
    expect(code).toBe(0);

    expect(JSON.parse(await fs.readFile(configFile(root), "utf8"))).toEqual({
      dashboard: false,
      futureKey: "x",
      emoji: true,
    });
  });

  it("refuses an unknown key without touching the disk", async () => {
    const root = await makeVault();
    const { code, lines } = await runConfig({ root, args: ["--set", "emojis=on"] });
    expect(code).toBe(1);
    expect(lines[0]).toContain("unknown setting");
    await expect(fs.access(configFile(root))).rejects.toThrow();
  });

  it("refuses a value the setting doesn't take, naming what it does", async () => {
    const root = await makeVault();
    const { code, lines } = await runConfig({ root, args: ["--set", "language=klingon"] });
    expect(code).toBe(1);
    expect(lines[0]).toContain("fr or en");
    await expect(fs.access(configFile(root))).rejects.toThrow();
  });

  it("keeps a copy of a hand-broken file before writing over it", async () => {
    const root = await makeVault();
    await fs.writeFile(configFile(root), "{oops");

    const { code } = await runConfig({ root, args: ["--set", "emoji=on"] });
    expect(code).toBe(0);

    expect(await fs.readFile(configFile(root) + ".bak", "utf8")).toBe("{oops");
    expect(JSON.parse(await fs.readFile(configFile(root), "utf8"))).toEqual({ emoji: true });
  });
});
