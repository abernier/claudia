#!/usr/bin/env node
/**
 * Keep the plugin + marketplace manifests in lockstep with package.json version.
 *
 * Changesets bumps `package.json`; a Claude Code plugin's version lives in
 * `.claude-plugin/plugin.json` (and the marketplace entry). Run this right after
 * `changeset version` — the `release:version` npm script chains them.
 */
import { readFileSync, writeFileSync } from "node:fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;

function patch(path, mutate) {
  const json = JSON.parse(readFileSync(path, "utf8"));
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
