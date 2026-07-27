/**
 * Closing a distillation: identity gets stamped by code, and the marker is cleared
 * only once that succeeded.
 */
import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { finishDistillation } from "../scripts/finish-distillation.mjs";

const roots: string[] = [];
afterEach(async () => {
  for (const r of roots.splice(0)) await fs.rm(r, { recursive: true, force: true });
});

async function makeVault(files: Record<string, string>): Promise<string> {
  const root = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "claudia-")), ".claudia");
  roots.push(path.dirname(root));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
  return root;
}

const read = (root: string, rel: string) => fs.readFile(path.join(root, rel), "utf8");
const exists = (root: string, rel: string) =>
  fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);

// What save-session leaves behind: the identity block it computed from the transcript.
const MARKER =
  "---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21, 2026-07-22]\n---\nneeds distillation\n";
const STEM = "2026-07-21-9113d5d7";

describe("finishDistillation()", () => {
  it("stamps identity onto a summary that carries only the judgment half", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "---\npeople: [Liliana]\n---\n\n# Séance\n\nLe fil.\n",
      [`sessions/${STEM}.pending-summary`]: MARKER,
    });
    expect(await finishDistillation({ root, stem: STEM })).toBe("stamped");
    expect(await read(root, `sessions/${STEM}.summary.md`)).toBe(
      "---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21, 2026-07-22]\npeople: [Liliana]\n---\n\n# Séance\n\nLe fil.\n",
    );
  });

  it("writes the whole block when the model wrote none at all", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "# Séance\n",
      [`sessions/${STEM}.pending-summary`]: MARKER,
    });
    await finishDistillation({ root, stem: STEM });
    expect(await read(root, `sessions/${STEM}.summary.md`)).toBe(
      "---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21, 2026-07-22]\n---\n# Séance\n",
    );
  });

  it("clears the marker — the state machine closes", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "# Séance\n",
      [`sessions/${STEM}.pending-summary`]: MARKER,
    });
    await finishDistillation({ root, stem: STEM });
    expect(await exists(root, `sessions/${STEM}.pending-summary`)).toBe(false);
  });

  it("KEEPS the marker when there is no summary — the session is still owed one", async () => {
    const root = await makeVault({ [`sessions/${STEM}.pending-summary`]: MARKER });
    expect(await finishDistillation({ root, stem: STEM })).toBe("no-summary");
    expect(await exists(root, `sessions/${STEM}.pending-summary`)).toBe(true);
  });

  it("prefers the marker's computed dates over anything already in the summary", async () => {
    const root = await makeVault({
      // The model guessed a single day; the transcript's timestamps say otherwise.
      [`sessions/${STEM}.summary.md`]: "---\ndates: [2026-07-21]\n---\nbody\n",
      [`sessions/${STEM}.pending-summary`]: MARKER,
    });
    await finishDistillation({ root, stem: STEM });
    expect(await read(root, `sessions/${STEM}.summary.md`)).toContain("dates: [2026-07-21, 2026-07-22]");
  });

  it("falls back to the stem's date only when nothing better exists (live-at-close)", async () => {
    const root = await makeVault({ [`sessions/${STEM}.summary.md`]: "body\n" }); // no marker
    await finishDistillation({ root, stem: STEM });
    expect(await read(root, `sessions/${STEM}.summary.md`)).toBe(
      "---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21]\n---\nbody\n",
    );
  });

  it("never lets that fallback overwrite a multi-day dates the model wrote", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "---\ndates: [2026-07-21, 2026-07-22]\n---\nbody\n",
    });
    await finishDistillation({ root, stem: STEM });
    expect(await read(root, `sessions/${STEM}.summary.md`)).toContain("dates: [2026-07-21, 2026-07-22]");
  });

  it("is idempotent, and reports when there was nothing to change", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]:
        "---\ntype: session\nsession: 2026-07-21-9113d5d7\ndates: [2026-07-21]\n---\nbody\n",
    });
    expect(await finishDistillation({ root, stem: STEM })).toBe("unchanged");
    expect(await finishDistillation({ root, stem: STEM })).toBe("unchanged");
  });

  it("leaves a summary whose block it could not read untouched, marker and all", async () => {
    const broken = "---\ntype: session\n\n# no closing fence\n";
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: broken,
      [`sessions/${STEM}.pending-summary`]: MARKER,
    });
    await finishDistillation({ root, stem: STEM });
    expect(await read(root, `sessions/${STEM}.summary.md`)).toBe(broken);
  });

  it("stamps a deliverable with the stem it could not have known when it wrote it", async () => {
    const rel = "sessions/exercises/2026-07-23-prediction-nest-pas-verdict.md";
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "body\n",
      [`sessions/${STEM}.pending-summary`]: MARKER,
      [rel]: "# Prédiction ≠ verdict\n\nLe contenu.\n",
    });
    await finishDistillation({ root, stem: STEM, deliverables: [rel] });
    expect(await read(root, rel)).toBe(
      "---\ntype: exercise\ncreated: 2026-07-23\nslug: prediction-nest-pas-verdict\nsession: 2026-07-21-9113d5d7\n---\n# Prédiction ≠ verdict\n\nLe contenu.\n",
    );
  });

  it("corrects a deliverable that already guessed a stem", async () => {
    const rel = "sessions/exercises/2026-07-23-quiz.md";
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "body\n",
      [rel]: "---\ntype: exercise\ncreated: 2026-07-23\nslug: quiz\nsession: 2026-07-23-9113d5d7\n---\nbody\n",
    });
    await finishDistillation({ root, stem: STEM, deliverables: [rel] });
    expect(await read(root, rel)).toContain(`session: ${STEM}`);
  });

  it("writes nothing outside sessions/{exercises,teachings}", async () => {
    const root = await makeVault({
      [`sessions/${STEM}.summary.md`]: "body\n",
      "person.md": "---\ntype: person-model\n---\nmine\n",
      "sessions/teachings/2026-07-23-anxiety.md": "explainer\n",
    });
    await finishDistillation({
      root,
      stem: STEM,
      deliverables: ["person.md", "../escape.md", "sessions/teachings/2026-07-23-anxiety.md"],
    });
    expect(await read(root, "person.md")).toBe("---\ntype: person-model\n---\nmine\n");
    expect(await read(root, "sessions/teachings/2026-07-23-anxiety.md")).toContain("type: teaching");
  });

  it("refuses an empty stem rather than guessing at a file", async () => {
    const root = await makeVault({ [`sessions/${STEM}.summary.md`]: "body\n" });
    expect(await finishDistillation({ root, stem: "" })).toBe("no-stem");
    expect(await read(root, `sessions/${STEM}.summary.md`)).toBe("body\n");
  });
});
