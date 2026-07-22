import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrations } from "../src/migrations/index.mjs";
import { migrate, id } from "../src/migrations/0001-wikilinks-to-relative.mjs";
import { runMigrations } from "../scripts/migrate-vault.mjs";

// A compact fixture vault exercising every resolution branch.
const fixture = (): Record<string, string> => ({
  "MEMORY.md": "← [[MEMORY]]\n- [[Liliana]] · [[themes]] · [[etre-rabaisse]]\n",
  "themes.md": "← [[MEMORY]]\n## Candidats (vus sur [[2026-07-21-abc]])\n- **[[etre-rabaisse]]** — the wound\n- see [[the inner critic]]\n",
  "people/Liliana.md":
    '---\ntype: person\nthemes: ["[[etre-rabaisse]]", "[[trust]]"]\n---\n← [[MEMORY]]\nsee [[2026-07-21-abc]] and [[Marie]]\n',
  "people/Marie.md": "# Marie\n",
  "sessions/2026-07-21-abc.summary.md": '---\npeople: ["[[Liliana]]"]\n---\nwith [[Liliana]]\n',
  "sessions/2026-07-21-abc.transcript.md": "verbatim [[Liliana]] stays untouched\n",
  "todo.md": "the tag `[[<date>-id>]]` at the end\n- task · [[2026-07-21-abc]]\n",
  "themes/the inner critic.md": "sibling [[what steadies me]] · [[Liliana]] · [[2026-07-21-abc]]\n",
});

describe("migration registry", () => {
  it("exposes an ordered list of {id, description, migrate}", () => {
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations.length).toBeGreaterThanOrEqual(1);
    for (const m of migrations) {
      expect(typeof m.id).toBe("string");
      expect(typeof m.description).toBe("string");
      expect(typeof m.migrate).toBe("function");
    }
  });
  it("registers 0001 first", () => {
    expect(migrations[0]!.id).toBe("0001-wikilinks-to-relative");
    expect(id).toBe("0001-wikilinks-to-relative");
  });
});

describe("0001 — wikilinks → relative links", () => {
  it("resolves root files, people, and themes-index fallback", () => {
    const out = migrate(fixture());
    expect(out["MEMORY.md"]).toBe("← [MEMORY](MEMORY.md)\n- [Liliana](people/Liliana.md) · [themes](themes.md) · [etre-rabaisse](themes.md)\n");
  });

  it("computes paths from each file's own directory", () => {
    const out = migrate(fixture());
    expect(out["people/Liliana.md"]).toContain("← [MEMORY](../MEMORY.md)");
    expect(out["people/Liliana.md"]).toContain("[2026-07-21-abc](../sessions/2026-07-21-abc.summary.md)");
    expect(out["people/Liliana.md"]).toContain("[Marie](Marie.md)");
    expect(out["sessions/2026-07-21-abc.summary.md"]).toContain("with [Liliana](../people/Liliana.md)");
  });

  it("flattens frontmatter list wikilinks to plain names", () => {
    const out = migrate(fixture());
    expect(out["people/Liliana.md"]).toContain("themes: [etre-rabaisse, trust]");
    expect(out["sessions/2026-07-21-abc.summary.md"]).toContain("people: [Liliana]");
  });

  it("keeps a theme slug as plain text at its define-site in themes.md", () => {
    const out = migrate(fixture());
    expect(out["themes.md"]).toContain("- **etre-rabaisse** — the wound");
    expect(out["themes.md"]).toContain("(vus sur [2026-07-21-abc](sessions/2026-07-21-abc.summary.md))");
  });

  it("wraps space-bearing destinations in angle brackets", () => {
    const out = migrate(fixture());
    expect(out["themes.md"]).toContain("[the inner critic](<themes/the inner critic.md>)");
    // display text may contain spaces; a space-free destination stays bare
    expect(out["themes/the inner critic.md"]).toContain("[what steadies me](../themes.md)");
  });

  it("rewrites the literal [[<date>-id>]] format placeholder", () => {
    const out = migrate(fixture());
    expect(out["todo.md"]).toContain("the tag `[<stem>](sessions/<stem>.summary.md)` at the end");
  });

  it("never touches the verbatim transcript", () => {
    const out = migrate(fixture());
    expect(out).not.toHaveProperty("sessions/2026-07-21-abc.transcript.md");
  });

  it("is idempotent — a second pass yields no changes", () => {
    const files = fixture();
    const applied = { ...files, ...migrate(files) };
    expect(migrate(applied)).toEqual({});
  });

  it("is a no-op on a vault with no wikilinks", () => {
    expect(migrate({ "a.md": "# already [clean](b.md)\n", "b.md": "hi\n" })).toEqual({});
  });
});

