/**
 * The deterministic opening at its process seam: one spawn of recall-open.mjs,
 * one compact report out, the mirror refreshed as a side effect. Spawn-based on
 * purpose — child-process isolation IS the promise under test ("the open must
 * never be blocked by upkeep"), so each test runs a copy of the deployed tree
 * where a child can be deleted or broken without touching the repo.
 *
 * The children's own contracts (pending detection, migration, mirror, settings)
 * are pinned in their own suites; this file covers the orchestration: ordering,
 * the two-phase stop, and visible degradation.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrations } from "../src/migrations/index.mjs";
import { cleanupVaults, makeVault, throwawayHome } from "../src/vault.fixture.ts";

const plugin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

afterEach(cleanupVaults);

/** The deployed shape (scripts/ + src/), copied where a test may break it. */
async function deployedCopy(): Promise<string> {
  const dir = path.join(await throwawayHome(), "plugin");
  await fs.cp(path.join(plugin, "scripts"), path.join(dir, "scripts"), { recursive: true });
  await fs.cp(path.join(plugin, "src"), path.join(dir, "src"), { recursive: true });
  return dir;
}

/** A vault whose migration ledger is already caught up, so the report is stable. */
async function caughtUpVault(): Promise<string> {
  const root = await makeVault();
  await fs.writeFile(path.join(root, ".migrations"), migrations.map((m) => m.id).join("\n") + "\n");
  return root;
}

const open = (dir: string, root: string) =>
  spawnSync(process.execPath, [path.join(dir, "scripts", "recall-open.mjs")], {
    encoding: "utf8",
    env: { ...process.env, CLAUDIA_ROOT: root },
  });

describe("recall-open — the one-call opening", () => {
  it("prints the full report and refreshes the mirror on a caught-up vault", async () => {
    const dir = await deployedCopy();
    const root = await caughtUpVault();

    const r = open(dir, root);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain("(silent open — no narration");
    expect(r.stdout).toContain("pending: none");
    expect(r.stdout).toContain("migration: ✓ Vault up to date");
    expect(r.stdout).toContain("emoji"); // the settings listing made it through
    // The side effect that makes this glue real: the mirror was rebuilt.
    await expect(fs.access(path.join(root, "dashboard.md"))).resolves.toBeUndefined();
  });

  it("stops at phase one when sessions are owed a distillation (ADR-0016 ordering)", async () => {
    const dir = await deployedCopy();
    const root = await caughtUpVault();
    await fs.writeFile(path.join(root, "sessions", "2026-07-20-aaaa0000.pending-summary"), "");

    const r = open(dir, root);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain("2026-07-20-aaaa0000");
    expect(r.stdout).toContain("hand each stem to distill-session");
    // Nothing past the stop: no report, no mirror refresh.
    expect(r.stdout).not.toContain("migration:");
    await expect(fs.access(path.join(root, "dashboard.md"))).rejects.toThrow();
  });

  it("degrades visibly — missing children read as 'unavailable', never as a blocked open", async () => {
    const dir = await deployedCopy();
    const root = await caughtUpVault();
    await fs.rm(path.join(dir, "scripts", "migrate-vault.mjs"));
    await fs.rm(path.join(dir, "scripts", "config.mjs"));

    const r = open(dir, root);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain("migration: unavailable (skipped)");
    expect(r.stdout).toContain("unavailable — shipped defaults apply");
    // The open still completed: the surviving child refreshed the mirror.
    await expect(fs.access(path.join(root, "dashboard.md"))).resolves.toBeUndefined();
  });

  it("survives a child that crashes — the failure stays the child's, not the open's", async () => {
    const dir = await deployedCopy();
    const root = await caughtUpVault();
    await fs.writeFile(path.join(dir, "scripts", "pending-sessions.mjs"), "process.exit(1);\n");

    const r = open(dir, root);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain("pending: none"); // a crashed detector reads as nothing pending
    expect(r.stdout).toContain("migration: ✓ Vault up to date");
  });
});
