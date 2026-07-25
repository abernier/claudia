#!/usr/bin/env node
/**
 * End-to-end: run Claudia for real, and check the whole pipe is wired.
 *
 *   npm run e2e                        both cases, one draw each
 *   npm run e2e -- --case crisis       one case
 *   npm run e2e -- --draws 3           three draws (the model layer varies)
 *   npm run e2e -- --model opus        another tier
 *
 * NOT part of `npm test`: each draw is a real session — it costs tokens, takes ~40 s, and
 * needs the machine's Claude Code auth. The Vitest suite stays the fast, deterministic
 * tier; this one is a runbook you invoke on purpose.
 *
 * ## How it isolates
 *
 * `os.homedir()` and the `~` in skill prose both follow `$HOME`, so seeding a fake home
 * (the demo rig, `demo/setup-home.sh` + `DEMO_HOME`) redirects the hooks AND the skills
 * onto a fixture vault in one move. That is not a nicety: without it a case would read the
 * operator's real `~/.claudia/` — someone's actual therapy notes — which is also why these
 * cases cannot live under `claude plugin eval` (it runs in the current environment).
 *
 * ## Two things learned the hard way, encoded here
 *
 * - A file can be opened by `Read` **or** by a shell that cats it. Counting only the
 *   former once measured a run at zero files read while its reply plainly knew the person.
 * - Draws run **sequentially**, and the home is re-seeded between them. Two sessions in
 *   parallel produced generic greetings that looked like failures and were artefacts; a
 *   reused home leaves a `pending-summary` behind, so the next open behaves differently.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASES } from "./cases.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** @param {string} flag @param {string} fallback @returns {string} */
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

/**
 * A fake `$HOME` with the demo fixture vault, this plugin, pre-allowed permissions and no
 * inherited conversation state.
 * @param {string} home
 * @returns {Promise<void>}
 */
async function seed(home) {
  await fs.rm(home, { recursive: true, force: true });
  execFileSync("bash", [path.join(REPO, "demo/setup-home.sh")], {
    env: { ...process.env, DEMO_HOME: home },
    stdio: "ignore",
  });
}

/**
 * One real session, parsed into the facts the checks assert on.
 * @param {string} home
 * @param {string} prompt
 * @param {string} model
 * @returns {import("./cases.mjs").Run}
 */
function session(home, prompt, model) {
  const r = spawnSync("claude", ["-p", prompt, "--output-format", "stream-json", "--verbose", "--model", model], {
    cwd: path.join(home, "desk"),
    env: { ...process.env, HOME: home },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

  /** @type {any[]} */
  const events = String(r.stdout || "")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  /** @type {string[]} */ const skills = [];
  /** @type {string[]} */ const reads = [];
  /** @type {string[]} */ const bash = [];
  for (const e of events) {
    const content = e.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b.type !== "tool_use") continue;
      if (b.name === "Skill" && b.input?.skill) skills.push(String(b.input.skill));
      else if (b.name === "Read" && b.input?.file_path) reads.push(path.basename(String(b.input.file_path)));
      else if (b.name === "Bash" && b.input?.command) {
        const cmd = String(b.input.command);
        bash.push(cmd);
        for (const m of cmd.matchAll(/(?:^|[\s"'])(\/[^\s"';|&]+\.(?:md|json))/g))
          reads.push(path.basename(m[1] ?? ""));
      }
    }
  }
  return { skills, reads, bash, reply: String(events.find((e) => e.type === "result")?.result ?? "") };
}

async function main() {
  const only = arg("--case", "");
  const draws = Math.max(1, Number(arg("--draws", "1")));
  const model = arg("--model", "sonnet");
  const cases = CASES.filter((c) => !only || c.name.includes(only));
  if (!cases.length) {
    console.error(`no case matches "${only}" — have: ${CASES.map((c) => c.name).join(", ")}`);
    process.exit(2);
  }

  const home = path.join(os.tmpdir(), "claudia-e2e");
  let failed = 0;

  for (const c of cases) {
    console.log(`\n\x1b[1m${c.name}\x1b[0m — ${c.why}`);
    console.log(`  « ${c.prompt} »   (${draws} draw${draws > 1 ? "s" : ""}, ${model})`);
    for (let i = 1; i <= draws; i++) {
      await seed(home);
      const run = session(home, c.prompt, model);
      const results = Object.entries(c.checks).map(([label, check]) => {
        let ok = false;
        try {
          ok = check(run);
        } catch {
          ok = false; // a throwing check is a failing check, never a crashed run
        }
        return { label, ok };
      });
      const bad = results.filter((x) => !x.ok);
      failed += bad.length ? 1 : 0;
      console.log(`  draw ${i}: ${bad.length ? "\x1b[31mFAIL\x1b[0m" : "\x1b[32mpass\x1b[0m"}`);
      for (const { label, ok } of results) console.log(`    ${ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${label}`);
      if (bad.length) {
        console.log(`    skills: ${run.skills.join(" → ") || "(none)"}`);
        console.log(`    read:   ${[...new Set(run.reads)].join(", ") || "(nothing)"}`);
        console.log(`    reply:  « ${run.reply.replace(/\s+/g, " ").slice(0, 240)} »`);
      }
    }
  }

  console.log(failed ? `\n\x1b[31m${failed} failing draw(s)\x1b[0m` : `\n\x1b[32mall draws passed\x1b[0m`);
  process.exit(failed ? 1 : 0);
}

main();
