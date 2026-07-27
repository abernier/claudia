/**
 * Claudia — the person's settings, `~/.claudia/config.json`
 * (pure, importable, testable). No filesystem or process side effects live here.
 *
 * The file predates this module: `saveTranscripts` (ADR-0004) and `dashboard`
 * (ADR-0019) were each read where they were needed, with an inline `JSON.parse` and
 * a default that existed only as an `=== false` check. Nothing declared what keys
 * exist, so nothing could *show* the person their own settings — and no setting had
 * ever reached the persona, only scripts. `emoji` is the first that does (ADR-0028).
 *
 * The contract, in one place:
 * - **Declared keys with closed value sets, never free text.** Booleans, plus the
 *   `language` enum (ADR-0029). No free-text field: an arbitrary instruction handed
 *   to the persona is a way through the safety floor, and the floor is not
 *   configurable (ADR-0001). A closed enum consumed by deterministic scripts cannot
 *   carry an instruction.
 * - **Absent, unreadable, or wrong-typed → the default.** A person hand-edits this
 *   file; a typo must degrade to the shipped behaviour, never to an error.
 * - **Unknown keys are preserved on write** — a key from a newer version (or one the
 *   person added) survives a `/config` change instead of being silently dropped.
 */

/**
 * A declared setting: what it defaults to, and what it does in the person's terms.
 * A setting with a `values` list is an enum (closed set); without one it is a boolean.
 *
 * @typedef {object} Setting
 * @property {boolean | string} default - the shipped behaviour when the key is absent
 * @property {readonly string[]} [values] - enum settings: the closed set of accepted values
 * @property {string} what - one line, person-facing (used by `/config`)
 */

/**
 * The names of the settings that exist. Anything else in the file is data we carry
 * but do not act on.
 *
 * @typedef {"saveTranscripts" | "dashboard" | "emoji" | "language" | "verbose" | "backups"} SettingKey
 */

/**
 * The languages the deterministic mirror can speak (ADR-0029) — exactly the set of
 * shipped string tables in `src/dashboard.mjs`. Adding one is a code change, not a
 * config value.
 *
 * @typedef {"fr" | "en"} MirrorLanguage
 */

/**
 * A fully-resolved configuration: every declared key, defaults filled in. This is
 * what readers consume — `cfg.emoji` is always a boolean, never `undefined`.
 *
 * @typedef {object} ClaudiaConfig
 * @property {boolean} saveTranscripts
 * @property {boolean} dashboard
 * @property {boolean} emoji
 * @property {MirrorLanguage} language
 * @property {boolean} verbose
 * @property {boolean} backups
 */

/**
 * The whole settings surface. Adding a key here is the only edit needed: `/config`
 * lists it, `parseConfig` resolves it, and the tests assert the declared default.
 *
 * @type {Record<SettingKey, Setting>}
 */
export const SETTINGS = {
  saveTranscripts: {
    default: true,
    what: "Keep a verbatim archive of each conversation under ~/.claudia/sessions/ (local only).",
  },
  dashboard: {
    default: true,
    what: "Maintain the bird's-eye mirror ~/.claudia/dashboard.md, opened with /dashboard.",
  },
  emoji: {
    default: false,
    what: "Let Claudia use emoji in what she writes. Off by default — she writes in plain words.",
  },
  language: {
    default: "fr",
    values: ["fr", "en"],
    what: "The language of what the scripts write for you (the dashboard mirror): fr or en. Claudia herself always speaks your language.",
  },
  verbose: {
    default: false,
    what: "Let Claudia narrate her machinery (the scripts she runs, the notes she reads) as she works. Off by default — the workings stay invisible.",
  },
  backups: {
    default: true,
    what: "Keep a rotating archive of your notes under ~/.claudia-backups/ (local only), so a bad write or a mistaken delete is recoverable. /forget destroys it too.",
  },
};

/**
 * Declared keys, in display order. Derived from {@link SETTINGS} so the two can
 * never disagree; the cast is the one place `Object.keys`' `string[]` is narrowed.
 *
 * @type {SettingKey[]}
 */
export const SETTING_KEYS = /** @type {SettingKey[]} */ (Object.keys(SETTINGS));

/**
 * A fresh configuration with every shipped default. Callers get their own object,
 * so mutating a resolved config can never leak into the next read.
 *
 * @returns {ClaudiaConfig}
 */
export function defaults() {
  const cfg = /** @type {ClaudiaConfig} */ ({});
  // The cast: each declared default matches its key's type by construction (the tests assert it).
  for (const key of SETTING_KEYS) /** @type {Record<string, unknown>} */ (cfg)[key] = SETTINGS[key].default;
  return cfg;
}

