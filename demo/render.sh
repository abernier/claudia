#!/usr/bin/env bash
#
# Claudia demo — render a recorded take: .cast → .gif (agg) → .mp4 (ffmpeg).
#
# The .cast is the committed editing source; gif and mp4 are regenerable outputs
# (gitignored). Idle stretches are capped so thinking pauses don't pad the video.
#
# Usage:  ./demo/render.sh [take-name]     (default: claudia-demo)
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
TAKE="${1:-claudia-demo}"
CAST="$REPO/demo/recordings/$TAKE.cast"
GIF="$REPO/demo/recordings/$TAKE.gif"
MP4="$REPO/demo/recordings/$TAKE.mp4"

command -v agg >/dev/null || { echo "agg not found — brew install agg"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found — brew install ffmpeg"; exit 1; }
[ -f "$CAST" ] || { echo "no take at $CAST — record one with ./demo/record.sh"; exit 1; }

agg --font-size 16 --idle-time-limit 2 "$CAST" "$GIF"

# yuv420p + even dimensions: the broadly-compatible mp4 shape (QuickTime, web, socials).
ffmpeg -y -loglevel error -i "$GIF" \
  -movflags faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  "$MP4"

echo "✔ rendered:"
echo "  $GIF"
echo "  $MP4"
