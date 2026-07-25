/**
 * Canonical production site URL (no trailing slash).
 *
 * Driven by the `VITE_SITE_URL` environment variable so the site can move
 * to a custom domain without code changes — just set the env var per
 * deployment. Falls back to the Vercel default URL.
 *
 * In Node.js contexts (the prerender script) `import.meta.env` is
 * `undefined`; callers there read `process.env.VITE_SITE_URL` directly.
 */
export const SITE_URL = import.meta.env?.VITE_SITE_URL ?? "https://claudia-site-theta.vercel.app";

/** Application name. */
export const APP_NAME = "Claudia";

/** GitHub repository — the source of truth for code, issues, and releases. */
export const GITHUB_URL = "https://github.com/abernier/claudia";

/**
 * The published recording of the take the hero plays locally from the repo's
 * `demo/` kit. Same cast, hosted — so a visitor can pause, scrub, or copy text
 * out of it, none of which the looping hero player affords.
 *
 * Re-published by `npm run demo:publish` after a re-shoot; update this then.
 */
export const ASCIINEMA_URL = "https://asciinema.org/a/TUfER9Ay8Hozzd3d";

/**
 * Public contact email surfaced in the legal block. Same status as the
 * GitHub profile — a public marketing identifier, no secret.
 */
export const LEGAL_CONTACT_EMAIL = "antoine.bernier@gmail.com";

/**
 * The two-step install: the repo is its own single-plugin marketplace,
 * so visitors register the marketplace, then install the plugin.
 * Kept as an array so the hero can render one line per command and the
 * copy button can join them with newlines.
 */
export const INSTALL_COMMANDS = [
  "claude plugin marketplace add abernier/claudia",
  "claude plugin install claudia@claudia --scope user",
] as const;
