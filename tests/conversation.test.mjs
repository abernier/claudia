/**
 * Deterministic "simulated conversation" — no model call.
 *
 * We script a multi-turn exchange and run it through the real safety + archiving
 * logic, asserting the machinery behaves: which turns pivot to crisis, and that
 * the session is archived correctly (and a coding session is not). This tests the
 * plumbing around a conversation, not the model's natural-language quality (that
 * belongs in a separate, non-deterministic eval).
 */
import { describe, it, expect } from "vitest";
import { decide } from "../src/safety.mjs";
import { renderMarkdown, isClaudiaSession } from "../src/session.mjs";

const conversation = [
  { user: "hey Claudia, rough week", escalate: false },
  { user: "work has been really stressful lately", escalate: false },
  { user: "honestly I can't go on anymore", escalate: true }, // veiled → fail-safe (model off)
  { user: "sometimes I think about ending it all", escalate: true }, // clear
  { user: "thank you, that actually helped a bit", escalate: false },
];

describe("simulated conversation — safety pipeline (model off)", () => {
  it("pivots on exactly the risky turns", async () => {
    const got = [];
    for (const turn of conversation) {
      const { escalate } = await decide(turn.user, { modelClassifierEnabled: false });
      got.push(escalate);
    }
    expect(got).toEqual(conversation.map((t) => t.escalate));
  });
});

describe("simulated conversation — archiving", () => {
  const claudiaTranscript = [
    { type: "user", message: { role: "user", content: "claudia?" } },
    { type: "user", message: { role: "user", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia\nYour identity is below. Become it fully." } },
    { type: "user", message: { role: "user", content: "j'ai du mal en ce moment" } },
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Je t'écoute. Qu'est-ce qui pèse le plus ?" }] } },
  ]
    .map((o) => JSON.stringify(o))
    .join("\n");

  it("recognises a Claudia session and renders the dialogue", () => {
    expect(isClaudiaSession(claudiaTranscript)).toBe(true);
    const { markdown: md } = renderMarkdown(claudiaTranscript, "2026-07-21");
    expect(md).toContain("**You:**");
    expect(md).toContain("**Claudia:**");
    expect(md).toContain("Je t'écoute");
  });

  it("does NOT treat a coding session as a Claudia conversation", () => {
    const coding = [
      { type: "user", message: { role: "user", content: "refactor the reducer please" } },
      { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "done, updated store.ts" }] } },
    ]
      .map((o) => JSON.stringify(o))
      .join("\n");
    expect(isClaudiaSession(coding)).toBe(false);
  });

  it("does NOT archive a dev session that merely READS the claudia skill (persona text in a tool_result)", () => {
    const devReadingSkill = [
      { type: "user", message: { role: "user", content: "dans ~/.claudia je ne vois pas les fichiers md" } },
      { type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", name: "Read", input: {} }] } },
      { type: "user", message: { role: "user", content: [{ type: "tool_result", content: "Base directory for this skill: /plug/skills/claudia\n# You are Claudia\nYour identity is below." }] } },
    ]
      .map((o) => JSON.stringify(o))
      .join("\n");
    expect(isClaudiaSession(devReadingSkill)).toBe(false);
  });
});
