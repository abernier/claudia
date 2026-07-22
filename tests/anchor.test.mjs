import { describe, it, expect } from "vitest";
import { ANCHOR_SOURCES, shouldAnchor, renderAnchorContext } from "../src/anchor.mjs";

describe("shouldAnchor()", () => {
  it("anchors a Claudia session that was resumed or compacted", () => {
    expect(shouldAnchor("resume", true)).toBe(true);
    expect(shouldAnchor("compact", true)).toBe(true);
  });
  it("leaves a fresh startup or a deliberate clear alone", () => {
    expect(shouldAnchor("startup", true)).toBe(false);
    expect(shouldAnchor("clear", true)).toBe(false);
  });
  it("never anchors a non-Claudia (e.g. coding) session", () => {
    expect(shouldAnchor("resume", false)).toBe(false);
    expect(shouldAnchor("compact", false)).toBe(false);
  });
  it("ignores an unknown/absent source", () => {
    expect(shouldAnchor(undefined, true)).toBe(false);
    expect(ANCHOR_SOURCES.has("startup")).toBe(false);
  });
});

describe("renderAnchorContext()", () => {
  it("re-asserts identity and forbids a restart (compact)", () => {
    const note = renderAnchorContext("compact");
    expect(note).toContain("compacted");
    expect(note).toContain("You are Claudia");
    expect(note).toContain("CONTINUING");
    expect(note).toContain("do NOT restart");
    expect(note).toContain("not the person");
  });
  it("names a resume distinctly from a compaction", () => {
    const note = renderAnchorContext("resume");
    expect(note).toContain("has been resumed");
    expect(note).not.toContain("compacted");
  });
});
