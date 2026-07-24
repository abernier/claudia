# Claudia demo — resolve DEMO_HOME (sourced by the demo shell scripts).
#
# Priority: explicit $DEMO_HOME > /Users/agnes (if it exists and is ours — the
# immersive home, so on-screen paths read /Users/agnes/…) > ~/.claudia-demo.
# /Users/agnes is a plain directory, not a macOS account; create it once with:
#   sudo mkdir -p /Users/agnes && sudo chown "$(id -un)":staff /Users/agnes
if [ -z "${DEMO_HOME:-}" ]; then
  if [ -d /Users/agnes ] && [ -w /Users/agnes ]; then
    DEMO_HOME=/Users/agnes
  else
    DEMO_HOME="$HOME/.claudia-demo"
  fi
fi
export DEMO_HOME
