/**
 * The mirror's invariants (ADR-0019) — never its voice.
 *
 * ADR-0019 decided what `dashboard.md` *is*: a derived file that only
 * **transcludes** what a source already says or **points** at it with a relative
 * link, never summarises; a section whose source is absent is omitted rather
 * than left dangling; a present-but-unparsable source degrades to an honest
 * pointer. Those are the properties asserted here — over every language the
 * settings declare at once — and the wording that carries them is
 * implementation, free to move. Reword a heading, a glue word or the day format
 * and this file stays green.
 *
 * ADR-0029 names those per-language strings (`22/07` in French, `Jul 22` in
 * English) as the string table's business, and what it *binds* is guarded here
 * structurally rather than by literal: the declared value list is exactly the set
 * of shipped tables, and no two languages render the same document.
 *
 * The two literals in {@link PROVENANCE} are the deliberate exception: that line
 * is where the file tells the person it is a mirror and that their real notes
 * live elsewhere, so rewording it changes what the document *claims to be*.
 *
 * On disk — every link resolving to a real vault file, the prose surfaces left
 * unexcerpted, `safety.md` never mirrored — is pinned at the seam, in
 * ../scripts/build-dashboard.test.ts.
 */
import { describe, it, expect } from "vitest";
import {
  listItems,
  sectionItems,
  quoteBlocks,
  mermaidBlock,
  personName,
  sessionsForMirror,
  cadence,
  buildDashboard,
} from "./dashboard.mjs";
import type { DashboardInput, MirrorSession } from "./dashboard.mjs";
import { SETTINGS } from "./config.mjs";
import type { MirrorLanguage } from "./config.mjs";

describe("listItems()", () => {
  it("transcludes bullet / numbered / checkbox lines verbatim, right-trimmed", () => {
    const md: string =
      "# Objectifs\n\n- retrouver le sommeil  \n* parler à Sixtine\n1. bouger un peu\n- [ ] respirer\n\nprose ignorée";
    expect(listItems(md)).toEqual([
      "- retrouver le sommeil",
      "* parler à Sixtine",
      "1. bouger un peu",
      "- [ ] respirer",
    ]);
    expect(listItems(md, { max: 2 })).toEqual(["- retrouver le sommeil", "* parler à Sixtine"]);
  });
  it("captures a WRAPPED bullet in full — never truncates to a dangling half-sentence", () => {
    // The real-data bug: a goal spilling onto the next physical line was cut at line 1.
    const md: string =
      "- **Séparer ce que je ressens de l'intention qu'on me prête** — et l'offrir aussi dans\nla relation, pas seulement dans ma tête.\n- **M'autoriser la colère**";
    expect(listItems(md)).toEqual([
      "- **Séparer ce que je ressens de l'intention qu'on me prête** — et l'offrir aussi dans\nla relation, pas seulement dans ma tête.",
      "- **M'autoriser la colère**",
    ]);
  });
});

describe("sectionItems()", () => {
  it("scopes to the matched heading, stops at the next one, and finds nothing when none matches", () => {
    const todo: string =
      "# À faire\n\n## Ouvert\n- [ ] rappeler le médecin · [2026-07-21-abc](sessions/2026-07-21-abc.summary.md)\n- [ ] écrire à Sixtine\n\n## Fait\n- [x] réserver\n";
    expect(sectionItems(todo, /ouvert/i)).toEqual([
      "- [ ] rappeler le médecin · [2026-07-21-abc](sessions/2026-07-21-abc.summary.md)",
      "- [ ] écrire à Sixtine",
    ]);
    expect(sectionItems(todo, /introuvable/i)).toEqual([]);
  });
});

describe("quoteBlocks()", () => {
  const keepsakes: string =
    "# Ce que je garde\n\n> Tu n'es pas en retard sur ta vie.\n>\n> — Claudia · [2026-07-21-bbb](sessions/2026-07-21-bbb.summary.md)\n\n> Dire non, ce n'était pas trahir.\n>\n> — moi\n";
  it("returns each contiguous quote as one block, verbatim, in file order", () => {
    expect(quoteBlocks(keepsakes)).toEqual([
      "> Tu n'es pas en retard sur ta vie.\n>\n> — Claudia · [2026-07-21-bbb](sessions/2026-07-21-bbb.summary.md)",
      "> Dire non, ce n'était pas trahir.\n>\n> — moi",
    ]);
    expect(quoteBlocks(keepsakes, { max: 1 })).toEqual([quoteBlocks(keepsakes)[0]]);
  });
  it("keeps the attribution and any note attached to their own quote", () => {
    // The quoted blank line is what holds a keepsake together — it must not split it.
    const one: string = "> une phrase\n>\n> — moi\n> *ce que ça me fait : je respire.*";
    expect(quoteBlocks(one)).toEqual([one]);
  });
});

