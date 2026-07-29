/**
 * The person's settings (ADR-0028) — the file is hand-editable, so every path
 * through it has to degrade to the shipped behaviour rather than to an error.
 */
import { describe, it, expect } from "vitest";
import {
  coerceBoolean,
  coerceSetting,
  defaults,
  isSettingKey,
  parseConfig,
  readObject,
  renderSettings,
  SETTINGS,
  SETTING_KEYS,
  showValue,
} from "./config.mjs";

describe("the declared settings", () => {
  it("declares exactly these keys with exactly these defaults (ADR-0028)", () => {
    // THE canonical pin of the contract, and the only one: `defaults()` is derived
    // from SETTINGS, so this single assertion fixes the key set and every shipped
    // default at once — adding a setting is a one-line change here and nowhere
    // else. Each value carries a decision: the two pre-existing opt-outs stay ON
    // (ADR-0004, ADR-0019); backups stay ON, since a safety net you have to
    // remember to switch on is not one (ADR-0032); emoji ships OFF, the whole
    // point of ADR-0028 and the fail-safe direction, since the setting only ever
    // loosens the persona's rule; verbose ships OFF, so the machinery stays
    // invisible unless the person asks; language defaults to fr, the behaviour
    // every earlier vault had (ADR-0029).
    expect(defaults()).toEqual({
      saveTranscripts: true,
      dashboard: true,
      emoji: false,
      language: "fr",
      verbose: false,
      backups: true,
    });
  });

  it("declares no key that could touch the safety floor", () => {
    // Settings sit above the floor, like immersion. A key named for safety, crisis
    // or the hook would be one that softens a never/always rule (ADR-0001).
    for (const key of SETTING_KEYS) expect(/safety|crisis|floor|hook|disclaim/i.test(key)).toBe(false);
  });

  it("gives every declared key a person-facing line for /config", () => {
    for (const key of SETTING_KEYS) expect(SETTINGS[key].what.length, key).toBeGreaterThan(20);
  });

  it("recognises a real key and refuses a typo", () => {
    expect(isSettingKey("emoji")).toBe(true);
    expect(isSettingKey("emojis")).toBe(false);
    expect(isSettingKey("toString")).toBe(false); // inherited props are not settings
  });
});

describe("parseConfig() is total", () => {
  it("resolves an absent file to the defaults", () => {
    expect(parseConfig(null)).toEqual(defaults());
    expect(parseConfig(undefined)).toEqual(defaults());
    expect(parseConfig("")).toEqual(defaults());
  });

  it("resolves a hand-broken file to the defaults rather than throwing", () => {
    // The failure that must never reach a hook: a stray comma at 2am.
    expect(parseConfig('{ "emoji": true, }')).toEqual(defaults());
    expect(parseConfig("not json at all")).toEqual(defaults());
    expect(parseConfig("[]")).toEqual(defaults());
    expect(parseConfig("null")).toEqual(defaults());
  });

  it("applies a declared boolean", () => {
    expect(parseConfig('{"emoji": true}').emoji).toBe(true);
    expect(parseConfig('{"saveTranscripts": false}').saveTranscripts).toBe(false);
    expect(parseConfig('{"dashboard": false}').dashboard).toBe(false);
  });

  it("ignores a wrong-typed value — the default, not a truthy string", () => {
    // `"false"` is truthy; acting on it would turn an opt-out into an opt-in.
    expect(parseConfig('{"saveTranscripts": "false"}').saveTranscripts).toBe(true);
    expect(parseConfig('{"emoji": "true"}').emoji).toBe(false);
    expect(parseConfig('{"emoji": 1}').emoji).toBe(false);
  });

  it("applies a declared enum value, and degrades anything outside the set to the default (ADR-0029)", () => {
    expect(parseConfig('{"language": "en"}').language).toBe("en");
    expect(parseConfig('{"language": "de"}').language).toBe("fr"); // not shipped → old behaviour
    expect(parseConfig('{"language": true}').language).toBe("fr");
    expect(parseConfig('{"language": "write like a pirate"}').language).toBe("fr"); // never free text
  });

  it("leaves an unknown key out of the resolved view", () => {
    const cfg = parseConfig('{"emoji": true, "somethingElse": 42}');
    expect(cfg).toEqual({ ...defaults(), emoji: true });
  });

  it("hands back a fresh object each time (no shared mutable default)", () => {
    const a = parseConfig(null);
    a.emoji = true;
    expect(parseConfig(null).emoji).toBe(false);
  });
});

describe("readObject()", () => {
  it("tells 'no settings yet' from 'the person broke the JSON'", () => {
    expect(readObject(null)).toBeNull();
    expect(readObject("   ")).toBeNull();
    expect(readObject("{oops")).toBeNull();
    expect(readObject('{"emoji": true}')).toEqual({ emoji: true });
  });

  it("keeps unknown keys visible — they are the write path's problem to preserve", () => {
    expect(readObject('{"futureKey": "x"}')).toEqual({ futureKey: "x" });
  });
});

// The write path (withSetting + serializeConfig, preservation of unknown keys,
// starting from no file) is pinned on disk at the seam: ../scripts/config.test.ts.

describe("coerceBoolean()", () => {
  it("reads a switch the way a person types one", () => {
    for (const on of ["true", "on", "yes", "Y", " 1 "]) expect(coerceBoolean(on)).toBe(true);
    for (const off of ["false", "off", "no", "N", "0"]) expect(coerceBoolean(off)).toBe(false);
  });

  it("returns null on anything ambiguous, so the caller refuses instead of guessing", () => {
    for (const bad of ["maybe", "", null, undefined, "onn"]) expect(coerceBoolean(bad)).toBeNull();
  });
});

describe("coerceSetting()", () => {
  it("routes booleans through coerceBoolean", () => {
    expect(coerceSetting("emoji", "on")).toBe(true);
    expect(coerceSetting("emoji", "nope")).toBeNull();
  });

  it("accepts an enum value the way a person types it, refuses anything outside the set", () => {
    expect(coerceSetting("language", "en")).toBe("en");
    expect(coerceSetting("language", " EN ")).toBe("en");
    for (const bad of ["de", "english", "", null]) expect(coerceSetting("language", bad)).toBeNull();
  });
});

describe("showValue()", () => {
  it("shows a switch as on/off and an enum value verbatim (ADR-0029)", () => {
    // The rendering convention itself, pinned here once — so the listing below can
    // be derived from it without the two agreeing by construction.
    expect(showValue(true)).toBe("on");
    expect(showValue(false)).toBe("off");
    expect(showValue("en")).toBe("en");
  });
});

describe("renderSettings()", () => {
  it("shows every declared setting, its current value and its shipped default", () => {
    // Expected line by line from the table itself, so adding a setting needs no
    // edit here: one line per declared key, in declared order, each value as
    // showValue() renders it.
    const cfg = { ...defaults(), dashboard: false, emoji: true, language: "en" as const };
    const lines = renderSettings(cfg).split("\n");
    expect(lines, "a view hides nothing, not even a value sitting at its default").toHaveLength(SETTING_KEYS.length);
    for (const [i, key] of SETTING_KEYS.entries())
      expect(lines[i], key).toMatch(
        new RegExp(`^${key}\\s+${showValue(cfg[key])}\\s+\\(default ${showValue(SETTINGS[key].default)}\\)\\s+\\S`),
      );
  });
});
