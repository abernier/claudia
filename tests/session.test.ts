import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  projectDirFor,
  textFromContent,
  partsFromContent,
  isClaudiaSession,
  sessionIdFrom,
  renderMarkdown,
  resolveTranscriptPath,
  sessionDays,
} from "../src/session.mjs";
import type { ContentBlock } from "../src/session.mjs";

// A tiny 1×1 PNG, base64 — enough to assert extraction round-trips the bytes.
const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const imageBlock = (data: string = PNG_1PX, media_type: string = "image/png"): ContentBlock => ({
  type: "image",
  source: { type: "base64", media_type, data },
});
// A document block, as Claude Code writes a PDF that entered the conversation.
const PDF_STUB = "JVBERi0xLjQK";
const documentBlock = (data: string = PDF_STUB, media_type: string = "application/pdf"): ContentBlock => ({
  type: "document",
  source: { type: "base64", media_type, data },
});

const userMsg = (content: string | ContentBlock[]): string =>
  JSON.stringify({ type: "user", message: { role: "user", content } });

describe("projectDirFor()", () => {
  it("encodes / and . as -", () => {
    expect(projectDirFor("/Users/abernier/claudia-test")).toBe("-Users-abernier-claudia-test");
    expect(projectDirFor("/Users/x/code/.claude/wt")).toBe("-Users-x-code--claude-wt");
  });
});

describe("textFromContent()", () => {
  it("handles a plain string", () => expect(textFromContent("hi")).toBe("hi"));
  it("joins text blocks and drops tool blocks", () => {
    // `as`: tool_use carries a `name` field beyond the loose ContentBlock shape — fed on purpose so it gets dropped.
    expect(
      textFromContent([
        { type: "text", text: "a" },
        { type: "tool_use", name: "x" } as ContentBlock,
        { type: "text", text: "b" },
      ]),
    ).toBe("a\n\nb");
  });
  it("returns empty for unknown shapes", () => expect(textFromContent(null)).toBe(""));
});

describe("partsFromContent()", () => {
  it("wraps a plain string as one text part", () => {
    expect(partsFromContent("hi")).toEqual([{ kind: "text", text: "hi" }]);
  });
  it("keeps text and image blocks in order, drops tool_use", () => {
    const parts = partsFromContent([
      { type: "text", text: "voilà " },
      imageBlock(),
      // `as`: tool_use carries a `name` field beyond the loose ContentBlock shape — fed on purpose so it gets dropped.
      { type: "tool_use", name: "x" } as ContentBlock,
    ]);
    expect(parts).toEqual([
      { kind: "text", text: "voilà" },
      { kind: "image", mediaType: "image/png", data: PNG_1PX },
    ]);
  });
  it("surfaces an image nested inside a tool_result but not its text (future-proof)", () => {
    const parts = partsFromContent([
      { type: "tool_result", content: [{ type: "text", text: "ignored" }, imageBlock(PNG_1PX, "image/jpeg")] },
    ]);
    expect(parts).toEqual([{ kind: "image", mediaType: "image/jpeg", data: PNG_1PX }]);
  });
  it("keeps a document block as a file part, alongside text", () => {
    const parts = partsFromContent([{ type: "text", text: "la lettre" }, documentBlock()]);
    expect(parts).toEqual([
      { kind: "text", text: "la lettre" },
      { kind: "file", mediaType: "application/pdf", data: PDF_STUB },
    ]);
  });
  it("surfaces a document nested inside a tool_result", () => {
    const parts = partsFromContent([{ type: "tool_result", content: [documentBlock()] }]);
    expect(parts).toEqual([{ kind: "file", mediaType: "application/pdf", data: PDF_STUB }]);
  });
  it("returns empty for unknown / empty shapes", () => {
    expect(partsFromContent(null)).toEqual([]);
    expect(partsFromContent([{ type: "text", text: "   " }])).toEqual([]);
    // A document block without base64 bytes (a URL source) has nothing to write.
    expect(partsFromContent([{ type: "document", source: { type: "url" } }])).toEqual([]);
  });
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
      // A tool_result whose nested content is a raw *string* — a real transcript shape; the gate must not read inside it.
      { type: "tool_result", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia" },
    ]);
    expect(isClaudiaSession(jsonl)).toBe(false);
  });
  it("false when a different skill is activated (e.g. /grill-me)", () => {
    expect(
      isClaudiaSession(userMsg("Base directory for this skill: /plug/skills/grilling\nRun a grilling session.")),
    ).toBe(false);
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
    JSON.stringify({
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "Je suis là." }] },
    }),
    JSON.stringify({ type: "file-history-snapshot", note: "meta event" }),
  ].join("\n");

  it("renders You/Claudia turns and skips meta events", () => {
    const { markdown, assets } = renderMarkdown(jsonl, "2026-07-21");
    expect(markdown).toContain("# Session — 2026-07-21");
    expect(markdown).toContain("**You:**");
    expect(markdown).toContain("**Claudia:**");
    expect(markdown).toContain("Je suis là.");
    expect(markdown).not.toContain("file-history-snapshot");
    expect(assets).toEqual([]);
  });

  it("returns null markdown and no assets when nothing is renderable", () => {
    expect(renderMarkdown('{"type":"meta"}', "2026-07-21")).toEqual({ markdown: null, assets: [] });
  });

  it("extracts a pasted image, numbers it, and embeds it inline into assetsDir", () => {
    const withImage = userMsg([{ type: "text", text: "regarde ça" }, imageBlock()]);
    const { markdown, assets } = renderMarkdown(withImage, "2026-07-21", { assetsDir: "2026-07-21-abcd1234.assets" });
    expect(assets).toEqual([{ name: "img-001.png", mediaType: "image/png", data: PNG_1PX }]);
    // Text then image, in order, linked relative to the session's own assets dir.
    expect(markdown).toContain("regarde ça");
    expect(markdown).toContain("![img-001](2026-07-21-abcd1234.assets/img-001.png)");
    // (`!`: the toContain assertions above already proved markdown is non-null.)
    expect(markdown!.indexOf("regarde ça")).toBeLessThan(markdown!.indexOf("![img-001]"));
  });

  it("numbers multiple images sequentially across turns and maps the extension", () => {
    const twoTurns = [
      userMsg([imageBlock(PNG_1PX, "image/png")]),
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "vu" }] } }),
      userMsg([imageBlock(PNG_1PX, "image/jpeg")]),
    ].join("\n");
    const { assets } = renderMarkdown(twoTurns, "2026-07-21");
    expect(assets.map((a) => a.name)).toEqual(["img-001.png", "img-002.jpeg"]);
  });

  it("renders an image-only turn (no text) rather than dropping it", () => {
    const { markdown, assets } = renderMarkdown(userMsg([imageBlock()]), "2026-07-21");
    expect(markdown).toContain("**You:**");
    expect(assets).toHaveLength(1);
  });

  it("saves a document as doc-00N.<ext>, linked (not embedded) into assetsDir", () => {
    const withPdf = userMsg([{ type: "text", text: "le compte-rendu" }, documentBlock()]);
    const { markdown, assets } = renderMarkdown(withPdf, "2026-07-21", { assetsDir: "2026-07-21-abcd1234.assets" });
    expect(assets).toEqual([{ name: "doc-001.pdf", mediaType: "application/pdf", data: PDF_STUB }]);
    // A plain link, not an image embed — no reader can inline a PDF.
    expect(markdown).toContain("[doc-001.pdf](2026-07-21-abcd1234.assets/doc-001.pdf)");
    expect(markdown).not.toContain("![doc-001");
  });

  it("counts images and documents on separate counters, in one assets list", () => {
    const mixed = userMsg([imageBlock(), documentBlock(), imageBlock(PNG_1PX, "image/jpeg"), documentBlock()]);
    const { assets } = renderMarkdown(mixed, "2026-07-21");
    expect(assets.map((a) => a.name)).toEqual(["img-001.png", "doc-001.pdf", "img-002.jpeg", "doc-002.pdf"]);
  });

  it("falls back to .bin for a media type it does not know", () => {
    const odt = userMsg([documentBlock(PDF_STUB, "application/vnd.oasis.opendocument.text")]);
    const { assets } = renderMarkdown(odt, "2026-07-21");
    expect(assets.map((a) => a.name)).toEqual(["doc-001.bin"]);
  });
});

