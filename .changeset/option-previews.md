---
"claudia": patch
---

Use `AskUserQuestion`'s **`preview` field** where the person is choosing between things worth _seeing_ rather than labels (amends ADR-0024). It renders markdown beside whichever option is focused, and it is **single-select only** — a multi-select question cannot carry one, which is why `quiz`'s "which lessons" must not try. The surface it most improves is `keep`: the candidate passage was being crammed into an option `description`, and the person is choosing _words_, so the words now get the preview pane and read like the quote they are, with whose line it was and when left in the description. `exercise` gains the same treatment for the worksheet's shape — its headings and blanks, so they see what they'd actually be filling in. `skills/quiz/SKILL.md` documents the field, as ADR-0024 designates it the reference description of the tool's shape for the whole plugin.
