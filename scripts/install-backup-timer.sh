#!/usr/bin/env bash
#
# Claudia — install the hourly vault-backup job (macOS / launchd).
#
# The SessionEnd hook already snapshots the vault when a conversation closes. This
# timer covers what the hook cannot: the hours Claude Code was never open, a session
# that died before its hooks ran, and edits the person made to their notes by hand.
#
# Everything stays local — the job runs `scripts/vault-backup.mjs` on this machine
# and uploads nothing (ADR-0004).
#
# Usage: ./scripts/install-backup-timer.sh [install|uninstall|status|run]
set -euo pipefail

LABEL="com.claudia.vault-backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/vault-backup.mjs"
LOG_DIR="$HOME/.claudia-backups"
INTERVAL=3600

# launchd never expands `~` and hands the job a minimal PATH, so every path written
# into the plist below is absolute and resolved here, at install time.
NODE_BIN="$(command -v node || true)"

usage() {
  echo "usage: $(basename "$0") [install|uninstall|status|run]" >&2
  exit 2
}

require_darwin() {
  if [ "$(uname -s)" != "Darwin" ]; then
    cat >&2 <<EOF
This installer is launchd-only (macOS). On Linux, wire the same command into a
systemd --user timer or cron, every hour:

  $NODE_BIN $BACKUP_SCRIPT --quiet
EOF
    exit 1
  fi
}

do_install() {
  require_darwin
  [ -n "$NODE_BIN" ] || { echo "node not found on PATH — install Node first." >&2; exit 1; }
  [ -f "$BACKUP_SCRIPT" ] || { echo "missing $BACKUP_SCRIPT" >&2; exit 1; }

  case "$NODE_BIN" in
    *"/.nvm/"*)
      echo "Note: node is an nvm build ($NODE_BIN)." >&2
      echo "      Switching or pruning that Node version will break the job — re-run 'install' after you do." >&2
      ;;
  esac

  mkdir -p "$LOG_DIR" && chmod 700 "$LOG_DIR"
  mkdir -p "$(dirname "$PLIST")"

  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$BACKUP_SCRIPT</string>
    <string>--quiet</string>
  </array>
  <!-- StartInterval, not StartCalendarInterval: on a laptop that sleeps through the
       hour, launchd runs a missed interval job shortly after wake. A calendar job
       would simply be skipped. -->
  <key>StartInterval</key><integer>$INTERVAL</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
  <key>Nice</key><integer>5</integer>
  <key>StandardOutPath</key><string>$LOG_DIR/launchd.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/launchd.log</string>
</dict>
</plist>
EOF

  launchctl bootout "gui/$UID" "$PLIST" 2>/dev/null || true
  launchctl bootstrap "gui/$UID" "$PLIST"
  launchctl kickstart -p "gui/$UID/$LABEL" >/dev/null 2>&1 || true

  echo "Installed $LABEL — every $((INTERVAL / 60)) minutes, and at login."
  echo "  plist:    $PLIST"
  echo "  archives: $LOG_DIR"
  echo "Uninstall with: $(basename "$0") uninstall"
}

do_uninstall() {
  require_darwin
  launchctl bootout "gui/$UID" "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed $LABEL. Existing archives in $LOG_DIR were left alone —"
  echo "delete them yourself, or with: node $BACKUP_SCRIPT --purge --yes"
}

do_status() {
  require_darwin
  if [ ! -f "$PLIST" ]; then
    echo "not installed (no $PLIST)"
    exit 1
  fi
  echo "plist: $PLIST"
  if launchctl print "gui/$UID/$LABEL" >/dev/null 2>&1; then
    launchctl print "gui/$UID/$LABEL" | grep -E '^\s+(state|last exit code|runs) ' || true
  else
    echo "plist exists but the job is not loaded — run: $(basename "$0") install"
    exit 1
  fi
  # The plist can outlive the script it points at (a plugin dir that moved or was
  # re-linked); say so rather than let the job fail silently every hour.
  if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "WARNING: $BACKUP_SCRIPT no longer exists — re-run 'install' from the current plugin directory."
    exit 1
  fi
}

case "${1:-install}" in
  install) do_install ;;
  uninstall) do_uninstall ;;
  status) do_status ;;
  run) "$NODE_BIN" "$BACKUP_SCRIPT" ;;
  *) usage ;;
esac
