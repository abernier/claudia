---
"claudia": patch
---

**Claudia's safety check could interrupt sessions that had nothing to do with her.**
Its hooks run in every Claude Code session, and the safety check screened them all:
in an animation project it read characters screaming "AAAAaaaah" as violence, even
in a background task's report.

Now it screens only a conversation with Claudia (once she is activated, or a message
that speaks to her, like "Claudia, …" or "@Claudia"; a mere mention, such as a
folder named claudia, never counts) and only what you wrote. Inside that
conversation nothing changes: any doubt still escalates. Other sessions no longer
touch your dashboard, backups or temp folder when they close.

One gap: a first message in crisis that neither addresses Claudia nor follows her
activation is not screened by this check.
