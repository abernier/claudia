---
name: distill-session
description: Turn a finished conversation into a distilled session summary for ~/.claudia/sessions/. Runs at session close when possible, but is normally deferred to the next session's recall (a close is unreliable). Produces the summary that recall will read — never a verbatim copy.
allowed-tools: Read Write Bash
---

# Distill a session

Produce `~/.claudia/sessions/<stem>.summary.md` — the memory that future
conversations actually read.

## The frontmatter — you write half of it

The block splits in two, and only one half is yours:

```yaml
---
type: session                     # ┐
session: 2026-07-21-9113d5d7      # │ identity — NOT yours. Stamped by
dates: [2026-07-21, 2026-07-22]   # ┘ finish-distillation.mjs. Don't write these.
people: [Liliana]                 # ┐ judgment — only you can know these.
themes: [the inner critic]        # ┘
---
```

**Write `people:` and `themes:`, and nothing else.** Everything above them is derived
from the transcript by code and stamped when you close the distillation below — so you
never have to reconstruct a stem or work out which days a conversation touched.

- **`people:`** — those the person actually talked _about_ this session, by the name
  their fiche uses (`people/<name>.md`), so the graph points both ways.
- **`themes:`** — **ratified** threads only, never a candidate. A thread the person has
  not yet recognised as theirs stays in the body, phrased as a question (ADR-0015).
- **No safety key, ever.** If a flag was raised, it belongs in the body and in
  `safety.md` — never as a searchable facet of the file (ADR-0019 omits safety from the
  dashboard for the same reason).

## What a good summary holds

- **The thread**: what the person brought, and where it went.
- **What seemed to matter**: the felt core, not every detail.
- **What helped**: approaches/techniques that landed, so they can recur.
- **Movement**: any shift, insight, or agreed next step (tie to `goals.md`).
- **Follow-ups**: any event the person is anticipating (with the date and the
  worry attached) and anything they meant to try — so next time can open with a
  contextualized check-in. Mark any earlier follow-up **done** if it was resolved
  or discussed this session, so it isn't raised again.
- **Safety**: note if a safety flag was raised (kind, and what was offered) —
  never the means/method.
- **Recurring threads**: if something the person raised has _returned_ across
  sessions, note it as a **candidate theme** — tentative, for `recall` to gently
  offer next time, never stored as fact until the person ratifies it (see
  [`themes`](../themes/SKILL.md)).

## Two ways this runs

- **Live, at close** — the conversation is still in context; distill from what you
  hold, then write the summary.
- **Deferred, from the transcript (the common case)** — a previous session left its
  `<stem>.transcript.md` flagged for distilling. `recall` detects it (via
  `scripts/pending-sessions.mjs`) and hands you the stem (`<date>-<id>`). Read that one
  transcript, distill it, write the summary. This is the sanctioned exception to
  "never read a transcript" — it exists precisely to _build_ the summary that spares
  every future recall from doing so (ADR-0016). Note the flag is a **dirty flag**: it
  can be present even when a `<stem>.summary.md` already exists, meaning the session was
  _resumed_ since — refresh the existing summary rather than starting blank.

Either way, after writing `<stem>.summary.md`, **close the distillation**:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/finish-distillation.mjs" "<stem>" \
  sessions/exercises/<date>-<slug>.md   # any exercise/teaching this session wrote
```

That one command stamps the identity frontmatter onto the summary you just wrote _and_
clears the marker, in that order — so a summary is never left un-identified, and a
session is never marked done without one. It is silent when it works. If it says there
is no summary, the file was not written where it expected: fix that and run it again
rather than deleting the marker by hand.

Pass the vault-relative path of every **exercise or teaching this session produced**
(none is fine — usually there are none). [`exercise`](../exercise/SKILL.md) and
[`teach`](../teach/SKILL.md) deliberately leave their `session:` key unwritten, because
mid-conversation the stem does not exist yet; this is where it gets filled in, with the
real one. You supply the path, the script supplies the identity.

## Rules

- **Distill, don't transcribe.** This layer is read on every recall; keep it lean
  and kind.
- **Person's language.** Write it in the language the conversation happened in.
- **Respect the floor.** No verbatim harmful content (ADR-0004).
- The verbatim `<stem>.transcript.md` is saved separately by the `SessionEnd` hook
  (`save-session.mjs`) — that is the person's archive, not this.

Then **sync `~/.claudia/todo.md`** via `todo` (ADR-0018). This is the _authoritative_
place to tag it: you hold the real session stem here (the `<stem>` you just wrote),
which a live addition mid-conversation may not have had. Promote this session's concrete,
_task-shaped_ to-do-later items into `## Ouvert`, tagged
`[<stem>](sessions/<stem>.summary.md)`; add that tag to any item a live addition left
untagged; and tick `[x]` anything this session resolved (mirroring the Follow-ups you
marked _done_). Promote genuine tasks,
not every follow-up — `todo.md` is an action list, not a mirror of the summary.

Same pass, same reason: **complete the session tag on any keepsake** the person kept
live this session (`~/.claudia/keepsakes.md`, ADR-0023) — a `/keep` mid-conversation
may not have held the stem. Only the tag. **Never add a keepsake yourself**, and never
promote a line you liked into their collection: what they keep is theirs to choose.

Then update `person.md` / `goals.md` via `remember` if something durable emerged,
and — if a pattern crystallised or the direction shifted — invoke `understand` to
revise the working understanding. If a thread has _recurred_, hand a **candidate
theme** to [`themes`](../themes/SKILL.md) — tentative, never stored until the person
ratifies it.