describe("runMigrations() — the fs runner", () => {
  const parents: string[] = [];
  afterEach(async () => {
    for (const p of parents.splice(0)) await fs.rm(p, { recursive: true, force: true });
  });

  // A vault at <tmp>/.claudia so its backup sibling (<tmp>/.claudia.bak-*) is cleaned too.
  async function makeVault(files: Record<string, string>): Promise<{ parent: string; root: string }> {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-"));
    parents.push(parent);
    const root = path.join(parent, ".claudia");
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(root, rel);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content);
    }
    return { parent, root };
  }

  const withLinks = (): Record<string, string> => ({
    "MEMORY.md": "- [[Liliana]] · [[2026-07-21-abc]]\n",
    "people/Liliana.md": "see [[2026-07-21-abc]]\n",
    "sessions/2026-07-21-abc.summary.md": "with [[Liliana]]\n",
    "sessions/2026-07-21-abc.transcript.md": "verbatim [[Liliana]] stays\n",
  });

  const read = (root: string, rel: string): Promise<string> => fs.readFile(path.join(root, rel), "utf8");
  const has = (root: string, rel: string): Promise<boolean> =>
    fs
      .access(path.join(root, rel))
      .then(() => true)
      .catch(() => false);

  it("dry-run previews changes and writes nothing", async () => {
    const { root } = await makeVault(withLinks());
    const r = await runMigrations({ root, dry: true });
    expect(r.status).toBe("dry");
    expect(r.changed).toContain("MEMORY.md");
    expect(r.changed).not.toContain("sessions/2026-07-21-abc.transcript.md");
    expect(await read(root, "MEMORY.md")).toContain("[[Liliana]]"); // untouched on disk
    expect(await has(root, ".migrations")).toBe(false);
  });

  it("applies: backs up, rewrites, records the ledger, leaves the transcript verbatim", async () => {
    const { root } = await makeVault(withLinks());
    const r = await runMigrations({ root });
    expect(r.status).toBe("applied");
    // rewritten
    expect(await read(root, "MEMORY.md")).toBe("- [Liliana](people/Liliana.md) · [2026-07-21-abc](sessions/2026-07-21-abc.summary.md)\n");
    expect(/\[\[/.test(await read(root, "people/Liliana.md"))).toBe(false);
    // transcript untouched
    expect(await read(root, "sessions/2026-07-21-abc.transcript.md")).toBe("verbatim [[Liliana]] stays\n");
    // ledger + backup
    expect((await read(root, ".migrations")).trim()).toBe("0001-wikilinks-to-relative");
    expect(r.backup).toBeTruthy();
    expect(await read(r.backup!, "MEMORY.md")).toContain("[[Liliana]]"); // backup keeps the original (`!` safe: toBeTruthy above)
  });

  it("is a no-op on the second run (ledger + idempotency)", async () => {
    const { root } = await makeVault(withLinks());
    await runMigrations({ root });
    const again = await runMigrations({ root });
    expect(again.status).toBe("noop");
    expect(again.backup).toBeNull();
  });

  it("records pending-but-unchanged migrations without a backup (hand-migrated vault)", async () => {
    const { root, parent } = await makeVault({ "MEMORY.md": "- [Liliana](people/Liliana.md)\n" });
    const r = await runMigrations({ root });
    expect(r.status).toBe("nochange");
    expect(r.backup).toBeNull();
    expect((await read(root, ".migrations")).trim()).toBe("0001-wikilinks-to-relative");
    // no backup sibling was created
    const siblings = await fs.readdir(parent);
    expect(siblings.some((s) => s.startsWith(".claudia.bak-"))).toBe(false);
  });

  it("reports absent when the vault does not exist", async () => {
    const r = await runMigrations({ root: path.join(os.tmpdir(), "claudia-does-not-exist-xyz") });
    expect(r.status).toBe("absent");
  });
});
