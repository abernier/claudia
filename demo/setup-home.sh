#!/usr/bin/env bash
#
# Claudia demo — build the fake $HOME the recording runs in.
#
# The whole isolation story is one environment variable: Node's os.homedir() and
# the `~` in skill prose both follow $HOME, so running Claude Code with
# HOME=$DEMO_HOME redirects the hooks AND the skills to the scratch vault at once.
# The fake home lives OUTSIDE the repo on purpose — a cwd inside the repo would
# make the demo session inherit the project's CLAUDE.md/git context.
#
# Usage:  ./demo/setup-home.sh          (then the one-time manual step it prints)
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
. "$REPO/demo/env.sh"

mkdir -p "$DEMO_HOME/desk" "$DEMO_HOME/.claude/skills"

# Dev-link the plugin into the fake home (same shape as scripts/dev-link.sh; no
# marketplace install in there, so no shadowing).
ln -sfn "$REPO" "$DEMO_HOME/.claude/skills/claudia"

# The macOS login keychain is resolved via $HOME too — without this link the demo
# claude can't reach its own credentials and asks for /login. Same user, same
# binary, same keychain; the link only restores what faking $HOME hid.
mkdir -p "$DEMO_HOME/Library"
ln -sfn "$HOME/Library/Keychains" "$DEMO_HOME/Library/Keychains"

# A clean, anonymous prompt for the recording shell.
if [ ! -f "$DEMO_HOME/.zshrc" ]; then
  printf 'PROMPT="%%1~ %%%% "\n' > "$DEMO_HOME/.zshrc"
fi

# Permission pre-allows live in .claude/settings.json — merged (never clobbered)
# by seed-claude-config.mjs below, alongside the onboarding state.

node "$REPO/demo/seed-vault.mjs"
node "$REPO/demo/seed-claude-config.mjs"

echo "✔ fake home ready at $DEMO_HOME (recording cwd: $DEMO_HOME/desk)"
echo "  no onboarding needed — 'npm run demo' drops straight into a session"
