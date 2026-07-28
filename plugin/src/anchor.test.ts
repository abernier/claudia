import { describe, it, expect } from "vitest";
import { ANCHOR_SOURCES, shouldAnchor, renderAnchorContext } from "./anchor.mjs";

// The gating (resume/compact anchor, startup and non-Claudia sessions do not)
// is pinned at the process seam: ../scripts/session-anchor.test.ts. Only the
// edges the seam does not exercise stay here.
describe("shouldAnchor()", () => {
  it("leaves a deliberate clear and an unknown/absent source alone", () => {
    expect(shouldAnchor("clear", true)).toBe(false);
    expect(shouldAnchor(undefined, true)).toBe(false);
    expect(ANCHOR_SOURCES.has("startup")).toBe(false);
  });
});

describe("renderAnchorContext()", () => {
  it("re-asserts identity and forbids a restart (compact)", () => {
    const note: string = renderAnchorContext("compact");
    expect(note).toContain("compacted");
    expect(note).toContain("You are Claudia");
    expect(note).toContain("CONTINUING");
    expect(note).toContain("do NOT restart");
    expect(note).toContain("not the person");
  });
  it("names a resume distinctly from a compaction", () => {
    const note: string = renderAnchorContext("resume");
    expect(note).toContain("has been resumed");
    expect(note).not.toContain("compacted");
  });
});
