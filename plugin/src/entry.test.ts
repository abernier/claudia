/**
 * Telling "run" from "imported" — the test that has to survive a symlinked install.
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isEntrypoint } from "./entry.mjs";

const dirs: string[] = [];
afterEach(async () => {
  for (const d of dirs.splice(0)) await fs.rm(d, { recursive: true, force: true });
});

/** A `real/script.mjs` plus a `link/ -> real/` beside it — the dev-install shape. */
async function makeScript(): Promise<{ real: string; viaLink: string }> {
  // Under the OS temp dir, which is itself a symlink on macOS (/tmp -> /private/tmp);
  // realpath() the root so the fixture only exercises the link it means to.
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "claudia-")));
  dirs.push(root);
  await fs.mkdir(path.join(root, "real"));
  await fs.writeFile(path.join(root, "real", "script.mjs"), "export {};\n");
  await fs.symlink(path.join(root, "real"), path.join(root, "link"));
  return { real: path.join(root, "real", "script.mjs"), viaLink: path.join(root, "link", "script.mjs") };
}

describe("isEntrypoint()", () => {
  it("is true for the file Node was asked to run", async () => {
    const { real } = await makeScript();
    expect(isEntrypoint(pathToFileURL(real).href, real)).toBe(true);
  });

  it("is true when the script was reached THROUGH a symlink (the dev install)", async () => {
    // `~/.claude/skills/claudia -> …/claudia/plugin`: Node resolves the link for
    // import.meta.url but hands argv[1] over as written, so an unresolved comparison
    // called this an import and skipped main() — silently, exit 0.
    const { real, viaLink } = await makeScript();
    expect(isEntrypoint(pathToFileURL(real).href, viaLink)).toBe(true);
  });

  it("is true when the invoked path is relative to the cwd", async () => {
    const { real } = await makeScript();
    expect(isEntrypoint(pathToFileURL(real).href, path.relative(process.cwd(), real))).toBe(true);
  });

  it("is false for a different script — the guard still guards", async () => {
    const { real } = await makeScript();
    const other = path.join(path.dirname(real), "other.mjs");
    await fs.writeFile(other, "export {};\n");
    expect(isEntrypoint(pathToFileURL(real).href, other)).toBe(false);
  });

  it("is false when nothing was invoked (a REPL)", async () => {
    const { real } = await makeScript();
    expect(isEntrypoint(pathToFileURL(real).href, "")).toBe(false);
  });

  it("reads process.argv[1] by default — this very file was imported, not run", () => {
    expect(isEntrypoint(import.meta.url)).toBe(false);
  });

  it("does not throw on a path that is not there — it just isn't the entry point", async () => {
    const { real } = await makeScript();
    expect(isEntrypoint(pathToFileURL(real).href, path.join(path.dirname(real), "gone.mjs"))).toBe(false);
  });
});
