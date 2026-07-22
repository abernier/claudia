import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  projectDirFor,
  textFromContent,
  isClaudiaSession,
  sessionIdFrom,
  renderMarkdown,
  resolveTranscriptPath,
} from "../src/session.mjs";

const userMsg = (content) => JSON.stringify({ type: "user", message: { role: "user", content } });

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
  it("true when the claudia skill was activated (loader preamble as a user message)", () => {
    const jsonl = [
      userMsg("claudia?"),
      userMsg("Base directory for this skill: /plug/skills/claudia\n# You are Claudia\nYour identity is below."),
    ].join("\n");
    expect(isClaudiaSession(jsonl)).toBe(true);
  });
  it("false when the persona text only appears inside a tool_result (a dev session reading the file)", () => {
    const jsonl = userMsg([
      { type: "tool_result", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" },
    ]);
    expect(isClaudiaSession(jsonl)).toBe(false);
  });
  it("false when a different skill is activated (e.g. /grill-me)", () => {
    expect(isClaudiaSession(userMsg("Base directory for this skill: /plug/skills/grilling\nRun a grilling session."))).toBe(false);
  });
  it("false for an unrelated coding transcript", () => {
    expect(isClaudiaSession(userMsg("please fix the webpack config"))).toBe(false);
    expect(isClaudiaSession("not even jsonl")).toBe(false);
  });
});

describe("sessionIdFrom()", () => {
  it("prefers an explicit session_id", () => {
    expect(sessionIdFrom({ session_id: "abc-123", transcript_path: "/x/other.jsonl" })).toBe("abc-123");
  });
  it("falls back to the transcript path basename", () => {
    expect(sessionIdFrom({ transcript_path: "/home/.claude/projects/p/def-456.jsonl" })).toBe("def-456");
  });
  it("returns null when there is nothing to key on", () => {
    expect(sessionIdFrom({})).toBeNull();
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
