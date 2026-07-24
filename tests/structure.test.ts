/**
 * Repo integrity — the plugin's structure stays valid and its docs don't rot.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

// Manifest shapes — only the fields these tests assert on.
type PluginManifest = { name?: string; hooks?: unknown };
type MarketplaceManifest = { name?: string; plugins: Array<{ source?: string }> };
type HooksManifest = { hooks: Record<string, unknown> };

describe("manifests", () => {
  it("plugin.json is valid and names the plugin", () => {
    const m: PluginManifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
    expect(m.name).toBe("claudia");
  });

  it("plugin.json does NOT declare hooks (hooks/hooks.json is auto-discovered)", () => {
    const m: PluginManifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
    expect(m.hooks).toBeUndefined();
  });

  it("marketplace.json is valid with a single-plugin './' source", () => {
    const m: MarketplaceManifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin/marketplace.json"), "utf8"));
    expect(m.name).toBe("claudia");
    expect(m.plugins.length).toBeGreaterThan(0);
    expect(m.plugins[0]!.source).toBe("./");
  });

  it("hooks.json wires UserPromptSubmit + SessionEnd", () => {
    const h: HooksManifest = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8"));
    expect(Object.keys(h.hooks)).toEqual(expect.arrayContaining(["UserPromptSubmit", "SessionEnd"]));
  });
});

describe("components", () => {
  it("every skill has name + description frontmatter", () => {
    const skills = walk(path.join(root, "skills"), (p) => p.endsWith("SKILL.md"));
    expect(skills.length).toBeGreaterThan(0);
    for (const s of skills) {
      const txt = readFileSync(s, "utf8");
      expect(txt.startsWith("---"), `${s} missing frontmatter`).toBe(true);
      expect(/^name:\s*\S+/m.test(txt), `${s} missing name`).toBe(true);
      expect(/^description:\s*\S+/m.test(txt), `${s} missing description`).toBe(true);
    }
  });

  it("ships exactly the eleven commands", () => {
    const cmds = walk(path.join(root, "commands"), (p) => p.endsWith(".md"))
      .map((p) => path.basename(p))
      .sort();
    expect(cmds).toEqual([
      "backup.md",
      "config.md",
      "dashboard.md",
      "export.md",
      "forget.md",
      "help-now.md",
      "keep.md",
      "menu.md",
      "migrate.md",
      "save.md",
      "thread.md",
    ]);
  });
});

describe("README stays in sync with the command surface", () => {
  // The gap that let /thread ship undocumented: commands/ was guarded (above)
  // and updated, but nothing tied the README's Commands table — or its prose
  // count — back to it, so the README kept saying "three". These assert that
  // link, so the docs can't drift on the next command added or removed (the
  // README must be current before each merge).
  const commands = walk(path.join(root, "commands"), (p) => p.endsWith(".md"))
    .map((p) => "/" + path.basename(p, ".md"))
    .sort();
  const readme = readFileSync(path.join(root, "README.md"), "utf8");

  it("the Commands table lists exactly the shipped commands", () => {
    const tabled = [...readme.matchAll(/^\|\s*`(\/[a-z-]+)`\s*\|/gm)].map((m) => m[1]).sort();
    expect(tabled).toEqual(commands);
  });

  it("every '<n> commands' count in the prose matches how many ship", () => {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
    const expected = words[commands.length];
    expect(expected, `extend words[] past ${commands.length}`).toBeDefined();
    const counts = [
      ...readme.matchAll(
        /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven)\s+(?:slash\s+)?commands?\b/gi,
      ),
    ].map((m) => m[1]!.toLowerCase());
    expect(counts.length, "README should state the command count").toBeGreaterThan(0);
    for (const w of counts) expect(w).toBe(expected);
  });
});

describe("rotating vault archive (ADR-0032)", () => {
  it("ships the pass, the timer installer and the ADR", () => {
    expect(existsSync(path.join(root, "scripts/vault-backup.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "scripts/install-backup-timer.sh"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0032-vault-backups.md"))).toBe(true);
  });

  it("snapshots at SessionEnd, after the dashboard rebuild", () => {
    // Order matters: it must capture the distilled state, not the state before
    // save-session and build-dashboard wrote to it.
    const h = readFileSync(path.join(root, "hooks/hooks.json"), "utf8");
    const end = JSON.parse(h).hooks.SessionEnd[0].hooks.map((x: { command: string }) => x.command);
    expect(end.at(-1)).toMatch(/vault-backup\.mjs/);
    expect(end.at(-1)).toMatch(/--quiet/); // benign layer: never fails a session
    expect(end.at(-1)).toMatch(/--detach/); // and never makes the person wait on one
  });

  it("/forget leaves the archives alone — a backup a routine command can destroy is not one", () => {
    const forget = readFileSync(path.join(root, "commands/forget.md"), "utf8");
    expect(/--purge/.test(forget), "/forget must not purge the archive set").toBe(false);
    expect(/never touch .*claudia-backups/i.test(forget)).toBe(true);
  });

  it("/forget says what is true about the copies it does not touch", () => {
    // The price of leaving archives alone is that the command must stop claiming a
    // permanence it no longer delivers.
    const forget = readFileSync(path.join(root, "commands/forget.md"), "utf8");
    expect(/rotate out/.test(forget), "must say the older copies persist").toBe(true);
    expect(/\/backup/.test(forget), "and where the person can clear them").toBe(true);
  });

  it("never mines an archive to undo a forgetting", () => {
    // This behavioural rule is what makes leaving the archives alone compatible with
    // honouring the deletion. It has to exist in both places that can reach one.
    for (const f of ["commands/forget.md", "commands/backup.md"]) {
      const txt = readFileSync(path.join(root, f), "utf8");
      expect(/chose to forget/i.test(txt), `${f} must carry the never-retrieve rule`).toBe(true);
    }
  });

  it("is refusable, like every other copy the plugin keeps", () => {
    const cfg = readFileSync(path.join(root, "src/config.mjs"), "utf8");
    expect(/^\s+backups: \{/m.test(cfg)).toBe(true);
  });

  it("is disclosed inside the existing first-run breath, not as its own prompt", () => {
    const remember = readFileSync(path.join(root, "skills/remember/SKILL.md"), "utf8");
    expect(/claudia-backups/.test(remember), "the archive must be disclosed at all").toBe(true);
    expect(/same breath/.test(remember), "and folded into the one disclosure that exists").toBe(true);
  });

  it("keeps the background job out of the conversation", () => {
    // A companion that asks to install system things stops feeling like a companion.
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/launchd|launchctl|backup-timer/i.test(persona)).toBe(false);
    const cmd = readFileSync(path.join(root, "commands/backup.md"), "utf8");
    expect(/never raise it mid-conversation/i.test(cmd)).toBe(true);
  });

  it("is recorded in the memory layout", () => {
    const layout = readFileSync(path.join(root, "docs/memory-layout.md"), "utf8");
    expect(/claudia-backups/.test(layout)).toBe(true);
  });
});

describe("self-authoring (ADR-0006)", () => {
  it("ships the adversarial auditor as a READ-ONLY agent", () => {
    const p = path.join(root, "agents/skill-auditor.md");
    expect(existsSync(p)).toBe(true);
    const txt = readFileSync(p, "utf8");
    expect(/disallowedTools:.*Write/i.test(txt), "auditor must not be able to write skills").toBe(true);
  });

  it("ships the author-skill meta-skill", () => {
    expect(existsSync(path.join(root, "skills/author-skill/SKILL.md"))).toBe(true);
  });

  it("the persona knows it can author skills (self-concept, not just capability)", () => {
    const soul = readFileSync(path.join(root, "SOUL.md"), "utf8");
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/grow|build myself|extend yourself/i.test(soul), "SOUL should express self-extension").toBe(true);
    expect(/author-skill/.test(persona), "persona should point to author-skill").toBe(true);
  });

  it("quarantine is separate from the load path", () => {
    // proposed-skills/ holds drafts and is NOT under skills/ (the only load path),
    // so a draft is inert until promoted.
    expect(existsSync(path.join(root, "proposed-skills"))).toBe(true);
    expect(existsSync(path.join(root, "skills/proposed-skills"))).toBe(false);
  });
});

describe("opening ritual", () => {
  it("greets by name, checks in on a still-open thread, handles first-timers, skips resolved", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/still.?open/i.test(persona), "opening should target a still-open thread").toBe(true);
    expect(/by name/i.test(persona), "opening should greet by name").toBe(true);
    expect(/First time/i.test(persona), "opening should handle first-timers").toBe(true);
    expect(/resolved/i.test(persona), "opening should not re-raise resolved threads").toBe(true);
  });

  it("recall surfaces anticipated events (follow-ups) and skips resolved ones", () => {
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/anticipat/i.test(recall)).toBe(true);
    expect(/resolved/i.test(recall)).toBe(true);
  });

  it("the persona is reachable by name (model-invocation trigger)", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/names Claudia|talk to Claudia|@Claudia/i.test(persona)).toBe(true);
  });
});

describe("delegation (ephemeral specialists)", () => {
  it("the persona can delegate backroom work, bounded away from the relationship/crisis", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/Task/.test(persona), "persona should use the Task tool to delegate").toBe(true);
    expect(/never delegate the relationship or a crisis/i.test(persona), "delegation must be bounded").toBe(true);
    expect(/^allowed-tools:.*\bTask\b/m.test(persona), "Task should be pre-approved to avoid mid-session prompts").toBe(
      true,
    );
  });
});

describe("working understanding (ADR-0008)", () => {
  it("ships the understand skill and the ADR", () => {
    expect(existsSync(path.join(root, "skills/understand/SKILL.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0008-working-understanding.md"))).toBe(true);
  });

  it("recall loads it, held provisionally", () => {
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/understanding\.md/.test(recall)).toBe(true);
    expect(/provisional|hold it lightly|hypothesis/i.test(recall)).toBe(true);
  });

  it("the persona holds it lightly, reflects it back, and stays anti-dependency", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/working understanding/i.test(persona)).toBe(true);
    expect(/does that fit/i.test(persona)).toBe(true);
    expect(/need you.{0,8}less/i.test(persona), "must be designed against dependency").toBe(true);
  });

  it("stays out of clinical framing (glossary + skill)", () => {
    const ctx = readFileSync(path.join(root, "CONTEXT.md"), "utf8");
    expect(/Working understanding/.test(ctx)).toBe(true);
    expect(/_Avoid_.*(formulation|dossier|clinical)/i.test(ctx)).toBe(true);
    const skill = readFileSync(path.join(root, "skills/understand/SKILL.md"), "utf8");
    expect(/no diagnosis/i.test(skill)).toBe(true);
  });

  it("is recorded in the memory layout", () => {
    const layout = readFileSync(path.join(root, "docs/memory-layout.md"), "utf8");
    expect(/understanding\.md/.test(layout)).toBe(true);
  });
});

describe("curiosity & intake (ADR-0009)", () => {
  it("ships the intake skill, the ADR, and the cited reference doc", () => {
    expect(existsSync(path.join(root, "skills/intake/SKILL.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0009-curiosity-and-intake.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/competencies/curiosity-and-questions.md"))).toBe(true);
  });

  it("the persona is reflection-led but actively curious, and offers intake", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/reflection-led/i.test(persona), "must stay reflection-led").toBe(true);
    expect(/never three questions in a\s+row/i.test(persona), "anti-interrogation dosage").toBe(true);
    expect(/intake/i.test(persona), "persona should offer the intake").toBe(true);
  });

  it("intake is offered (declinable) and yields to safety", () => {
    const intake = readFileSync(path.join(root, "skills/intake/SKILL.md"), "utf8");
    expect(/declinable/i.test(intake)).toBe(true);
    expect(/crisis/i.test(intake)).toBe(true);
  });
});

describe("relationship map (ADR-0010)", () => {
  it("ships the relationships skill and the ADR", () => {
    expect(existsSync(path.join(root, "skills/relationships/SKILL.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0010-relationship-map.md"))).toBe(true);
  });

  it("uses mermaid and stays non-judgmental about third parties", () => {
    const skill = readFileSync(path.join(root, "skills/relationships/SKILL.md"), "utf8");
    expect(/mermaid/i.test(skill)).toBe(true);
    expect(/non-judgmental/i.test(skill)).toBe(true);
    expect(/accusatory/i.test(skill) && /never/i.test(skill), "no clinical/accusatory labels on third parties").toBe(
      true,
    );
  });

  it("is recorded in the memory layout and surfaced by recall", () => {
    expect(/people\.md/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
    expect(/people\.md/.test(readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8"))).toBe(true);
  });
});

describe("person fiches (ADR-0011)", () => {
  it("ships the ADR and the common template", () => {
    expect(existsSync(path.join(root, "docs/adr/0011-person-fiches.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/person-fiche-template.md"))).toBe(true);
  });

  it("relationships maintains fiches, cross-linked, transcript only via summary", () => {
    const skill = readFileSync(path.join(root, "skills/relationships/SKILL.md"), "utf8");
    expect(/per-person fiches/i.test(skill)).toBe(true);
    expect(/relative markdown link/i.test(skill)).toBe(true);
    expect(/only through/i.test(skill), "reach a transcript only through its summary").toBe(true);
  });

  it("export runs the vault export pass", () => {
    expect(/vault-export\.mjs/.test(readFileSync(path.join(root, "commands/export.md"), "utf8"))).toBe(true);
  });

  it("the template stays a mirror, not a dossier", () => {
    const tmpl = readFileSync(path.join(root, "docs/person-fiche-template.md"), "utf8");
    expect(/mirror/i.test(tmpl) && /never a dossier/i.test(tmpl)).toBe(true);
  });
});

describe("life timeline (ADR-0014)", () => {
  it("ships the timeline skill and the ADR", () => {
    expect(existsSync(path.join(root, "skills/timeline/SKILL.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0014-life-timeline.md"))).toBe(true);
  });

  it("is person-led, trauma-informed; dated-list canonical, mermaid optional", () => {
    const skill = readFileSync(path.join(root, "skills/timeline/SKILL.md"), "utf8");
    expect(/never force/i.test(skill), "never force a chronological trauma inventory").toBe(true);
    expect(/never infer/i.test(skill), "never infer unstated events").toBe(true);
    expect(/sectioned list/i.test(skill), "dated sectioned list is canonical").toBe(true);
    expect(/optional/i.test(skill) && /mermaid/i.test(skill), "mermaid is an optional view").toBe(true);
  });

  it("is recorded in the memory layout", () => {
    expect(/timeline\.md/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
  });
});

describe("to-do-later surface (ADR-0018)", () => {
  it("ships the todo skill and the ADR", () => {
    expect(existsSync(path.join(root, "skills/todo/SKILL.md"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0018-todo-surface.md"))).toBe(true);
  });

  it("the persona points to it — the trigger that makes it reachable mid-session", () => {
    // The guard that was missing at v0.3.0: the surface was wired into
    // recall/remember/distill, but the always-loaded persona never mentioned it,
    // so asking Claudia to "create a todo" mid-conversation routed nowhere. A
    // wired-but-untriggerable capability is invisible until found by hand — this
    // asserts the reachability, not just the plumbing.
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/todo/i.test(persona), "persona should point to the todo capability").toBe(true);
  });

  it("recall reads it and memory-layout records it", () => {
    expect(/todo\.md/.test(readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8"))).toBe(true);
    expect(/todo\.md/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
  });
});

describe("dashboard mirror (ADR-0019)", () => {
  it("ships the command, the script, the pure module, and the ADR", () => {
    expect(existsSync(path.join(root, "commands/dashboard.md"))).toBe(true);
    expect(existsSync(path.join(root, "scripts/build-dashboard.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "src/dashboard.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0019-dashboard.md"))).toBe(true);
  });

  it("is rebuilt at SessionEnd and at the tail of recall (a zero-lag mirror)", () => {
    const h: HooksManifest = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8"));
    expect(/build-dashboard\.mjs/.test(JSON.stringify(h.hooks.SessionEnd)), "SessionEnd should rebuild it").toBe(true);
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/build-dashboard\.mjs/.test(recall), "recall should rebuild after deferred distillation").toBe(true);
  });

  it("is a mirror that transcludes or points — never summarises prose", () => {
    const adr = readFileSync(path.join(root, "docs/adr/0019-dashboard.md"), "utf8");
    expect(/never summarise|linked, never excerpted/i.test(adr)).toBe(true);
    const mod = readFileSync(path.join(root, "src/dashboard.mjs"), "utf8");
    expect(/transclude/i.test(mod) && /never/i.test(mod)).toBe(true);
  });

  it("never mirrors safety.md (no risk profile at a glance)", () => {
    const adr = readFileSync(path.join(root, "docs/adr/0019-dashboard.md"), "utf8");
    expect(/deliberately absent/i.test(adr)).toBe(true);
    const script = readFileSync(path.join(root, "scripts/build-dashboard.mjs"), "utf8");
    expect(/"safety\.md"/.test(script), "the builder must not read safety.md").toBe(false);
  });

  it("is disclosed once (remember) and refusable via config.json", () => {
    expect(/dashboard/i.test(readFileSync(path.join(root, "skills/remember/SKILL.md"), "utf8"))).toBe(true);
    const script = readFileSync(path.join(root, "scripts/build-dashboard.mjs"), "utf8");
    expect(/cfg\.dashboard === false/.test(script)).toBe(true);
    // Through the declared reader, not an inline JSON.parse (ADR-0028).
    expect(/parseConfig/.test(script), "the opt-out reads the shared settings module").toBe(true);
  });

  it("is recorded in the memory layout and the glossary (non-dossier)", () => {
    expect(/dashboard\.md/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
    const ctx = readFileSync(path.join(root, "CONTEXT.md"), "utf8");
    expect(/\*\*Dashboard\*\*/.test(ctx)).toBe(true);
    expect(/_Avoid_.*(dossier|profile|clinical)/i.test(ctx)).toBe(true);
  });
});

