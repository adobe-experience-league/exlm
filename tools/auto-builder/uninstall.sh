#!/usr/bin/env bash
#
# Remove the EXLM auto-build poller scheduler (macOS & Linux).
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLLER="$SCRIPT_DIR/poller.mjs"
LABEL="com.exlm.auto-build-poller"
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
  echo "Removed launchd agent."
  exit 0
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl --user disable --now exlm-auto-build-poller.timer 2>/dev/null || true
  rm -f "$HOME/.config/systemd/user/exlm-auto-build-poller.timer" \
        "$HOME/.config/systemd/user/exlm-auto-build-poller.service"
  systemctl --user daemon-reload 2>/dev/null || true
  echo "Removed systemd user timer."
fi

# Also strip any cron fallback line.
if crontab -l >/dev/null 2>&1; then
  crontab -l 2>/dev/null | grep -v "$POLLER" | crontab - || true
  echo "Removed any crontab entry."
fi