describe("mermaidBlock()", () => {
  it("returns the first mermaid fence verbatim", () => {
    const people: string = "# Mon monde\n\n```mermaid\ngraph TD\n  moi --> Sixtine\n```\n\nsuite";
    expect(mermaidBlock(people)).toBe("```mermaid\ngraph TD\n  moi --> Sixtine\n```");
  });
  it("returns null when there is no mermaid block", () => {
    expect(mermaidBlock("- Sixtine\n- ma sœur")).toBeNull();
    expect(mermaidBlock(null)).toBeNull();
  });
});

describe("personName()", () => {
  it("reads a labelled field", () => {
    expect(personName("**Nom** : Agnès\ncontexte…")).toBe("Agnès");
    expect(personName("- name: Agnès Dupont")).toBe("Agnès Dupont");
  });
  it("reads a short first-line H1 (a title, not a sentence)", () => {
    expect(personName("# Agnès\n\nquelqu'un de…")).toBe("Agnès");
  });
  it("never guesses from prose — a sentence-y H1 or plain prose yields null", () => {
    expect(personName("# Agnès se sent débordée en ce moment.")).toBeNull();
    expect(personName("Agnès, 34 ans, navigue une période difficile.")).toBeNull();
    expect(personName(null)).toBeNull();
  });
});

describe("sessionsForMirror()", () => {
  it("parses stems to {stem, date, hasSummary}, most recent first", () => {
    const files: string[] = [
      "2026-07-18-aaa.transcript.md",
      "2026-07-18-aaa.summary.md",
      "2026-07-21-bbb.transcript.md",
      "2026-07-21-bbb.pending-summary",
    ];
    expect(sessionsForMirror(files)).toEqual([
      { stem: "2026-07-21-bbb", date: "2026-07-21", hasSummary: false },
      { stem: "2026-07-18-aaa", date: "2026-07-18", hasSummary: true },
    ]);
  });
});

describe("cadence()", () => {
  it("keys the coarse rhythm, or null under two dated sessions — labels are the mirror's business (ADR-0029)", () => {
    // Deliberately partial fixtures (no stem/hasSummary): cadence() only reads .date.
    expect(cadence([{ date: "2026-07-20" }] as MirrorSession[])).toBeNull();
    expect(cadence([{ date: "2026-07-20" }, { date: "2026-07-21" }] as MirrorSession[])).toBe("daily");
    expect(cadence([{ date: "2026-07-14" }, { date: "2026-07-21" }] as MirrorSession[])).toBe("weekly");
    expect(cadence([{ date: "2026-07-01" }, { date: "2026-07-21" }] as MirrorSession[])).toBe("monthly");
  });
});

/**
 * One row per source surface the mirror can show: the file a pointer to it names,
 * the whole source as the vault holds it, and the fragment that must come through
 * **verbatim**. Adding a section to the mirror is adding a row here.
 */
const SURFACES = [
  {
    key: "goals",
    file: "goals.md",
    source: "## Objectifs\n- retrouver le sommeil\n- poser une limite au travail",
    shown: "- retrouver le sommeil",
  },
  { key: "themes", file: "themes.md", source: "## Thèmes\n- l'inner critic", shown: "- l'inner critic" },
  {
    key: "todo",
    file: "todo.md",
    source: "## Ouvert\n- [ ] rappeler le médecin\n\n## Fait\n- [x] réserver",
    shown: "- [ ] rappeler le médecin",
  },
  {
    // Attribution included, links and all (ADR-0023): a source's own links are the
    // person's, and they travel with the passage.
    key: "keepsakes",
    file: "keepsakes.md",
    source:
      "# Ce que je garde\n\n> Tu n'es pas en retard sur ta vie.\n>\n> — Claudia · [2026-07-21-bbb](sessions/2026-07-21-bbb.summary.md)\n",
    shown: "> Tu n'es pas en retard sur ta vie.\n>\n> — Claudia · [2026-07-21-bbb](sessions/2026-07-21-bbb.summary.md)",
  },
  {
    key: "people",
    file: "people.md",
    source: "```mermaid\ngraph TD\n  moi --> Sixtine\n```",
    shown: "```mermaid\ngraph TD\n  moi --> Sixtine\n```",
  },
  {
    // Four markers, so the mirror's bounded glance (the last three) is visible.
    key: "timeline",
    file: "timeline.md",
    source: "- 2001 — naissance de ma sœur\n- 2019 — déménagement\n- 2024 — nouveau poste\n- 2026 — début avec Claudia",
    shown: "- 2026 — début avec Claudia",
  },
] as const;

