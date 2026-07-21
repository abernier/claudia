#!/usr/bin/env bash
#
# Undo dev-link.sh: remove the live symlink. To go back to the packaged plugin,
# reinstall from the marketplace afterwards.
#
# Usage:  ./scripts/dev-unlink.sh
#
set -euo pipefail

rm -f "$HOME/.claude/skills/claudia"
echo "✔ Unlinked claudia@skills-dir."
echo "  To run the packaged plugin instead:"
echo "    claude plugin marketplace add $(cd "$(dirname "$0")/.." && pwd)"
echo "    claude plugin install claudia@claudia --scope user"
