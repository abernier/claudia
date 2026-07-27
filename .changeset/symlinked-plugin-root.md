---
"claudia": patch
---

**A conversation already distilled could come back as "to distill" at every opening.**
Three scripts — the one that closes a distillation, the one that rebuilds your
dashboard, and the migration runner — worked out whether they had been _run_ or merely
_imported_ by comparing two paths, one of which Node resolves symlinks for and one it
doesn't. Reached through a link, each read its own invocation as an import and exited
without doing anything, reporting success.

So the summary got written but the flag saying "this one still needs distilling" was
never cleared, and the next opening re-read a transcript already distilled. Nothing was
ever at risk — the fail-safe keeps the flag rather than losing a session — but the
dashboard could sit stale and a migration could quietly not run.

Both paths are now resolved before being compared.
