import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileFloor,
  heuristic,
  decide,
  renderConduct,
  NO_RULES,
  type ClassifierResult,
  type FloorRule,
} from "../src/safety.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The behavioural suite runs against the SHIPPED domain floor, not a fixture: these
// assertions are the regression guard on the crisis path, so they must exercise the
// patterns the hook actually loads.
const RULES: FloorRule[] = compileFloor(
  JSON.parse(readFileSync(path.join(root, "domains/psychotherapy/docs/safety/floor.json"), "utf8")),
);

/** The one site-1 rule the shipped domain declares. Absent it, the suite is testing nothing. */
const RULE: FloorRule = (() => {
  const r = RULES[0];
  if (!r) throw new Error("docs/safety/floor.json declares no rule — the crisis path would be silent");
  return r;
})();

describe("heuristic risk bands", () => {
  it("flags explicit suicidal ideation as clear", () => {
    expect(heuristic("I want to kill myself", RULES).band).toBe("clear");
    expect(heuristic("I don't want to live anymore", RULES).band).toBe("clear");
    expect(heuristic("I keep thinking about ending it all", RULES).band).toBe("clear");
  });

  it("flags multilingual clear risk", () => {
    expect(heuristic("je veux en finir ce soir", RULES).band).toBe("clear");
    expect(heuristic("quiero matarme", RULES).band).toBe("clear");
  });

  it("flags veiled distress as uncertain", () => {
    expect(heuristic("I just want the pain to stop", RULES).band).toBe("uncertain");
    expect(heuristic("à quoi bon, je n'en peux plus", RULES).band).toBe("uncertain");
  });

  it("leaves benign text safe", () => {
    expect(heuristic("had a lovely coffee this morning", RULES).band).toBe("safe");
    expect(heuristic("", RULES).band).toBe("safe");
    expect(heuristic("let's kill the failing process", RULES).band).toBe("safe"); // no false positive
  });

  it("names the rule that matched, so an escalation always has a route", () => {
    const h = heuristic("I want to kill myself", RULES);
    expect(h.rule?.owner).toBe("psychotherapy");
    expect(h.rule?.id).toBe("F7a");
  });
});

// The empty composition. The machine is not absent and not permissive: it runs, and
// matches nothing, because nobody supplied it with a criterion.
describe("the empty floor — present and idle", () => {
  it("matches nothing, not even text that would clearly fire a declared rule", () => {
    expect(heuristic("I want to kill myself").band).toBe("safe");
    expect(heuristic("je veux en finir ce soir", NO_RULES).band).toBe("safe");
    expect(heuristic("I just want the pain to stop", NO_RULES).band).toBe("safe");
  });

  it("never escalates, and never reaches the fail-safe — there is nothing to fail toward", async () => {
    const r = await decide("I want to kill myself", { rules: NO_RULES, modelClassifierEnabled: true });
    expect(r.escalate).toBe(false);
    expect(r.interrupt).toBe(null);
  });
});

