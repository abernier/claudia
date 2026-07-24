# Claudia demo — resolve DEMO_HOME (sourced by the demo shell scripts).
#
# Priority: explicit $DEMO_HOME > /Users/nora (if it exists and is ours — the
# immersive home, so on-screen paths read /Users/nora/…) > ~/.claudia-demo.
# /Users/nora is a plain directory, not a macOS account; create it once with:
#   sudo mkdir -p /Users/nora && sudo chown "$(id -un)":staff /Users/nora
if [ -z "${DEMO_HOME:-}" ]; then
  if [ -d /Users/nora ] && [ -w /Users/nora ]; then
    DEMO_HOME=/Users/nora
  else
    DEMO_HOME="$HOME/.claudia-demo"
  fi
fi
export DEMO_HOME
