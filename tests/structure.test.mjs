/**
 * Repo integrity — the plugin's structure stays valid and its docs don't rot.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, filter) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, filter));
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

describe("manifests", () => {
  it("plugin.json is valid and names the plugin", () => {
    const m = JSON.parse(readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
    expect(m.name).toBe("claudia");
  });

  it("plugin.json does NOT declare hooks (hooks/hooks.json is auto-discovered)", () => {
    const m = JSON.parse(readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8"));
    expect(m.hooks).toBeUndefined();
  });

  it("marketplace.json is valid with a single-plugin './' source", () => {
    const m = JSON.parse(readFileSync(path.join(root, ".claude-plugin/marketplace.json"), "utf8"));
    expect(m.name).toBe("claudia");
    expect(m.plugins.length).toBeGreaterThan(0);
    expect(m.plugins[0].source).toBe("./");
  });

  it("hooks.json wires UserPromptSubmit + SessionEnd", () => {
    const h = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8"));
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

  it("ships exactly the five commands", () => {
    const cmds = walk(path.join(root, "commands"), (p) => p.endsWith(".md"))
      .map((p) => path.basename(p))
      .sort();
    expect(cmds).toEqual(["dashboard.md", "export.md", "forget.md", "help-now.md", "thread.md"]);
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
    const tabled = [...readme.matchAll(/^\|\s*`(\/[a-z-]+)`\s*\|/gm)]
      .map((m) => m[1])
      .sort();
    expect(tabled).toEqual(commands);
  });

  it("every '<n> commands' count in the prose matches how many ship", () => {
    const words = ["zero", "one", "two", "three", "four", "five", "six",
      "seven", "eight", "nine", "ten"];
    const expected = words[commands.length];
    expect(expected, `extend words[] past ${commands.length}`).toBeDefined();
    const counts = [...readme.matchAll(
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:slash\s+)?commands?\b/gi,
    )].map((m) => m[1].toLowerCase());
    expect(counts.length, "README should state the command count").toBeGreaterThan(0);
    for (const w of counts) expect(w).toBe(expected);
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
    expect(/^allowed-tools:.*\bTask\b/m.test(persona), "Task should be pre-approved to avoid mid-session prompts").toBe(true);
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
    expect(/accusatory/i.test(skill) && /never/i.test(skill), "no clinical/accusatory labels on third parties").toBe(true);
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

  it("relationships maintains fiches, wiki-linked, transcript only via summary", () => {
    const skill = readFileSync(path.join(root, "skills/relationships/SKILL.md"), "utf8");
    expect(/per-person fiches/i.test(skill)).toBe(true);
    expect(/wikilink/i.test(skill)).toBe(true);
    expect(/only through/i.test(skill), "reach a transcript only through its summary").toBe(true);
  });

  it("export runs the wikilink→relative export pass", () => {
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
    const h = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8"));
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
    expect(/cfg\.dashboard === false/.test(readFileSync(path.join(root, "scripts/build-dashboard.mjs"), "utf8"))).toBe(true);
  });

  it("is recorded in the memory layout and the glossary (non-dossier)", () => {
    expect(/dashboard\.md/.test(readFileSync(path.join(root, "docs/memory-layout.md"), "utf8"))).toBe(true);
    const ctx = readFileSync(path.join(root, "CONTEXT.md"), "utf8");
    expect(/\*\*Dashboard\*\*/.test(ctx)).toBe(true);
    expect(/_Avoid_.*(dossier|profile|clinical)/i.test(ctx)).toBe(true);
  });
});

describe("documentation links resolve", () => {
  it("every relative .md link points to an existing file", () => {
    const mdFiles = walk(root, (p) => p.endsWith(".md"));
    const linkRe = /\]\(([^)]+?\.md)(#[^)]*)?\)/g;
    const broken = [];
    for (const f of mdFiles) {
      // Strip code (fenced + inline) so example link-syntax isn't link-checked.
      const txt = readFileSync(f, "utf8")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]*`/g, "");
      let m;
      while ((m = linkRe.exec(txt))) {
        const target = m[1];
        if (/^https?:/.test(target)) continue;
        if (!existsSync(path.resolve(path.dirname(f), target))) {
          broken.push(`${path.relative(root, f)} -> ${target}`);
        }
      }
    }
    expect(broken, `broken links:\n${broken.join("\n")}`).toEqual([]);
  });
});
