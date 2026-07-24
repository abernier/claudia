#!/usr/bin/env bash
#
# Claudia demo — auto-pilot take. Performs demo/scenario.take (the single source
# of truth for the scenario) against the real claude TUI in a tmux pane while
# asciinema records the attached client, so a full take can be (re)generated
# with no human typist:
#
#   ./demo/drive-take.sh [take-name] [scenario-file]
#   DRY_RUN=1 ./demo/drive-take.sh          # parse/validate the scenario only
#
# The model's replies vary between takes; the scenario types the person's lines
# and waits for the pane to go quiet before the next beat. A permission prompt
# mid-take means the fake home isn't pre-allowed — the driver fails loudly
# rather than recording a broken take.
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
. "$REPO/demo/env.sh"
TAKE="${1:-claudia-demo}"
SCENARIO="${2:-$REPO/demo/scenario.take}"
CAST="$REPO/demo/recordings/$TAKE.cast"
SES="claudia-take"
DRY="${DRY_RUN:-}"

[ -f "$SCENARIO" ] || { echo "no scenario at $SCENARIO"; exit 1; }

if [ -z "$DRY" ]; then
  command -v tmux >/dev/null || { echo "tmux not found — brew install tmux"; exit 1; }
  command -v asciinema >/dev/null || { echo "asciinema not found — brew install asciinema"; exit 1; }
  [ -d "$DEMO_HOME/desk" ] || "$REPO/demo/setup-home.sh"

  node "$REPO/demo/seed-vault.mjs"
  node "$REPO/demo/seed-claude-config.mjs"
  mkdir -p "$REPO/demo/recordings"

  tmux kill-session -t "$SES" 2>/dev/null || true
  # bash --norc: immune to whatever rc files an environment ships; PS1 via env.
  tmux new-session -d -s "$SES" -x 100 -y 30 -c "$DEMO_HOME/desk" \
    env HOME="$DEMO_HOME" PS1='desk % ' bash --noprofile --norc
  tmux set-option -t "$SES" status off
  # Keep a crashed pane on screen (diagnosable) instead of evaporating the session.
  tmux set-option -t "$SES" remain-on-exit on

  sleep 1
  if ! tmux has-session -t "$SES" 2>/dev/null; then
    echo "✗ tmux session died at startup" >&2
    exit 1
  fi
  if tmux capture-pane -pt "$SES" | grep -q "Pane is dead"; then
    echo "✗ the recording shell crashed at startup:" >&2
    tmux capture-pane -pt "$SES" | tail -10 >&2
    exit 1
  fi

  # A failed take must not leave a recorder or a tmux session behind.
  cleanup() {
    tmux kill-session -t "$SES" 2>/dev/null || true
    [ -n "${REC:-}" ] && kill "$REC" 2>/dev/null || true
  }
  trap cleanup EXIT

  # Record the attached client; keep the pty at the pane's size.
  asciinema rec --overwrite --quiet --cols 100 --rows 30 "$CAST" \
    -c "tmux attach -t $SES" &
  REC=$!
  sleep 1

  echo "· take running (watch: tmux attach -t $SES) …"
fi

pane() { tmux capture-pane -pt "$SES"; }

# Type like a person: char by char, small pause, then Enter.
type_line() {
  local s="$1" i
  for ((i = 0; i < ${#s}; i++)); do
    tmux send-keys -t "$SES" -l -- "${s:i:1}"
    sleep 0.045
  done
  sleep 0.4
  tmux send-keys -t "$SES" Enter
}

# Wait until the pane content matches a pattern (timeout in seconds).
wait_for() {
  local pat="$1" timeout="${2:-90}" i
  for ((i = 0; i < timeout * 2; i++)); do
    pane | grep -qE "$pat" && return 0
    sleep 0.5
  done
  echo "✗ timeout waiting for: $pat" >&2
  pane | tail -20 >&2
  return 1
}

# Wait until claude finished a turn: the pane stops repainting for ~4s.
# (While it works, the spinner repaints continuously.) Also trips the alarm on a
# permission prompt — a clean take must not contain one.
settle() {
  local prev="" cur stable=0 i
  for ((i = 0; i < 360; i++)); do
    cur="$(pane)"
    if printf '%s' "$cur" | grep -qE "Do you want to proceed\?|Use skill"; then
      echo "✗ permission prompt mid-take — pre-allow it in the fake home settings" >&2
      printf '%s\n' "$cur" | tail -20 >&2
      return 1
    fi
    if [ "$cur" = "$prev" ]; then stable=$((stable + 1)); else stable=0; fi
    prev="$cur"
    [ "$stable" -ge 8 ] && return 0
    sleep 0.5
  done
  echo "✗ pane never settled" >&2
  return 1
}

# Take the highlighted option of an open skill picker; fail on a permission dialog.
picker_enter() {
  if pane | grep -q "Do you want to proceed?"; then
    echo "✗ permission prompt mid-take — extend the allowlist in seed-claude-config.mjs" >&2
    pane | tail -20 >&2
    return 1
  fi
  if pane | grep -qE "Esc to cancel"; then tmux send-keys -t "$SES" Enter; fi
}

# ---- perform the scenario ---------------------------------------------------

lineno=0
while IFS= read -r line || [ -n "$line" ]; do
  lineno=$((lineno + 1))
  line="${line#"${line%%[![:space:]]*}"}" # trim leading whitespace
  case "$line" in '' | '#'*) continue ;; esac
  verb="${line%% *}"
  rest="${line#"$verb"}"
  rest="${rest# }"

  if [ -n "$DRY" ]; then
    case "$verb" in
      type | settle | sleep | expect | picker-enter | key) printf '· L%-3s %s %s\n' "$lineno" "$verb" "$rest" ;;
      *)
        echo "✗ $SCENARIO:$lineno: unknown verb: $verb" >&2
        exit 1
        ;;
    esac
    continue
  fi

  case "$verb" in
    type) type_line "$rest" ;;
    settle) settle ;;
    sleep) sleep "$rest" ;;
    expect) wait_for $rest ;; # unquoted on purpose: "<pattern> [timeout]", pattern is space-free
    picker-enter) picker_enter ;;
    key) tmux send-keys -t "$SES" "$rest" ;;
    *)
      echo "✗ $SCENARIO:$lineno: unknown verb: $verb" >&2
      exit 1
      ;;
  esac
done <"$SCENARIO"

if [ -n "$DRY" ]; then
  echo "✔ scenario parses: $SCENARIO"
  exit 0
fi

# End the take: kill the session (remain-on-exit would keep a dead pane open),
# which detaches the recorded client and closes the cast.
sleep 2
tmux kill-session -t "$SES" 2>/dev/null || true
wait "$REC" || true

[ -s "$CAST" ] || {
  echo "✗ no cast written"
  exit 1
}
echo "✔ take saved: $CAST"
echo "  render it with: ./demo/render.sh $TAKE"
