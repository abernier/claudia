#!/usr/bin/env node
/**
 * Keep the plugin + marketplace manifests in lockstep with package.json version.
 *
 * Changesets bumps `package.json`; a Claude Code plugin's version lives in
 * `.claude-plugin/plugin.json` (and the marketplace entry). Run this right after
 * `changeset version` — the `release:version` npm script chains them.
 */
import { readFileSync, writeFileSync } from "node:fs";

/**
 * The slice of a manifest we rewrite in place — covers both
 * `.claude-plugin/plugin.json` (top-level `version`) and
 * `.claude-plugin/marketplace.json` (`plugins[0].version`).
 *
 * @typedef {object} Manifest
 * @property {string} [version]
 * @property {Array<{ version: string }>} [plugins]
 */

const version = /** @type {{ version: string }} */ (JSON.parse(readFileSync("package.json", "utf8"))).version;

/**
 * Re-serialize a manifest at `path` after letting `mutate` edit it in place.
 *
 * @param {string} path Repo-relative path to the JSON file.
 * @param {(json: Manifest) => void} mutate
 */
function patch(path, mutate) {
  const json = /** @type {Manifest} */ (JSON.parse(readFileSync(path, "utf8")));
  mutate(json);
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  console.log(`synced ${path} -> ${version}`);
}

patch(".claude-plugin/plugin.json", (j) => {
  j.version = version;
});
patch(".claude-plugin/marketplace.json", (j) => {
  if (j.plugins?.[0]) j.plugins[0].version = version;
});