/**
 * Whether `name` is a setting Claudia acts on. Used by `/config` to refuse a typo
 * loudly rather than write a key nothing will ever read.
 *
 * @param {string} name
 * @returns {name is SettingKey}
 */
export function isSettingKey(name) {
  return Object.prototype.hasOwnProperty.call(SETTINGS, name);
}

/**
 * The raw JSON object as written on disk — unknown keys included, nothing resolved.
 * Returns `null` for an absent, empty, malformed, or non-object file, which is what
 * lets a caller tell "no settings yet" from "the person broke the JSON" (only the
 * latter is worth backing up before a write).
 *
 * @param {string | null | undefined} raw - the file's text, or null if it doesn't exist
 * @returns {Record<string, unknown> | null}
 */
export function readObject(raw) {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return /** @type {Record<string, unknown>} */ (parsed);
  } catch {
    return null; // a hand-edited file with a stray comma is not an error, just "no settings"
  }
}

/**
 * Resolve the file's text into a configuration with every default filled in. Total:
 * any input at all yields a usable config. A key present with the wrong type (a
 * string `"false"`, a number) is ignored in favour of the default — the person meant
 * something, but not something we can act on safely.
 *
 * @param {string | null | undefined} raw - the file's text, or null if it doesn't exist
 * @returns {ClaudiaConfig}
 */
export function parseConfig(raw) {
  const cfg = defaults();
  const obj = readObject(raw);
  if (!obj) return cfg;
  for (const key of SETTING_KEYS) {
    const value = obj[key];
    const spec = SETTINGS[key];
    const accepted = spec.values
      ? typeof value === "string" && spec.values.includes(value) // enum: only a declared value
      : typeof value === "boolean";
    if (accepted) /** @type {Record<string, unknown>} */ (cfg)[key] = value;
  }
  return cfg;
}

/**
 * The file's object with one setting changed — everything else, **including keys
 * this version doesn't know**, carried through untouched.
 *
 * @param {Record<string, unknown> | null} obj - the current file object (null → start fresh)
 * @param {SettingKey} key
 * @param {boolean | string} value
 * @returns {Record<string, unknown>}
 */
export function withSetting(obj, key, value) {
  return { ...(obj || {}), [key]: value };
}

/**
 * Serialize the settings file: two-space indent, trailing newline. It is a file the
 * person opens and edits by hand, so it is written to be read by one.
 *
 * @param {Record<string, unknown>} obj
 * @returns {string}
 */
export function serializeConfig(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

/**
 * Read a value the way a person types it. Returns `null` for anything ambiguous, so
 * a caller refuses rather than guesses which way the person meant a switch to go.
 *
 * @param {string | null | undefined} text
 * @returns {boolean | null}
 */
export function coerceBoolean(text) {
  const t = String(text ?? "")
    .trim()
    .toLowerCase();
  if (["true", "on", "yes", "y", "1"].includes(t)) return true;
  if (["false", "off", "no", "n", "0"].includes(t)) return false;
  return null;
}

/**
 * Read a value for `key` the way a person types it — booleans through
 * {@link coerceBoolean}, enums against their declared value set. Returns `null`
 * for anything not in the set, so a caller refuses rather than guesses.
 *
 * @param {SettingKey} key
 * @param {string | null | undefined} text
 * @returns {boolean | string | null}
 */
export function coerceSetting(key, text) {
  const spec = SETTINGS[key];
  if (!spec.values) return coerceBoolean(text);
  const t = String(text ?? "")
    .trim()
    .toLowerCase();
  return spec.values.includes(t) ? t : null;
}

/**
 * A value as `/config` shows it: booleans as on/off, enum values verbatim.
 *
 * @param {boolean | string} value
 * @returns {string}
 */
export function showValue(value) {
  return typeof value === "boolean" ? (value ? "on" : "off") : String(value);
}

/**
 * The settings as a person-readable listing — one line per declared key, its current
 * value, the shipped default, and what it does. `/config` prints this; it is a view,
 * so it never hides a key whose value happens to match its default.
 *
 * @param {ClaudiaConfig} cfg
 * @returns {string}
 */
export function renderSettings(cfg) {
  const width = Math.max(...SETTING_KEYS.map((k) => k.length));
  return SETTING_KEYS.map((key) => {
    const value = showValue(cfg[key]);
    const fallback = showValue(SETTINGS[key].default);
    return `${key.padEnd(width)}  ${value.padEnd(3)}  (default ${fallback})  ${SETTINGS[key].what}`;
  }).join("\n");
}
