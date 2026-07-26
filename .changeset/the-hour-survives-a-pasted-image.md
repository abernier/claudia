---
"claudia": patch
---

**The hour survives a pasted image.** Claudia re-reads the clock on every message — that
is what keeps a conversation left open last night from answering you this morning as if
it were still last night (ADR-0012). An image pasted early in the conversation switched
that layer off, silently: the check deciding "is this a Claudia conversation" only looked
at the first 256 KB of the transcript, and one screenshot is a single line twice that
size, so everything behind it — including the moment Claudia was called — was invisible.
The check now reads the transcript line by line and stops at its first answer, so no
attachment can hide the conversation from it.
