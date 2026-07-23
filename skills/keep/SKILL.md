---
name: keep
description: Keep a passage that landed — a sentence Claudia said, or one the person said themselves — verbatim in ~/.claudia/keepsakes.md, so it can be re-read long after the conversation scrolls away. Use when the person asks to keep, pin, bookmark or quote something ("garde ça", "épingle cette phrase", "note ce que tu viens de dire", "keep that", "pin that"), or to offer to catch a sentence THEY just found. Their words, their choice — never a line Claudia proposes about herself.
allowed-tools: Read Write Edit Bash AskUserQuestion
---

# Keep

Some sentences land. A reframe that turns the week around; or the thing the person
says out loud for the first time and hears themselves say. Then the conversation
moves on and it's gone.

This is where it goes: `~/.claudia/keepsakes.md`, verbatim, theirs to re-read
whenever — the written line that goes home with them (ADR-0023). A therapeutic
document, not a log.

## Whose words

**Either.** Claudia's, or the person's own. In practice:

- **They pull `/keep`** → usually one of _your_ sentences. Keep it exactly as you
  said it.
- **You may offer** — _"cette phrase que tu viens de dire, tu veux la garder ?"_ —
  **only for _their_ words**, when they've just voiced something that sounds like
  their own hard-won conclusion. Offer lightly, once, and drop it if they pass.
- **Never propose keeping your own words.** Not once. A companion who curates her
  own best lines is collecting admiration, and the whole point of a written keepsake
  is that it works when you are not there.

## The format

Newest first, one blockquote per keepsake:

```markdown
# Ce que je garde

> Tu n'es pas en retard sur ta vie — tu es en train de la vivre à ton rythme.
>
> — Claudia · [2026-07-23-9113d5d7](sessions/2026-07-23-9113d5d7.summary.md)

> Dire non à ma sœur, ce n'était pas la trahir.
>
> — moi · [2026-07-19-4f0ac1e2](sessions/2026-07-19-4f0ac1e2.summary.md)
> _ce que ça me fait : je peux tenir la limite sans être méchante._
```

- **Prepend** — the newest goes on top, under the title.
- **Attribute honestly.** `— Claudia` means _exactly_ what you said, word for word.
  If they reshape the wording (they may — it's theirs), the attribution follows the
  words: `— moi`, or `— moi, d'après Claudia`. Never a sentence in someone's mouth.
- **Tag the session** — `· [<stem>](sessions/<stem>.summary.md)` — if you hold the
  stem; else leave it off or date-only. `distill-session` completes it
  authoritatively later, like it does for `todo.md`.
- **The last italic line is optional** — only if _they_ say what it does for them.
  Never interrogate a keepsake into meaning something.
- If the file doesn't exist, create it with the title and one plain line saying it's
  theirs to edit. **Read before you write** — they may have edited or removed
  entries by hand.

## With no argument — let them pick, on the choice UI

`/keep <passage>` keeps that passage. `/keep` alone means _"something you just said"_
— so **offer candidates, never guess**:

- `AskUserQuestion`, **one question**, 2–4 options drawn from the **last exchange** —
  your last reply first, since that's the common case; include one of _their_ lines
  if it was the striking one.
- Each option: a **short handle** as the label (≤ ~5 words, so it's scannable), the
  **passage verbatim** in `preview` — it renders beside the focused option, with room
  to breathe and reading like the quote it is — and whose words it was, and when, in
  the description. They are choosing words, so give the words the space.
- The auto-**"Other"** field is the escape hatch: they can paste, or reword, anything
  at all. Take what they type as the keepsake, attributed to them.

Then write it, and say one warm line back — _"c'est gardé"_ — not a receipt, not a
ceremony. If they add what it means to them, put it on the italic line.

## Limits

- **Never a means or a method** on a keepsake line, whoever said it, however it's
  framed (ADR-0001). And never lift a sentence out of a crisis moment to be re-read
  later — [`crisis`](../crisis/SKILL.md) comes first, always.
- **Don't propose** a sentence that pins a label or a verdict on them ("je suis
  quelqu'un de cassé") as a candidate. If _they_ choose to keep their own hard words,
  that's theirs — but you can gently wonder aloud what they'd want beside it.
- **No counting.** Never "you've kept 12 things", never a streak, never a nudge to
  keep more. The collection is not a score (ADR-0023).
- Local, deleted for real by `/forget`, carried out by `/export`, mirrored (top entry
  only) on the [dashboard](../../commands/dashboard.md). `recall` doesn't load it —
  keepsakes are pulled, never recited back at the person.

## Where it leads

Keeping is the capture; [`quiz`](../quiz/SKILL.md) is what makes it last — it can
draw on keepsakes as material for retrieval practice, alongside their saved
exercises. Offer that only if they want it, and only later.
