/**
 * The pending lister at the vault seam (ADR-0035): a root goes in, the stems
 * still owed a distillation come out. The sorting and marker semantics live in
 * src/pending.mjs and are pinned there — this covers the glue: the right
 * directory of the right vault, and silence instead of a throw when the vault
 * is not there yet.
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

import { listPending } from "./pending-sessions.mjs";
import { cleanupVaults, makeVault } from "../src/vault.fixture.ts";

afterEach(cleanupVaults);

describe("listPending", () => {
  it("returns the stems owed a distillation, oldest first", async () => {
    const root = await makeVault();
    const dir = path.join(root, "sessions");
    await fs.writeFile(path.join(dir, "2026-07-26-abcd1234.pending-summary"), "");
    await fs.writeFile(path.join(dir, "2026-07-25-ffff0000.pending-summary"), "");

    expect(await listPending({ root })).toEqual(["2026-07-25-ffff0000", "2026-07-26-abcd1234"]);
  });

  it("reads nothing outside the root it was given", async () => {
    // Two vaults side by side: only the asked-for one answers.
    const marked = await makeVault();
    await fs.writeFile(path.join(marked, "sessions", "2026-07-20-aaaa0000.pending-summary"), "");
    const clean = await makeVault();

    expect(await listPending({ root: clean })).toEqual([]);
  });

  it("treats a vault that does not exist yet as nothing pending", async () => {
    expect(await listPending({ root: "/no/such/vault" })).toEqual([]);
  });
});
