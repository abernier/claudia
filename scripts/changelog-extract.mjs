#!/usr/bin/env node
/**
 * Print the CHANGELOG.md section for a version, for use as GitHub Release notes.
 *
 *   node scripts/changelog-extract.mjs 0.2.1
 *
 * Thin CLI over `src/changelog.mjs` (the pure, tested logic lives there). The
 * release workflow runs this to turn the tag into a Release body; you can run it
 * locally to preview or to backfill a Release page for a tag already pushed.
 */
import { readFileSync } from "node:fs";
import { extractSection } from "../src/changelog.mjs";

const version = process.argv[2];
if (!version) {
  console.error("usage: changelog-extract.mjs <version>");
  process.exit(1);
}

const body = extractSection(readFileSync("CHANGELOG.md", "utf8"), version);
if (body === null) {
  console.error(`No CHANGELOG.md section for ${version}`);
  process.exit(1);
}
process.stdout.write(body + "\n");
