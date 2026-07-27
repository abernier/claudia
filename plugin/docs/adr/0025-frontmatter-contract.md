---
status: accepted
---

# The frontmatter contract — identity is derived, judgment is written

Every note in `~/.claudia/` opens with a YAML block, but only two of them were ever
specified: the theme note ([`themes`](../../skills/themes/SKILL.md)) and the person
fiche ([`person-fiche-template.md`](../person-fiche-template.md)). The session summary,
the exercise and the teaching had no written contract at all — the model re-improvised
the block at every write.

It drifted, and the drift was measurable in a real vault:

- **2 summaries of 4 had no frontmatter whatsoever**, and 1 exercise of 3.
- **`session:` meant two different things** — the bare short id in summaries
  (`9113d5d7`), the full stem in exercises (`2026-07-22-9113d5d7`).
- **Both exercise stems were dead.** `2026-07-22-9113d5d7` and `2026-07-23-9113d5d7`
  named files that never existed; the session's real stem is `2026-07-21-9113d5d7`.

Prose alone could not have held this. **Nothing parses these blocks** — `dashboard.mjs`
and `pending.mjs` re-derive the date and the id from the _filename_ — so a wrong or
missing block is invisible to `npm test` and to the person alike.

## The diagnosis: one block, two kinds of fact

The block mixes things of genuinely different natures, and asking a single writer for
both is what degraded it:

- **Identity** — `type`, `session`, `dates`, `created`, `slug` — is _derivable_. It
  follows from the filename and from the transcript, mechanically.
- **Judgment** — `people`, `themes` — is not. Only a reader of the conversation knows
  who was talked about, or which thread the person has ratified as theirs.

Asked to write both, the model treats the derivable half as something to _recall_, and
recall degrades. For the deliverables it was worse than unreliable — it was
**structurally impossible**: an exercise is written mid-conversation, and the session's
stem does not exist yet (`save-session` mints it at close, ADR-0017). The model could
only invent one. That is the whole story of the dead stems.

## Decision

**Identity is written by code; the model writes only judgment.**

```yaml
# sessions/<stem>.summary.md          # sessions/{exercises,teachings}/<date>-<slug>.md
---                                   ---
type: session                         type: exercise | teaching
session: 2026-07-21-9113d5d7          created: 2026-07-22
dates: [2026-07-21, 2026-07-22]       slug: un-sentiment-ca-s-accueille
people: [Liliana]                     session: 2026-07-21-9113d5d7
themes: [the inner critic]            ---
---
```

- **`session:` is the stem everywhere** — `<date>-<short-id>`, resolvable as
  `sessions/<stem>.summary.md`. That closes the ambiguity; the migration below repairs
  the files that predate it.

- **The marker carries the identity.** `save-session` (SessionEnd) already reads the
  transcript and already drops `<stem>.pending-summary`; it now computes the block and
  writes it _as_ that marker's content. `dates` comes from the transcript's own
  timestamps via `sessionDays()`, so a conversation that ran past midnight reports both
  days exactly. `src/pending.mjs` keys on the marker's **existence**, so this content
  costs nothing and breaks nothing.

- **The enforcement point is the step that already had to happen.**
  `distill-session` must clear the marker to close the deferred-distillation state
  machine (ADR-0016). That bare `rm -f` is now
  `scripts/finish-distillation.mjs <stem>`, which stamps the identity onto the summary
  **and then** clears the marker. Skipping it leaves the marker standing, so `recall`
  simply re-flags the session at the next open. The model cannot omit the frontmatter
  without also failing to finish — and failing to finish is already self-healing.

- **For deliverables, the model gives the path and the code gives the value.**
  `exercise` and `teach` write no `session:` at all — they cannot know it — and pass
  the file they wrote to `finish-distillation.mjs`, which stamps the real stem. This is
  the same deferral `todo.md` tags (ADR-0018) and keepsakes (ADR-0023) already use.

- **Dates are days, never timestamps.** `localDay()`, not `isoWithOffset()`. A note
  records _which day it concerns_, not the minute it was written: Claudia is exact
  about the hour **in the moment** and sober about the **record**, because a
  per-minute trace of when someone talked is surveillance, not presence (ADR-0012).
  A `dates` already on disk is never overwritten by a fallback — a session can span
  midnight, and a guess must not replace a fact.

- **No safety key, ever.** A flag raised belongs in the body and in `safety.md`, never
  as a searchable facet of a filename — the same reason ADR-0019 keeps `safety.md` out
  of the dashboard.

- **Reading is best-effort; writing is conservative.** `src/frontmatter.mjs` is the one
  place that knows the format, and it deliberately exposes **no general serializer**:
  `stampIdentity` does line surgery, replacing or inserting only the handed keys and
  leaving every other line byte-identical — comments, spacing, quoting, line endings.
  A block whose fence never closes is returned **untouched** rather than rewritten.
  These are the person's own hand-editable notes (ADR-0004, ADR-0018); a
  parse→serialize round-trip would quietly reformat choices they made. The asymmetry
  _is_ the safety property.

- **The past is repaired once, by migration.** `0002-vault-frontmatter` (ADR-0020):
  pure, idempotent, backed up, applied quietly at `recall` and disclosed when it acts.
  It fills what is absent, normalises `session:` to the stem, and repairs a dead
  deliverable stem **only** when its short id resolves to exactly one summary — zero or
  several candidates are left alone, because a confidently wrong link is worse than a
  visibly broken one.

- **The prose half is guarded like every other prose contract here** — a
  `describe("frontmatter contract (ADR-0025)")` block in `tests/structure.test.ts`,
  which is how this repo has always kept its docs from rotting.

## Consequences

- The model's job at distillation shrinks to what only it can do: the body,
  `people:`, `themes:`. Two fewer things to get right, none of them guessable.
- `dates` becomes trustworthy enough to build on — it is computed, not recalled.
- Zero new dependencies (`dependencies: {}` stays empty): the YAML subset the vault
  actually uses is parsed by hand, consistent with ADR-0022.
- One coupling accepted: `finish-distillation.mjs` is now part of the distillation
  contract, so a `distill-session` that skips it leaves summaries un-stamped. That
  failure is visible (the marker survives) and self-correcting (recall re-distills),
  which is the same fail-safe direction as ADR-0016.
- Not covered, deliberately: `person.md`, `goals.md`, `themes.md`, `timeline.md`,
  `todo.md`, `safety.md`, `keepsakes.md`. Their blocks are written once and edited in
  place rather than minted per session, so they have not drifted. The pattern above
  extends to them if they ever do.