describe("vault migrations (ADR-0020)", () => {
  it("ships the command, the runner, the registry, and the first migration", () => {
    expect(existsSync(path.join(root, "commands/migrate.md"))).toBe(true);
    expect(existsSync(path.join(root, "scripts/migrate-vault.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "src/migrations/index.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "src/migrations/0001-wikilinks-to-relative.mjs"))).toBe(true);
  });

  it("is auto-applied at recall as background upkeep, and disclosed when it acts", () => {
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/migrate-vault\.mjs/.test(recall), "recall should run the migration runner").toBe(true);
    expect(/disclose/i.test(recall), "recall must disclose when it migrates").toBe(true);
  });

  it("backs up first and never touches the verbatim transcript", () => {
    const runner = readFileSync(path.join(root, "scripts/migrate-vault.mjs"), "utf8");
    expect(/\.bak-/.test(runner), "runner takes a backup before writing").toBe(true);
    expect(/transcript\.md/.test(runner), "runner excludes *.transcript.md").toBe(true);
  });

  it("migrations are pure, idempotent transforms behind an ordered registry", () => {
    const idx = readFileSync(path.join(root, "src/migrations/index.mjs"), "utf8");
    expect(/migrations\s*=\s*\[/.test(idx), "registry exports an ordered list").toBe(true);
    const m = readFileSync(path.join(root, "src/migrations/0001-wikilinks-to-relative.mjs"), "utf8");
    expect(/export function migrate/.test(m) && /idempotent/i.test(m)).toBe(true);
  });

  it("ships the ADR and is recorded in the layout + glossary", () => {
    expect(existsSync(path.join(root, "docs/adr/0020-vault-migrations.md"))).toBe(true);
    expect(/\.migrations/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
    expect(/\*\*Migration\*\*/.test(readFileSync(path.join(root, "CONTEXT.md"), "utf8"))).toBe(true);
  });
});

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

describe("the choice UI (ADR-0024)", () => {
  it("ships the ADR and the glossary entry", () => {
    expect(existsSync(path.join(root, "docs/adr/0024-the-choice-ui.md"))).toBe(true);
    expect(/\*\*Choice UI\*\*/.test(readFileSync(path.join(root, "CONTEXT.md"), "utf8"))).toBe(true);
  });

  it("is declared wherever it is used", () => {
    // The gap at v0.9.0: `quiz` was built end-to-end on AskUserQuestion while its
    // allowed-tools said `Read Write Bash`, so the choice UI raised a permission
    // prompt mid-quiz — immersion broken at the worst moment. Same reasoning as the
    // `Task` assertion above, applied to every surface rather than one file.
    const undeclared = undeclaredUsers("AskUserQuestion");
    expect(undeclared, `uses AskUserQuestion without declaring it:\n${undeclared.join("\n")}`).toEqual([]);
  });

  it("stays out of the exploratory skills", () => {
    // The half that protects the therapeutic side. A menu pre-writes the answers,
    // so these surfaces ask openly, permanently: getting to know someone, ratifying
    // a theme, walking a life timeline, checking a relationship map, and crisis.
    const exploratory = ["intake", "themes", "timeline", "relationships", "understand", "crisis"];
    for (const name of exploratory) {
      const txt = readFileSync(path.join(root, `skills/${name}/SKILL.md`), "utf8");
      expect(/AskUserQuestion/.test(txt), `${name} must ask openly, not with options (ADR-0024)`).toBe(false);
    }
  });

  it("keep shows the words in the preview pane, not squeezed into a description", () => {
    // The person is choosing *words*; `preview` is the only field with room for them.
    const keep = readFileSync(path.join(root, "skills/keep/SKILL.md"), "utf8");
    expect(/`preview`/.test(keep), "the verbatim passage belongs in preview (ADR-0024)").toBe(true);
  });

  it("the persona carries the rule and is pre-approved for it", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/^allowed-tools:.*\bAskUserQuestion\b/m.test(persona), "pre-approved, to avoid mid-session prompts").toBe(
      true,
    );
    expect(
      /Buttons for decisions/i.test(persona),
      "the persona is the only always-loaded file — the rule must live there",
    ).toBe(true);
  });

  it("crisis and the irreversible commands keep their plain-text asks", () => {
    // Non-goals with reasons (ADR-0024): /help-now is "not the moment for
    // exploration", and friction is protective on a write that cannot be undone.
    for (const cmd of ["help-now", "forget", "migrate"]) {
      const txt = readFileSync(path.join(root, `commands/${cmd}.md`), "utf8");
      expect(/AskUserQuestion/.test(txt), `/${cmd} asks in plain text on purpose (ADR-0024)`).toBe(false);
    }
  });
});