describe("decide()", () => {
  it("escalates clear risk WITHOUT calling the model", async () => {
    let called = false;
    const r = await decide("kill myself", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => (
        (called = true),
        { ok: true, verdict: { risk: "none" } }
      ),
    });
    expect(r.escalate).toBe(true);
    expect(called).toBe(false);
  });

  it("stays silent on benign even with the model enabled", async () => {
    const r = await decide("nice weather today", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "imminent" } }),
    });
    expect(r.escalate).toBe(false);
  });

  it("uncertain + model OFF → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", { rules: RULES, modelClassifierEnabled: false });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("classifier off");
  });

  it("uncertain + model says elevated → escalate", async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({
        ok: true,
        verdict: { risk: "elevated", category: "suicide" },
      }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("model:elevated");
  });

  it("uncertain + model says none → silent", async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "none" } }),
    });
    expect(r.escalate).toBe(false);
  });

  it("uncertain + model UNAVAILABLE → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
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
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({
        ok: true,
        verdict: { risk: "IMMINENT", category: "suicide" },
      }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("model:imminent:suicide");
  });

  it('uncertain + model says "Elevated " (case + whitespace) → escalates', async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "Elevated " } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("model:elevated:?");
  });

  it('uncertain + model says "NONE" (uppercase) → silent, it normalizes to a recognized clear verdict', async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "NONE" } }),
    });
    expect(r.escalate).toBe(false);
    expect(r.reason).toBe(null);
  });

  it("uncertain + unrecognized verdict value → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: { risk: "unknown" } }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("failing safe");
  });

  it("uncertain + empty verdict object → fail-safe escalate", async () => {
    const r = await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => ({ ok: true, verdict: {} }),
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toContain("failing safe");
  });

  it("stage 2 runs on the DOMAIN's prompt, with the turn interpolated", async () => {
    let seen = "";
    await decide("I can't go on anymore", {
      rules: RULES,
      modelClassifierEnabled: true,
      classifyWithModel: async (p: string): Promise<ClassifierResult> => (
        (seen = p),
        { ok: true, verdict: { risk: "none" } }
      ),
    });
    expect(seen).toContain("I can't go on anymore");
    expect(seen).toBe(RULE.classifierPrompt?.replace("{text}", "I can't go on anymore"));
  });

  it("a declared rule with no second stage fails safe rather than running one", async () => {
    const mute: FloorRule[] = compileFloor({
      owner: "d",
      rules: [{ id: "r", criteria: { uncertain: [{ name: "veiled", pattern: "hmm", flags: "i" }] }, conduct: "c" }],
    });
    let called = false;
    const r = await decide("hmm", {
      rules: mute,
      modelClassifierEnabled: true,
      classifyWithModel: async (): Promise<ClassifierResult> => (
        (called = true),
        { ok: true, verdict: { risk: "none" } }
      ),
    });
    expect(called).toBe(false);
    expect(r.escalate).toBe(true);
  });
});

// The chassis routes; it does not speak. What an interrupt carries is a pointer into
// the owning domain, plus that domain's conduct as an opaque payload.
describe("the interrupt is a pointer", () => {
  it("names the owner and the rule, and carries the domain's conduct verbatim", async () => {
    const r = await decide("kill myself", { rules: RULES });
    expect(r.interrupt?.owner).toBe("psychotherapy");
    expect(r.interrupt?.rule).toBe("F7a");
    expect(r.interrupt?.conduct).toBe(RULE.conduct);
  });

  it("renderConduct fills the reason into the domain's own words", async () => {
    const r = await decide("kill myself", { rules: RULES });
    const note = renderConduct(r.interrupt, r.reason ?? "");
    expect(note).toContain("suicide");
    expect(note).toContain("crisis");
    expect(note).toContain("docs/safety/crisis-protocol.md");
    expect(note).toContain("not the person");
    expect(note).not.toContain("{reason}");
  });

  it("a domain that declared no conduct leaves the chassis with nothing to say", () => {
    expect(renderConduct({ owner: "d", rule: "r", conduct: null }, "why")).toBe(null);
    expect(renderConduct(null, "why")).toBe(null);
  });
});

// The whole point of the refactor: the machine holds no criterion of its own, so the
// shipped floor must be readable, complete, and the only place the patterns live.
describe("the shipped domain floor is well-formed", () => {
  it("declares one site-1 rule, owned by the domain, with criteria as data", () => {
    const spec = JSON.parse(readFileSync(path.join(root, "domains/psychotherapy/docs/safety/floor.json"), "utf8"));
    expect(spec.owner).toBe("psychotherapy");
    expect(spec.rules).toHaveLength(1);
    const rule = spec.rules[0];
    expect(rule.site).toBe(1);
    expect(rule.polarity).toBe("obligation");
    expect(rule.conditionality).toBe("unconditional");
    expect(rule.criteria.clear.length).toBeGreaterThan(0);
    expect(rule.criteria.uncertain.length).toBeGreaterThan(0);
    expect(rule.conduct).toBeTruthy();
  });

  it("compiles without throwing — a malformed pattern must fail here, never on a turn", () => {
    expect(() =>
      compileFloor(JSON.parse(readFileSync(path.join(root, "domains/psychotherapy/docs/safety/floor.json"), "utf8"))),
    ).not.toThrow();
  });
});
