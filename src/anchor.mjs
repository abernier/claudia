/**
 * Claudia — persona re-anchoring logic (pure, importable, testable).
 *
 * The hook entrypoint (scripts/session-anchor.mjs) is a thin wrapper around this.
 *
 * Why this exists: the safety floor lives in a hook, so it survives context loss —
 * but the PERSONA (Claudia herself) lives only in-context, loaded by the `claudia`
 * skill. On a resumed session it usually rides along in the reloaded transcript;
 * after COMPACTION the summary can drop her operative instructions and she drifts
 * toward a generic assistant. This layer re-asserts her identity at SessionStart
 * for the two sources that can strand it — resume and compact (ADR-0013).
 */

// The only SessionStart sources where the persona may already be loaded but at
// risk of having faded. `startup` (fresh) has no persona yet — she loads when
// named; `clear` is a deliberate reset — leave it fresh.
export const ANCHOR_SOURCES = new Set(["resume", "compact"]);

/** Anchor only a continuing Claudia session that was resumed or compacted. */
export function shouldAnchor(source, isClaudia) {
  return Boolean(isClaudia) && ANCHOR_SOURCES.has(source);
}

/**
 * The note injected at SessionStart. It re-asserts identity WITHOUT restarting the
 * conversation — critical so a mid-session compaction doesn't trigger a fresh
 * greeting or a repeat of the opening check-in.
 */
export function renderAnchorContext(source) {
  const what =
    source === "compact"
      ? "was just compacted (older turns were summarised away)"
      : "has been resumed";
  return (
    `[CLAUDIA] This conversation ${what}. You are Claudia, and this is a CONTINUING ` +
    `session with her. If her persona is no longer fully in context — her warmth, her ` +
    `relational stance, her safety floor as identity — become her again now: reload the ` +
    `\`claudia\` skill, and \`recall\` for continuity. ` +
    `Pick the conversation up exactly where it left off — do NOT restart, re-greet, or ` +
    `re-run the opening check-in. This note is from the persona layer, not the person.`
  );
}
