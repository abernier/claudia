/**
 * CHANGELOG section extraction — the GitHub Release notes come straight from
 * here, so a heading-format drift must fail a test, not ship an empty Release.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSection } from "../src/changelog.mjs";

const root: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SAMPLE: string = `# claudia

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
    // Cast at the external-JSON boundary: package.json is parsed, not typed.
    const version = (JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as { version: string }).version;
    const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
    expect(extractSection(changelog, version)).toBeTruthy();
  });
});

describe("changesets stay digestible", () => {
  // These bodies become the GitHub Release notes verbatim, and their audience is
  // the person using Claudia, not a contributor. Left unbounded they drifted to
  // 280–480 words each — v0.11.0 shipped ~1,960 words of unbroken prose, because
  // every entry re-argued the *why* that its ADR already carries, in full. Say
  // what changed and what it means for them; cite the ADR for the reasoning.
  const LIMIT = 150;

  const bodies = readdirSync(path.join(root, ".changeset"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => ({
      file: f,
      words: readFileSync(path.join(root, ".changeset", f), "utf8")
        .replace(/^---[\s\S]*?---/, "") // drop the bump frontmatter
        .split(/\s+/)
        .filter(Boolean).length,
    }));

  it(`keeps every pending changeset under ${LIMIT} words`, () => {
    const tooLong = bodies.filter((b) => b.words > LIMIT).map((b) => `${b.file} (${b.words} words)`);
    expect(tooLong, `too verbose for a release note — see README "Releasing":\n${tooLong.join("\n")}`).toEqual([]);
  });
});
