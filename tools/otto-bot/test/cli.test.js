import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { main } from '../lib/cli.js';
import { appendHistory, writeCurrentRun } from '../lib/state.js';
import { tempDir } from './helpers.js';

async function cliEnv() {
  const configDir = await tempDir();
  const dataDir = await tempDir();
  await fs.writeFile(path.join(configDir, 'config.json'), JSON.stringify({ dataDir }));
  const out = [];
  const answers = {
    'Jira username of the master account: ': 'otto-master',
    'Copilot fine-grained PAT (github_pat_..., Copilot Requests): ': `github_pat_${'c'.repeat(30)}`,
    'Git author email: ': 'otto@example.com',
  };
  return {
    configDir,
    dataDir,
    out,
    opts: {
      env: { ...process.env, OTTO_CONFIG_DIR: configDir },
      out: (line) => out.push(line),
      ask: async (q) => answers[q] || 'value-123',
    },
  };
}

test('help and unknown commands', async () => {
  const { opts, out } = await cliEnv();
  assert.equal(await main(['help'], opts), 0);
  assert.ok(out.join('\n').includes('otto tick'));
  assert.equal(await main(['nope'], opts), 2);
});

test('users add/list/remove works before any identity exists', async () => {
  const { opts, out } = await cliEnv();
  assert.equal(await main(['users', 'add', '--master'], opts), 0);
  assert.equal(await main(['users', 'add', 'jdoe'], opts), 0);
  assert.equal(await main(['users', 'list'], opts), 0);
  assert.ok(out.includes('master: otto-master'));
  assert.ok(out.includes('- jdoe'));
  assert.equal(await main(['users', 'remove', 'jdoe'], opts), 0);
  assert.equal(await main(['users', 'add'], opts), 2);
});

test('status shows the current run and recent history', async () => {
  const { opts, out, dataDir } = await cliEnv();
  await main(['users', 'add', '--master'], opts);
  const stateDir = path.join(dataDir, 'state');
  await writeCurrentRun(stateDir, { key: 'EXLM-2', runId: 'r2', identity: 'jdoe' });
  await appendHistory(stateDir, {
    key: 'EXLM-1',
    runId: 'r1',
    outcome: 'done',
    prUrl: 'https://github.com/o/r/pull/1',
  });
  assert.equal(await main(['status'], opts), 0);
  const text = out.join('\n');
  assert.ok(text.includes('Running: EXLM-2 (run r2, as jdoe)'));
  assert.ok(text.includes('EXLM-1 done https://github.com/o/r/pull/1'));
});

test('tick returns 1 and logs when the config is invalid', async () => {
  const { opts } = await cliEnv();
  const lines = [];
  assert.equal(await main(['tick'], { ...opts, deps: { write: (line) => lines.push(line) } }), 1);
  assert.ok(lines.join('').includes('"level":"error"'));
});

test('run validates the ticket key', async () => {
  const { opts } = await cliEnv();
  await main(['users', 'add', '--master'], opts);
  assert.equal(await main(['run', 'not-a-key'], opts), 2);
});
