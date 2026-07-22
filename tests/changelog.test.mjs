/**
 * CHANGELOG section extraction — the GitHub Release notes come straight from
 * here, so a heading-format drift must fail a test, not ship an empty Release.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSection } from "../src/changelog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SAMPLE = `# claudia

## 0.2.1

### Patch Changes

- abc123: Fix the thing.

## 0.2.0

**Digest.** The big one.

### Minor Changes

- def456: Add the thing.
`;

describe("extractSection", () => {
  it("pulls a middle version up to the next heading", () => {
    expect(extractSection(SAMPLE, "0.2.1")).toBe("### Patch Changes\n\n- abc123: Fix the thing.");
  });

  it("pulls the last version through end of file", () => {
    expect(extractSection(SAMPLE, "0.2.0")).toBe(
      "**Digest.** The big one.\n\n### Minor Changes\n\n- def456: Add the thing.",
    );
  });

  it("returns null for an unknown version", () => {
    expect(extractSection(SAMPLE, "9.9.9")).toBeNull();
  });

  it("matches the heading exactly — a prefix version does not match", () => {
    // `## 0.2` must not accidentally match the `## 0.2.1` heading.
    expect(extractSection(SAMPLE, "0.2")).toBeNull();
  });
});

describe("the real CHANGELOG.md", () => {
  it("has a non-empty section for the current package version", () => {
    // Guarantees the release workflow always finds notes for what it ships.
    const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
    const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
    expect(extractSection(changelog, version)).toBeTruthy();
  });
});
