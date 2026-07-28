/**
 * The mirror's glue at the vault seam (ADR-0019 · ADR-0035): a root goes in,
 * `<root>/dashboard.md` appears, disappears, or stays away. Direct import —
 * rebuildDashboard returns whether it wrote, and the vault shows the rest.
 * What the mirror *says* is pinned in ../src/dashboard.test.ts (and is free to
 * move); this file covers reading the right vault, honouring the opt-out for
 * real, and failing silent on a vault that isn't there.
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { rebuildDashboard } from "./build-dashboard.mjs";
import { cleanupVaults, makeVault } from "../src/vault.fixture.ts";

afterEach(cleanupVaults);

describe("rebuildDashboard", () => {
  it("mirrors the vault it was given: the session it found is linked, resolvably", async () => {
    const root = await makeVault();

    expect(await rebuildDashboard({ root })).toBe(true);

    const md = await fs.readFile(path.join(root, "dashboard.md"), "utf8");
    const link = "sessions/2026-07-24.summary.md"; // the fixture's one session
    expect(md).toContain(link);
    await expect(fs.access(path.join(root, link))).resolves.toBeUndefined();
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
