---
status: accepted
---

# Images and documents in a transcript — extracted, embedded, reusable

People paste images into a conversation — most often a screenshot. Claude Code
stores each one **inline in the session JSONL as base64**
(`{"type":"image","source":{"type":"base64","media_type":"image/png","data":"…"}}`),
not as a file reference. The transcript renderer (`renderMarkdown`) only ever kept
text blocks, so those images were silently dropped: they survived only inside Claude
Code's own project store (`~/.claude/projects/…`), never in the person's own archive
under `~/.claudia/`.

The same is true of **documents**, in the same shape under a different block type
(`{"type":"document","source":{"type":"base64","media_type":"application/pdf",…}}`),
and it matters more here than the format suggests: the PDF someone brings to a session
is a letter, a medical report, a decision they received. Losing it from the archive
loses the thing the conversation was _about_.

Two things the person wants, from one mechanism: the asset should **be part of the
transcript**, and it should be **reusable elsewhere** — linkable from any other
markdown (an Obsidian note, a person fiche, wherever).

## Decision

Images and documents that entered the conversation are materialised as files in the
local archive, referenced inline from the transcript. Passive only — this happens at
archival time; there is no "pin this" affordance to invoke.

- **Extracted at `SessionEnd`, in the existing archival path.** `scripts/save-session.mjs`
  already reads the JSONL and renders the transcript; it now also decodes each asset's
  base64 and writes it to disk. No new hook, no new command.

- **Stored per-session, beside the transcript** — `sessions/<stem>.assets/`, a folder
  namespaced by the same `<stem>` as `<stem>.transcript.md`. Files are named
  `img-001.<ext>`, `img-002.<ext>`… and `doc-001.<ext>`, `doc-002.<ext>`… **by order of
  appearance on their own per-kind counter**, extension from the `media_type` (an
  unknown one falls back to `.bin` — the bytes are still written, under a name that
  claims nothing about them). Because the JSONL is append-only, the Nth image is always
  `img-00N`, so re-extracting on every close (the transcript is overwritten each close,
  ADR-0017) is **idempotent** — same names, same bytes.

- **Referenced inline, at its position.** `renderMarkdown` emits
  `![img-001](<stem>.assets/img-001.png)` exactly where the asset occurred in the flow,
  with a link **relative to the session folder** — so it renders in Obsidian, GitHub, or
  a preview pane, and keeps working verbatim after `/export`. The image _is_ part of the
  transcript, not an appendix. A document gets a **plain link** carrying its full
  filename — `[doc-001.pdf](<stem>.assets/doc-001.pdf)` — because no reader can inline a
  PDF, and a broken `![…]` would read as a lost image rather than an attached file.

- **The core stays pure.** `renderMarkdown` gains no filesystem side effects: it returns
  `{ markdown, assets: [{ name, mediaType, data }] }` — deciding names, links, and
  numbering (all testable in memory) — and the impure wrapper decodes the base64 and
  writes the bytes. One list, not one per kind: the name already carries the kind, and
  the write loop has no reason to care. The invariant in `src/session.mjs` ("no
  filesystem side effects here") holds.

- **All assets in the rendered turns, not just top-level ones.** Top-level blocks (what
  the person pastes or attaches) and any nested one level inside a `tool_result` are both
  extracted — so a tool that returns an image or a document lands the same way, at no
  extra cost. A `tool_result`'s _text_ stays dropped, on purpose, so the genuine-session
  gate (ADR-0017) is unaffected.

- **Same trust boundary as the transcript.** Local-only, never uploaded (ADR-0004,
  ADR-0007). Governed by the **same** opt-out: `{ "saveTranscripts": false }` skips assets
  too — there is no separate flag, so the archive never references a file it didn't
  write. `/forget` of a session deletes `<stem>.assets/` with it; `/export` copies it out
  (its recursive walk already does). `recall` never reads a transcript, and the dashboard
  is built from the working files, not transcripts — so a pasted screenshot or an attached
  report, which may be sensitive, never re-enters context and never surfaces in the mirror.

## Not done: files that were never in the message

A file the person `@`-mentions or drags in does **not** arrive as a content block. Claude
Code puts it in a separate JSONL line outside `.message.content`
(`{"type":"attachment","attachment":{"type":"file","filename":…,"content":{"type":"text",…}}}`),
and `renderMarkdown` never looks there. That stays true, deliberately: the file already
exists on the person's own disk, at a path they chose, and copying its contents into
`<stem>.assets/` would duplicate data — sometimes large, often sensitive — that nobody
asked the archive to keep. Base64 blocks are different precisely because there is **no**
other copy: drop them and they are gone.

The cost is real and accepted: re-reading such a transcript, "the document I showed you"
names nothing the archive can resolve. Surfacing the reference alone (filename and path,
never the contents) would close that gap without duplicating anything — deliberately left
for its own decision, because it turns on whether an attached file counts as the person's
_words_ or as a tool result, and ADR-0017 drops tool results on purpose.

## Consequence, accepted

Per-session storage keeps `/forget` trivial and provenance obvious, but it means a link
from _elsewhere_ into `<stem>.assets/…` **breaks if that session is forgotten**. That is
the deliberate trade for simplicity and clean deletion: no shared content-addressed pool,
no reference counting. If durable cross-session reuse is ever needed, a shared pool can be
added later without disturbing this layout.

A document block does not record **who** brought it: a PDF the person attached and a PDF
Claudia read for them land identically, in a `user` message. So both are archived. That is
the conservative side to err on — an unwanted copy sits in a folder `/forget` deletes
wholesale, whereas a missing one is unrecoverable — but it does mean a large PDF read in
passing is rewritten on every close.

A PDF also arrives **twice**: Claude Code sends the document block _and_ rasterises every
page into `image` blocks for vision. The archive keeps both (a 9-page PDF measured at
184 KB plus ~1.3 MB of page JPEGs), and that is on purpose — the page images were already
extracted under this ADR, and the document is the only one of the two that is the actual
file. Deduplicating them would mean guessing which images belong to which document from
adjacency alone; not worth the fragility at this size.
