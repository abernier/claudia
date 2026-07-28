/**
 * The vault seam's single test adapter (ADR-0035): every test that needs a vault
 * builds a throwaway one here, in a temp directory the fixture tracks and removes.
 * Grown from the backup suite's builder, which was the prior art — before this
 * file, four competing faking patterns each built their own.
 *
 * Never points anywhere near the real home: the person's actual vault must be
 * unreachable from a test by construction.
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const tracked: string[] = [];

/**
 * A fresh temp directory standing in for the person's home. Tracked for
 * `cleanupVaults`.
 */
export async function throwawayHome(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-home-"));
  tracked.push(d);
  return d;
}

/**
 * A minimal but realistic vault under `parent` (a throwaway home by default):
 * an index, a working file, a session, a person. Returns the vault root.
 */
export async function makeVault(parent?: string): Promise<string> {
  const home = parent ?? (await throwawayHome());
  const root = path.join(home, ".claudia");
  await fs.mkdir(path.join(root, "sessions"), { recursive: true });
  await fs.mkdir(path.join(root, "people"), { recursive: true });
  await fs.writeFile(path.join(root, "MEMORY.md"), "# index\n");
  await fs.writeFile(path.join(root, "person.md"), "notes\n");
  await fs.writeFile(path.join(root, "safety.md"), "flags\n");
  await fs.writeFile(path.join(root, "sessions", "2026-07-24.summary.md"), "a session\n");
  await fs.writeFile(path.join(root, "people", "Sixtine.md"), "a fiche\n");
  return root;
}

/** Remove every directory this fixture created. Call it from `afterEach`. */
export async function cleanupVaults(): Promise<void> {
  await Promise.all(tracked.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
}
