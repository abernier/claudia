#!/usr/bin/env bash
#
# Live-development link. Symlinks this repo into ~/.claude/skills so Claude Code
# loads it in place as `claudia@skills-dir` — edits to the repo take effect with
# no reinstall. Removes any cached marketplace install first to avoid duplicate
# hooks.
#
# Usage:  ./scripts/dev-link.sh      (then restart Claude Code, or /reload-plugins)
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# Drop the packaged (cached, versioned) install if present — it would duplicate
# this plugin's hooks/skills.
claude plugin uninstall claudia@claudia >/dev/null 2>&1 || true

mkdir -p "$HOME/.claude/skills"
ln -sfn "$REPO" "$HOME/.claude/skills/claudia"

echo "✔ Linked claudia@skills-dir -> $REPO"
echo "  Edits are now live. Apply them with /reload-plugins (context) or a restart (hooks)."
echo "  Revert with: ./scripts/dev-unlink.sh"
