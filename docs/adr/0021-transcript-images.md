---
status: accepted
---

# Images in a transcript — extracted, embedded, reusable

People paste images into a conversation — most often a screenshot. Claude Code
stores each one **inline in the session JSONL as base64**
(`{"type":"image","source":{"type":"base64","media_type":"image/png","data":"…"}}`),
not as a file reference. The transcript renderer (`renderMarkdown`) only ever kept
text blocks, so those images were silently dropped: they survived only inside Claude
Code's own project store (`~/.claude/projects/…`), never in the person's own archive
under `~/.claudia/`.

Two things the person wants, from one mechanism: the image should **be part of the
transcript**, and it should be **reusable elsewhere** — linkable from any other
markdown (an Obsidian note, a person fiche, wherever).

## Decision

Images the person pastes are materialised as files in the local archive, referenced
inline from the transcript. Passive only — this happens at archival time; there is no
"pin this image" affordance to invoke.

- **Extracted at `SessionEnd`, in the existing archival path.** `scripts/save-session.mjs`
  already reads the JSONL and renders the transcript; it now also decodes each image's
  base64 and writes it to disk. No new hook, no new command.

- **Stored per-session, beside the transcript** — `sessions/<stem>.assets/`, a folder
  namespaced by the same `<stem>` as `<stem>.transcript.md`. Files are named
  `img-001.<ext>`, `img-002.<ext>`… **by order of appearance**, extension from the
  `media_type`. Because the JSONL is append-only, the Nth image is always `img-00N`, so
  re-extracting on every close (the transcript is overwritten each close, ADR-0017) is
  **idempotent** — same names, same bytes.

- **Embedded inline, at its position.** `renderMarkdown` emits
  `![img-001](<stem>.assets/img-001.png)` exactly where the image occurred in the flow,
  with a link **relative to the session folder** — so it renders in Obsidian, GitHub, or
  a preview pane, and keeps working verbatim after `/export`. The image _is_ part of the
  transcript, not an appendix.

- **The core stays pure.** `renderMarkdown` gains no filesystem side effects: it returns
  `{ markdown, images: [{ name, mediaType, data }] }` — deciding names, links, and
  numbering (all testable in memory) — and the impure wrapper decodes the base64 and
  writes the bytes. The invariant in `src/session.mjs` ("no filesystem side effects
  here") holds.

- **All images in the rendered turns, not just top-level pastes.** Top-level image blocks
  (what the person pastes) and any nested one level inside a `tool_result` are both
  extracted — future-proof for a tool that returns an image, at no extra cost. A
  `tool_result`'s _text_ stays dropped, on purpose, so the genuine-session gate (ADR-0017)
  is unaffected.

- **Same trust boundary as the transcript.** Local-only, never uploaded (ADR-0004,
  ADR-0007). Governed by the **same** opt-out: `{ "saveTranscripts": false }` skips images
  too — there is no separate flag, so the archive never references an image it didn't
  write. `/forget` of a session deletes `<stem>.assets/` with it; `/export` copies it out
  (its recursive walk already does). `recall` never reads a transcript, and the dashboard
  is built from the working files, not transcripts — so a pasted screenshot, which may be
  sensitive, never re-enters context and never surfaces in the mirror.

## Consequence, accepted

Per-session storage keeps `/forget` trivial and provenance obvious, but it means a link
from _elsewhere_ into `<stem>.assets/…` **breaks if that session is forgotten**. That is
the deliberate trade for simplicity and clean deletion: no shared content-addressed pool,
no reference counting. If durable cross-session reuse is ever needed, a shared pool can be
added later without disturbing this layout.
