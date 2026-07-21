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

  it("ships exactly the three commands", () => {
    const cmds = walk(path.join(root, "commands"), (p) => p.endsWith(".md"))
      .map((p) => path.basename(p))
      .sort();
    expect(cmds).toEqual(["export.md", "forget.md", "help-now.md"]);
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

describe("delegation (ephemeral specialists)", () => {
  it("the persona can delegate backroom work, bounded away from the relationship/crisis", () => {
    const persona = readFileSync(path.join(root, "skills/claudia/SKILL.md"), "utf8");
    expect(/Task/.test(persona), "persona should use the Task tool to delegate").toBe(true);
    expect(/never delegate the relationship or a crisis/i.test(persona), "delegation must be bounded").toBe(true);
    expect(/^allowed-tools:.*\bTask\b/m.test(persona), "Task should be pre-approved to avoid mid-session prompts").toBe(true);
  });
});

describe("documentation links resolve", () => {
  it("every relative .md link points to an existing file", () => {
    const mdFiles = walk(root, (p) => p.endsWith(".md"));
    const linkRe = /\]\(([^)]+?\.md)(#[^)]*)?\)/g;
    const broken = [];
    for (const f of mdFiles) {
      const txt = readFileSync(f, "utf8");
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
