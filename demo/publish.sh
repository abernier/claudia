#!/usr/bin/env bash
#
# Claudia demo — publish the take's .cast to asciinema.org and print the
# ready-to-paste README badge. Publishing is an explicit act: run this only when
# the take is the one you want public. (An anonymous upload returns a secret
# URL; link it to your account with `asciinema auth` to manage it later.)
#
# Usage:  ./demo/publish.sh [take-name]     (default: claudia-demo)
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
TAKE="${1:-claudia-demo}"
CAST="$REPO/demo/recordings/$TAKE.cast"

command -v asciinema >/dev/null || { echo "asciinema not found — brew install asciinema"; exit 1; }
[ -f "$CAST" ] || { echo "no take at $CAST — record one with npm run demo:take"; exit 1; }

# v3 CLI: the server must be explicit; the piped newline answers the one-time
# consent prompt so this also works from a non-TTY.
URL="$(printf '\n' | ASCIINEMA_SERVER_URL=https://asciinema.org asciinema upload "$CAST" | grep -oE 'https://asciinema\.org/a/[A-Za-z0-9]+' | head -1)"
[ -n "$URL" ] || { echo "✗ upload did not return an asciinema URL"; exit 1; }
ID="${URL##*/}"

echo "✔ published: $URL"
echo
echo "README badge (paste over the demo placeholder):"
echo
echo "[![Claudia demo](https://asciinema.org/a/$ID.svg)]($URL)"
