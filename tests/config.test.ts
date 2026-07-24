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
  serializeConfig,
  withSetting,
} from "../src/config.mjs";

describe("the declared settings", () => {
  it("ships emoji OFF by default — the whole point of ADR-0028", () => {
    expect(SETTINGS.emoji.default).toBe(false);
    expect(defaults().emoji).toBe(false);
  });

  it("keeps the two pre-existing opt-outs default-ON (ADR-0004, ADR-0019)", () => {
    expect(defaults()).toEqual({
      saveTranscripts: true,
      dashboard: true,
      emoji: false,
      language: "fr",
      verbose: false,
      backups: true,
    });
  });

  it("ships backups ON — a safety net you have to remember to switch on is not one (ADR-0032)", () => {
    expect(SETTINGS.backups.default).toBe(true);
  });

  it("ships verbose OFF — the machinery stays invisible unless the person asks", () => {
    expect(SETTINGS.verbose.default).toBe(false);
  });

  it("ships language as a CLOSED enum defaulting to fr — the behaviour every earlier vault had (ADR-0029)", () => {
    expect(SETTINGS.language.default).toBe("fr");
    expect(SETTINGS.language.values).toEqual(["fr", "en"]);
  });

  it("declares no key that could touch the safety floor", () => {
    // Settings sit above the floor, like immersion. A key named for safety, crisis
    // or the hook would be one that softens a never/always rule (ADR-0001).
    for (const key of SETTING_KEYS) expect(/safety|crisis|floor|hook|disclaim/i.test(key)).toBe(false);
  });

  it("exposes every declared key, with a person-facing line for /config", () => {
    expect([...SETTING_KEYS].sort()).toEqual([
      "backups",
      "dashboard",
      "emoji",
      "language",
      "saveTranscripts",
      "verbose",
    ]);
    for (const key of SETTING_KEYS) expect(SETTINGS[key].what.length).toBeGreaterThan(20);
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

describe("writing a setting", () => {
  it("preserves every other key, including ones this version doesn't know", () => {
    const obj = readObject('{"dashboard": false, "futureKey": "x"}');
    expect(withSetting(obj, "emoji", true)).toEqual({ dashboard: false, futureKey: "x", emoji: true });
  });

  it("starts from nothing when there is no file", () => {
    expect(withSetting(null, "emoji", true)).toEqual({ emoji: true });
  });

  it("serializes as a file a person can open and edit", () => {
    const text = serializeConfig({ emoji: true });
    expect(text).toBe('{\n  "emoji": true\n}\n');
    expect(parseConfig(text).emoji).toBe(true); // round-trips
  });
});

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

describe("renderSettings()", () => {
  const listing = renderSettings({
    saveTranscripts: true,
    dashboard: false,
    emoji: true,
    language: "en",
    verbose: false,
    backups: true,
  });

  it("shows every declared setting, its value and its default", () => {
    for (const key of SETTING_KEYS) expect(listing).toContain(key);
    expect(listing).toMatch(/emoji\s+on\s+\(default off\)/);
    expect(listing).toMatch(/dashboard\s+off\s+\(default on\)/);
    expect(listing).toMatch(/language\s+en\s+\(default fr\)/); // enum values shown verbatim, not on/off
  });

  it("hides nothing that happens to sit at its default", () => {
    expect(renderSettings(defaults()).split("\n")).toHaveLength(SETTING_KEYS.length);
  });
});
