---
status: accepted
---

# A person-facing dashboard mirror — `dashboard.md`

The working memory is spread across many files — `goals.md`, `themes.md`,
`understanding.md`, `todo.md`, `people.md`, `timeline.md`, the session summaries.
Each is the right home for its own thing, but there was no single place a person
could open to see, at a glance, *where things are*. This is that place:
`~/.claudia/dashboard.md`, a bird's-eye view of the person's own journey.

The tension is real: Claudia's whole design resists making the person feel like a
dossier — `recall` deliberately surfaces **one** thing, never a recital; the
working understanding is held "lightly, as a hypothesis". A dashboard is, by
definition, an aggregation. The decisions below are what make an aggregation
compatible with that ethos rather than a betrayal of it.

## Decision

A single derived file, `~/.claudia/dashboard.md`, written in the person's language.

- **A mirror, never a source of truth.** It is produced by a deterministic script
  (`scripts/build-dashboard.mjs` → `src/dashboard.mjs`), not by the model. It only
  ever **transcludes** what a source file already says (a list, the items under a
  heading, the `people.md` mermaid ecomap) or **points** to it with a `[[wikilink]]`.
  It **never summarises or paraphrases**: a deterministic script cannot read
  therapeutic prose without risking putting words in the person's mouth, so it does
  not try. The two prose surfaces — the working understanding and each session
  summary — are therefore **linked, never excerpted**. A wrapped bullet is captured
  in full, never truncated to a dangling half-sentence.

- **Background-refreshed, read on demand.** The file is kept fresh so the person can
  open it directly, any time, without invoking Claudia — who **never recites it**.
  It is rebuilt at `SessionEnd` (after `save-session`) and at the tail of `recall`
  (after any deferred distillation, ADR-0016, so the newest summary is reflected):
  the two together give a zero-lag mirror. `/dashboard` rebuilds and shows it on
  pull.

- **`safety.md` is deliberately absent.** A standing safety flag shown at every
  glance would reduce the person to a risk profile and re-expose crisis content —
  exactly what `recall` avoids. The safety net lives elsewhere (the `safety-check`
  hook, `/help-now`, `recall` reading `safety.md` first). No safety flags, no
  resources, nothing from `safety.md` is mirrored. No mood/progress chart either
  (the clinical "life chart" this project avoids — see CONTEXT.md).

- **Discoverable, with consent.** Because it is shipped to everyone, the person is
  told once it exists — folded into `remember`'s existing first-run disclosure — and
  can pull it with `/dashboard`. Transparency is non-negotiable (ADR-0004); this is
  the floor's disclosure principle, not a recital.

- **Refusable, for real.** `{ "dashboard": false }` in `~/.claudia/config.json`
  (precedent: `saveTranscripts`) turns it off: no file is written and any existing
  `dashboard.md` is removed — otherwise deleting it would be undone at the next
  close.

- **Honours deletion and export.** `/forget` rebuilds the mirror after a partial
  deletion (so it never reflects erased content) and it disappears with the
  directory on "forget everything"; `/export` already sweeps it up and rewrites its
  wikilinks (ADR-0011 vault export).

## Consequences

- Same guarantees as the rest of the working layer (ADR-0004): strictly local,
  never uploaded; safety-floored (no means/methods, and here no safety flags at all);
  removed by `/forget`; carried by `/export`. Recorded in `docs/memory-layout.md`.
- It is a **derived view**, not read by `recall` — `recall` reads the sources, not
  their mirror. The dashboard adds no new interpretive layer that could drift from
  the sources, because it never interprets.
- The public command surface grows from four to **five** (`/dashboard` joins
  `/thread` as a second pull-only orientation aid). README, `/help`, and the
  structure guard track that.
- A section whose source file is absent is omitted (no dangling link); a
  present-but-unparsable source falls back to a bare `[[wikilink]]`. The mirror
  degrades to honest pointers rather than guessing.
