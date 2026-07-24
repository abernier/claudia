#!/usr/bin/env node
/**
 * Claudia demo — pre-seed Claude Code's own state in the fake home, so `npm run
 * demo` drops straight into a session: no onboarding wizard, no trust dialog, no
 * login prompt.
 *
 * MERGES into $DEMO_HOME/.claude.json — existing keys always win, missing ones are
 * filled in (a claude quit mid-wizard leaves a partial file behind; re-running
 * repairs it without clobbering the fake home's accumulated state):
 *   - hasCompletedOnboarding + lastOnboardingVersion (copied from the real file,
 *     so a version-gated re-onboarding doesn't fire)
 *   - oauthAccount + userID copied from the real ~/.claude.json — account
 *     METADATA only (the actual credentials live in the macOS Keychain, which is
 *     per-OS-user and needs no copying). The fake home lives outside the repo and
 *     is never committed.
 *   - the recording cwd ($DEMO_HOME/desk) pre-trusted.
 */

import { accessSync, constants } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/** Same resolution as demo/env.sh: $DEMO_HOME > /Users/nora (if ours) > ~/.claudia-demo. */
function resolveDemoHome() {
  if (process.env.DEMO_HOME) return process.env.DEMO_HOME;
  try {
    accessSync("/Users/nora", constants.W_OK);
    return "/Users/nora";
  } catch {
    return path.join(os.homedir(), ".claudia-demo");
  }
}

const DEMO_HOME = resolveDemoHome();

/**
 * Only the fields these seeds act on; everything else rides along untouched
 * (both files are external JSON owned by Claude Code, hence the open records).
 *
 * @typedef {Record<string, unknown> & { projects?: Record<string, Record<string, unknown>> }} ClaudeJson
 * @typedef {{ allow?: string[], deny?: string[], additionalDirectories?: string[] }} PermissionsBlock
 * @typedef {Record<string, unknown> & { permissions?: PermissionsBlock, hooks?: Record<string, unknown>, model?: string }} SettingsFile
 */
const DEST = path.join(DEMO_HOME, ".claude.json");
const REAL = path.join(os.homedir(), ".claude.json");