describe("the pulled menu (ADR-0027)", () => {
  const menu = readFileSync(path.join(root, "commands/menu.md"), "utf8");

  it("ships the command, the ADR and the glossary entry", () => {
    expect(existsSync(path.join(root, "docs/adr/0027-the-menu.md"))).toBe(true);
    expect(/\*\*Menu\*\*/.test(readFileSync(path.join(root, "CONTEXT.md"), "utf8"))).toBe(true);
    expect(/^allowed-tools:.*\bAskUserQuestion\b/m.test(menu), "the picker is the whole point").toBe(true);
  });

  it("is pulled, never opened on the person", () => {
    // This is the single fact that makes a picker legitimate here and forbidden at
    // the opening (ADR-0024): the person asked to be shown, so nothing is pre-written.
    expect(/Never open it unprompted/i.test(menu)).toBe(true);
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/never at the opening/i.test(persona), "the persona may name /menu, never open it").toBe(true);
  });

  it("stays the person's own material, with the open door always on it", () => {
    expect(/never a feature list/i.test(menu), "a menu of skills would make her a list of features").toBe(true);
    expect(/always the open door/i.test(menu), "the menu must stay declinable from inside").toBe(true);
    expect(/dated list of past sessions/i.test(menu), "memory is not an archive to browse (ADR-0004)").toBe(true);
  });

  it("is a view onto memory, never a write to it", () => {
    expect(/^allowed-tools:(?!.*\b(Write|Edit)\b)/m.test(menu), "reads only, like the dashboard mirror").toBe(true);
  });

  it("leaves the opening ritual in plain text", () => {
    // recall earns one specific check-in from the person's own files; a picker there
    // would displace it with a generic list — the ADR's first half.
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/AskUserQuestion/.test(recall), "recall must open in plain text (ADR-0027)").toBe(false);
  });
});

