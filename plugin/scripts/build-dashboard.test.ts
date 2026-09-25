/**
 * The mirror's glue at the vault seam (ADR-0019 · ADR-0035): a root goes in,
 * `<root>/dashboard.md` appears, disappears, or stays away. Direct import —
 * rebuildDashboard returns whether it wrote, and the vault shows the rest.
 * What the mirror *says* is pinned in ../src/dashboard.test.ts (and is free to
 * move); this file covers reading the right vault, the ADR-0019 promises that
 * are only checkable against real files — every link resolving, the prose left
 * unexcerpted, `safety.md` never mirrored — honouring the opt-out for real, and
 * failing silent on a vault that isn't there.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rebuildDashboard, rebuildDashboardAtClose } from "./build-dashboard.mjs";
import { cleanupVaults, makeVault, throwawayHome } from "../src/vault.fixture.ts";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./build-dashboard.mjs");

const line = (o: object): string => JSON.stringify(o) + "\n";
const userLine = (content: string): string => line({ type: "user", message: { role: "user", content } });
const activation = userLine("Base directory for this skill: /plug/skills/claudia\n# You are Claudia");

/** A transcript in a throwaway home; returns its path. */
async function transcript(jsonl: string): Promise<string> {
  const file = path.join(await throwawayHome(), "session.jsonl");
  await fs.writeFile(file, jsonl);
  return file;
}

afterEach(cleanupVaults);

describe("rebuildDashboard", () => {
  it("mirrors the vault it was given: every link it writes resolves to a file there (ADR-0019)", async () => {
    const root = await makeVault();
    const write = (rel: string, body: string) => fs.writeFile(path.join(root, rel), body);
    await Promise.all([
      write("goals.md", "- retrouver le sommeil\n"),
      write("themes.md", "- l'inner critic\n"),
      write("keepsakes.md", "> Tu n'es pas en retard sur ta vie.\n>\n> — moi\n"),
      write("people.md", "- Sixtine\n"),
      write("timeline.md", "- 2026 — début avec Claudia\n"),
      write("understanding.md", "## En ce moment\nune prose thérapeutique très personnelle.\n"),
      // List-shaped on purpose: were safety.md ever read into any surface, it would
      // be transcluded rather than quietly degrade to a link, and this test would say so.
      write("safety.md", "- une phrase qui ne doit jamais reparaître à chaque coup d'œil\n"),
    ]);

    expect(await rebuildDashboard({ root })).toBe(true);

    const md = await fs.readFile(path.join(root, "dashboard.md"), "utf8");
    const targets = [...md.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!);
    expect(targets, "the mirror should point at the vault it read").toContain("sessions/2026-07-24.summary.md");
    for (const t of targets)
      await expect(fs.access(path.join(root, t)), `dangling link: ${t}`).resolves.toBeUndefined();
    // The two rules a real vault is needed to prove: prose is pointed at, never
    // excerpted — and safety.md is not mirrored at all, not even as a link.
    expect(targets).toContain("understanding.md");
    expect(md, "the working understanding is linked, never excerpted").not.toContain("prose thérapeutique");
    expect(md, "no standing risk profile at a glance").not.toMatch(/safety\.md|jamais reparaître/);
  });

  it("makes the opt-out real: dashboard=false removes a stale mirror (ADR-0028)", async () => {
    const root = await makeVault();
    await fs.writeFile(path.join(root, "dashboard.md"), "stale mirror from before the opt-out\n");
    await fs.writeFile(path.join(root, "config.json"), JSON.stringify({ dashboard: false }));

    expect(await rebuildDashboard({ root })).toBe(false);

    await expect(fs.access(path.join(root, "dashboard.md"))).rejects.toThrow();
  });

  it("writes nothing when the person has no vault yet", async () => {
    expect(await rebuildDashboard({ root: "/no/such/vault" })).toBe(false);
  });
});

describe("the SessionEnd path (--hook) — gated on a Claudia session (ADR-0036)", () => {
  it("rebuilds the mirror when the closing session was Claudia's", async () => {
    const root = await makeVault();
    const payload = { transcript_path: await transcript(activation) };

    expect(await rebuildDashboardAtClose({ root, payload })).toBe(true);

    await expect(fs.access(path.join(root, "dashboard.md"))).resolves.toBeUndefined();
  });

  it("touches nothing when it was any other session — or when it cannot tell", async () => {
    const root = await makeVault();
    const coding = { transcript_path: await transcript(userLine("render the squash-and-stretch pass")) };

    expect(await rebuildDashboardAtClose({ root, payload: coding })).toBe(false);
    expect(await rebuildDashboardAtClose({ root, payload: {}, home: await throwawayHome() })).toBe(false);

    await expect(fs.access(path.join(root, "dashboard.md"))).rejects.toThrow();
  });

  it("reads the gate's payload from stdin under --hook; bare, it rebuilds unconditionally", async () => {
    const root = await makeVault();
    const run = (args: string[], input: string) =>
      spawnSync(process.execPath, [script, ...args], {
        encoding: "utf8",
        input,
        env: { ...process.env, CLAUDIA_ROOT: root },
      });
    const coding = JSON.stringify({ transcript_path: await transcript(userLine("fix the CI")) });

    expect(run(["--hook"], coding).status).toBe(0);
    await expect(fs.access(path.join(root, "dashboard.md"))).rejects.toThrow();

    expect(run([], "").status).toBe(0); // `/dashboard`, recall: no payload, no gate
    await expect(fs.access(path.join(root, "dashboard.md"))).resolves.toBeUndefined();
  });
});
