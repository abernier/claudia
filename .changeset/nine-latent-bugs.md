---
"claudia": patch
---

Fix the latent bugs surfaced by the strict-typing pass (ADR-0022 follow-up):

- **safety**: an unrecognized model-classifier verdict (wrong case, unknown
  value, missing field) on an uncertain message now escalates fail-safe —
  previously `{"risk":"IMMINENT"}` silently read as *no risk*. Only an
  explicit, recognized `none` clears; `SafetyDecision` is now a discriminated
  union so `escalate: true` provably carries a reason.
- **save-session**: the `pending-summary` marker is dropped *before* the
  transcript write, so a failed archive write still flags the session for
  distillation at next recall (ADR-0016's dirty-flag contract).
- **vault-export**: a failing `/export` now reports the error and exits
  non-zero, warning that the copy at the destination may be partial —
  previously it swallowed everything with a success code.
- **migrate-vault**: errors mid-migration now print a clear message naming the
  `.bak-<stamp>` backup to restore (was: unhandled rejection); a dry-run over a
  file-*creating* migration renders as pure additions instead of crashing.
- **session**: `resolveTranscriptPath` tolerates a nullish payload like its
  sibling `sessionIdFrom`; `ContentBlock.content` models the raw-string form
  real transcripts can carry.
- Plus: `rewriteFile`'s guard/read pair collapsed to a single checked `get`,
  and `pending-sessions`' docs now describe the stems it actually emits.