describe("showing a deliverable (ADR-0026)", () => {
  it("ships the ADR, and the glossary knows saving from showing", () => {
    expect(existsSync(path.join(root, "docs/adr/0026-showing-the-deliverable.md"))).toBe(true);
    const ctx = readFileSync(path.join(root, "CONTEXT.md"), "utf8");
    expect(/\*\*Deliverable\*\*/.test(ctx)).toBe(true);
    expect(/Showing is not\s+publishing/i.test(ctx), "the Deliverable entry must carry the distinction").toBe(true);
  });

  it("is declared wherever it is used", () => {
    const undeclared = undeclaredUsers("SendUserFile");
    expect(undeclared, `uses SendUserFile without declaring it:\n${undeclared.join("\n")}`).toEqual([]);
  });

  it("never pushes — 'proactive' may be forbidden, never instructed", () => {
    // The hard non-goal. `status: 'proactive'` pushes a notification to the person's
    // phone; Claudia shows a file because they are already here, never to bring them
    // back. Same refusal as scheduled check-ins (ADR-0012, "Presence, not
    // surveillance"), and the one a future change is most likely to reach for.
    //
    // A flat ban on the word would gag the persona, which has to *name* the thing it
    // forbids. So the rule is semantic: every mention must be negated close by.
    const instructed: string[] = [];
    for (const s of surfaces) {
      for (const m of s.body.matchAll(/proactive/gi)) {
        const preceding = s.body.slice(Math.max(0, m.index - 60), m.index);
        if (!/\bnever\b|\bnot\b|\bno\b/i.test(preceding)) instructed.push(`${s.rel}:${m.index}`);
      }
    }
    expect(instructed, `Claudia never initiates contact (ADR-0026):\n${instructed.join("\n")}`).toEqual([]);
  });

  it("crisis never sends a file", () => {
    const crisis = readFileSync(path.join(root, "skills/crisis/SKILL.md"), "utf8");
    expect(/SendUserFile/.test(crisis), "stay with the person; a download card is a detour").toBe(false);
  });

  it("Artifact stays refused — showing is not publishing", () => {
    // Artifact mints a durable, shareable URL: a persistent copy outside the machine,
    // which is exactly what ADR-0007 rejected with the remote connector.
    const publishing = surfaces.filter((s) => /\bArtifact\b/.test(s.body)).map((s) => s.rel);
    expect(publishing, `nothing leaves the machine (ADR-0007):\n${publishing.join("\n")}`).toEqual([]);
    const adr = readFileSync(path.join(root, "docs/adr/0026-showing-the-deliverable.md"), "utf8");
    expect(/Artifact/.test(adr), "the ADR must record why it is refused").toBe(true);
  });
});

