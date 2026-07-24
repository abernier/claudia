#!/usr/bin/env node
/**
 * Claudia — read and change the person's settings (`~/.claudia/config.json`).
 *
 * Thin wrapper around ../src/config.mjs, driven by `/config` (ADR-0028). The write
 * path is deterministic on purpose: a model editing JSON by hand is how an unknown
 * key — or the rest of the file — quietly disappears.
 *
 *   node scripts/config.mjs                    list every setting, its value and default
 *   node scripts/config.mjs --set emoji=true   change one setting, print the before → after
 *
 * Unlike the hooks, this is person-initiated and not on the conversation's critical
 * path, so it reports failure instead of failing silent: a refused write the person
 * believes happened is worse than an error message. Exit 1 on a bad key or value.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  coerceBoolean,
  isSettingKey,
  parseConfig,
  readObject,
  renderSettings,
  SETTING_KEYS,
  serializeConfig,
  withSetting,
} from "../src/config.mjs";

const root = path.join(os.homedir(), ".claudia");
const file = path.join(root, "config.json");

/** @type {(p: string) => Promise<string | null>} */
const read = (p) => fs.readFile(p, "utf8").catch(() => null);

/** @param {string} line */
const say = (line) => process.stdout.write(line + "\n");

/**
 * Change one setting, preserving every other key in the file. A file that exists but
 * cannot be parsed is copied to `config.json.bak` first — the person hand-edits this,
 * and their broken attempt may hold the intent behind it.
 *
 * @param {string} assignment - `key=value`
 * @returns {Promise<number>} process exit code
 */
async function set(assignment) {
  const eq = assignment.indexOf("=");
  const key = (eq === -1 ? assignment : assignment.slice(0, eq)).trim();
  const value = coerceBoolean(eq === -1 ? "" : assignment.slice(eq + 1));

  if (!isSettingKey(key)) {
    say(`unknown setting: ${key || "(none)"} — known settings: ${SETTING_KEYS.join(", ")}`);
    return 1;
  }
  if (value === null) {
    say(`${key} takes on or off (true/false) — got: ${assignment.slice(eq + 1).trim() || "(nothing)"}`);
    return 1;
  }

  const raw = await read(file);
  const obj = readObject(raw);
  if (raw !== null && obj === null && raw.trim()) {
    await fs.writeFile(file + ".bak", raw).catch(() => {});
    say(`(the existing config.json could not be read — kept a copy at ${file}.bak)`);
  }

  const before = parseConfig(raw)[key];
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(file, serializeConfig(withSetting(obj, key, value)));

  const word = /** @param {boolean} b */ (b) => (b ? "on" : "off");
  say(before === value ? `${key}: already ${word(value)}` : `${key}: ${word(before)} → ${word(value)}`);
  say(file);
  return 0;
}

/** @returns {Promise<number>} process exit code */
async function main() {
  const args = process.argv.slice(2);
  const setIndex = args.indexOf("--set");
  if (setIndex !== -1) return set(args[setIndex + 1] || "");

  say(renderSettings(parseConfig(await read(file))));
  say(file);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    say(`could not read or write ${file}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  },
);
