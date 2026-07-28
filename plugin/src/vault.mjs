/**
 * Claudia — where the person's Memory lives (the vault seam, ADR-0035).
 *
 * This module is the one place in the codebase that answers "which directory is
 * the vault?". It used to be answered inline at nine call sites, and only one of
 * them honoured the root override — so a dev run or a test could reach the
 * person's real notes through any of the other eight. Every script's CLI adapter
 * resolves the root here and passes it down; nothing below an adapter resolves
 * it again.
 */

import os from "node:os";
import path from "node:path";

/**
 * The vault root: the `CLAUDIA_ROOT` override when set, else `.claudia` under
 * the home directory. An empty override reads as "unset" — resolving `""`
 * would aim every write at the current working directory.
 *
 * @param {NodeJS.ProcessEnv} [env] - defaults to the process environment
 * @param {string} [home] - defaults to the real home directory
 * @returns {string}
 */
export function resolveVaultRoot(env = process.env, home = os.homedir()) {
  return env.CLAUDIA_ROOT || path.join(home, ".claudia");
}