describe("the handover note (ADR-0033)", () => {
  const skillPath = path.join(root, "skills/handover/SKILL.md");

  it("ships the skill, the ADR, and the glossary entry", () => {
    expect(existsSync(skillPath)).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0033-handover-note.md"))).toBe(true);
    const ctx = readFileSync(path.join(root, "CONTEXT.md"), "utf8");
    expect(/\*\*Handover\*\*/.test(ctx)).toBe(true);
    expect(/clinician-to-clinician/.test(ctx), "the Avoid line must fence the clinical sense").toBe(true);
  });

  it("the provenance line is required and cannot be cut", () => {
    // The one line on the page that is not the person's to remove. Without it the note
    // reads as correspondence from a peer to a professional with no other way to know
    // what produced it — safety-floor rule 1 at the receiving end.
    const skill = readFileSync(skillPath, "utf8");
    expect(/an AI companion \(not a clinician\)/.test(skill), "the header text must be shown").toBe(true);
    expect(/not optional and not removable/.test(skill)).toBe(true);
  });

  it("nothing is pre-selected — a default is not a choice", () => {
    // Pre-ticking was proposed and rejected (ADR-0033, Planet49): her judgment lives in
    // what makes the list and in the reason under it, never in a default state.
    const skill = readFileSync(skillPath, "utf8");
    expect(/[Nn]othing is pre-selected/.test(skill)).toBe(true);
  });

  it("never invents a stem, and is never stamped with one either", () => {
    const skill = readFileSync(skillPath, "utf8");
    expect(/type: handover/.test(skill), "the skill should show its block").toBe(true);
    expect(/[Nn]ever write a `?session:`? key/.test(skill), "must forbid inventing a stem").toBe(true);
    // The deliberate non-extension: the closing script's regex knows exercises and
    // teachings only. A handover leaves the machine, and the opaque stem means nothing
    // to the person who receives it.
    const script = readFileSync(path.join(root, "scripts/finish-distillation.mjs"), "utf8");
    expect(/handover/.test(script), "finish-distillation must not learn about handovers").toBe(false);
  });

  it("Claudia never carries it further than the person", () => {
    const skill = readFileSync(skillPath, "utf8");
    expect(/[Nn]ever send it anywhere yourself/.test(skill)).toBe(true);
    expect(/display: 'attach'/.test(skill), "a take-away, like a worksheet (ADR-0026)").toBe(true);
    const adr = readFileSync(path.join(root, "docs/adr/0026-showing-the-deliverable.md"), "utf8");
    expect(/sessions\/handovers/.test(adr), "the surface table must carry the row").toBe(true);
  });

  it("never assesses whether the work with Claudia has sufficed", () => {
    // Dropped deliberately: asking "am I still useful to you?" puts the person in the
    // position of reassuring or dismissing her (ADR-0033, and Ivey via ADR-0024).
    const skill = readFileSync(skillPath, "utf8");
    expect(/the work with you has been enough/.test(skill), "the refusal must be written down").toBe(true);
  });

  it("the referral goes first — the note never delays help", () => {
    const skill = readFileSync(skillPath, "utf8");
    expect(/referral goes first/.test(skill)).toBe(true);
    expect(/never a precondition for getting help/.test(skill)).toBe(true);
    const referOnly = readFileSync(path.join(root, "docs/approaches/refer-only.md"), "utf8");
    expect(/handover/.test(referOnly), "recognise → refer used to stop here").toBe(true);
    expect(/never before/.test(referOnly)).toBe(true);
  });

  it("the persona knows it exists — the ADR-0018 lesson", () => {
    // A capability documented everywhere except skills/claudia/SKILL.md is invisible in
    // practice, because that is the only always-loaded file.
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/`handover`/.test(persona)).toBe(true);
    expect(/ADR-0033/.test(persona)).toBe(true);
  });
});

