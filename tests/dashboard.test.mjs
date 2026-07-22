import { describe, it, expect } from "vitest";
import {
  listItems,
  sectionItems,
  mermaidBlock,
  personName,
  sessionsForMirror,
  cadence,
  buildDashboard,
} from "../src/dashboard.mjs";

describe("listItems()", () => {
  it("transcludes bullet / numbered / checkbox lines verbatim, right-trimmed", () => {
    const md = "# Objectifs\n\n- retrouver le sommeil  \n* parler à Liliana\n1. bouger un peu\n- [ ] respirer\n\nprose ignorée";
    expect(listItems(md)).toEqual(["- retrouver le sommeil", "* parler à Liliana", "1. bouger un peu", "- [ ] respirer"]);
  });
  it("captures a WRAPPED bullet in full — never truncates to a dangling half-sentence", () => {
    // The real-data bug: a goal spilling onto the next physical line was cut at line 1.
    const md = "- **Séparer ce que je ressens de l'intention qu'on me prête** — et l'offrir aussi dans\nla relation, pas seulement dans ma tête.\n- **M'autoriser la colère**";
    expect(listItems(md)).toEqual([
      "- **Séparer ce que je ressens de l'intention qu'on me prête** — et l'offrir aussi dans\nla relation, pas seulement dans ma tête.",
      "- **M'autoriser la colère**",
    ]);
  });
  it("returns [] for null / listless prose (caller then links instead)", () => {
    expect(listItems(null)).toEqual([]);
    expect(listItems("juste un paragraphe, aucune liste")).toEqual([]);
  });
  it("respects max", () => {
    expect(listItems("- a\n- b\n- c", { max: 2 })).toEqual(["- a", "- b"]);
  });
});

describe("sectionItems()", () => {
  const todo =
    "# À faire\n\n## Ouvert\n- [ ] rappeler le médecin · [2026-07-21-abc](sessions/2026-07-21-abc.summary.md)\n- [ ] écrire à Liliana\n\n## Fait\n- [x] réserver\n";
  it("scopes to the matched heading, stops at the next heading", () => {
    expect(sectionItems(todo, /ouvert/i)).toEqual([
      "- [ ] rappeler le médecin · [2026-07-21-abc](sessions/2026-07-21-abc.summary.md)",
      "- [ ] écrire à Liliana",
    ]);
  });
  it("returns [] when no heading matches", () => {
    expect(sectionItems(todo, /introuvable/i)).toEqual([]);
  });
});

describe("mermaidBlock()", () => {
  it("returns the first mermaid fence verbatim", () => {
    const people = "# Mon monde\n\n```mermaid\ngraph TD\n  moi --> Liliana\n```\n\nsuite";
    expect(mermaidBlock(people)).toBe("```mermaid\ngraph TD\n  moi --> Liliana\n```");
  });
  it("returns null when there is no mermaid block", () => {
    expect(mermaidBlock("- Liliana\n- ma sœur")).toBeNull();
    expect(mermaidBlock(null)).toBeNull();
  });
});

describe("personName()", () => {
  it("reads a labelled field", () => {
    expect(personName("**Nom** : Antoine\ncontexte…")).toBe("Antoine");
    expect(personName("- name: Marie Dupont")).toBe("Marie Dupont");
  });
  it("reads a short first-line H1 (a title, not a sentence)", () => {
    expect(personName("# Antoine\n\nquelqu'un de…")).toBe("Antoine");
  });
  it("never guesses from prose — a sentence-y H1 or plain prose yields null", () => {
    expect(personName("# Antoine se sent débordé en ce moment.")).toBeNull();
    expect(personName("Antoine, 34 ans, navigue une période difficile.")).toBeNull();
    expect(personName(null)).toBeNull();
  });
});

