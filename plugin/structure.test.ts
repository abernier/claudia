/**
 * Repo integrity — fitness functions, one per recorded decision.
 *
 * Each test guards one decision and names where it is recorded (an ADR, an
 * issue, a competency doc). Expectations are derived from the tree wherever
 * possible, never hardcoded. The prose assertions are deliberate: in a
 * prompt-programmed plugin the SKILL.md prose *is* the program, so a guarded
 * rule-sentence is source code — rewording it is a behaviour change and the
 * failure is legitimate. Anything this file does not guard may be reworded
 * freely; if a failure here surprises you, read the ADR the title cites
 * before editing the assertion.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaults, SETTING_KEYS } from "./src/config.mjs";
import { localDay } from "./src/time.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// `root` is the *plugin* root — `plugin/`, what `${CLAUDE_PLUGIN_ROOT}` resolves to
// and what an install copies. It used to coincide with the repo root; since the
// payload moved out of it, only repo-level things (the marketplace entry, the
// architecture diagram, the whole-repo link sweep) still reach for `repo`.
const root = path.dirname(fileURLToPath(import.meta.url));

function walk(dir: string, filter?: (p: string) => boolean): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, filter));
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

// Every skill and command, split into (frontmatter, body) so the allowed-tools
// declaration itself never counts as a "use" of the tool.
const surfaces = [
  ...walk(path.join(root, "skills"), (p) => p.endsWith("SKILL.md")),
  ...walk(path.join(root, "commands"), (p) => p.endsWith(".md")),
].map((file) => {
  const txt = readFileSync(file, "utf8");
  const end = txt.indexOf("\n---", 3);
  return {
    rel: path.relative(root, file),
    frontmatter: end === -1 ? "" : txt.slice(0, end),
    body: end === -1 ? txt : txt.slice(end),
  };
});

/** Surfaces that reach for `tool` in their body without declaring it in allowed-tools. */
function undeclaredUsers(tool: string): string[] {
  const declared = new RegExp(`^allowed-tools:.*\\b${tool}\\b`, "m");
  return surfaces.filter((s) => s.body.includes(tool) && !declared.test(s.frontmatter)).map((s) => s.rel);
}

// Manifest shapes — only the fields these tests assert on.
type PluginManifest = { name?: string; hooks?: unknown };
type MarketplaceManifest = { name?: string; plugins: Array<{ source?: string }> };
type HooksManifest = { hooks: Record<string, unknown> };