describe("frontmatter contract (ADR-0025)", () => {
  it("ships the ADR, the pure module, the closing script, and the repair migration", () => {
    expect(existsSync(path.join(root, "docs/adr/0025-frontmatter-contract.md"))).toBe(true);
    expect(existsSync(path.join(root, "src/frontmatter.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "scripts/finish-distillation.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "src/migrations/0002-vault-frontmatter.mjs"))).toBe(true);
  });

  it("identity is stamped by code — distill-session runs the script, never a bare rm", () => {
    const skill = readFileSync(path.join(root, "skills/distill-session/SKILL.md"), "utf8");
    expect(/finish-distillation\.mjs/.test(skill), "distill-session must close via the script").toBe(true);
    expect(/rm -f[^\n]*pending-summary/.test(skill), "the bare rm -f must be gone — it was the enforcement point").toBe(
      false,
    );
  });

  it("the model is told it writes only the judgment half", () => {
    const skill = readFileSync(path.join(root, "skills/distill-session/SKILL.md"), "utf8");
    expect(/people:/.test(skill) && /themes:/.test(skill)).toBe(true);
    expect(/ratified/i.test(skill), "themes: must be ratified threads only (ADR-0015)").toBe(true);
    expect(/[Nn]o safety key/.test(skill), "no safety facet in frontmatter (ADR-0019 symmetry)").toBe(true);
  });

  it("deliverables never invent a stem — the value comes from the close", () => {
    for (const s of ["skills/exercise/SKILL.md", "skills/teach/SKILL.md"]) {
      const skill = readFileSync(path.join(root, s), "utf8");
      expect(/type: (exercise|teaching)/.test(skill), `${s} should show its block`).toBe(true);
      expect(/[Nn]ever write a `?session:`? key/.test(skill), `${s} must forbid inventing a stem`).toBe(true);
    }
  });

  it("writing is conservative — a block it cannot read is left untouched", () => {
    const mod = readFileSync(path.join(root, "src/frontmatter.mjs"), "utf8");
    expect(/malformed/.test(mod)).toBe(true);
    expect(/export function stampIdentity/.test(mod)).toBe(true);
    expect(
      /export function serializeFrontmatter/.test(mod),
      "a general serializer would defeat the line-surgery guarantee",
    ).toBe(false);
  });

  it("dates stay day-grained, and the layout records the contract", () => {
    expect(/export function localDay/.test(readFileSync(path.join(root, "src/time.mjs"), "utf8"))).toBe(true);
    const layout = readFileSync(path.join(root, "docs/memory-layout.md"), "utf8");
    expect(/ADR-0025/.test(layout)).toBe(true);
    expect(/never timestamps/.test(layout)).toBe(true);
    expect(/\*\*Frontmatter contract\*\*/.test(readFileSync(path.join(root, "CONTEXT.md"), "utf8"))).toBe(true);
  });
});

