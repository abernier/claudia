import { describe, it, expect } from "vitest";
import { heuristic, decide, escalationContext, type ClassifierResult } from "../src/safety.mjs";

describe("heuristic risk bands", () => {
  it("flags explicit suicidal ideation as clear", () => {
    expect(heuristic("I want to kill myself").band).toBe("clear");
    expect(heuristic("I don't want to live anymore").band).toBe("clear");
    expect(heuristic("I keep thinking about ending it all").band).toBe("clear");
  });

  it("flags multilingual clear risk", () => {
    expect(heuristic("je veux en finir ce soir").band).toBe("clear");
    expect(heuristic("quiero matarme").band).toBe("clear");
  });

  it("flags veiled distress as uncertain", () => {
    expect(heuristic("I just want the pain to stop").band).toBe("uncertain");
    expect(heuristic("à quoi bon, je n'en peux plus").band).toBe("uncertain");
  });

  it("leaves benign text safe", () => {
    expect(heuristic("had a lovely coffee this morning").band).toBe("safe");
    expect(heuristic("").band).toBe("safe");
    expect(heuristic("let's kill the failing process").band).toBe("safe"); // no false positive
  });
});

describe("decide()", () => {
  it("escalates clear risk WITHOUT calling the model", async () => {
    let called = false;
    const r = await decide("kill myself", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ((called = true), { ok: true, verdict: { risk: "none" } }),
    });
    expect(r.escalate).toBe(true);
    expect(called).toBe(false);
  });

  it("stays silent on benign even with the model enabled", async () => {
    const r = await decide("nice weather today", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "imminent" } }),
    });
    expect(r.escalate).toBe(false);
  });

  it("uncertain + model OFF → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", { modelClassifierEnabled: false });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("classifier off");
  });

  it("uncertain + model says elevated → escalate", async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "elevated", category: "suicide" } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("model:elevated");
  });

  it("uncertain + model says none → silent", async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "none" } }),
    });
    expect(r.escalate).toBe(false);
  });

  it("uncertain + model UNAVAILABLE → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: false }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("failing safe");
  });

  // Model output is untrusted text — the verdict check must normalize case and
  // whitespace, and anything it does not recognize must fail SAFE (escalate),
  // never silently read as "no risk".
  it('uncertain + model says "IMMINENT" (uppercase) → escalates', async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "IMMINENT", category: "suicide" } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("model:imminent:suicide");
  });

  it('uncertain + model says "Elevated " (case + whitespace) → escalates', async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "Elevated " } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("model:elevated:?");
  });

  it('uncertain + model says "NONE" (uppercase) → silent, it normalizes to a recognized clear verdict', async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "NONE" } }),
    });
    expect(r.escalate).toBe(false);
    expect(r.reason).toBe(null);
  });

  it("uncertain + unrecognized verdict value → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "unknown" } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("failing safe");
  });

  it("uncertain + empty verdict object → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: {} }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("failing safe");
  });
});

describe("escalationContext()", () => {
  it("names the crisis skill and marks itself as a safety-layer note", () => {
    const c = escalationContext("suicide");
    expect(c).toContain("crisis");
    expect(c).toContain("docs/safety/crisis-protocol.md");
    expect(c).toContain("not the person");
  });
});
