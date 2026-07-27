/**
 * Claudia — "was this file run, or was it imported?" (the entry-point test).
 *
 * Every script under `scripts/` is both things at once: an executable the hooks and
 * the skills invoke, and a module its test imports. The line that told them apart was
 * written inline, three times:
 *
 *     if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
 *
 * and it is wrong in a way nothing catches. Node resolves symlinks for
 * `import.meta.url` but not for `argv[1]`, so the two sides disagree the moment the
 * script is reached *through* a link — which is exactly what a dev install is
 * (`~/.claude/skills/claudia -> …/claudia/plugin`), and what any `${CLAUDE_PLUGIN_ROOT}`
 * path may turn out to be. `main()` then never runs and the script exits 0, so the
 * caller sees a success: `finish-distillation` quietly stopped clearing its marker,
 * and every recall re-flagged a session that had already been distilled.
 *
 * Failing open is not available here — the scripts carrying this line are precisely the
 * ones whose silence is indistinguishable from success. So both sides are resolved
 * through the filesystem before they are compared. This is the one module under `src/`
 * that reads the filesystem, because the question it answers *is* a filesystem question.
 */

import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The real (symlink-free) absolute path of `p`. A path that does not exist resolves as
 * far as it can and stops: a caller's typo must read as "not the entry point", never
 * as a throw out of a guard.
 *
 * @param {string} p
 * @returns {string}
 */
function real(p) {
  const abs = path.resolve(p);
  try {
    return realpathSync(abs);
  } catch {
    return abs;
  }
}

/**
 * True when the module that asks is the file Node was asked to run.
 *
 * @param {string} importMetaUrl - the caller's own `import.meta.url`
 * @param {string} [argv1] - the invoked path; defaults to `process.argv[1]` (injectable, for tests)
 * @returns {boolean} false when nothing was invoked at all — an import, a REPL
 */
export function isEntrypoint(importMetaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return real(argv1) === real(fileURLToPath(importMetaUrl));
}
