---
status: accepted
---

# The thread — person-pulled orientation, within and across sessions

Conversations wander — and that is often where the meaning is. Claudia therefore
offers **"the thread"**: a way to *see* where a conversation has gone, at two
scales, **always pulled by the person, never pushed by Claudia**. Within a session,
the `/thread` command surfaces a light reflection of the through-line; across
sessions, a small **theme layer** sediments the recurring threads. The healthy
analogues are the counselling **summarising** microskill ("let me pull the threads
together"), **narrative** thread-tracking and re-authoring (White & Epston, 1990),
and **collaborative case conceptualization** (Kuyken, Padesky & Dudley, 2009 — "the
client knows best"). We explicitly do **not** build a clinical **case formulation /
diagnostic dossier**: theme reliability degrades exactly at the inferential layer
(Bieling & Kuyken, 2003) and a formulation shared too fast can shame or overwhelm
(Redhead, Johnstone & Nightingale, 2015). This stays a person-authored map, not a
verdict.

## Stance (non-negotiable): follow by default, the person pulls

Drift is **signal, not error** — an association, an avoidance, a felt shift is often
the material (psychodynamic *focus on affect / recurring themes / avoidance*: Blagys
& Hilsenroth, 2000). So the default is **non-directive** (Rogers, 1957): Claudia
follows, and any orientation aid is an **offered task** the person chooses (Bordin,
1979) — imposed, it becomes a task-rupture. Where it can, the reflection is
**process over content** (Gendlin's felt sense; Greenberg's EFT: *process-directive,
never content-directive*) — *that* something feels alive or unfinished, kept close
to the person's own words.

## Within a session — the `/thread` command

- **Person-triggered only, never spontaneous.** An explicit `/thread` (not
  natural-language detection — no false positives), surfaced **once** at first run
  alongside the memory disclosure, then never advertised again.
- **A dim `※` meta-channel, not Claudia's voice.** The reflection renders as a
  greyed `※` aside *beside* the warm voice — a separate channel, not a disclaimer
  that punctures immersion (ADR-0001). Content in the person's language (ADR-0005).
- **Prose by default; a mermaid tree only on explicit demand.** The default is a
  short **fil-de-sens** anchored to the person's verbatim (least inferential); a
  visual "arbre de pensée" is a heavier, opt-in view — never the default, because a
  map can pull the person out of felt experiencing into analytic "head" mode.
- **Ephemeral.** Regenerated from live context, **never a new store**; the durable
  capture of the through-line is already `distill-session`'s job at close.

## Across sessions — the theme layer

The vault (ADR-0011) already links fiches to `[[themes]]`, but nothing backs those
links. This fills that seam with a **deliberately light** layer whose job is
distinct from the working understanding (the *current direction*), goals (the
*targets*), and fiches (per *person*): **themes are the recurring threads that cut
across people and sessions** — "self-effacement in the bond", "the inner critic".

- **Propose-tentatively, ratify-by-the-person.** Claudia may *offer* a candidate
  thread as a question ("there's a thread of X that keeps returning — does that fit,
  or would you name it differently?"); it is **stored only once the person accepts
  or reshapes it**, and they can rename / split / merge / reject at any time
  (narrative authorship). Nothing inferred is ever presented as fact.
- **Detected at `distill-session`, ratified at `recall`.** A theme is *recurring* by
  nature, so it is caught looking back across sessions and surfaced gently next time;
  live offers are rare and never interrupt.
- **Problems *and* exceptions/resources.** Each theme holds its dominant pattern
  **and** its unique outcomes ("times it didn't happen", "what helped"); purely
  resource threads are first-class — otherwise the map becomes problem-saturated and
  feeds rumination (narrative *unique outcomes*; cf. the timeline's positive-events
  rule, ADR-0014).
- **Externalising, never diagnostic.** "the worry", "the critic" — never "your
  anxiety disorder" or any clinical label (the anti-labeling line, ADR-0008).

## Shape & rendering

Mirrors the relationship-map (ADR-0010) and timeline (ADR-0014) contract exactly:
**the markdown store is canonical; any mermaid graph is a regenerated view.**

- `~/.claudia/themes.md` = the index/MOC: one line per thread in the person's words,
  status (`open` / `quiet` / `eased`), and `[[wikilinks]]` to fiches, session
  summaries, and the working understanding.
- `~/.claudia/themes/<name>.md` = a dedicated note **only when a thread graduates**
  (gains depth) — filename is the thread's name in the person's words (like a fiche,
  so `[[wikilinks]]` resolve); dated, *revised not overwritten*, with the person's
  **verbatim kept separate from any tentative reflection**, exceptions/what-helps,
  and backlinks.
- An **optional mermaid `graph`** of threads (nodes = themes, edges = theme↔theme /
  theme↔person, `click` → the note) is the "arbre de pensée" at the scale where it
  earns its place. Never the store.
- Indexed in the existing `MEMORY.md` (which today indexes people).

## Red lines (from the evidence base)

Never: classify or pathologise wandering speech (tangentiality/flight-of-ideas are a
clinician's business, routed via [crisis](../../skills/crisis/SKILL.md), never shown
as a label); march the person through nodes or nudge them "back on track"; prune or
discourage digression; present an inferred theme as fact; surface an unreached
trauma / core belief, unpaced; make the map mandatory, sticky, or high-frequency
(self-monitoring reactivity, Nelson & Hayes, 1981; the "chilling effect", Blease et
al., 2021; over-monitoring as the engine of disorder, Wells, 2009); let the tool
outrank the relationship (resistance to it is a repair moment); or substitute the map
for the route-to-human path.

## Consequences

- **New `commands/thread.md`** (the `/thread` slash command, alongside `/export` and
  `/forget`) — additive, ephemeral, `※` rendering, person-invoked only.
- **New `skills/themes/`** — maintains `themes.md` + `themes/`, the propose-ratify
  discipline, and the optional mermaid view (mirrors `skills/relationships/` and
  `skills/timeline/`).
- **Theme layer wiring**: `distill-session` flags candidate threads; `recall` reads
  `themes.md` and surfaces at most one candidate for ratification, never a list;
  `remember` indexes themes in `MEMORY.md`; `docs/memory-layout.md` and
  `docs/person-fiche-template.md` gain the now-backed `[[themes]]`; `themes.md` /
  `themes/` join the vault; `src/vault.mjs` + `/export` already rewrite the
  wikilinks; **`/forget` deletes a theme note and de-links it everywhere** (real
  deletion, ADR-0004).
- **Purely additive** — it touches neither the safety floor, the soul, the crisis
  pivot, nor the hooks. `author-skill`'s self-authoring quarantine does not apply
  (that flow is for Claudia's *autonomous* authoring, not developer changes under an
  ADR); an adversarial safety review against [ADR-0001](0001-safety-floor.md) /
  `red-lines.md` gates the change instead.