describe("install contracts", () => {
  it("the manifests honour the loader contract (#49)", () => {
    const m: PluginManifest = JSON.parse(read(".claude-plugin/plugin.json"));
    expect(m.name).toBe("claudia");
    // hooks/hooks.json is auto-discovered; declaring it twice double-fires it.
    expect(m.hooks).toBeUndefined();
    const mk: MarketplaceManifest = JSON.parse(
      readFileSync(path.join(repo, ".claude-plugin/marketplace.json"), "utf8"),
    );
    expect(mk.name).toBe("claudia");
    expect(mk.plugins.length).toBeGreaterThan(0);
    // `./` shipped the whole repo — the site, the demo, the tests, and a
    // package.json the installer then ran `npm install` against (#49).
    expect(mk.plugins[0]!.source).toBe("./plugin");
    const h: HooksManifest = JSON.parse(read("hooks/hooks.json"));
    expect(Object.keys(h.hooks)).toEqual(expect.arrayContaining(["UserPromptSubmit", "SessionEnd"]));
  });

  it("the payload boundary holds — plugin/ is the tarball (#49)", () => {
    // There is no exclude mechanism anywhere in the install path (no
    // .claudeignore, no ignorePatterns, no `files` field), so the directory is
    // the only boundary there is.
    //
    // No package.json: the installer runs `npm install` at the plugin root —
    // with one in the payload, every install landed 100MB of devDependencies
    // on the person's machine.
    const found = walk(root, (p) => path.basename(p) === "package.json");
    expect(found.map((p) => path.relative(repo, p))).toEqual([]);
    // No file above the desktop installer's MAX_COMPRESSION_RATIO: 50 — this
    // fails before a person sees an orange warning on a mental-health plugin.
    const over = walk(root)
      .map((p) => {
        const raw = readFileSync(p);
        return { rel: path.relative(repo, p), ratio: raw.length / gzipSync(raw, { level: 9 }).length };
      })
      .filter((f) => f.ratio > 50)
      .map((f) => `${f.rel} (${f.ratio.toFixed(1)}:1)`);
    expect(over).toEqual([]);
  });

  it("resolves every ${CLAUDE_PLUGIN_ROOT} path it cites (the thirteen-scripts move)", () => {
    // Twelve of thirteen scripts moved and a hook breaks at install time with
    // nothing in the suite noticing. This is the assertion that notices.
    const cited = new Set<string>();
    for (const f of walk(root, (p) => p.endsWith(".md") || p.endsWith(".json")))
      for (const m of readFileSync(f, "utf8").matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)) cited.add(m[1]!);
    expect(cited.size, "the payload should cite some of its own files").toBeGreaterThan(0);
    const missing = [...cited].filter((rel) => !existsSync(path.join(root, rel)));
    expect(missing, `cited but absent from plugin/:\n${missing.join("\n")}`).toEqual([]);
  });

  it("scripts stay reachable through a symlink — isEntrypoint() everywhere (the dev-install incident)", () => {
    // Three scripts decided "run or imported?" by comparing `path.resolve(argv[1])`
    // to `fileURLToPath(import.meta.url)`. Node resolves symlinks for the second and
    // not the first, so on a dev install — where ${CLAUDE_PLUGIN_ROOT} IS a link —
    // main() never ran and the script exited 0, silently.
    const scripts = walk(path.join(root, "scripts"), (p) => p.endsWith(".mjs") && !p.endsWith(".test.mjs"));
    const fragile = scripts
      .filter((p) => /path\.resolve\(process\.argv\[1\]\)/.test(readFileSync(p, "utf8")))
      .map((p) => path.relative(root, p));
    expect(fragile, `must use isEntrypoint() from src/entry.mjs:\n${fragile.join("\n")}`).toEqual([]);
    const guards = scripts.flatMap((p) =>
      [...readFileSync(p, "utf8").matchAll(/^if \((.+)\) main\(\);$/gm)].map((m) => ({
        rel: path.relative(root, p),
        condition: m[1]!,
      })),
    );
    expect(guards.length, "some scripts are executable and importable both").toBeGreaterThan(0);
    for (const g of guards)
      expect(g.condition, `${g.rel} should guard with isEntrypoint()`).toBe("isEntrypoint(import.meta.url)");
    // A script that exports symbols is importable BY DESIGN — a bare `main();`
    // would run it on import, so there the guard is mandatory (the session-anchor
    // fold, #62). Hook-only scripts with no exports may keep the bare call.
    const unguarded = scripts
      .map((p) => ({ rel: path.relative(root, p), txt: readFileSync(p, "utf8") }))
      .filter((s) => /^export /m.test(s.txt) && /^main\(\);$/m.test(s.txt))
      .map((s) => s.rel);
    expect(unguarded, `importable scripts must guard main() with isEntrypoint():\n${unguarded.join("\n")}`).toEqual([]);
  });

  it("every skill declares name + description frontmatter (the loader contract)", () => {
    const skills = walk(path.join(root, "skills"), (p) => p.endsWith("SKILL.md"));
    expect(skills.length).toBeGreaterThan(0);
    for (const s of skills) {
      const txt = readFileSync(s, "utf8");
      expect(txt.startsWith("---"), `${s} missing frontmatter`).toBe(true);
      expect(/^name:\s*\S+/m.test(txt), `${s} missing name`).toBe(true);
      expect(/^description:\s*\S+/m.test(txt), `${s} missing description`).toBe(true);
    }
  });
});

