import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { runCommand } from '../lib/exec.js';

const node = process.execPath;

test('runCommand captures stdout, stderr, and exit code', async () => {
  const r = await runCommand(node, ['-e', 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)']);
  assert.equal(r.code, 3);
  assert.equal(r.stdout, 'out');
  assert.equal(r.stderr, 'err');
  assert.equal(r.timedOut, false);
});

test('runCommand passes env, cwd, and stdin', async () => {
  const script =
    'let s = ""; process.stdin.on("data", (d) => { s += d; }).on("end", () => process.stdout.write(s + process.env.OTTO_X));';
  const r = await runCommand(node, ['-e', script], {
    env: { ...process.env, OTTO_X: '|x|' },
    cwd: os.tmpdir(),
    input: 'in',
  });
  assert.equal(r.stdout, 'in|x|');
});

test('runCommand kills the process on timeout', async () => {
  const r = await runCommand(node, ['-e', 'setTimeout(() => {}, 10000)'], { timeoutMs: 200, killGraceMs: 200 });
  assert.equal(r.timedOut, true);
  assert.equal(r.signal, 'SIGTERM');
});

test('runCommand rejects when the binary does not exist', async () => {
  await assert.rejects(runCommand('/nonexistent/otto-binary', []), /ENOENT/);
});
