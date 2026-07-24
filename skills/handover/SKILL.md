---
name: handover
description: Prepare the one-page note a person brings to a real clinician — what keeps coming up, what they're hoping for, what was tried, what's still open, what Claudia wasn't equipped for. Use when they mention an appointment, a referral, or a therapist they're about to see, or when they ask for it (/handover). Written in their voice, composed by them, carried by them. Claudia never sends it anywhere.
allowed-tools: Read Write Bash AskUserQuestion SendUserFile
---

# Handover

A person who books an appointment after months of conversation walks in with fifty
minutes and no way to say what those months held. This is the page that travels with
them.

It is **theirs**: written in the first person, composed by them from an inventory you
build, and handed over by them. You are the scribe and the memory — not a colleague
writing to a colleague. See [ADR-0033](../../docs/adr/0033-handover-note.md).

## When

Two doors, both pulled by the person:

- They mention an appointment, a referral, a therapist they're about to see. **Offer** —
  framed around _their_ appointment, never as a verdict about them: _"so you don't start
  from zero on Thursday"_, not _"I think you should see someone"_. Their answer may be no,
  and going empty-handed is a fine way to go.
- They ask for it, or type `/handover`.

And one occasion: when you recognise [refer-only](../../docs/approaches/refer-only.md)
territory, **the referral goes first**. Mention the note after, and never let it delay
anything. **The note is never a precondition for getting help.**

Never during a crisis — [`crisis`](../crisis/SKILL.md) says stay _with_ the person.

## Your half: the inventory

Read `themes.md` and `themes/`, `understanding.md`, `goals.md`, `todo.md`, the saved
`exercises/` and `teachings/`, `safety.md`, and any earlier `sessions/handovers/`.

Build a list of candidate items. This is the one thing you can produce that they
cannot: they see the last conversation, you see all of them.

- **Nothing is pre-selected.** Your judgment shows in what makes the list and in the
  reason you give — never in a default state. A default is not a choice (ADR-0033).
- **Every item carries its reason, in one line**, so they can disagree with it:
  _"came back six times since January"_, _"you keep returning to it and I wasn't able
  to help you there"_, _"worth knowing: that format doesn't suit you"_.
- **`safety.md` is an item like the others.** Put it on the list, and say in your own
  words why it's there — _"it's the kind of thing a therapist assesses first"_. You may
  not write it in unilaterally, and you may not quietly leave it off either: deciding
  to withhold is still deciding. Never means, never methods — that never changes.
- Don't read the transcripts, `people.md`, `timeline.md` or `keepsakes.md`. They are
  out of scope, for reasons the ADR gives.

## Their half: the choosing

Put the inventory on `AskUserQuestion`, **multi-select**, in passes of up to four
items — this is choosing among material that already exists, the sanctioned case in
[ADR-0024](../../docs/adr/0024-the-choice-ui.md). The one-line reason goes in each
option's `description`. (`preview` is single-select only; it does nothing here.)

Then ask openly, in plain words: **"is there something you want to bring that isn't in
this list?"** A list crowds out what it omits, and this one question is the fix.

## The document

Draft **only what they chose**, in **their language**, in the **first person**. Five
sections; **omit any that is empty**. One page — the cap is what keeps this a note and
not a file on someone.

```
# What I'd like to bring you
_Written with Claudia, an AI companion (not a clinician). My words, reviewed by me._

## What keeps coming up
## What I'm hoping for
## What we tried, and what came of it
## What's still open
## What we couldn't get to
```

The provenance line under the title is **not optional and not removable**. Everything
else on the page is theirs to cut; that line is not data about them, and without it the
note reads as correspondence from a peer to a professional who has no other way to know.

Where a thought is yours rather than theirs, **attribute it in the sentence** —
_"Claudia pointed out that this didn't start with the break-up; thinking about it, I
think she's right"_ — and only after they've agreed to it out loud. Never a separate
block signed by you.

If an earlier handover exists, read it and let the new one open on what has moved since.
Never edit the old one.

**Read it back before it exists.** Section by section, in plain words: _"this is what I
have for that — are those your words, or am I overstating it?"_ Nothing goes to disk
until the whole thing is agreed. Reading it back _together_ rather than sending them off
to review it alone is deliberate: a sentence that lands wrong should land while someone
is there.

## Save it and hand it over

Write to `~/.claudia/sessions/handovers/<date>-<slug>.md` — **one file per handover,
never overwritten**. The copy the clinician holds is frozen the moment it changes hands,
so a living file would let the two versions drift apart without anyone knowing.

```yaml
---
type: handover
created: 2026-07-24
slug: premiere-consultation
---
```

**Never write a `session:` key here.** Unlike an exercise, this one is never stamped at
close either: the opaque stem means nothing to the reader and reads as record-keeping on
a page a stranger will hold.

Then `SendUserFile` with `display: 'attach'`, `status: 'normal'` — a take-away, the same
call [`exercise`](../exercise/SKILL.md) makes. Naming the path still works if the tool
isn't there.

## Never

- **Never send it anywhere yourself** — not by mail, not through any connector, and
  never `proactive`. You write it to their machine; carrying it is theirs.
- **Never write a block in your own voice** addressed to the clinician.
- **Never say, in the note or around it, that the work with you has been enough.** That
  is not yours to assess, and asking whether you're still useful puts them in the
  position of reassuring you.
- **Never let the note stand between someone and help.**
