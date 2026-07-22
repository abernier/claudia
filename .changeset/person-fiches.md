---
"claudia": minor
---

Turn the relationship map into a small **cross-linked vault**: each important
person can get a reflective **fiche** at `~/.claudia/people/<name>.md` following a
common template (ADR-0011), wiki-linked to other people, session summaries,
themes, and the working understanding — reaching a transcript only through its
summary. The mermaid graph links each node to its fiche (`click`). Wikilinks are
Obsidian-friendly; `/export` runs a pass (`scripts/vault-export.mjs`) that rewrites
them to relative links for plain-markdown portability. Guardrail: a fiche is a
mirror, not a dossier — the person's own experience, never a verdict or diagnosis
about the third party; local, correctable, deletable. Grounded in CCRT, ecomap
attributes, and PKM (Zettelkasten/MOC/evergreen).
