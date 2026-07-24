#!/usr/bin/env bash
#
# Claudia demo — record a take.
#
# Re-seeds the scratch vault (every take starts from the same canonical fixture),
# then records an asciinema session in the fake home. Follow demo/scenario.take
# (the single source for the scenario): `type` lines are what you type and send,
# `draft` lines are typed WITHOUT sending — a `newline` between them is backslash
# then Enter, and `send` is the final Enter. End the take with Ctrl+D twice (once
# for claude, once for the shell).
#
# Usage:  ./demo/record.sh [take-name]     (default: claudia-demo)
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
. "$REPO/demo/env.sh"
TAKE="${1:-claudia-demo}"
CAST="$REPO/demo/recordings/$TAKE.cast"

command -v asciinema >/dev/null || { echo "asciinema not found — brew install asciinema"; exit 1; }
[ -d "$DEMO_HOME/desk" ] || "$REPO/demo/setup-home.sh"

node "$REPO/demo/seed-vault.mjs"
node "$REPO/demo/seed-claude-config.mjs"
mkdir -p "$REPO/demo/recordings"

echo "Recording to $CAST — pinned to 100×30, whatever the terminal's own size."
cd "$DEMO_HOME/desk"
HOME="$DEMO_HOME" asciinema rec --overwrite --window-size 100x30 "$CAST"

echo "✔ take saved: $CAST"
echo "  render it with: ./demo/render.sh $TAKE"
