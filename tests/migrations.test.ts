import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrations } from "../src/migrations/index.mjs";
import { migrate, id } from "../src/migrations/0001-wikilinks-to-relative.mjs";
import { migrate as migrate0002, id as id0002 } from "../src/migrations/0002-vault-frontmatter.mjs";
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
  it("registers them in ledger order", () => {
    expect(migrations[0]!.id).toBe("0001-wikilinks-to-relative");
    expect(id).toBe("0001-wikilinks-to-relative");
    expect(migrations[1]!.id).toBe("0002-vault-frontmatter");
    expect(id0002).toBe("0002-vault-frontmatter");
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

// The real drift this migration was written for: two summaries with no block at all,
// a `session:` meaning the bare id here and the full stem there, and exercise stems
// pointing at sessions that never existed.
const drifted = (): Record<string, string> => ({
  "sessions/2026-07-21-9113d5d7.summary.md":
    "---\ntype: session\nsession: 9113d5d7\ndates: [2026-07-21, 2026-07-22]\npeople: [Liliana]\n---\n\n# Séance\n\nLe fil.\n",
  "sessions/2026-07-23-042d64f7.summary.md": "# Séance — 2026-07-23 (042d64f7)\n\nSéance courte.\n",
  "sessions/2026-07-21-9113d5d7.transcript.md": "verbatim, never rewritten\n",
  "sessions/exercises/2026-07-22-un-sentiment.md":
    "---\ntype: exercise\ncreated: 2026-07-22\nslug: un-sentiment\nsession: 2026-07-22-9113d5d7\n---\n\n# Un sentiment\n",
  "sessions/exercises/2026-07-23-prediction.md": "# Prédiction ≠ verdict\n",
  "person.md": "---\ntype: person-model\nlast_reflected: 2026-07-22\n---\nnot this migration's business\n",
});

describe("0002 — identity frontmatter", () => {
  it("gives a summary that had no block one derived from its filename", () => {
    const out = migrate0002(drifted());
    expect(out["sessions/2026-07-23-042d64f7.summary.md"]).toBe(
      "---\ntype: session\nsession: 2026-07-23-042d64f7\ndates: [2026-07-23]\n---\n# Séance — 2026-07-23 (042d64f7)\n\nSéance courte.\n"
    );
  });

  it("closes the `session:` ambiguity — the bare id becomes the stem", () => {
    const out = migrate0002(drifted());
    expect(out["sessions/2026-07-21-9113d5d7.summary.md"]).toContain("session: 2026-07-21-9113d5d7");
  });

  it("never rewrites a `dates:` the distiller wrote — a session can span midnight", () => {
    const out = migrate0002(drifted());
    expect(out["sessions/2026-07-21-9113d5d7.summary.md"]).toContain("dates: [2026-07-21, 2026-07-22]");
  });

  it("leaves the judgment half and the body byte-identical", () => {
    const out = migrate0002(drifted());
    const next = out["sessions/2026-07-21-9113d5d7.summary.md"]!;
    expect(next).toContain("people: [Liliana]");
    expect(next.endsWith("---\n\n# Séance\n\nLe fil.\n")).toBe(true);
  });

  it("repairs a dead deliverable stem through its short id", () => {
    const out = migrate0002(drifted());
    // 2026-07-22-9113d5d7 never existed; 9113d5d7 was first seen on the 21st.
    expect(out["sessions/exercises/2026-07-22-un-sentiment.md"]).toContain("session: 2026-07-21-9113d5d7");
  });

  it("resolves a bare short id in a deliverable too", () => {
    const files = { ...drifted(), "sessions/exercises/x.md": "---\nsession: 9113d5d7\n---\n" };
    expect(migrate0002(files)["sessions/exercises/x.md"]).toContain("session: 2026-07-21-9113d5d7");
  });

  it("never guesses: an ambiguous or unknown short id is left alone", () => {
    const ambiguous = {
      "sessions/2026-07-21-abc.summary.md": "---\n---\n",
      "sessions/2026-07-22-abc.summary.md": "---\n---\n",
      "sessions/exercises/2026-07-23-e.md": "---\ntype: exercise\ncreated: 2026-07-23\nslug: e\nsession: 2026-07-30-abc\n---\n",
    };
    expect(migrate0002(ambiguous)["sessions/exercises/2026-07-23-e.md"]).toBeUndefined();
    const unknown = { "sessions/exercises/2026-07-23-e.md": "---\ntype: exercise\ncreated: 2026-07-23\nslug: e\nsession: 2026-07-30-zzz\n---\n" };
    expect(migrate0002(unknown)).toEqual({});
  });

  it("does not invent a `session:` for a deliverable that has none", () => {
    const out = migrate0002(drifted());
    const next = out["sessions/exercises/2026-07-23-prediction.md"]!;
    expect(next).toBe("---\ntype: exercise\ncreated: 2026-07-23\nslug: prediction\n---\n# Prédiction ≠ verdict\n");
    expect(next).not.toContain("session:");
  });

  it("owns only summaries and deliverables — the transcript and root notes are untouched", () => {
    const out = migrate0002(drifted());
    expect(out["sessions/2026-07-21-9113d5d7.transcript.md"]).toBeUndefined();
    expect(out["person.md"]).toBeUndefined();
  });

  it("refuses to touch a block whose fence never closes", () => {
    expect(migrate0002({ "sessions/2026-07-21-abc.summary.md": "---\ntype: session\n\n# oops\n" })).toEqual({});
  });

  it("is idempotent — a second pass yields no changes", () => {
    const files = drifted();
    const applied = { ...files, ...migrate0002(files) };
    expect(migrate0002(applied)).toEqual({});
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
    // ledger + backup — every migration it ran is recorded, in registry order
    expect((await read(root, ".migrations")).trim().split("\n")).toEqual(migrations.map((m) => m.id));
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
    expect((await read(root, ".migrations")).trim().split("\n")).toEqual(migrations.map((m) => m.id));
    // no backup sibling was created
    const siblings = await fs.readdir(parent);
    expect(siblings.some((s) => s.startsWith(".claudia.bak-"))).toBe(false);
  });

  it("reports absent when the vault does not exist", async () => {
    const r = await runMigrations({ root: path.join(os.tmpdir(), "claudia-does-not-exist-xyz") });
    expect(r.status).toBe("absent");
  });

  // The registry is injectable (test seam) so we can exercise the runner against a
  // migration shape the real registry does not have yet: one that CREATES a file.
  const creator = {
    id: "9999-create-greeting",
    description: "fake migration that creates a file absent from the vault",
    migrate: (): Record<string, string> => ({ "greeting.md": "hello\n" }),
  };

  it("dry-run renders a created file as pure additions (before is the empty string)", async () => {
    const { root } = await makeVault({ "MEMORY.md": "hi\n" });
    const r = await runMigrations({ root, dry: true, migrations: [creator] });
    expect(r.status).toBe("dry");
    expect(r.diffs).toEqual([{ rel: "greeting.md", before: "", after: "hello\n" }]);
    expect(await has(root, "greeting.md")).toBe(false); // dry run writes nothing
  });

  it("applies a migration that creates a file, backing the vault up first", async () => {
    const { root } = await makeVault({ "MEMORY.md": "hi\n" });
    const r = await runMigrations({ root, migrations: [creator] });
    expect(r.status).toBe("applied");
    expect(await read(root, "greeting.md")).toBe("hello\n");
    expect((await read(root, ".migrations")).trim()).toBe("9999-create-greeting");
    // The backup snapshot predates the write: it holds the original vault and NOT the
    // created file — proof the backup was taken before any change landed.
    expect(r.backup).toBeTruthy();
    expect(await read(r.backup!, "MEMORY.md")).toBe("hi\n"); // (`!` safe: toBeTruthy above)
    expect(await has(r.backup!, "greeting.md")).toBe(false);
  });
});

describe("migrate-vault CLI — failure after the backup", () => {
  const parents: string[] = [];
  afterEach(async () => {
    for (const p of parents.splice(0)) await fs.rm(p, { recursive: true, force: true });
  });

  it("exits 1 with a plain restore hint instead of an unhandled rejection", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "claudia-"));
    parents.push(parent);
    const root = path.join(parent, ".claudia");
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, "MEMORY.md"), "- [[Liliana]]\n");
    // `.migrations` as a *directory*: readLedger tolerates it (EISDIR → empty ledger), so
    // the run proceeds — backup, rewrite — then the post-apply ledger write throws EISDIR.
    // That reproduces a failure AFTER the backup exists, mid-way through the apply path.
    await fs.mkdir(path.join(root, ".migrations"));

    const script = fileURLToPath(new URL("../scripts/migrate-vault.mjs", import.meta.url));
    const r = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Migration failed");
    expect(r.stderr).toContain("partially migrated");
    expect(r.stderr).toContain(".bak-"); // points at the restorable backup folder
    // Hedged phrasing: a failure can also land BEFORE fs.cp, where no backup exists —
    // the message must never assert one does.
    expect(r.stderr).toContain("If a folder named");
    expect(r.stderr).not.toContain("UnhandledPromiseRejection");
  });
});