describe("docs stay in sync with the tree", () => {
  it("the README command table lists exactly the shipped commands (the /thread gap)", () => {
    // The expectation is derived from commands/, so adding or removing a
    // command only ever requires updating the README — never this test.
    const commands = walk(path.join(root, "commands"), (p) => p.endsWith(".md"))
      .map((p) => "/" + path.basename(p, ".md"))
      .sort();
    const readme = read("README.md");
    const tabled = [...readme.matchAll(/^\|\s*`(\/[a-z-]+)`\s*\|/gm)].map((m) => m[1]).sort();
    expect(tabled).toEqual(commands);
  });

  it("the architecture diagram pictures the wiring — nothing more, nothing less (the ADR-0016 rot)", () => {
    // The ASCII picture this replaced still advertised a `Stop` hook long after
    // hooks.json had moved to SessionEnd (ADR-0016). A diagram is prose too, so
    // both directions are derived: everything wired is pictured, everything
    // pictured still exists.
    const diagram =
      readFileSync(path.join(repo, "docs/ARCHITECTURE.md"), "utf8").match(/```mermaid\n([\s\S]*?)```/)?.[1] ?? "";
    expect(diagram, "docs/ARCHITECTURE.md must carry a mermaid block").not.toBe("");
    const wired: Record<string, Array<{ hooks: Array<{ command: string }> }>> = JSON.parse(
      read("hooks/hooks.json"),
    ).hooks;
    for (const [event, groups] of Object.entries(wired)) {
      expect(diagram, `${event} is wired but not pictured`).toContain(event);
      for (const g of groups)
        for (const h of g.hooks) {
          const script = h.command.match(/([\w-]+\.mjs)/)![1]!;
          expect(diagram, `${script} is wired but not pictured`).toContain(script);
        }
    }
    const named = new Set([
      ...[...diagram.matchAll(/\b([\w-]+\.mjs)\b/g)].map((m) => path.join("scripts", m[1]!)),
      ...[...diagram.matchAll(/\bskills\/([\w-]+)/g)].map((m) => path.join("skills", m[1]!)),
    ]);
    expect(named.size, "the diagram should name some of what it draws").toBeGreaterThan(0);
    for (const rel of named) expect(existsSync(path.join(root, rel)), `${rel} is pictured but gone`).toBe(true);
  });

  it("every relative .md link points to an existing file (the payload move put a boundary in the middle)", () => {
    // The whole repo, not just the payload: the move put a boundary between the
    // ADRs and what links to them, and a link that crosses it breaks here first.
    const mdFiles = walk(repo, (p) => p.endsWith(".md"));
    const linkRe = /\]\(([^)]+?\.md)(#[^)]*)?\)/g;
    const broken: string[] = [];
    for (const f of mdFiles) {
      // Strip code (fenced + inline) so example link-syntax isn't link-checked.
      // Code spans must pair by backtick-run length (CommonMark): a span opened with
      // N backticks closes on a run of exactly N. The naive /`[^`]*`/ mis-paired on a
      // span *containing* a longer run — the CHANGELOG's inline ` ```mermaid ` — and
      // every link after it in the file silently lost its code-span shield, surfacing
      // documented `~/.claudia/` paths (`Ombeline.md`) as broken repo links.
      const txt = readFileSync(f, "utf8")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/(`+)[\s\S]*?(?<!`)\1(?!`)/g, "");
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(txt))) {
        const target = m[1]!;
        if (/^https?:/.test(target)) continue;
        // The demo fixture's evergreen date tokens ({{TODAY-N}} in links, TODAY-N-
        // in filenames — rendered by demo/seed-vault.mjs) normalize to the on-disk
        // template names, so fixture links are genuinely checked, not skipped.
        const onDisk = target.replace(/\{\{(TODAY-\d+)\}\}/g, "$1");
        if (!existsSync(path.resolve(path.dirname(f), onDisk))) {
          broken.push(`${path.relative(repo, f)} -> ${target}`);
        }
      }
    }
    expect(broken, `broken links:\n${broken.join("\n")}`).toEqual([]);
  });
});

describe("decision guards", () => {
  it("ADR-0032 — the rotating archive keeps every promise it made", () => {
    // Snapshots last at SessionEnd: it must capture the distilled state, not the
    // state before save-session and build-dashboard wrote to it.
    const end = JSON.parse(read("hooks/hooks.json")).hooks.SessionEnd[0].hooks.map(
      (x: { command: string }) => x.command,
    );
    expect(end.at(-1)).toMatch(/vault-backup\.mjs/);
    expect(end.at(-1)).toMatch(/--quiet/); // benign layer: never fails a session
    expect(end.at(-1)).toMatch(/--detach/); // and never makes the person wait on one
    // /forget leaves the archives alone — a backup a routine command can destroy
    // is not one — and says what is true about the copies it does not touch.
    const forget = read("commands/forget.md");
    expect(/--purge/.test(forget), "/forget must not purge the archive set").toBe(false);
    expect(/never touch .*claudia-backups/i.test(forget)).toBe(true);
    expect(/rotate out/.test(forget), "must say the older copies persist").toBe(true);
    expect(/\/backup/.test(forget), "and where the person can clear them").toBe(true);
    // Never mine an archive to undo a forgetting — in both places that can reach one.
    for (const f of ["commands/forget.md", "commands/backup.md"])
      expect(/chose to forget/i.test(read(f)), `${f} must carry the never-retrieve rule`).toBe(true);
    // Refusable like every other copy, disclosed inside the existing first-run
    // breath, and the background job stays out of the conversation.
    // Not the settings table (pinned once, in src/config.test.ts): what is guarded
    // here is that the archive has a switch at all, so it is refusable like every
    // other copy the vault keeps.
    expect([...SETTING_KEYS], "the archive must be refusable — it needs a declared key").toContain("backups");
    const remember = read("skills/remember/SKILL.md");
    expect(/claudia-backups/.test(remember), "the archive must be disclosed at all").toBe(true);
    expect(/same breath/.test(remember), "and folded into the one disclosure that exists").toBe(true);
    expect(/launchd|launchctl|backup-timer/i.test(read("skills/claudia/SKILL.md"))).toBe(false);
    expect(/never raise it mid-conversation/i.test(read("commands/backup.md"))).toBe(true);
  });

  it("ADR-0036 — every hook is gated on a Claudia session", () => {
    // The plugin is user-scoped: every command in hooks.json runs in every session on
    // the machine. A script that serves other callers too learns it is the hook from
    // --hook — drop the flag and it acts on every coding session's close again.
    const commands: string[] = Object.values(
      JSON.parse(read("hooks/hooks.json")).hooks as Record<string, { hooks: { command: string }[] }[]>,
    ).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
    for (const name of ["build-dashboard.mjs", "vault-backup.mjs"]) {
      const cmd = commands.find((c) => c.includes(name));
      expect(cmd, `${name} must run as a hook`).toBeDefined();
      expect(cmd, `${name} must be told it is the hook`).toMatch(/--hook\b/);
    }
    // The hook-only scripts gate in code; each must reach the shared gate.
    for (const rel of [
      "scripts/safety-check.mjs",
      "scripts/time-context.mjs",
      "scripts/build-dashboard.mjs",
      "scripts/vault-backup.mjs",
    ])
      expect(/isClaudiaHookPayload/.test(read(rel)), `${rel} must pass the gate (src/gate.mjs)`).toBe(true);
    for (const rel of ["scripts/save-session.mjs", "scripts/session-anchor.mjs"])
      expect(/isClaudiaSession/.test(read(rel)), `${rel} must pass the gate`).toBe(true);
  });

  it("ADR-0034 — self-authoring stays withdrawn, traceably", () => {
    for (const rel of ["skills/author-skill", "agents/skill-auditor.md", "proposed-skills"])
      expect(existsSync(path.join(root, rel)), `${rel} was withdrawn by ADR-0034`).toBe(false);
    expect(
      /author-skill|proposed-skills/.test(read("SOUL.md") + read("skills/claudia/SKILL.md")),
      "self-extension is not a capability",
    ).toBe(false);
    const adr = read("docs/adr/0006-self-authoring.md");
    expect(/^status: superseded by ADR-0034$/m.test(adr), "the reversal must stay traceable").toBe(true);
    expect(existsSync(path.join(root, "skills/quiz/SKILL.md")), "quiz is an ordinary skill now").toBe(true);
  });

  it("the opening ritual earns its check-in (skills/claudia + recall contract)", () => {
    const persona = read("skills/claudia/SKILL.md");
    expect(/still.?open/i.test(persona), "opening should target a still-open thread").toBe(true);
    expect(/by name/i.test(persona), "opening should greet by name").toBe(true);
    expect(/First time/i.test(persona), "opening should handle first-timers").toBe(true);
    expect(/resolved/i.test(persona), "opening should not re-raise resolved threads").toBe(true);
    const recall = read("skills/recall/SKILL.md");
    expect(/anticipat/i.test(recall), "recall surfaces anticipated events").toBe(true);
    expect(/resolved/i.test(recall), "and skips resolved ones").toBe(true);
    expect(/names Claudia|talk to Claudia|@Claudia/i.test(persona), "the persona is reachable by name").toBe(true);
  });

  it("delegation is bounded away from the relationship and crisis (skills/claudia contract)", () => {
    const persona = read("skills/claudia/SKILL.md");
    expect(/Task/.test(persona), "persona should use the Task tool to delegate").toBe(true);
    expect(/never delegate the relationship or a crisis/i.test(persona), "delegation must be bounded").toBe(true);
    expect(/^allowed-tools:.*\bTask\b/m.test(persona), "Task should be pre-approved to avoid mid-session prompts").toBe(
      true,
    );
  });

  it("ADR-0008 — the working understanding is held lightly, never clinically", () => {
    const recall = read("skills/recall/SKILL.md");
    expect(/understanding\.md/.test(recall), "recall loads it").toBe(true);
    expect(/provisional|hold it lightly|hypothesis/i.test(recall), "held provisionally").toBe(true);
    const persona = read("skills/claudia/SKILL.md");
    expect(/working understanding/i.test(persona)).toBe(true);
    expect(/does that fit/i.test(persona), "reflected back for correction").toBe(true);
    expect(/need you.{0,8}less/i.test(persona), "must be designed against dependency").toBe(true);
    const ctx = read("CONTEXT.md");
    expect(/Working understanding/.test(ctx)).toBe(true);
    expect(/_Avoid_.*(formulation|dossier|clinical)/i.test(ctx), "the glossary de-clinicalises it").toBe(true);
    expect(/no diagnosis/i.test(read("skills/understand/SKILL.md"))).toBe(true);
  });

  it("ADR-0009 — curiosity without interrogation, intake offered not imposed", () => {
    const persona = read("skills/claudia/SKILL.md");
    expect(/reflection-led/i.test(persona), "must stay reflection-led").toBe(true);
    expect(/three questions/i.test(persona), "anti-interrogation dosage").toBe(true);
    expect(/intake/i.test(persona), "persona should offer the intake").toBe(true);
    const intake = read("skills/intake/SKILL.md");
    expect(/declinable/i.test(intake)).toBe(true);
    expect(/crisis/i.test(intake), "intake yields to safety").toBe(true);
  });

  it("ADR-0010 — the relationship map stays non-judgmental and surfaced by recall", () => {
    const skill = read("skills/relationships/SKILL.md");
    expect(/mermaid/i.test(skill)).toBe(true);
    expect(/non-judgmental/i.test(skill)).toBe(true);
    expect(/accusatory/i.test(skill) && /never/i.test(skill), "no clinical/accusatory labels on third parties").toBe(
      true,
    );
    expect(/people\.md/.test(read("skills/recall/SKILL.md")), "recall surfaces it").toBe(true);
  });

  it("ADR-0011 — a fiche is the person's mirror, never a dossier on someone", () => {
    const skill = read("skills/relationships/SKILL.md");
    expect(/per-person fiches/i.test(skill)).toBe(true);
    expect(/relative markdown link/i.test(skill), "fiches cross-link relatively").toBe(true);
    expect(/only through/i.test(skill), "reach a transcript only through its summary").toBe(true);
    expect(/vault-export\.mjs/.test(read("commands/export.md")), "export runs the vault export pass").toBe(true);
    const tmpl = readFileSync(path.join(root, "docs/person-fiche-template.md"), "utf8");
    expect(/mirror/i.test(tmpl) && /never a dossier/i.test(tmpl)).toBe(true);
  });

  it("ADR-0014 — the timeline is person-led and trauma-informed", () => {
    const skill = read("skills/timeline/SKILL.md");
    expect(/never force/i.test(skill), "never force a chronological trauma inventory").toBe(true);
    expect(/never infer/i.test(skill), "never infer unstated events").toBe(true);
    expect(/sectioned list/i.test(skill), "dated sectioned list is canonical").toBe(true);
    expect(/optional/i.test(skill) && /mermaid/i.test(skill), "mermaid is an optional view").toBe(true);
  });

  it("ADR-0018 — the todo surface is reachable mid-session, not just wired", () => {
    // The guard that was missing at v0.3.0: the surface was wired into
    // recall/remember/distill, but the always-loaded persona never mentioned it,
    // so asking Claudia to "create a todo" mid-conversation routed nowhere.
    expect(/todo/i.test(read("skills/claudia/SKILL.md")), "persona should point to the todo capability").toBe(true);
    expect(/todo\.md/.test(read("skills/recall/SKILL.md")), "recall reads it").toBe(true);
  });

  it("ADR-0019 — the dashboard is a zero-lag mirror that only points, and omits safety.md", () => {
    const h: HooksManifest = JSON.parse(read("hooks/hooks.json"));
    expect(/build-dashboard\.mjs/.test(JSON.stringify(h.hooks.SessionEnd)), "SessionEnd should rebuild it").toBe(true);
    const recall = read("skills/recall/SKILL.md");
    expect(/build-dashboard\.mjs/.test(recall), "recall should rebuild after deferred distillation").toBe(true);
    const adr = read("docs/adr/0019-dashboard.md");
    expect(/never summarise|linked, never excerpted/i.test(adr)).toBe(true);
    const mod = read("src/dashboard.mjs");
    expect(/transclude/i.test(mod) && /never/i.test(mod), "the module states the points-only rule").toBe(true);
    expect(/deliberately absent/i.test(adr), "no risk profile at a glance").toBe(true);
    const script = read("scripts/build-dashboard.mjs");
    expect(/"safety\.md"/.test(script), "the builder must not read safety.md").toBe(false);
    expect(/dashboard/i.test(read("skills/remember/SKILL.md")), "disclosed once, at first-run").toBe(true);
    expect(/cfg\.dashboard === false/.test(script), "refusable via config.json").toBe(true);
    // Through the declared reader, not an inline JSON.parse (ADR-0028).
    expect(/parseConfig/.test(script), "the opt-out reads the shared settings module").toBe(true);
    expect(
      /_Avoid_.*(dossier|profile|clinical)/i.test(read("CONTEXT.md")),
      "the glossary de-clinicalises the mirror",
    ).toBe(true);
  });

  it("ADR-0020 — migrations stay pure, backed-up-first, and quiet upkeep at recall", () => {
    const recall = read("skills/recall/SKILL.md");
    expect(/migrate-vault\.mjs/.test(recall), "recall should run the migration runner").toBe(true);
    expect(/disclose/i.test(recall), "recall must disclose when it migrates").toBe(true);
    const runner = read("scripts/migrate-vault.mjs");
    expect(/\.bak-/.test(runner), "runner takes a backup before writing").toBe(true);
    expect(/transcript\.md/.test(runner), "runner excludes *.transcript.md").toBe(true);
    expect(/migrations\s*=\s*\[/.test(read("src/migrations/index.mjs")), "registry exports an ordered list").toBe(true);
    const m = read("src/migrations/0001-wikilinks-to-relative.mjs");
    expect(/export function migrate/.test(m) && /idempotent/i.test(m)).toBe(true);
  });
  it("ADR-0024 / ADR-0026 — every tool a surface uses is declared in its allowed-tools", () => {
    // The gap at v0.9.0: `quiz` was built end-to-end on AskUserQuestion while its
    // allowed-tools said `Read Write Bash`, so the choice UI raised a permission
    // prompt mid-quiz — immersion broken at the worst moment.
    for (const tool of ["AskUserQuestion", "SendUserFile"]) {
      const undeclared = undeclaredUsers(tool);
      expect(undeclared, `uses ${tool} without declaring it:\n${undeclared.join("\n")}`).toEqual([]);
    }
  });

  it("ADR-0026 / ADR-0007 — Claudia never initiates contact and nothing leaves the machine", () => {
    // `status: 'proactive'` pushes a notification to the person's phone; Claudia
    // shows a file because they are already here, never to bring them back. A flat
    // ban on the word would gag the persona, which has to *name* the thing it
    // forbids — so the rule is semantic: every mention must be negated close by.
    const instructed: string[] = [];
    for (const s of surfaces) {
      for (const m of s.body.matchAll(/proactive/gi)) {
        const preceding = s.body.slice(Math.max(0, m.index - 60), m.index);
        if (!/\bnever\b|\bnot\b|\bno\b/i.test(preceding)) instructed.push(`${s.rel}:${m.index}`);
      }
    }
    expect(instructed, `Claudia never initiates contact (ADR-0026):\n${instructed.join("\n")}`).toEqual([]);
    // Artifact mints a durable, shareable URL: a persistent copy outside the
    // machine, which is exactly what ADR-0007 rejected with the remote connector.
    const publishing = surfaces.filter((s) => /\bArtifact\b/.test(s.body)).map((s) => s.rel);
    expect(publishing, `nothing leaves the machine (ADR-0007):\n${publishing.join("\n")}`).toEqual([]);
    expect(/Artifact/.test(read("docs/adr/0026-showing-the-deliverable.md")), "the ADR records why").toBe(true);
  });

  it("ADR-0024 — buttons for decisions, open questions for exploration", () => {
    // The half that protects the therapeutic side: a menu pre-writes the answers,
    // so the exploratory surfaces ask openly, permanently. These name lists are
    // the ADR's own enumeration — the decision itself, not a mirror of the tree —
    // so renaming one of these skills is a change to what ADR-0024 decided.
    const exploratory = ["intake", "themes", "timeline", "relationships", "understand", "crisis"];
    for (const name of exploratory)
      expect(
        /AskUserQuestion/.test(read(`skills/${name}/SKILL.md`)),
        `${name} must ask openly, not with options (ADR-0024)`,
      ).toBe(false);
    // Non-goals with reasons: /help-now is not the moment for exploration, and
    // friction is protective on a write that cannot be undone.
    for (const cmd of ["help-now", "forget", "migrate"])
      expect(/AskUserQuestion/.test(read(`commands/${cmd}.md`)), `/${cmd} asks in plain text on purpose`).toBe(false);
    // The person choosing *words* sees them in the preview pane.
    expect(/`preview`/.test(read("skills/keep/SKILL.md")), "the verbatim passage belongs in preview").toBe(true);
    const persona = read("skills/claudia/SKILL.md");
    expect(/^allowed-tools:.*\bAskUserQuestion\b/m.test(persona), "pre-approved, to avoid mid-session prompts").toBe(
      true,
    );
    expect(
      /Buttons for decisions/i.test(persona),
      "the persona is the only always-loaded file — the rule must live there",
    ).toBe(true);
  });

  it("ADR-0027 — the menu is pulled by the person, never opened on them", () => {
    const menu = read("commands/menu.md");
    expect(/^allowed-tools:.*\bAskUserQuestion\b/m.test(menu), "the picker is the whole point").toBe(true);
    expect(/Never open it unprompted/i.test(menu)).toBe(true);
    expect(
      /never at the opening/i.test(read("skills/claudia/SKILL.md")),
      "the persona may name /menu, never open it",
    ).toBe(true);
    expect(/never a feature list/i.test(menu), "a menu of skills would make her a list of features").toBe(true);
    expect(/always the open door/i.test(menu), "the menu must stay declinable from inside").toBe(true);
    expect(/dated list of past sessions/i.test(menu), "memory is not an archive to browse (ADR-0004)").toBe(true);
    expect(/^allowed-tools:(?!.*\b(Write|Edit)\b)/m.test(menu), "a view onto memory, never a write to it").toBe(true);
    expect(/AskUserQuestion/.test(read("skills/recall/SKILL.md")), "recall must open in plain text").toBe(false);
  });

  it("ADR-0026 — showing is not publishing, and crisis never sends a file", () => {
    expect(
      /Showing is not\s+publishing/i.test(read("CONTEXT.md")),
      "the Deliverable glossary entry must carry the distinction",
    ).toBe(true);
    expect(
      /SendUserFile/.test(read("skills/crisis/SKILL.md")),
      "stay with the person; a download card is a detour",
    ).toBe(false);
  });

  it("attribution — gains are theirs, setbacks are not (docs/competencies/attribution.md)", () => {
    // Marlatt's abstinence violation effect: attributing a lapse to internal,
    // stable, global causes is what turns it into a relapse. A symmetric "fair"
    // attribution is the harmful one, so the doc must say it is deliberate.
    const doc = readFileSync(path.join(root, "docs/competencies/attribution.md"), "utf8");
    expect(/[Nn]ever run it backwards/.test(doc)).toBe(true);
    expect(/asymmetry is deliberate/.test(doc)).toBe(true);
    expect(/[Nn]ever refuse credit that is offered/.test(doc)).toBe(true);
    expect(/congruence/i.test(doc), "the reason is congruence, not politeness").toBe(true);
    expect(/attribution\.md/.test(read("docs/competencies/README.md")), "the library index lists it").toBe(true);
    // The only always-loaded file — the ADR-0018 lesson.
    const persona = read("skills/claudia/SKILL.md");
    expect(/competencies\/attribution\.md/.test(persona)).toBe(true);
    expect(/needing me less/.test(persona), "the persona should name what this is for").toBe(true);
  });

  it("ADR-0033 — the handover is the person's note, carried by them, never a gate to help", () => {
    const skill = read("skills/handover/SKILL.md");
    // The provenance line is the one line that is not the person's to remove —
    // safety-floor rule 1 at the receiving end.
    expect(/an AI companion \(not a clinician\)/.test(skill), "the header text must be shown").toBe(true);
    expect(/not optional and not removable/.test(skill)).toBe(true);
    // Pre-ticking was proposed and rejected (Planet49): her judgment lives in what
    // makes the list, never in a default state.
    expect(/[Nn]othing is pre-selected/.test(skill)).toBe(true);
    expect(/type: handover/.test(skill), "the skill should show its block").toBe(true);
    expect(/[Nn]ever write a `?session:`? key/.test(skill), "must forbid inventing a stem").toBe(true);
    expect(
      /handover/.test(read("scripts/finish-distillation.mjs")),
      "finish-distillation must not learn about handovers",
    ).toBe(false);
    expect(/[Nn]ever send it anywhere yourself/.test(skill)).toBe(true);
    expect(/display: 'attach'/.test(skill), "a take-away, like a worksheet (ADR-0026)").toBe(true);
    expect(/sessions\/handovers/.test(read("docs/adr/0026-showing-the-deliverable.md")), "the surface table row").toBe(
      true,
    );
    expect(/the work with you has been enough/.test(skill), "never assesses whether she has sufficed").toBe(true);
    expect(/referral goes first/.test(skill)).toBe(true);
    expect(/never a precondition for getting help/.test(skill)).toBe(true);
    const referOnly = readFileSync(path.join(root, "docs/approaches/refer-only.md"), "utf8");
    expect(/handover/.test(referOnly), "recognise → refer used to stop here").toBe(true);
    expect(/never before/.test(referOnly)).toBe(true);
    const persona = read("skills/claudia/SKILL.md");
    expect(/`handover`/.test(persona), "the persona knows it exists").toBe(true);
    expect(/ADR-0033/.test(persona)).toBe(true);
    expect(/clinician-to-clinician/.test(read("CONTEXT.md")), "the glossary fences the clinical sense").toBe(true);
  });

  it("ADR-0025 — identity is stamped by code, judgment stays the model's half", () => {
    const distill = read("skills/distill-session/SKILL.md");
    expect(/finish-distillation\.mjs/.test(distill), "distill-session must close via the script").toBe(true);
    expect(
      /rm -f[^\n]*pending-summary/.test(distill),
      "the bare rm -f must be gone — it was the enforcement point",
    ).toBe(false);
    expect(/people:/.test(distill) && /themes:/.test(distill)).toBe(true);
    expect(/ratified/i.test(distill), "themes: must be ratified threads only (ADR-0015)").toBe(true);
    expect(/[Nn]o safety key/.test(distill), "no safety facet in frontmatter (ADR-0019 symmetry)").toBe(true);
    for (const s of ["skills/exercise/SKILL.md", "skills/teach/SKILL.md"]) {
      const skill = read(s);
      expect(/type: (exercise|teaching)/.test(skill), `${s} should show its block`).toBe(true);
      expect(/[Nn]ever write a `?session:`? key/.test(skill), `${s} must forbid inventing a stem`).toBe(true);
    }
    const mod = read("src/frontmatter.mjs");
    expect(/malformed/.test(mod), "a block it cannot read is left untouched").toBe(true);
    expect(/export function stampIdentity/.test(mod)).toBe(true);
    expect(
      /export function serializeFrontmatter/.test(mod),
      "a general serializer would defeat the line-surgery guarantee",
    ).toBe(false);
    // Dates stay day-grained: the day helper is the exported API, and the
    // layout doc carries the rule sentence.
    expect(typeof localDay, "src/time.mjs must keep exporting the day helper").toBe("function");
    expect(
      /never timestamps/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8")),
      "the day-grain rule must stay written down",
    ).toBe(true);
  });

  it("ADR-0028 — settings go through one module, and nothing configurable lowers the floor", () => {
    // The state this ADR replaced: two scripts each parsing the file inline, with
    // the default living only in an `=== false` check.
    for (const s of ["scripts/save-session.mjs", "scripts/build-dashboard.mjs", "scripts/config.mjs"]) {
      const txt = read(s);
      expect(/from "\.\.\/src\/config\.mjs"/.test(txt), `${s} should import the settings module`).toBe(true);
      expect(/JSON\.parse\([^)]*config\.json/.test(txt), `${s} must not parse config.json itself`).toBe(false);
    }
    const command = read("commands/config.md");
    expect(/config\.mjs" --set/.test(command), "/config changes a setting through the script").toBe(true);
    expect(/^allowed-tools:(?!.*\b(Write|Edit)\b)/m.test(command), "no direct write to config.json").toBe(true);
    // Emoji defaults off; the register rule lives in the always-loaded persona —
    // the fail-safe direction, since the setting only ever loosens it.
    // Not a restatement of the settings table (pinned once, in src/config.test.ts):
    // what is guarded here is the *direction* — the strict side is the default, so a
    // compaction that drops `emoji: true` falls back to plain, never to loose.
    expect(defaults().emoji, "the setting may only ever loosen the persona's rule").toBe(false);
    const persona = read("skills/claudia/SKILL.md");
    expect(/without emoji/i.test(persona), "the persona must carry the register rule").toBe(true);
    expect(/emoji/i.test(read("SOUL.md")), "and the soul, as congruence").toBe(true);
    const recall = read("skills/recall/SKILL.md");
    expect(/config\.mjs/.test(recall), "recall reads the settings before the first sentence").toBe(true);
    expect(/never read it back|never recite/i.test(recall), "settings are honoured silently, like memory").toBe(true);
    const adr = read("docs/adr/0028-settings.md");
    expect(/lower the floor/i.test(adr), "the ADR must state the limit").toBe(true);
    expect(/no free-text style key/i.test(adr), "a free-text persona override is a way through the floor").toBe(true);
    expect(/never nudge/i.test(command), "a preference is not a symptom to explore").toBe(true);
  });

  it("ADR-0030 — consultation secrecy is by construction: one tool, no filesystem", () => {
    const p = path.join(root, "agents/consult.md");
    expect(existsSync(p)).toBe(true);
    const txt = readFileSync(p, "utf8");
    // The allowlist is the guarantee: WebSearch alone — no filesystem, no MCP,
    // so ~/.claudia is unreachable no matter what the prompt is talked into.
    const tools = txt.match(/^tools:\s*(.+)$/m)?.[1] ?? "";
    expect(tools.trim(), "consult must grant exactly WebSearch").toBe("WebSearch");
    expect(/neither confirm nor deny/i.test(txt), "the clinical stance must be stated").toBe(true);
  });
});
