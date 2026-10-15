#!/usr/bin/env bash
set -euo pipefail
# One-time ATS-cloud VM setup for otto-bot. Run as root: sudo bash setup-vm.sh <copilot-cli-version>
# Re-running is safe. The timer is installed but NOT enabled; enable it after "otto doctor" passes.

COPILOT_VERSION="${1:?usage: sudo bash setup-vm.sh <@github/copilot version, e.g. 1.0.0>}"
OTTO_HOME=/home/otto
REPO_DIR="$OTTO_HOME/exlm-otto"

id otto >/dev/null 2>&1 || useradd --system --create-home --home-dir "$OTTO_HOME" --shell /bin/bash otto

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  dnf -y module reset nodejs
  dnf -y module install nodejs:22
fi
dnf -y install git

sudo -u otto -H bash -s "$COPILOT_VERSION" <<'AS_OTTO'
set -euo pipefail
COPILOT_VERSION="$1"
mkdir -p ~/.npm-global ~/var ~/.config/otto-bot
chmod 700 ~/var ~/.config/otto-bot
npm config set prefix ~/.npm-global
npm install -g "@github/copilot@${COPILOT_VERSION}"
if [ ! -d ~/exlm-otto/.git ]; then
  git clone https://github.com/adobe-experience-league/exlm.git ~/exlm-otto
fi
git -C ~/exlm-otto fetch origin
git -C ~/exlm-otto switch otto-bot
git -C ~/exlm-otto pull --ff-only
if [ ! -f ~/.config/otto-bot/config.json ]; then
  cp ~/exlm-otto/tools/otto-bot/config.example.json ~/.config/otto-bot/config.json
fi
node --input-type=module - <<'NODE'
import fs from 'node:fs';

const configPath = '/home/otto/.config/otto-bot/config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.copilotBin = '/home/otto/.npm-global/bin/copilot';
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
NODE
AS_OTTO

install -m 0644 "$REPO_DIR/tools/otto-bot/deploy/otto-bot.service" /etc/systemd/system/otto-bot.service
install -m 0644 "$REPO_DIR/tools/otto-bot/deploy/otto-bot.timer" /etc/systemd/system/otto-bot.timer
systemctl daemon-reload

cat <<'NEXT'
otto-bot installed. Next steps:
  1. sudo -u otto -H env PATH=/home/otto/.npm-global/bin:$PATH node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js users add --master
  2. sudo -u otto -H env PATH=/home/otto/.npm-global/bin:$PATH node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js doctor
  3. sudo systemctl enable --now otto-bot.timer
NEXT