describe("the person's settings (ADR-0028)", () => {
  const command = readFileSync(path.join(root, "commands/config.md"), "utf8");
  const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");

  it("ships the command, the script, the pure module, and the ADR", () => {
    expect(existsSync(path.join(root, "commands/config.md"))).toBe(true);
    expect(existsSync(path.join(root, "scripts/config.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "src/config.mjs"))).toBe(true);
    expect(existsSync(path.join(root, "docs/adr/0028-settings.md"))).toBe(true);
  });

  it("every reader goes through the one module — no ad-hoc JSON.parse of config.json", () => {
    // The state this ADR replaced: two scripts each parsing the file inline, with the
    // default living only in an `=== false` check and nothing declaring the key set.
    for (const s of ["scripts/save-session.mjs", "scripts/build-dashboard.mjs", "scripts/config.mjs"]) {
      const txt = readFileSync(path.join(root, s), "utf8");
      expect(/from "\.\.\/src\/config\.mjs"/.test(txt), `${s} should import the settings module`).toBe(true);
      expect(/JSON\.parse\([^)]*config\.json/.test(txt), `${s} must not parse config.json itself`).toBe(false);
    }
  });

  it("the write path is deterministic — the model never hand-edits the JSON", () => {
    // A model rewriting the file is how an unknown key (or the rest of it) disappears.
    expect(/config\.mjs" --set/.test(command), "/config changes a setting through the script").toBe(true);
    expect(/^allowed-tools:(?!.*\b(Write|Edit)\b)/m.test(command), "no direct write to config.json").toBe(true);
  });

  it("emoji is off by default, and the rule lives in the always-loaded persona", () => {
    // Config is read at recall; the persona is loaded always. Putting the rule there
    // means a session that never reads the file still writes plainly — the fail-safe
    // direction, since the setting only ever *loosens* it.
    expect(/emoji:\s*\{\s*\n\s*default:\s*false/.test(readFileSync(path.join(root, "src/config.mjs"), "utf8"))).toBe(
      true,
    );
    expect(/without emoji/i.test(persona), "the persona must carry the register rule").toBe(true);
    expect(/emoji/i.test(readFileSync(path.join(root, "SOUL.md"), "utf8")), "and the soul, as congruence").toBe(true);
  });

  it("recall loads the settings before the first sentence, and never recites them", () => {
    const recall = readFileSync(path.join(root, "skills/recall/SKILL.md"), "utf8");
    expect(/config\.mjs/.test(recall), "recall should read the settings").toBe(true);
    expect(/never read it back|never recite/i.test(recall), "settings are honoured silently, like memory").toBe(true);
  });

  it("nothing configurable can lower the safety floor", () => {
    const adr = readFileSync(path.join(root, "docs/adr/0028-settings.md"), "utf8");
    expect(/lower the floor/i.test(adr), "the ADR must state the limit").toBe(true);
    expect(/no free-text style key/i.test(adr), "a free-text persona override is a way through the floor").toBe(true);
    expect(/never nudge/i.test(command), "a preference is not a symptom to explore").toBe(true);
  });

  it("is recorded in the layout and the glossary", () => {
    expect(/config\.json/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
    expect(/\*\*Settings\*\*/.test(readFileSync(path.join(root, "CONTEXT.md"), "utf8"))).toBe(true);
  });
});

describe("documentation links resolve", () => {
  it("every relative .md link points to an existing file", () => {
    const mdFiles = walk(root, (p) => p.endsWith(".md"));
    const linkRe = /\]\(([^)]+?\.md)(#[^)]*)?\)/g;
    const broken: string[] = [];
    for (const f of mdFiles) {
      // Strip code (fenced + inline) so example link-syntax isn't link-checked.
      // Code spans must pair by backtick-run length (CommonMark): a span opened with
      // N backticks closes on a run of exactly N. The naive /`[^`]*`/ mis-paired on a
      // span *containing* a longer run — the CHANGELOG's inline ` ```mermaid ` — and
      // every link after it in the file silently lost its code-span shield, surfacing
      // documented `~/.claudia/` paths (`Marie.md`) as broken repo links.
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
          broken.push(`${path.relative(root, f)} -> ${target}`);
        }
      }
    }
    expect(broken, `broken links:\n${broken.join("\n")}`).toEqual([]);
  });
});

describe("consultation (ADR-0030)", () => {
  it("ships the consult agent with a one-tool allowlist (secrecy by construction)", () => {
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
