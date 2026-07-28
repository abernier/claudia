/**
 * The vault seam's resolver (ADR-0035). One question, answered in one place:
 * where does the person's Memory live? Everything here pins the two-step
 * contract — the root override wins, the home directory is the fallback —
 * because nine call sites used to answer it independently and only one of
 * them honoured the override.
 */
import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { resolveVaultRoot } from "./vault.mjs";
import { rebuildDashboard } from "../scripts/build-dashboard.mjs";
import { cleanupVaults, makeVault, throwawayHome } from "./vault.fixture.ts";

afterEach(cleanupVaults);

describe("resolveVaultRoot", () => {
  it("falls back to .claudia under the given home", () => {
    expect(resolveVaultRoot({}, "/home/sixtine")).toBe(path.join("/home/sixtine", ".claudia"));
  });

  it("lets the root override win over the home directory", () => {
    const env = { CLAUDIA_ROOT: "/somewhere/else/vault" };
    expect(resolveVaultRoot(env, "/home/sixtine")).toBe("/somewhere/else/vault");
  });

  it("treats an empty override as absent", () => {
    // `CLAUDIA_ROOT=""` in a shell is a way of saying "unset" — resolving to ""
    // would aim every write at the current directory.
    expect(resolveVaultRoot({ CLAUDIA_ROOT: "" }, "/home/sixtine")).toBe(path.join("/home/sixtine", ".claudia"));
  });

  it("reads the real environment and home by default", () => {
    // No fabricated inputs: the zero-argument call is what every CLI adapter
    // runs, so its two halves must agree with the injectable form.
    const expected = process.env.CLAUDIA_ROOT || path.join(os.homedir(), ".claudia");
    expect(resolveVaultRoot()).toBe(expected);
  });
});

describe("the adapter swap (ADR-0035)", () => {
  it("serves an entry function a throwaway vault in-process", async () => {
    const root = await makeVault();

    expect(await rebuildDashboard({ root })).toBe(true);

    expect(existsSync(path.join(root, "dashboard.md"))).toBe(true);
  });

  it("routes the production adapter through the override and never reaches the home", async () => {
    // The same entry function, now behind its CLI adapter: a spawn is warranted
    // here because environment handling IS the behaviour under test. `home`
    // stands in for the person's real home; the override points elsewhere.
    const home = await throwawayHome();
    const root = await makeVault();
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "build-dashboard.mjs");

    const r = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      env: { ...process.env, HOME: home, CLAUDIA_ROOT: root },
    });

    expect(r.status).toBe(0);
    // The vault effect landed behind the override…
    expect(existsSync(path.join(root, "dashboard.md"))).toBe(true);
    // …and nothing so much as created a vault under the home.
    expect(existsSync(path.join(home, ".claudia"))).toBe(false);
  });
});