/** The oldest life marker — past the mirror's bounded glance, it stays in its file. */
const BEYOND_THE_GLANCE = "- 2001 — naissance de ma sœur";

type SurfaceKey = (typeof SURFACES)[number]["key"];

const PERSON = "Agnès";
const DISTILLED: MirrorSession = { stem: "2026-07-21-bbb", date: "2026-07-21", hasSummary: true };
const PENDING: MirrorSession = { stem: "2026-07-22-ccc", date: "2026-07-22", hasSummary: false };

/** A vault with every surface present — the baseline each invariant varies from. */
const base: DashboardInput = {
  name: PERSON,
  sessions: [DISTILLED, PENDING],
  ...(Object.fromEntries(SURFACES.map((s) => [s.key, s.source])) as Record<SurfaceKey, string>),
  understandingExists: true,
  generatedAt: "2026-07-22",
};

/**
 * What a link in the mirror may point at: a surface the baseline vault has, or a
 * target one of its sources already carried — a transcluded link is the person's
 * own, and the mirror is not answerable for where it goes.
 */
const REACHABLE: string[] = [
  "understanding.md",
  ...SURFACES.map((s) => s.file),
  `sessions/${DISTILLED.stem}.summary.md`,
];

/**
 * The mirror's one golden line per language: the note that says this file is a
 * reflection and that the person's real notes live in the linked files. Keyed by
 * the settings enum, so a language shipped in `config.mjs` without a string table
 * in `dashboard.mjs` fails here rather than silently rendering French.
 */
const PROVENANCE: Record<MirrorLanguage, string> = {
  fr: "*Ce fichier est un reflet, tenu à jour tout seul — tes vraies notes vivent dans les fichiers liés.*",
  en: "*This file is a mirror, kept up to date on its own — your real notes live in the linked files.*",
};

const LANGUAGES = (SETTINGS.language.values ?? []) as readonly MirrorLanguage[];

/** Every `](target)` the mirror points at, in order. */
const linkTargets = (md: string): string[] => [...md.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!);

const sessionLinks = (md: string): string[] => linkTargets(md).filter((t) => t.startsWith("sessions/"));

/**
 * The mirror's section headings, in order — stopping at the `---` rule, below
 * which sits the footer nav rather than a section. Compared to each other and
 * counted, never matched against a literal.
 */
function headings(md: string): string[] {
  const out: string[] = [];
  for (const line of md.split("\n")) {
    if (line === "---") break;
    if (line.startsWith("## ")) out.push(line);
  }
  return out;
}

