#!/usr/bin/env node
/**
 * Claudia — read and change the person's settings (`<root>/config.json`).
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
import path from "node:path";
import { isEntrypoint } from "../src/entry.mjs";
import {
  coerceSetting,
  isSettingKey,
  parseConfig,
  readObject,
  renderSettings,
  SETTINGS,
  SETTING_KEYS,
  serializeConfig,
  showValue,
  withSetting,
} from "../src/config.mjs";
import { resolveVaultRoot } from "../src/vault.mjs";

/** @type {(p: string) => Promise<string | null>} */
const read = (p) => fs.readFile(p, "utf8").catch(() => null);

/**
 * Change one setting, preserving every other key in the file. A file that exists but
 * cannot be parsed is copied to `config.json.bak` first — the person hand-edits this,
 * and their broken attempt may hold the intent behind it.
 *
 * @param {{ root: string, assignment: string }} opts - `assignment` is `key=value`
 * @returns {Promise<{ code: number, lines: string[] }>}
 */
async function set({ root, assignment }) {
  const file = path.join(root, "config.json");
  /** @type {string[]} */
  const lines = [];

  const eq = assignment.indexOf("=");
  const key = (eq === -1 ? assignment : assignment.slice(0, eq)).trim();

  if (!isSettingKey(key)) {
    lines.push(`unknown setting: ${key || "(none)"} — known settings: ${SETTING_KEYS.join(", ")}`);
    return { code: 1, lines };
  }
  const value = coerceSetting(key, eq === -1 ? "" : assignment.slice(eq + 1));
  if (value === null) {
    const takes = SETTINGS[key].values ? SETTINGS[key].values.join(" or ") : "on or off (true/false)";
    lines.push(`${key} takes ${takes} — got: ${assignment.slice(eq + 1).trim() || "(nothing)"}`);
    return { code: 1, lines };
  }

  const raw = await read(file);
  const obj = readObject(raw);
  if (raw !== null && obj === null && raw.trim()) {
    await fs.writeFile(file + ".bak", raw).catch(() => {});
    lines.push(`(the existing config.json could not be read — kept a copy at ${file}.bak)`);
  }

  const before = parseConfig(raw)[key];
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(file, serializeConfig(withSetting(obj, key, value)));

  lines.push(
    before === value ? `${key}: already ${showValue(value)}` : `${key}: ${showValue(before)} → ${showValue(value)}`,
  );
  lines.push(file);
  return { code: 0, lines };
}

/**
 * The `/config` surface at the vault seam (ADR-0035): list every setting, or change
 * one via `--set key=value`. Returns the lines to print and the exit code; the CLI
 * adapter below does the printing.
 *
 * @param {{ root: string, args?: string[] }} opts
 * @returns {Promise<{ code: number, lines: string[] }>}
 */
export async function runConfig({ root, args = [] }) {
  const setIndex = args.indexOf("--set");
  if (setIndex !== -1) return set({ root, assignment: args[setIndex + 1] || "" });

  const file = path.join(root, "config.json");
  return { code: 0, lines: [renderSettings(parseConfig(await read(file))), file] };
}

/** @returns {Promise<void>} */
async function main() {
  const root = resolveVaultRoot();
  try {
    const { code, lines } = await runConfig({ root, args: process.argv.slice(2) });
    for (const line of lines) process.stdout.write(line + "\n");
    process.exit(code);
  } catch (err) {
    const file = path.join(root, "config.json");
    process.stdout.write(`could not read or write ${file}: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

// Run only when invoked directly, not on import (tests import runConfig).
// Symlink-safe — see src/entry.mjs for what comparing unresolved paths cost.
if (isEntrypoint(import.meta.url)) main();
