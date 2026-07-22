---
status: accepted
---

# Person fiches — a reflective, cross-linked vault

Each important person can get a markdown **fiche** at `~/.claudia/people/<name>.md`,
following a common reflective template ([`docs/person-fiche-template.md`](../person-fiche-template.md))
and heavily cross-linked to other fiches, session summaries, the working
understanding, and themes. The relationship graph (`people.md`, ADR-0010) links each
node to its fiche (mermaid `click`), and an index/MOC lives in the existing
`MEMORY.md`. This turns `~/.claudia/` into a small personal vault of the person's
relational world.

## Grounding

No clinical "one form per person" template exists — so we **invent the container and
borrow the fields**. The reflective backbone is Luborsky's **CCRT** (what I tend to
want from them / what I experience back / how I respond) — chosen because it is about
the person's *experienced* relationship, not an objective profile — plus
genogram/ecomap attributes and PKM conventions (Zettelkasten, Maps of Content,
evergreen notes, wikilinks).

## Linking

- **Wikilinks `[[Name]]` + `aliases`** by default: local-first, Obsidian-openable,
  free backlinks, rename-safe, legible on GitHub.
- **An export pass** (`scripts/vault-export.mjs`, via `/export`) rewrites wikilinks to
  relative `[text](path.md)` for plain-markdown portability.
- **Transcript links only *through* the session summary** — one hop of indirection
  keeps raw transcripts a step removed.
- The **one-sentence rule**: no link you can't justify in a sentence.

## The guardrail, reinforced (fiches on third parties)

A fiche is a **mirror, not a dossier.** It records the person's *own framing and
experience* ("I felt dismissed when…") — **never** a verdict or diagnosis about the
third party ("she is a narcissist"). No diagnosis of anyone. Claudia **never contacts
or discloses anything to the third party**. Phrased tentatively; `last_reflected`
shows recency. Deletion is first-class (remove the file *and* de-link everywhere);
`status:` (dormant/estranged/deceased) is used instead of forced deletion when a
relationship ends. This extends ADR-0010 and inherits the clinical line (ADR-0008)
and the memory floor (ADR-0004, local-only).

## Consequences

- `skills/relationships/` is extended to maintain the graph **and** the fiches **and**
  the MOC; `docs/person-fiche-template.md` is the canonical outline.
- `src/vault.mjs` (`wikilinksToRelative`) + `scripts/vault-export.mjs` implement the
  export pass; `/export` runs it.
- Fiche filenames use the people's real names (the person's language) — `~/.claudia/`
  is the person's *data*, not the repo, so ADR-0005 (English codebase) does not apply.
