#!/usr/bin/env bash
#
# One-shot installer for the EXLM auto-build poller (macOS & Linux).
# Detects node + claude, reads pollIntervalSeconds from config.json, and registers
# an OS scheduler that auto-starts the poller on login/boot and re-runs it on interval.
#
#   macOS -> launchd LaunchAgent  (~/Library/LaunchAgents/com.exlm.auto-build-poller.plist)
#   Linux -> systemd user timer   (falls back to crontab if systemd is unavailable)
#
# Run once:   bash tools/auto-builder/install.sh
# Remove:     bash tools/auto-builder/uninstall.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
POLLER="$SCRIPT_DIR/poller.mjs"
CONFIG="$SCRIPT_DIR/config.json"
LABEL="com.exlm.auto-build-poller"

# --- detect binaries ---------------------------------------------------------
NODE_BIN="$(command -v node || true)"
CLAUDE_BIN="$(command -v claude || true)"
if [ -z "$NODE_BIN" ]; then
  echo "ERROR: 'node' not found on PATH. Install Node >= 18 and retry." >&2
  exit 1
fi
if [ -z "$CLAUDE_BIN" ]; then
  echo "ERROR: 'claude' CLI not found on PATH. Install Claude Code and retry." >&2
  exit 1
fi
NODE_DIR="$(dirname "$NODE_BIN")"
CLAUDE_DIR="$(dirname "$CLAUDE_BIN")"
OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN:-}"
if [ -n "$OAUTH_TOKEN" ]; then
  echo "claude auth: baking CLAUDE_CODE_OAUTH_TOKEN from current environment into the scheduler"
fi

# --- read interval from config.json ------------------------------------------
INTERVAL="$("$NODE_BIN" -e "try{process.stdout.write(String((require('$CONFIG').pollIntervalSeconds)||1800))}catch(e){process.stdout.write('1800')}")"
echo "node:     $NODE_BIN"
echo "claude:   $CLAUDE_BIN"
echo "repo:     $REPO_ROOT"
echo "interval: ${INTERVAL}s"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  # --- macOS: launchd --------------------------------------------------------
  PLIST_DIR="$HOME/Library/LaunchAgents"
  PLIST="$PLIST_DIR/$LABEL.plist"
  LOG_DIR="$HOME/Library/Logs"
  mkdir -p "$PLIST_DIR" "$LOG_DIR"
  PATH_VALUE="$NODE_DIR:$CLAUDE_DIR:/usr/local/bin:/usr/bin:/bin"

  OAUTH_PLIST_ENTRY=""
  if [ -n "$OAUTH_TOKEN" ]; then
    OAUTH_PLIST_ENTRY="    <key>CLAUDE_CODE_OAUTH_TOKEN</key><string>$OAUTH_TOKEN</string>"
  fi

  cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$POLLER</string>
  </array>
  <key>WorkingDirectory</key><string>$REPO_ROOT</string>
  <key>StartInterval</key><integer>$INTERVAL</integer>
  <key>RunAtLoad</key><true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$PATH_VALUE</string>
$OAUTH_PLIST_ENTRY
  </dict>
  <key>StandardOutPath</key><string>$LOG_DIR/$LABEL.stdout.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/$LABEL.stderr.log</string>
</dict>
</plist>
PLIST_EOF
  [ -n "$OAUTH_TOKEN" ] && chmod 600 "$PLIST"

  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST"
  echo "Installed launchd agent: $PLIST"
  echo "It will auto-start now and every ${INTERVAL}s. Force a run: launchctl kickstart -k gui/$(id -u)/$LABEL"
  exit 0
fi

# --- Linux -------------------------------------------------------------------
if command -v systemctl >/dev/null 2>&1; then
  UNIT_DIR="$HOME/.config/systemd/user"
  mkdir -p "$UNIT_DIR"
  PATH_VALUE="$NODE_DIR:$CLAUDE_DIR:/usr/local/bin:/usr/bin:/bin"

  OAUTH_SVC_LINE=""
  if [ -n "$OAUTH_TOKEN" ]; then
    OAUTH_SVC_LINE="Environment=CLAUDE_CODE_OAUTH_TOKEN=$OAUTH_TOKEN"
  fi

  cat > "$UNIT_DIR/exlm-auto-build-poller.service" <<SVC_EOF
[Unit]
Description=EXLM auto-build poller

[Service]
Type=oneshot
WorkingDirectory=$REPO_ROOT
Environment=PATH=$PATH_VALUE
$OAUTH_SVC_LINE
ExecStart=$NODE_BIN $POLLER
SVC_EOF
  [ -n "$OAUTH_TOKEN" ] && chmod 600 "$UNIT_DIR/exlm-auto-build-poller.service"

  cat > "$UNIT_DIR/exlm-auto-build-poller.timer" <<TIMER_EOF
[Unit]
Description=Run EXLM auto-build poller every ${INTERVAL}s

[Timer]
OnBootSec=2min
OnUnitActiveSec=${INTERVAL}s
Persistent=true

[Install]
WantedBy=timers.target
TIMER_EOF

  systemctl --user daemon-reload
  systemctl --user enable --now exlm-auto-build-poller.timer
  loginctl enable-linger "$(id -un)" 2>/dev/null || \
    echo "NOTE: could not enable-linger; poller runs only while you are logged in."
  echo "Installed systemd user timer. Force a run: systemctl --user start exlm-auto-build-poller.service"
  exit 0
fi

# --- Linux fallback: cron ----------------------------------------------------
MINUTES=$(( INTERVAL / 60 )); [ "$MINUTES" -lt 1 ] && MINUTES=1
LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}"; mkdir -p "$LOG_DIR"
OAUTH_CRON_PREFIX=""
if [ -n "$OAUTH_TOKEN" ]; then
  OAUTH_CRON_PREFIX="CLAUDE_CODE_OAUTH_TOKEN=$OAUTH_TOKEN "
fi
CRON_LINE="*/$MINUTES * * * * cd $REPO_ROOT && ${OAUTH_CRON_PREFIX}PATH=$NODE_DIR:$CLAUDE_DIR:\$PATH $NODE_BIN $POLLER >> $LOG_DIR/$LABEL.cron.log 2>&1"
( crontab -l 2>/dev/null | grep -v "$POLLER" ; echo "$CRON_LINE" ) | crontab -
echo "Installed crontab entry (every ${MINUTES}m). Edit with: crontab -e"