describe("sessionDays()", () => {
  // Envelope form, as the real JSONL writes it: the instant sits on the envelope.
  const at = (type: string, timestamp: string) =>
    JSON.stringify({ type, timestamp, message: { role: type, content: "hi" } });
  const PARIS = "Europe/Paris"; // UTC+2 in July

  it("returns the local days a conversation touched, ascending and deduplicated", () => {
    const jsonl = [at("user", "2026-07-21T09:00:00Z"), at("assistant", "2026-07-21T09:00:05Z")].join("\n");
    expect(sessionDays(jsonl, PARIS)).toEqual(["2026-07-21"]);
  });

  it("yields both days when the conversation crosses LOCAL midnight", () => {
    // 22:30Z and 23:30Z are 00:30 and 01:30 the next day in Paris.
    const jsonl = [at("user", "2026-07-21T20:00:00Z"), at("assistant", "2026-07-21T22:30:00Z")].join("\n");
    expect(sessionDays(jsonl, PARIS)).toEqual(["2026-07-21", "2026-07-22"]);
  });

  it("is zone-correct — the same instant is a different day elsewhere", () => {
    const jsonl = at("user", "2026-07-21T21:06:33.797Z");
    expect(sessionDays(jsonl, PARIS)).toEqual(["2026-07-21"]);
    expect(sessionDays(jsonl, "Pacific/Auckland")).toEqual(["2026-07-22"]);
  });

  it("counts only the turns renderMarkdown renders", () => {
    // An attachment stamped on a later day must not invent a day of conversation.
    const jsonl = [at("user", "2026-07-21T09:00:00Z"), at("attachment", "2026-07-25T09:00:00Z")].join("\n");
    expect(sessionDays(jsonl, PARIS)).toEqual(["2026-07-21"]);
  });

  it("skips what it cannot date, and yields [] when nothing is datable", () => {
    const jsonl = [
      "not json",
      at("user", "not-a-date"),
      JSON.stringify({ type: "user", message: { role: "user" } }),
    ].join("\n");
    expect(sessionDays(jsonl, PARIS)).toEqual([]);
    expect(sessionDays("", PARIS)).toEqual([]);
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
  it("tolerates a null / undefined payload, symmetric with sessionIdFrom()", () => {
    expect(resolveTranscriptPath(null, "/home/x")).toBeNull();
    expect(resolveTranscriptPath(undefined, "/home/x")).toBeNull();
  });
});
