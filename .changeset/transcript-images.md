---
"claudia": minor
---

Persist pasted images in a transcript. Screenshots a person pastes into a
conversation used to be dropped from the saved `.transcript.md` (they lived only as
base64 inside Claude Code's own JSONL). They are now extracted at `SessionEnd` into a
per-session `sessions/<stem>.assets/` folder as `img-NNN.<ext>`, embedded inline in
the transcript with a relative link, and reusable from any other markdown. Local-only,
governed by the same `saveTranscripts` opt-out, deleted with the session by `/forget`,
copied out by `/export` (ADR-0021).
