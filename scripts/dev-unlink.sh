#!/usr/bin/env bash
#
# Undo dev-link.sh: remove the live symlink. To go back to the packaged plugin,
# reinstall from the marketplace afterwards.
#
# Usage:  npm run unlink
#
set -euo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
LINK="$CLAUDE_DIR/skills/claudia"

if [ -L "$LINK" ]; then
  rm -f "$LINK"
  echo "✔ Unlinked claudia@skills-dir."
elif [ -e "$LINK" ]; then
  # Not something this script put there — a copied install. Same rule as
  # dev-link.sh: name it, don't delete a directory in someone's $HOME.
  echo "✘ $LINK is not a symlink — a copied install, not the dev link." >&2
  echo "  Remove it yourself if you meant to: rm -rf \"$LINK\"" >&2
  exit 1
else
  echo "· Already unlinked ($LINK does not exist)."
fi

echo "  Note: the next 'npm install' links it again (the prepare script)."
echo "  To run the packaged plugin instead:"
echo "    claude plugin marketplace add $(cd "$(dirname "$0")/.." && pwd)"
echo "    claude plugin install claudia@claudia --scope user"
