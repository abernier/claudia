import { describe, it, expect } from "vitest";
import { sessionIndex, pendingSessions } from "../src/pending.mjs";

describe("sessionIndex()", () => {
  it("folds filenames into per-stem artefact records", () => {
    const idx = sessionIndex([
      "2026-07-21-abc.transcript.md",
      "2026-07-21-abc.summary.md",
      "2026-07-22-def.transcript.md",
      "2026-07-22-def.pending-summary",
    ]);
    expect(idx.get("2026-07-21-abc")).toEqual({ transcript: true, summary: true, pending: false });
    expect(idx.get("2026-07-22-def")).toEqual({ transcript: true, summary: false, pending: true });
  });
  it("treats a .jsonl transcript the same as a .md one", () => {
    const idx = sessionIndex(["2026-07-20-xyz.transcript.jsonl"]);
    expect(idx.get("2026-07-20-xyz")).toEqual({ transcript: true, summary: false, pending: false });
  });
  it("still keys legacy date-only stems", () => {
    const idx = sessionIndex(["2026-07-21.transcript.md", "2026-07-21.summary.md"]);
    expect(idx.get("2026-07-21")).toEqual({ transcript: true, summary: true, pending: false });
  });
  it("ignores files that are not session artefacts", () => {
    const idx = sessionIndex(["teachings", "2026-07-21-thought-record.md", ".DS_Store", "config.json"]);
    expect(idx.size).toBe(0);
  });
});

describe("pendingSessions()", () => {
  it("flags any session carrying a pending marker (the dirty flag)", () => {
    expect(pendingSessions(["2026-07-22-def.transcript.md", "2026-07-22-def.pending-summary"])).toEqual([
      "2026-07-22-def",
    ]);
  });
  it("does not flag a distilled, untouched session (no marker)", () => {
    expect(pendingSessions(["2026-07-21-abc.transcript.md", "2026-07-21-abc.summary.md"])).toEqual([]);
  });
  it("re-flags a distilled session that was resumed (summary present AND marker back)", () => {
    expect(
      pendingSessions(["2026-07-21-abc.transcript.md", "2026-07-21-abc.summary.md", "2026-07-21-abc.pending-summary"])
    ).toEqual(["2026-07-21-abc"]);
  });
  it("returns oldest-first so a caller can distill chronologically", () => {
    const files = [
      "2026-07-22-c.transcript.md",
      "2026-07-22-c.pending-summary",
      "2026-07-20-a.transcript.md",
      "2026-07-20-a.pending-summary",
      "2026-07-21-b.transcript.md",
      "2026-07-21-b.pending-summary",
    ];
    expect(pendingSessions(files)).toEqual(["2026-07-20-a", "2026-07-21-b", "2026-07-22-c"]);
  });
  it("is empty when there is nothing to do", () => {
    expect(pendingSessions([])).toEqual([]);
    expect(pendingSessions(["2026-07-21-abc.transcript.md"])).toEqual([]);
  });
});