describe("sessionsForMirror()", () => {
  it("parses stems to {stem, date, hasSummary}, most recent first", () => {
    const files = [
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
  it("labels coarse rhythm, or null under two dated sessions", () => {
    expect(cadence([{ date: "2026-07-20" }])).toBeNull();
    expect(cadence([{ date: "2026-07-20" }, { date: "2026-07-21" }])).toBe("~quotidien");
    expect(cadence([{ date: "2026-07-14" }, { date: "2026-07-21" }])).toBe("~hebdo");
    expect(cadence([{ date: "2026-07-01" }, { date: "2026-07-21" }])).toBe("~mensuel");
  });
});

describe("buildDashboard() — transclude or point, never summarise", () => {
  const understanding = "# Working understanding\n\n## En ce moment\nune longue prose thérapeutique très personnelle…";
  const base = {
    name: "Antoine",
    sessions: [
      { stem: "2026-07-21-bbb", date: "2026-07-21", hasSummary: true },
      { stem: "2026-07-22-ccc", date: "2026-07-22", hasSummary: false },
    ],
    goals: "## Objectifs\n- retrouver le sommeil\n- poser une limite au travail",
    themes: "## Thèmes\n- l'inner critic\n- s'effacer pour ne pas déranger",
    todo: "## Ouvert\n- [ ] rappeler le médecin\n## Fait\n- [x] réserver",
    people: "```mermaid\ngraph TD\n  moi --> Liliana\n```",
    timeline: "- 2001 — naissance de ma sœur\n- 2019 — déménagement\n- 2024 — nouveau poste\n- 2026 — début avec Claudia",
    understandingExists: true,
    generatedAt: "2026-07-22",
  };

  it("titles with the name and shows computed vitals", () => {
    const md = buildDashboard(base);
    expect(md).toMatch(/^# Vue d'ensemble — Antoine/);
    expect(md).toContain("dernière session · 22/07");
    expect(md).toContain("2 sessions");
  });

  it("links the working understanding, never excerpts its prose", () => {
    const md = buildDashboard(base);
    expect(md).toContain("## Là où on en est");
    expect(md).toContain("→ [understanding](understanding.md)");
    expect(md).not.toContain("longue prose thérapeutique");
    expect(md).not.toContain("En ce moment");
  });

  it("transcludes lists verbatim (goals, themes)", () => {
    const md = buildDashboard(base);
    expect(md).toContain("- retrouver le sommeil");
    expect(md).toContain("- l'inner critic");
  });

  it("shows only the still-open todos", () => {
    const md = buildDashboard(base);
    expect(md).toContain("- [ ] rappeler le médecin");
    expect(md).not.toContain("réserver");
  });

  it("renders recent fils as date+link, and pending sessions as pending — never an excerpt", () => {
    const md = buildDashboard(base);
    expect(md).toContain("- 21/07 → [2026-07-21-bbb](sessions/2026-07-21-bbb.summary.md)");
    expect(md).toContain("- 22/07 · *en cours de distillation*");
  });

  it("transcludes the ecomap block verbatim", () => {
    const md = buildDashboard(base);
    expect(md).toContain("```mermaid\ngraph TD\n  moi --> Liliana\n```");
  });

  it("keeps only the last three life markers", () => {
    const md = buildDashboard(base);
    expect(md).toContain("- 2026 — début avec Claudia");
    expect(md).not.toContain("naissance de ma sœur");
  });

  it("never mirrors safety content", () => {
    const md = buildDashboard(base);
    expect(md).not.toMatch(/safety|sécurité|risque|crise/i);
  });

  it("omits the name when it cannot be found, and omits absent sections (no dangling links)", () => {
    const md = buildDashboard({ ...base, name: null, timeline: null, people: null });
    expect(md).toMatch(/^# Vue d'ensemble\n/);
    expect(md).not.toContain("## Repères de vie");
    expect(md).not.toContain("## Ton monde");
    expect(md).not.toContain("timeline.md");
  });

  it("falls back to a bare link when a present source has no parsable list", () => {
    const md = buildDashboard({ ...base, goals: "on en reparlera, rien d'arrêté encore" });
    expect(md).toContain("## Objectifs\n→ [goals](goals.md)");
  });
});
