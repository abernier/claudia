/**
 * Claudia — "is this a Claudia session?" (the gate every hook passes first, ADR-0036).
 *
 * The plugin is installed at user scope, so `hooks/hooks.json` fires in EVERY Claude
 * Code session on the machine — a coding session, a video edit, a background task.
 * Each hook therefore has to ask one question before it does anything at all, and
 * this module is where that question is answered, once.
 *
 * The signal is the one `src/session.mjs` already defines: the `claudia` skill's
 * loader preamble, appearing as a user-role message in the transcript every hook
 * can locate from its payload. Plus, for the per-turn safety hook only, the person
 * addressing her directly in the prompt — the skill triggers on her name, so on
 * turn one the activation is not in the transcript yet.
 *
 * Like `src/entry.mjs`, this module reads the filesystem, because the question it
 * answers is a question about a file. It never writes, and it never throws: a gate
 * that cannot decide answers "not Claudia", which for every benign hook is silence.
 */

import { createReadStream } from "node:fs";
import os from "node:os";
import readline from "node:readline";
import { isClaudiaActivationLine, resolveTranscriptPath } from "./session.mjs";

/**
 * Does the transcript at `file` contain a genuine Claudia activation? Streamed line
 * by line, stopping at the first hit.
 *
 * This used to be a bounded head-read (the first 256 KB), which looked cheap and was
 * wrong: an image pasted early in the conversation is a single ~500 KB line, so
 * everything after it — the activation included — fell outside the window, the gate
 * read "not a Claudia session", and the time layer silently switched off for the whole
 * conversation. That is precisely the bug ADR-0012 exists to close, so the gate may not
 * be the thing that reintroduces it. A stream costs one substring test per line and
 * exits on the first match (turn one, in a real Claudia session); only a session that
 * never activates Claudia is walked to the end.
 *
 * @param {string} file  path to the JSONL transcript
 * @returns {Promise<boolean>} rejects when the file cannot be read
 */
export async function isClaudiaTranscript(file) {
  const stream = createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) if (isClaudiaActivationLine(line)) return true;
    return false;
  } finally {
    rl.close();
    stream.destroy();
  }
}

/**
 * Is the session a hook payload describes a Claudia session? Locates the transcript
 * from the payload (see `resolveTranscriptPath`) and streams it for an activation.
 *
 * Never throws. A missing payload, an unresolvable path, a transcript not written yet
 * or unreadable — each answers false: when the gate cannot tell, the hook behind it
 * stays out of the way.
 *
 * @param {import("./session.mjs").TranscriptHookPayload | null | undefined} payload
 * @param {string} [home]  the base under which `.claude/projects` lives (injectable, for tests)
 * @returns {Promise<boolean>}
 */
export async function isClaudiaHookPayload(payload, home = os.homedir()) {
  const transcriptPath = resolveTranscriptPath(payload, home);
  if (!transcriptPath) return false;
  try {
    return await isClaudiaTranscript(transcriptPath);
  } catch {
    return false;
  }
}

/**
 * `@Claudia` as a standalone token. Not after a letter, digit or path/identifier
 * character (`user@claudia.dev`, `x@Claudia`), and not followed by one
 * (`@claudia/plugin`, `@Claudia_bot`). A trailing `.` or `-` counts only when
 * whitespace or the end follows it — that is a sentence ending, not a filename.
 */
const AT_MENTION = /(?<![\p{L}\p{N}_/\\.`@-])@claudia(?![\p{L}\p{N}_/\\`@]|[.\-](?!\s|$))/iu;

/**
 * An opening address: the prompt starts with an optional greeting, then "Claudia",
 * then a vocative boundary — a comma, "!", "?", a "." or ":" followed by whitespace
 * or the end, a dash or em-dash followed by a space, a line break, or the end.
 * "Claudia's hook", "Claudia doesn't trigger", "claudia/plugin", "claudia:crisis",
 * "claudia.md" all fail the boundary.
 */
const OPENING_ADDRESS =
  /^(?:(?:hey|hi|hello|dear|ok|okay|bonjour|salut|coucou|allo|allô)[\s,]+)?claudia(?=[,!?]|[.:](?:\s|$)|[ \t]*[-–—][ \t]|[ \t]*(?:\n|$))/iu;

/**
 * Does this text ADDRESS Claudia — speak to her, not about her? `@Claudia` anywhere
 * as a standalone token, or a prompt that opens with (an optional greeting and) her
 * name as a vocative: "Claudia, I can't go on", "Hey Claudia!", "salut Claudia\n…".
 *
 * The `claudia` skill triggers on her name, so on turn one her activation is not in
 * the transcript yet; addressing her is what opens the safety gate for that turn.
 *
 * Deliberately narrow (ADR-0036). A mention is not an address: "Claudia's safety hook
 * is broken", "the claudia skill", "cd ~/code/claudia", "`claudia`" are all coding
 * sessions talking ABOUT her, and a hook that fires there is the failure that matters
 * most. The text is expected with harness blocks already stripped (`personsWords`).
 *
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function addressesClaudia(text) {
  const t = String(text || "").trim();
  return AT_MENTION.test(t) || OPENING_ADDRESS.test(t);
}