describe("buildDashboard() — the mirror's contract, in every declared language", () => {
  it("speaks exactly the languages the settings declare (ADR-0029)", () => {
    // The two tables are shipped in different modules; this is where they meet.
    expect(Object.keys(PROVENANCE).sort()).toEqual([...LANGUAGES].sort());
  });

  it("gives each declared language words of its own — no two render the same document (ADR-0029)", () => {
    // The drift this suite exists to catch: a shipped language whose table was
    // copied from another's, or never written, renders identically and nothing says
    // so. Which words differ is the mirror's business; that they differ is not.
    const rendered = LANGUAGES.map((l) => buildDashboard({ ...base, language: l }));
    expect(new Set(rendered).size, "two languages rendering alike is a table that never got written").toBe(
      LANGUAGES.length,
    );
  });

  it("degrades an unshipped language to the shipped default — the whole document, not just a heading", () => {
    const fallback = SETTINGS.language.default as MirrorLanguage;
    const unshipped = buildDashboard({ ...base, language: "de" as unknown as MirrorLanguage });
    expect(unshipped).toBe(buildDashboard({ ...base, language: fallback }));
  });

  describe.each(LANGUAGES)("in %s", (language) => {
    const mirror = (over: DashboardInput = {}) => buildDashboard({ ...base, ...over, language });

    it("says it is a mirror and where the real notes live (the one line pinned verbatim)", () => {
      expect(mirror()).toContain(PROVENANCE[language]);
    });

    it("transcludes a present source verbatim, and leaves no trace of an absent one (ADR-0019)", () => {
      const full = mirror();
      for (const { key, file, shown } of SURFACES) {
        expect(full, `${key} should come through verbatim`).toContain(shown);
        const dropped: DashboardInput = { ...base };
        dropped[key] = null; // the file the person simply does not have
        const without = buildDashboard({ ...dropped, language });
        expect(without, `${key} absent: nothing of it may be transcluded`).not.toContain(shown);
        expect(without, `${key} absent: no dangling link to ${file}`).not.toContain(file);
        expect(headings(without), `${key} absent: exactly its section goes`).toHaveLength(headings(full).length - 1);
      }
    });

    it("points at the working understanding, never into it (ADR-0019)", () => {
      // The prose never even reaches the builder — the input carries a boolean, so
      // excerpting it is impossible by construction. What is asserted is the pointer.
      expect(linkTargets(mirror())).toContain("understanding.md");
      const without = mirror({ understandingExists: false });
      expect(without).not.toContain("understanding.md");
      expect(headings(without)).toHaveLength(headings(mirror()).length - 1);
    });

    it("links a distilled session and shows a pending one without naming it (ADR-0016)", () => {
      // Read on a vault with nothing kept, so the only session links in the document
      // are the mirror's own — a transcluded keepsake carries the person's.
      const own = (over: DashboardInput = {}) => mirror({ keepsakes: null, ...over });
      expect(sessionLinks(own())).toEqual([`sessions/${DISTILLED.stem}.summary.md`]);
      const pendingOnly = own({ sessions: [PENDING] });
      expect(headings(pendingOnly), "the section stays — the session is shown").toEqual(headings(own()));
      expect(sessionLinks(pendingOnly), "but there is no summary to point at yet").toEqual([]);
      expect(pendingOnly, "and nothing of it is named or excerpted").not.toContain(PENDING.stem);
      expect(headings(own({ sessions: [] }))).toHaveLength(headings(own()).length - 1);
    });

    it("points only at files the vault actually has (ADR-0019)", () => {
      const carried = SURFACES.flatMap((s) => linkTargets(s.source)); // the person's own links, transcluded
      const dangling = linkTargets(mirror()).filter((t) => ![...REACHABLE, ...carried].includes(t));
      expect(dangling, `links to files that do not exist:\n${dangling.join("\n")}`).toEqual([]);
    });

    it("keeps the glance bounded — the oldest life markers stay in their file (ADR-0019)", () => {
      // A mirror that grew without limit would stop being a glance and become the file.
      expect(mirror()).not.toContain(BEYOND_THE_GLANCE);
    });

    it("degrades an unparsable source to an honest pointer rather than guessing (ADR-0019)", () => {
      const md = mirror({ goals: "on en reparlera, rien d'arrêté encore" });
      expect(md, "prose is never excerpted").not.toContain("on en reparlera");
      expect(linkTargets(md), "it is pointed at instead").toContain("goals.md");
      expect(headings(md), "and the section stays").toEqual(headings(mirror()));
    });

    it("shows what is still open, whichever language the todo file was written in (ADR-0018)", () => {
      // A vault that changed language keeps its whole history readable (ADR-0029).
      for (const { todo, open, done } of [
        {
          todo: "## Ouvert\n- [ ] rappeler le médecin\n\n## Fait\n- [x] réserver",
          open: "rappeler le médecin",
          done: "réserver",
        },
        {
          todo: "## Open\n- [ ] draft the message\n\n## Done\n- [x] book the class",
          open: "draft the message",
          done: "book the class",
        },
      ]) {
        const md = mirror({ todo });
        expect(md, todo).toContain(`- [ ] ${open}`);
        expect(md, todo).not.toContain(done);
      }
    });

    it("mirrors one kept passage, verbatim, and never counts them (ADR-0023)", () => {
      const kept = "> Tu n'es pas en retard sur ta vie.\n>\n> — moi";
      const older = "> Dire non, ce n'était pas trahir.";
      const md = mirror({ keepsakes: `# Ce que je garde\n\n${kept}\n\n${older}\n>\n> — moi\n` });
      expect(md).toContain(kept);
      expect(md, "a glance at what they carry, not the collection").not.toContain(older);
      expect(md, "counting would turn re-reading into scoring").not.toMatch(/\d+\s+(keepsakes?|citations?|phrases?)/i);
    });

    it("carries the person's name in its title, and nothing in its place when there is none", () => {
      const [titled = ""] = mirror().split("\n");
      expect(titled).toMatch(/^# /);
      expect(titled).toContain(PERSON);
      const [nameless = ""] = mirror({ name: null }).split("\n");
      expect(nameless).not.toContain(PERSON);
      expect(titled.startsWith(nameless), "the name is appended to the same title").toBe(true);
      expect(nameless, "no glue left hanging where the name would have been").not.toMatch(/[\s—·:|-]$/);
    });
  });
});
