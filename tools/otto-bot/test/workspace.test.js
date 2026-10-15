import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from '../lib/exec.js';
import {
  branchName,
  createWorktree,
  ensureMirror,
  gitAuthEnv,
  prepareWorktree,
  removeWorktree,
  writeAskpass,
} from '../lib/workspace.js';
import { git, gitBare, makeRemote, silentLog, tempDir } from './helpers.js';

test('branchName lowercases the ticket key', () => {
  assert.equal(branchName('EXLM-1234'), 'exlm-1234');
});

test('askpass script answers username and password prompts', async () => {
  const askpassPath = await writeAskpass(await tempDir());
  const env = gitAuthEnv({ askpassPath, token: 'tok-abcdefgh', baseEnv: { PATH: process.env.PATH } });
  assert.equal(env.GIT_TERMINAL_PROMPT, '0');
  const user = await runCommand(askpassPath, ["Username for 'https://github.com': "], { env });
  const pass = await runCommand(askpassPath, ["Password for 'https://x-access-token@github.com': "], { env });
  assert.equal(user.stdout.trim(), 'x-access-token');
  assert.equal(pass.stdout.trim(), 'tok-abcdefgh');
  assert.equal((await fs.stat(askpassPath)).mode % 0o1000, 0o700);
});

test('ensureMirror clones once and fetches new commits on later calls', async () => {
  const remote = await makeRemote();
  const mirrorDir = path.join(await tempDir(), 'mirror', 'exlm.git');
  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  const first = await gitBare(mirrorDir, 'rev-parse', 'origin/main');

  const clone = path.join(remote.dir, 'clone');
  await git(remote.dir, 'clone', remote.bare, clone);
  await fs.writeFile(path.join(clone, 'more.txt'), 'more\n');
  await git(clone, 'add', '-A');
  await git(clone, 'commit', '-m', 'more');
  await git(clone, 'push', 'origin', 'main');

  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  const second = await gitBare(mirrorDir, 'rev-parse', 'origin/main');
  assert.notEqual(first, second);
});

test('createWorktree checks out a fresh branch from origin/main, and removeWorktree cleans up', async () => {
  const remote = await makeRemote();
  const root = await tempDir();
  const mirrorDir = path.join(root, 'mirror.git');
  const workDir = path.join(root, 'work', 'run-1');
  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  await createWorktree({ mirrorDir, workDir, branch: 'exlm-1', baseBranch: 'main' });
  assert.equal(await git(workDir, 'rev-parse', '--abbrev-ref', 'HEAD'), 'exlm-1');
  await fs.access(path.join(workDir, 'README.md'));

  await removeWorktree({ mirrorDir, workDir });
  await assert.rejects(fs.access(workDir));
  await createWorktree({ mirrorDir, workDir, branch: 'exlm-1', baseBranch: 'main' });
  await removeWorktree({ mirrorDir, workDir });
});

test('prepareWorktree installs deps, tolerates skills failure, and git-excludes .otto/', async () => {
  const remote = await makeRemote();
  const root = await tempDir();
  const mirrorDir = path.join(root, 'mirror.git');
  const workDir = path.join(root, 'work', 'run-1');
  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  await createWorktree({ mirrorDir, workDir, branch: 'exlm-2', baseBranch: 'main' });

  const calls = [];
  const run = async (cmd, args, opts) => {
    if (cmd === 'git') return runCommand(cmd, args, opts);
    calls.push([cmd, ...args].join(' '));
    return { code: cmd === 'npx' ? 1 : 0, stdout: '', stderr: 'skills offline', timedOut: false };
  };
  const log = silentLog();
  await prepareWorktree({ workDir, log, run });

  assert.deepEqual(calls, ['npm ci --ignore-scripts --no-audit --no-fund', 'npx --yes skills experimental_install']);
  assert.ok(log.lines.some(([level, msg]) => level === 'warn' && msg.includes('skills')));
  await fs.writeFile(path.join(workDir, '.otto', 'result.json'), '{}');
  assert.equal(await git(workDir, 'status', '--porcelain'), '');
});

test('prepareWorktree reverts tracked files modified by setup tools', async () => {
  const remote = await makeRemote();
  const root = await tempDir();
  const mirrorDir = path.join(root, 'mirror.git');
  const workDir = path.join(root, 'work', 'run-1');
  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  await createWorktree({ mirrorDir, workDir, branch: 'exlm-3', baseBranch: 'main' });

  const run = async (cmd, args, opts) => {
    if (cmd === 'git') return runCommand(cmd, args, opts);
    if (cmd === 'npx') await fs.writeFile(path.join(workDir, 'README.md'), '# rewritten by skills install\n');
    return { code: 0, stdout: '', stderr: '', timedOut: false };
  };
  await prepareWorktree({ workDir, log: silentLog(), run });

  assert.equal(await git(workDir, 'status', '--porcelain'), '');
  assert.equal(await fs.readFile(path.join(workDir, 'README.md'), 'utf8'), '# test\n');
});

test('prepareWorktree fails the workspace stage when npm ci fails', async () => {
  const workDir = await tempDir();
  const run = async () => ({ code: 1, stdout: '', stderr: 'npm ERR!', timedOut: false });
  await assert.rejects(prepareWorktree({ workDir, log: silentLog(), run }), (err) => err.stage === 'workspace');
});
