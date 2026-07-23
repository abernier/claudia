---
status: accepted
---

# Keepsakes — keeping the one sentence that landed

Sometimes a single sentence lands. Claudia says something that reframes the whole
week; or the person themselves says the thing they had never quite said out loud.
Then the conversation moves on and the sentence is gone — scrolled past, and by the
next session unrecoverable.

Nothing in the memory model catches it. The working layer is **distilled by
design** (ADR-0004): a summary says *what helped*, never the words that helped. The
`<stem>.transcript.md` holds every word but is the person's archive, deliberately
unread and unnavigable — nobody re-reads a transcript to find a half-remembered
line. So the most re-readable thing a session produces has nowhere to live.

The clinical literature is unusually direct about this gap. Narrative therapy makes
the written line an intervention in itself — **therapeutic documents**: a sentence
put on paper and taken home, which clients routinely value out of all proportion to
its size (White & Epston, 1990; White, 2007). CBT does the same with **coping cards
/ therapy notes** — the conclusion the person reached, written in their own words,
re-read when the moment they wrote it for actually arrives (Beck, 2011). Both exist
because recall of what was said in a session is genuinely poor (Kessels, 2003), and
because what carries a session into the week is what happens *between* sessions
(Kazantzis et al., 2010).

## Decision

A single file, `~/.claudia/keepsakes.md` (working layer), holding the passages the
person chose to keep — hers, theirs, verbatim — plus a `keep` skill and a `/keep`
command that pull it into reach mid-conversation.

- **Format: newest first, one blockquote per keepsake.** The words, a blank quoted
  line, then an attribution line inside the same quote —
  `> — Claudia · [<stem>](sessions/<stem>.summary.md)`. Optionally one more line for
  what the person makes of it. Newest-first because the freshest is the one most
  likely to be re-read, and because the mirror transcludes the top. Person's
  language, like every working file, and no heading grammar to parse — a keepsake
  is a quote, which is what it already looks like.

- **Either voice, honestly attributed.** Claudia's words *or* the person's own
  ("pin n'importe quoi"). A keepsake attributed to Claudia is **exactly** what she
  said; if the person reshapes the wording — which they may, it is theirs — the
  attribution follows the words (`— moi`, or `— moi, d'après Claudia`). Never put a
  sentence in someone's mouth, not even a flattering one.

- **Verbatim on purpose — a bounded exception** to "summaries are distilled, never
  verbatim". Bounded by: *person-initiated*, *one short passage at a time*, and the
  floor unchanged — **never** a means or a method on a line (ADR-0001 rule 4), and
  nothing lifted out of a crisis moment to be re-read later.

- **The asymmetry that guards against dependency.** Claudia may **offer** to keep
  *the person's* words — "that sentence you just said — want to keep it?" — which is
  the narrative-therapy move (catching a unique outcome as the person voices it).
  She **never proposes keeping her own**; hers are kept only when the person pulls
  `/keep`. A companion that curates her own greatest hits is building a following,
  not an ally, and the point of a written keepsake is precisely that it works *when
  she is not there* (the coping-card rationale).

- **`/keep [passage]`, with a no-argument path built on the choice UI.** With an
  argument, keep it. Without one, offer 2–4 candidate passages from the **last
  exchange** — hers first, since that is the common case — as `AskUserQuestion`
  options; the auto-"Other" field always allows anything else, pasted or reworded.
  The person picks the words; Claudia never decides for them what mattered.

- **A dedicated `keep` skill owns the behavior**, as every memory surface does
  (`todo`, `understand`, `themes`…), so the natural-language triggers — *"garde
  ça"*, *"épingle cette phrase"*, *"pin that"* — fire mid-conversation without the
  slash command. The command is the discoverable door, not the only one.

- **Read where it earns its place, never recited.** The
  [dashboard](0019-dashboard.md) transcludes the most recent keepsake — verbatim
  quoting is exactly that mirror's contract ("transclude or point, never
  summarise"). [`quiz`](../../skills/quiz/SKILL.md) may draw on keepsakes as
  material, which closes the loop: `keep` captures the lesson, `quiz` makes it last.
  **`recall` does not load them** — context economy, and an opening that quotes a
  past session back at the person is a recital, the failure mode every pull-only
  surface here exists to avoid.

- **Session tag, reconciled later.** A live `/keep` may not hold the finalized
  session stem (the archive file is only written at `SessionEnd`), so the tag may be
  date-only or absent; `distill-session` completes it authoritatively, exactly as it
  does for `todo.md` (ADR-0018).

- **Not a tracker.** No count, no streak, no "you kept 3 things this week". Making
  the collection itself salient would turn a re-read into self-monitoring, which is
  the one thing the evidence says not to amplify (Nelson & Hayes, 1981; Wells, 2009).

## Consequences

- Same guarantees as the rest of the working layer (ADR-0004): strictly local, never
  uploaded, deleted for real by `/forget`, copied out by `/export`. Added to
  `docs/memory-layout.md`.
- The vault now holds verbatim text **outside** the transcript. That is a deliberate,
  narrow widening of the verbatim surface, and it inherits the floor unchanged — the
  no-means/methods rule is what makes the widening safe, not the person's consent
  alone.
- `dashboard.mjs` gains a quote-block transclusion (`quoteBlocks`), the first
  non-list, non-mermaid shape the mirror reads.
- The eighth command. The natural-language path is the primary one (ADR-0003), and
  `/keep` is kept because "keep that" is precisely the moment a person reaches for a
  key, not a sentence.
