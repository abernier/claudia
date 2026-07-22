import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "vault-export.mjs");

/** Run the export script as the user would (a real child process, real exit code). */
const runExport = (src: string, dest: string) =>
  spawnSync(process.execPath, [script, src, dest], { encoding: "utf8" });

const tmpDirs: string[] = [];
const tmp = async (): Promise<string> => {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-export-"));
  tmpDirs.push(d);
  return d;
};

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe("vault export pass (scripts/vault-export.mjs)", () => {
  it("copies the vault and exits 0", async () => {
    const parent = await tmp();
    const src = path.join(parent, "vault");
    await fs.mkdir(path.join(src, "people"), { recursive: true });
    await fs.writeFile(path.join(src, "MEMORY.md"), "index\n");
    await fs.writeFile(path.join(src, "people", "Liliana.md"), "fiche\n");

    const dest = path.join(parent, "out");
    const r = runExport(src, dest);

    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Exported 2 files/);
    expect(await fs.readFile(path.join(dest, "people", "Liliana.md"), "utf8")).toBe("fiche\n");
  });

  it("on a mid-copy failure, exits 1 and warns the person about the partial copy", async () => {
    const parent = await tmp();
    const src = path.join(parent, "vault");
    await fs.mkdir(src, { recursive: true });
    await fs.writeFile(path.join(src, "MEMORY.md"), "index\n");

    // A regular file where the copy loop needs a directory: `mkdir -p` under it
    // fails (ENOTDIR), reproducing an export that dies partway through.
    const blocker = path.join(parent, "blocker");
    await fs.writeFile(blocker, "not a directory\n");
    const dest = path.join(blocker, "out");

    const r = runExport(src, dest);

    // A user-invoked /export must never fail silently with a success code.
    expect(r.status).toBe(1);
    // The person is told it failed, why, and where the untrustworthy partial copy lives.
    expect(r.stderr).toMatch(/export failed/i);
    expect(r.stderr).toMatch(/ENOTDIR/);
    expect(r.stderr).toContain(dest);
    expect(r.stderr).toMatch(/partial/i);
    expect(r.stderr).toMatch(/complete/i);
  });
});
