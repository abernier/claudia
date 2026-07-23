/**
 * The vault's frontmatter format — reading is best-effort, writing is conservative.
 * Fixtures are the shapes really found in a vault, drift included.
 */
import { describe, it, expect } from "vitest";
import { parseFrontmatter, stampIdentity } from "../src/frontmatter.mjs";
import type { Frontmatter } from "../src/frontmatter.mjs";

const SUMMARY = `---
type: session
session: 9113d5d7
dates: [2026-07-21, 2026-07-22]
people: [Emilie de Bueil]
---

# Séance — 2026-07-21

Le fil.
`;

describe("parseFrontmatter()", () => {
  it("reads scalars and inline lists, and hands back the body", () => {
    const fm: Frontmatter = parseFrontmatter(SUMMARY);
    expect(fm.status).toBe("present");
    expect(fm.data).toEqual({
      type: "session",
      session: "9113d5d7",
      dates: ["2026-07-21", "2026-07-22"],
      people: ["Emilie de Bueil"], // a name with spaces is one item, not two
    });
    expect(fm.body).toBe("\n# Séance — 2026-07-21\n\nLe fil.\n");
  });

  it("reports a note with no block, keeping the whole text as body", () => {
    const text = "# Séance — 2026-07-23 (042d64f7)\n\nSéance courte.\n";
    const fm = parseFrontmatter(text);
    expect(fm.status).toBe("absent");
    expect(fm.data).toEqual({});
    expect(fm.body).toBe(text);
  });

  it("reports a block whose fence never closes, rather than guessing", () => {
    const text = "---\ntype: session\n\n# oops\n";
    expect(parseFrontmatter(text).status).toBe("malformed");
    expect(parseFrontmatter(text).body).toBe(text);
  });

  it("keeps a scalar containing commas whole — only brackets make a list", () => {
    expect(parseFrontmatter("---\ndescription: Turn a session, distilled, into memory\n---\n").data).toEqual({
      description: "Turn a session, distilled, into memory",
    });
  });

  it("strips one layer of matching quotes, on scalars and list items", () => {
    expect(parseFrontmatter(`---\nname: "Liliana"\nthemes: ['the inner critic', trust]\n---\n`).data).toEqual({
      name: "Liliana",
      themes: ["the inner critic", "trust"],
    });
  });

  it("skips lines outside the subset instead of misreading them", () => {
    const fm = parseFrontmatter("---\n# a comment\ntype: theme\n- a block list item\n---\n");
    expect(fm.data).toEqual({ type: "theme" });
  });

  it("handles an empty block and a block with no body", () => {
    expect(parseFrontmatter("---\n---\n").data).toEqual({});
    expect(parseFrontmatter("---\ntype: session\n---").body).toBe("");
  });

  it("never throws on nullish input", () => {
    expect(parseFrontmatter(null).status).toBe("absent");
    expect(parseFrontmatter(undefined).body).toBe("");
  });
});

describe("stampIdentity()", () => {
  const identity = { type: "session", session: "2026-07-21-9113d5d7", dates: ["2026-07-21"] };

  it("creates the block on a summary that has none", () => {
    const body = "# Séance — 2026-07-23 (042d64f7)\n\nSéance courte.\n";
    expect(stampIdentity(body, identity)).toBe(
      `---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21]\n---\n${body}`
    );
  });

  it("replaces a key in place — the ambiguous bare id becomes the stem", () => {
    const out = stampIdentity(SUMMARY, { session: "2026-07-21-9113d5d7" });
    expect(out).toContain("session: 2026-07-21-9113d5d7");
    expect(out).not.toContain("session: 9113d5d7");
    // in place: the person's own ordering survives
    expect(out.indexOf("session:")).toBeLessThan(out.indexOf("dates:"));
  });

  it("leaves the model's keys and the body byte-identical", () => {
    const out = stampIdentity(SUMMARY, identity);
    expect(out).toContain("people: [Emilie de Bueil]");
    expect(out.slice(out.indexOf("\n---\n") + 5)).toBe(parseFrontmatter(SUMMARY).body);
  });

  it("inserts a missing key next to the siblings that are already there", () => {
    const out = stampIdentity("---\ntype: session\npeople: [Liliana]\n---\nbody\n", identity);
    expect(out).toBe("---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21]\npeople: [Liliana]\n---\nbody\n");
  });

  it("inserts at the top when no sibling is present yet", () => {
    expect(stampIdentity("---\npeople: [Liliana]\n---\nbody\n", { type: "exercise" })).toBe(
      "---\ntype: exercise\npeople: [Liliana]\n---\nbody\n"
    );
  });

  it("is idempotent — a second pass returns the very same string", () => {
    const once = stampIdentity(SUMMARY, identity);
    expect(stampIdentity(once, identity)).toBe(once);
    expect(stampIdentity(SUMMARY, { type: "session" })).toBe(SUMMARY); // already correct → untouched
  });

  it("refuses to touch a block it could not read", () => {
    const broken = "---\ntype: session\n\n# oops\n";
    expect(stampIdentity(broken, identity)).toBe(broken);
  });

  it("skips keys with nothing to say rather than writing noise", () => {
    expect(stampIdentity(SUMMARY, { dates: [], type: "  " })).toBe(SUMMARY);
    expect(stampIdentity("body\n", {})).toBe("body\n");
  });

  it("preserves comments, spacing and the person's own line ending", () => {
    const handEdited = "---\r\ntype: person\r\naliases: [Lili]   # her name to me\r\n---\r\nbody\r\n";
    const out = stampIdentity(handEdited, { type: "person", first_noted: "2026-07-21" });
    expect(out).toContain("aliases: [Lili]   # her name to me");
    expect(out.split("\n").every((l) => l === "" || l.endsWith("\r"))).toBe(true);
  });
});
