---
"claudia": patch
---

**Claudia's safety check could interrupt sessions that had nothing to do with her.**
The plugin runs in every Claude Code session on your machine, and its safety check
screened them all. In an unrelated animation project it read characters screaming
"AAAAaaaah" as violence and switched the assistant to crisis support, even on a
background task's report no person had typed.

Now it screens only a conversation with Claudia (once she is activated, or a message
that names her, so a first "Claudia, …" in crisis is still caught) and only what you
wrote. Inside that conversation nothing changes: any doubt still escalates. Other
sessions no longer refresh your dashboard, back up your notes, or leave a file in
your temp folder when they close.

One gap: a first message in crisis that neither names Claudia nor follows her
activation is not screened by this check.
