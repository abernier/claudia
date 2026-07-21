import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  projectDirFor,
  textFromContent,
  isClaudiaSession,
  renderMarkdown,
  resolveTranscriptPath,
} from "../src/session.mjs";

describe("projectDirFor()", () => {
  it("encodes / and . as -", () => {
    expect(projectDirFor("/Users/abernier/claudia-test")).toBe("-Users-abernier-claudia-test");
    expect(projectDirFor("/Users/x/code/.claude/wt")).toBe("-Users-x-code--claude-wt");
  });
});

describe("textFromContent()", () => {
  it("handles a plain string", () => expect(textFromContent("hi")).toBe("hi"));
  it("joins text blocks and drops tool blocks", () => {
    expect(textFromContent([{ type: "text", text: "a" }, { type: "tool_use", name: "x" }, { type: "text", text: "b" }])).toBe("a\n\nb");
  });
  it("returns empty for unknown shapes", () => expect(textFromContent(null)).toBe(""));
});

describe("isClaudiaSession()", () => {
  it("true when the persona signature is present", () => {
    expect(isClaudiaSession('...{"content":"You are Claudia"}...')).toBe(true);
  });
  it("false for an unrelated coding transcript", () => {
    expect(isClaudiaSession("please fix the webpack config")).toBe(false);
  });
});

describe("renderMarkdown()", () => {
  const jsonl = [
    JSON.stringify({ type: "user", message: { role: "user", content: "You are Claudia" } }),
    JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Je suis là." }] } }),
    JSON.stringify({ type: "file-history-snapshot", note: "meta event" }),
  ].join("\n");

  it("renders You/Claudia turns and skips meta events", () => {
    const md = renderMarkdown(jsonl, "2026-07-21");
    expect(md).toContain("# Session — 2026-07-21");
    expect(md).toContain("**You:**");
    expect(md).toContain("**Claudia:**");
    expect(md).toContain("Je suis là.");
    expect(md).not.toContain("file-history-snapshot");
  });

  it("returns null when nothing is renderable", () => {
    expect(renderMarkdown('{"type":"meta"}', "2026-07-21")).toBeNull();
  });
});

describe("resolveTranscriptPath()", () => {
  it("honours an explicit field", () => {
    expect(resolveTranscriptPath({ transcript_path: "/x/y.jsonl" }, "/home")).toBe("/x/y.jsonl");
  });
  it("self-locates from session_id + cwd", () => {
    const p = resolveTranscriptPath({ session_id: "s1", cwd: "/work/space" }, "/home");
    expect(p).toBe(path.join("/home", ".claude", "projects", "-work-space", "s1.jsonl"));
  });
  it("returns null when there is nothing to go on", () => {
    expect(resolveTranscriptPath({}, "/home")).toBeNull();
  });
});
