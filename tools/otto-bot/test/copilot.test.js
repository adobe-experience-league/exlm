import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCopilotArgs, buildCopilotEnv, DENIED_TOOLS, runCopilot } from '../lib/copilot.js';
import { tempDir } from './helpers.js';

test('buildCopilotArgs runs non-interactively with git/network tools denied', () => {
  const args = buildCopilotArgs({ prompt: 'do it', model: 'auto', logDir: '/r/logs', shareFile: '/r/session-1.md' });
  assert.deepEqual(args.slice(0, 2), ['-p', 'do it']);
  assert.ok(args.includes('--allow-all-tools'));
  assert.ok(args.includes(`--deny-tool=${DENIED_TOOLS.join(',')}`));
  assert.ok(args.includes('--no-ask-user'));
  assert.ok(args.includes('--disable-builtin-mcps'));
  assert.ok(args.includes('--model=auto'));
  assert.ok(args.includes('--no-color'));
  assert.ok(args.includes('--log-dir=/r/logs'));
  assert.ok(args.includes('--share=/r/session-1.md'));
});

test('buildCopilotEnv passes only the Copilot token and safe variables', () => {
  const env = buildCopilotEnv({
    baseEnv: { PATH: '/bin', HOME: '/home/otto', GH_TOKEN: 'x', GITHUB_TOKEN: 'y', OTTO_GIT_TOKEN: 'z', JIRA: 'j' },
    copilotHome: '/data/copilot-homes/master',
    token: 'github_pat_copilot',
  });
  assert.deepEqual(env, {
    PATH: '/bin',
    HOME: '/home/otto',
    COPILOT_HOME: '/data/copilot-homes/master',
    COPILOT_GITHUB_TOKEN: 'github_pat_copilot',
    CI: '1',
    NO_COLOR: '1',
  });
});

test('runCopilot runs in the worktree, records output, and isolates COPILOT_HOME', async () => {
  const root = await tempDir();
  const calls = [];
  const run = async (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return {
      code: 0,
      signal: null,
      timedOut: false,
      stdout: 'did it with copilot-secret-value and github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      stderr: '',
    };
  };
  const copilotHome = path.join(root, 'homes', 'master');
  const runDir = path.join(root, 'run');
  await fs.mkdir(runDir);
  await runCopilot({
    copilotBin: 'copilot',
    workDir: '/work',
    prompt: 'p',
    model: 'auto',
    timeoutMs: 1000,
    copilotHome,
    token: 'copilot-secret-value',
    runDir,
    sessionName: 'session-1',
    baseEnv: { PATH: '/bin' },
    run,
  });
  assert.equal(calls[0].cmd, 'copilot');
  assert.equal(calls[0].opts.cwd, '/work');
  assert.equal(calls[0].opts.timeoutMs, 1000);
  assert.equal(calls[0].opts.env.COPILOT_HOME, copilotHome);
  assert.equal((await fs.stat(copilotHome)).mode % 0o1000, 0o700);
  const log = await fs.readFile(path.join(runDir, 'session-1.out.log'), 'utf8');
  assert.ok(log.includes('did it'));
  assert.equal(log.includes('copilot-secret-value'), false);
  assert.equal(log.includes('github_pat_'), false);
});

test('runCopilot redacts Copilot log-dir and share artifacts in place', async () => {
  const root = await tempDir();
  const runDir = path.join(root, 'run');
  const logDir = path.join(runDir, 'copilot');
  const shareFile = path.join(runDir, 'session-1.md');
  await fs.mkdir(logDir, { recursive: true });
  const run = async () => {
    await fs.writeFile(
      path.join(logDir, 'transcript.log'),
      'artifact has shared-secret and github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
    await fs.writeFile(shareFile, 'share has shared-secret');
    return { code: 0, signal: null, timedOut: false, stdout: 'ok', stderr: '' };
  };

  await runCopilot({
    copilotBin: 'copilot',
    workDir: '/work',
    prompt: 'p',
    model: 'auto',
    timeoutMs: 1000,
    copilotHome: path.join(root, 'home'),
    token: 'copilot-secret-value',
    runDir,
    sessionName: 'session-1',
    run,
    redact: (value) =>
      String(value)
        .replaceAll('shared-secret', '[REDACTED]')
        .replace(/github_pat_[A-Z]+/g, '[REDACTED]'),
  });

  assert.equal((await fs.readFile(path.join(logDir, 'transcript.log'), 'utf8')).includes('shared-secret'), false);
  assert.equal((await fs.readFile(path.join(logDir, 'transcript.log'), 'utf8')).includes('github_pat_'), false);
  assert.equal((await fs.readFile(shareFile, 'utf8')).includes('shared-secret'), false);
});

test('runCopilot throws a copilot StageError on timeout and on failure', async () => {
  const root = await tempDir();
  const base = {
    copilotBin: 'copilot',
    workDir: '/work',
    prompt: 'p',
    model: 'auto',
    timeoutMs: 1000,
    copilotHome: path.join(root, 'home'),
    token: 'copilot-secret-value',
    runDir: root,
    sessionName: 's',
  };
  const timedOut = async () => ({ code: null, signal: 'SIGTERM', timedOut: true, stdout: '', stderr: '' });
  const failed = async () => ({
    code: 1,
    signal: null,
    timedOut: false,
    stdout: '',
    stderr: 'auth failed copilot-secret-value',
  });
  await assert.rejects(
    runCopilot({ ...base, run: timedOut }),
    (e) => e.stage === 'copilot' && /timed out/.test(e.message),
  );
  await assert.rejects(
    runCopilot({ ...base, run: failed }),
    (e) => e.stage === 'copilot' && /auth failed/.test(e.details) && !e.details.includes('copilot-secret-value'),
  );
});
