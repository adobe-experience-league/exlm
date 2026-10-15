import test from 'node:test';
import assert from 'node:assert/strict';
import { qualityLoop, runQuality } from '../lib/quality.js';

test('runQuality runs npm run quality in the worktree', async () => {
  const calls = [];
  const run = async (cmd, args, opts) => {
    calls.push([cmd, args, opts.cwd]);
    return { code: 1, stdout: 'lint out', stderr: 'err out', timedOut: false };
  };
  const result = await runQuality({ workDir: '/w', run });
  assert.deepEqual(calls, [['npm', ['run', 'quality'], '/w']]);
  assert.equal(result.ok, false);
  assert.ok(result.output.includes('lint out') && result.output.includes('err out'));
});

test('qualityLoop returns immediately when quality passes', async () => {
  let repairs = 0;
  const result = await qualityLoop({
    check: async () => ({ ok: true, output: '' }),
    repair: async () => {
      repairs += 1;
    },
    guard: async () => {},
    maxRepairs: 3,
  });
  assert.deepEqual(result, { ok: true, repairs: 0, output: '' });
  assert.equal(repairs, 0);
});

test('qualityLoop repairs until quality passes and guards after each repair', async () => {
  const outcomes = [false, false, true];
  const events = [];
  const result = await qualityLoop({
    check: async () => {
      const ok = outcomes.shift();
      events.push(`check:${ok}`);
      return { ok, output: ok ? '' : 'bad' };
    },
    repair: async ({ attempt, output }) => events.push(`repair:${attempt}:${output}`),
    guard: async () => events.push('guard'),
    maxRepairs: 3,
  });
  assert.deepEqual(result, { ok: true, repairs: 2, output: '' });
  assert.deepEqual(events, [
    'check:false',
    'repair:1:bad',
    'guard',
    'check:false',
    'repair:2:bad',
    'guard',
    'check:true',
  ]);
});

test('qualityLoop stops after maxRepairs and reports the last failure', async () => {
  let n = 0;
  const result = await qualityLoop({
    check: async () => {
      n += 1;
      return { ok: false, output: `fail ${n}` };
    },
    repair: async () => {},
    guard: async () => {},
    maxRepairs: 3,
  });
  assert.deepEqual(result, { ok: false, repairs: 3, output: 'fail 4' });
});

test('qualityLoop propagates guardrail failures', async () => {
  await assert.rejects(
    qualityLoop({
      check: async () => ({ ok: false, output: 'bad' }),
      repair: async () => {},
      guard: async () => {
        throw new Error('protected path');
      },
      maxRepairs: 3,
    }),
    /protected path/,
  );
});
