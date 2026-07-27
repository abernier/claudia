---
status: accepted
---

# Two-layer memory under ~/.claudia

Claudia's memory lives entirely on the person's own machine under `~/.claudia/`,
in **two layers** with different jobs:

1. **Working memory** — what Claudia reads for continuity: a distilled
   `person.md`, `goals`, `safety.md`, and one **distilled summary per session**
   (`sessions/2026-07-21.summary.md`). Lean enough to load into context.
   **Recall only ever reads this layer** — never the raw transcripts (context
   economy, avoids re-exposing crisis content, and limits the "illusion of a
   continuous relationship" the APA warns about).

2. **Person's archive** — the **verbatim dated transcript**
   (`sessions/2026-07-21.transcript.md`), saved **by default**. This is the
   person's own journal; autonomy over one's own local data won over the
   privacy-minimising default. Claudia does not routinely re-read it.

## Making default-on safe (per safety floor rule 10)

- **One-time, clear disclosure** at first run that transcripts are saved locally
  — the "when it matters" moment, not a repeated disclaimer.
- **Strictly local, never uploaded.** `~/.claudia/` is never sent anywhere;
  the plugin ships guidance to keep it out of cloud sync / backups.
- `/forget` performs **real deletion** (transcript + summary + derived notes).
- `/export` bundles everything for portability.
- Retention is the person's to set; deletion is always real.

## Consequences

- Session close writes two files (transcript + distilled summary). A deterministic
  `Stop`/session-end hook is the natural place, so it happens even without a
  formal close.
- The distiller that produces summaries must itself respect the safety floor (no
  verbatim means/method, etc.) when writing to the working layer.
- Because the archive is default-on, the first-run disclosure is a hard
  requirement, not optional polish.