async function main() {
  /** @type {ClaudeJson} */
  let real = {};
  try {
    real = JSON.parse(await fs.readFile(REAL, "utf8"));
  } catch {
    console.log("note: no readable real ~/.claude.json — the first demo run may ask you to log in");
  }

  /** @type {ClaudeJson} */
  let cfg = {};
  try {
    cfg = JSON.parse(await fs.readFile(DEST, "utf8"));
  } catch {
    /* absent or unreadable → start fresh */
  }

  cfg.hasCompletedOnboarding = cfg.hasCompletedOnboarding ?? true;
  // Identity metadata (login), plus already-seen markers so promo banners and
  // release notes don't open the recorded session. Metadata only, never content.
  for (const key of [
    "lastOnboardingVersion",
    "oauthAccount",
    "userID",
    "seenNotifications",
    "lastReleaseNotesSeen",
    "announcementImpressions",
    "tipsHistory",
    "passesUpsellSeenCount",
    "hasVisitedPasses",
    "passesLastSeenRemaining",
    "subscriptionNoticeCount",
  ]) {
    if (cfg[key] === undefined && real[key] !== undefined) cfg[key] = real[key];
  }
  const desk = path.join(DEMO_HOME, "desk");
  cfg.projects = cfg.projects || {};
  cfg.projects[desk] = {
    allowedTools: [],
    ...cfg.projects[desk],
    hasTrustDialogAccepted: true,
    hasCompletedProjectOnboarding: true,
  };

  await fs.mkdir(DEMO_HOME, { recursive: true });
  await fs.writeFile(DEST, JSON.stringify(cfg, null, 2) + "\n");
  console.log(`seeded ${DEST} (onboarding done, desk/ trusted${cfg.oauthAccount ? ", account linked" : ""})`);

  // Pre-allow the plugin's own machinery so the demo has zero permission prompts —
  // scoped to Claudia's skills, node scripts, and the (fake) vault, merged into
  // any existing settings union-style. ABSOLUTE paths only — never `~` in
  // permission config: Claude Code expands it against the passwd home, not the
  // faked $HOME, which once mounted the REAL vault into a demo session (the
  // read-leak incident).
  const FAKE_VAULT = path.join(DEMO_HOME, ".claudia");
  const REAL_VAULT = path.join(os.userInfo().homedir, ".claudia"); // passwd-based: immune to $HOME faking
  const toRule = (/** @type {string} */ p) => `/${p}`; // rule-form absolute path: "/Users/…" → "//Users/…" (the `//` prefix marks a rule absolute)
  const ALLOW = [
    "Skill(claudia:*)",
    "Bash(node:*)",
    // The skills also read their own files and the vault with plain shell tools.
    "Bash(cat:*)",
    "Bash(ls:*)",
    "Bash(echo:*)",
    "Bash(grep:*)",
    "Bash(date:*)",
    "Bash(mkdir:*)",
    `Read(${toRule(FAKE_VAULT)}/**)`,
    `Edit(${toRule(FAKE_VAULT)}/**)`, // Edit covers ALL file-editing tools; Write(path) rules are ignored and warn at startup
  ];
  const DENY = [`Read(${toRule(REAL_VAULT)}/**)`, `Edit(${toRule(REAL_VAULT)}/**)`];
  // Purge rules an earlier seed wrote: leaky `~` paths, and ignored Write(path) rules.
  const STALE_RULES = /\(~\/\.claudia\/|^Write\(\/\//;
  const settingsPath = path.join(DEMO_HOME, ".claude", "settings.json");
  /** @type {SettingsFile} */
  let settings = {};
  try {
    settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
  } catch {
    /* absent or unreadable → start fresh */
  }
  // Sonnet: the sweet spot on camera. Haiku was tried and failed the money shot —
  // it answered turn 1 as plain Claude Code instead of activating the persona.
  // Authoritative — the repo owns this rig knob; change it here, reseed, done.
  settings.model = "sonnet";

  settings.permissions = settings.permissions || {};
  settings.permissions.allow = [
    ...new Set([...(settings.permissions.allow || []).filter((r) => !STALE_RULES.test(r)), ...ALLOW]),
  ];
  settings.permissions.deny = [
    ...new Set([...(settings.permissions.deny || []).filter((r) => !STALE_RULES.test(r)), ...DENY]),
  ];
  settings.permissions.additionalDirectories = [
    ...new Set([
      ...(settings.permissions.additionalDirectories || []).filter((d) => !d.startsWith("~/")),
      FAKE_VAULT + "/",
    ]),
  ];

  // Prefix allowlists can't cover the ad-hoc shell the skills compose (any `$f`
  // expansion prompts regardless of rules), so the demo rig decides every tool
  // call via a PreToolUse GUARD hook — silently, no status-line banner in the
  // recording. The guard DENIES anything referencing the real vault and allows
  // the rest: the rig stays prompt-free AND fenced. This is a RIG, not a daily
  // driver. The guard owns the whole PreToolUse list (any earlier entry is
  // replaced); hooks on OTHER events are untouched.
  const guardPath = path.join(DEMO_HOME, ".claude", "demo-guard-hook.mjs");
  await fs.mkdir(path.dirname(guardPath), { recursive: true });
  await fs.writeFile(
    guardPath,
    `#!/usr/bin/env node
// Claudia demo rig guard (written by demo/seed-claude-config.mjs — do not edit).
// Auto-allows tool calls inside the fake home, DENIES any that reference the
// real vault. The real home comes from passwd, immune to the faked $HOME.
import { userInfo } from "node:os";
let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  const realVault = userInfo().homedir + "/.claudia";
  // A reference to the real vault is realVault NOT followed by a word char or
  // dash (so the fake …/.claudia-demo/.claudia never matches).
  let touchesReal = false;
  for (let i = input.indexOf(realVault); i !== -1; i = input.indexOf(realVault, i + 1)) {
    const next = input[i + realVault.length];
    if (!next || !/[-\\w]/.test(next)) { touchesReal = true; break; }
  }
  const decision = touchesReal
    ? { permissionDecision: "deny", permissionDecisionReason: "demo rig: the real vault is off-limits" }
    : { permissionDecision: "allow", permissionDecisionReason: "demo rig: sandboxed fake home" };
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...decision } }));
});
`,
  );
  settings.hooks = settings.hooks || {};
  settings.hooks.PreToolUse = [{ matcher: "*", hooks: [{ type: "command", command: `node "${guardPath}"` }] }];
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  console.log(`seeded ${settingsPath} (plugin machinery pre-allowed, vault dir shared)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
