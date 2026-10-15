import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DEFAULT_CONFIG } from '../lib/config.js';

const read = (rel) => fs.readFile(new URL(`../${rel}`, import.meta.url), 'utf8');

test('service is a hardened oneshot running otto tick as the otto user', async () => {
  const unit = await read('deploy/otto-bot.service');
  [
    'Type=oneshot',
    'User=otto',
    'WorkingDirectory=/home/otto/exlm-otto/tools/otto-bot',
    'ExecStart=/usr/bin/env node bin/otto.js tick',
    'TimeoutStartSec=120min',
    'NoNewPrivileges=yes',
    'ProtectSystem=strict',
    'ReadWritePaths=/home/otto',
    'PrivateTmp=yes',
  ].forEach((line) => assert.ok(unit.includes(line), `missing ${line}`));
  assert.match(unit, /^Environment=PATH=\/home\/otto\/\.npm-global\/bin:/m);
});

test('timer fires 5 minutes after the previous run ends', async () => {
  const unit = await read('deploy/otto-bot.timer');
  ['OnActiveSec=1min', 'OnBootSec=2min', 'OnUnitInactiveSec=5min', 'WantedBy=timers.target'].forEach((line) =>
    assert.ok(unit.includes(line), `missing ${line}`),
  );
});

test('config.example.json documents every config key and no secrets', async () => {
  const example = JSON.parse(await read('config.example.json'));
  assert.deepEqual(Object.keys(example).sort(), Object.keys(DEFAULT_CONFIG).sort());
  assert.ok(!Object.keys(example).some((key) => /pat$|token/i.test(key)));
  assert.ok(!JSON.stringify(example).includes('github_pat_'));
});

test('setup script is strict and pins the Copilot CLI version', async () => {
  const script = await read('deploy/setup-vm.sh');
  assert.ok(script.startsWith('#!/usr/bin/env bash\nset -euo pipefail'));
  assert.match(script, /COPILOT_VERSION="\$\{1:\?/);
  assert.ok(script.includes('npm install -g "@github/copilot@'));
});
