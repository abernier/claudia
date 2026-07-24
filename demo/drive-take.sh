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

# Typing is character-wise, and the scenario types an emoji: bash slices `${s:i:1}`
# by BYTES outside a UTF-8 locale, which would send a pin as four broken keys.
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

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
    env HOME="$DEMO_HOME" PS1='desk % ' LANG="$LC_ALL" bash --noprofile --norc
  tmux set-option -t "$SES" status off
  # Without this, Claude Code prints a "tmux focus-events off · add …" notice into
  # the pane — rig plumbing, in the middle of the shot.
  tmux set-option -g focus-events on
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
  # --window-size, not --cols/--rows: asciinema 3 dropped those, silently recording
  # at the default 80x24 while the pane was built at 100x30.
  asciinema rec --overwrite --quiet --window-size 100x30 "$CAST" \
    -c "tmux attach -t $SES" &
  REC=$!
  sleep 1

  echo "· take running (watch: tmux attach -t $SES) …"
fi

pane() { tmux capture-pane -pt "$SES"; }

# Type char by char WITHOUT validating. `${s:i:1}` is character-wise (not byte-wise)
# only in a UTF-8 locale — which the header pins — so an emoji goes out as one key.
draft_line() {
  local s="$1" i
  for ((i = 0; i < ${#s}; i++)); do
    tmux send-keys -t "$SES" -l -- "${s:i:1}"
    sleep 0.045
  done
}

# A soft newline inside the prompt: backslash + Enter adds a line without sending.
# What buys the comic timing — the second line is typed after the silence, so the
# punchline lands as a beat rather than arriving pre-written.
soft_newline() {
  tmux send-keys -t "$SES" -l -- '\'
  sleep 0.2
  tmux send-keys -t "$SES" Enter
}

# Validate whatever is in the prompt (one line or several).
send_prompt() {
  sleep 0.4
  tmux send-keys -t "$SES" Enter
}

# Type like a person: char by char, small pause, then Enter.
type_line() {
  draft_line "$1"
  send_prompt
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

# Assert on what the take LEFT IN THE VAULT, not on what the pane showed. The pane
# is the wrong witness here: the sentence this take exists to capture also appears
# further up the screen, in the person's own message. Only the file proves it landed.
expect_file() {
  # Separate `local` statements on purpose: under `set -u`, a later var on the same
  # `local` line can't see an earlier one ("f=…/$rel" → rel: unbound variable).
  local rel="$1" pat="$2"
  local f="$DEMO_HOME/$rel"
  [ -f "$f" ] || {
    echo "✗ nothing at $f" >&2
    return 1
  }
  grep -qE "$pat" "$f" || {
    echo "✗ $rel does not match: $pat" >&2
    sed -n '1,12p' "$f" >&2
    return 1
  }
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
      type | draft | newline | send | settle | sleep | expect | expect-file | picker-enter | key)
        printf '· L%-3s %s %s\n' "$lineno" "$verb" "$rest"
        ;;
      *)
        echo "✗ $SCENARIO:$lineno: unknown verb: $verb" >&2
        exit 1
        ;;
    esac
    continue
  fi

  case "$verb" in
    type) type_line "$rest" ;;
    draft) draft_line "$rest" ;;
    newline) soft_newline ;;
    send) send_prompt ;;
    settle) settle ;;
    sleep) sleep "$rest" ;;
    expect) wait_for $rest ;; # unquoted on purpose: "<pattern> [timeout]", pattern is space-free
    expect-file) expect_file $rest ;; # "<vault-relative-path> <space-free-regex>"
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

# Trim tmux's teardown off the tail: detaching clears the screen and prints
# "[exited]", which the recorder faithfully captures. The site loops this cast, so
# those last two events are a blank flash between the held final frame and the
# restart. The take ends where the picture ends.
node -e '
const fs = require("fs"), p = process.argv[1];
const lines = fs.readFileSync(p, "utf8").replace(/\n$/, "").split("\n");
let end = lines.length;
while (end > 1) {
  const e = JSON.parse(lines[end - 1]);
  const payload = typeof e[2] === "string" ? e[2] : "";
  if (e[1] === "x" || payload.includes("[exited]") || payload.includes("[2J")) { end--; continue; }
  break;
}
const dropped = lines.slice(end);
if (dropped.length) {
  // asciicast v3 intervals are DELTAS, so the held final frame is the gap carried
  // BY the teardown event: dropping it outright deletes the hold. Put the gap back
  // as one silent event — same duration on screen, nothing painted.
  const held = dropped.reduce((s, l) => s + JSON.parse(l)[0], 0);
  const kept = lines.slice(0, end);
  if (held > 0) kept.push(JSON.stringify([held, "o", ""]));
  fs.writeFileSync(p, kept.join("\n") + "\n");
  console.log(`  trimmed ${dropped.length} teardown event(s), kept the ${held.toFixed(1)}s hold`);
}
' "$CAST"
echo "✔ take saved: $CAST"
echo "  render it with: ./demo/render.sh $TAKE"
