import { describe, it, expect } from "vitest";
import { wikilinksToRelative, ficheNames } from "../src/vault.mjs";

const resolve = (name) =>
  ({ Liliana: "people/Liliana.md", "2026-07-21": "sessions/2026-07-21.summary.md" }[name] || null);

describe("wikilinksToRelative()", () => {
  it("rewrites a plain wikilink", () => {
    expect(wikilinksToRelative("see [[Liliana]] today", resolve)).toBe("see [Liliana](people/Liliana.md) today");
  });
  it("uses the label form [[Target|label]]", () => {
    expect(wikilinksToRelative("[[Liliana|Lili]]", resolve)).toBe("[Lili](people/Liliana.md)");
  });
  it("keeps a heading anchor", () => {
    expect(wikilinksToRelative("[[Liliana#How it feels]]", resolve)).toBe("[Liliana](people/Liliana.md#How it feels)");
  });
  it("resolves session links", () => {
    expect(wikilinksToRelative("[[2026-07-21]]", resolve)).toBe("[2026-07-21](sessions/2026-07-21.summary.md)");
  });
  it("drops an unknown target to plain text (no dangling link)", () => {
    expect(wikilinksToRelative("[[Nobody]]", resolve)).toBe("Nobody");
  });
  it("leaves single-bracket links alone", () => {
    expect(wikilinksToRelative("[label](url) and [x]", resolve)).toBe("[label](url) and [x]");
  });
});

describe("ficheNames()", () => {
  it("extracts name + aliases from frontmatter", () => {
    const md = `---\ntype: person\nname: Liliana\naliases: [Lili, "L."]\n---\n# body`;
    expect(ficheNames(md)).toEqual(["Liliana", "Lili", "L."]);
  });
  it("returns [] with no frontmatter", () => {
    expect(ficheNames("# just a heading")).toEqual([]);
  });
});
