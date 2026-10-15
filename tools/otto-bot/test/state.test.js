import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  acquireLock,
  appendHistory,
  clearCurrentRun,
  readCurrentRun,
  readHistory,
  writeCurrentRun,
} from '../lib/state.js';
import { cleanupRuns } from '../lib/housekeeping.js';
import { tempDir } from './helpers.js';

test('acquireLock is exclusive while the holder is alive', async () => {
  const dir = await tempDir();
  const release = await acquireLock(dir, { pid: 111, isAlive: () => true });
  assert.equal(typeof release, 'function');
  assert.equal(await acquireLock(dir, { pid: 222, isAlive: () => true }), null);
  await release();
  const again = await acquireLock(dir, { pid: 222, isAlive: () => true });
  assert.equal(typeof again, 'function');
  await again();
});

test('acquireLock reclaims a lock held by a dead process', async () => {
  const dir = await tempDir();
  const stale = await acquireLock(dir, { pid: 111, isAlive: () => true });
  const release = await acquireLock(dir, { pid: 222, isAlive: (pid) => pid !== 111 });
  assert.equal(typeof release, 'function');
  const owner = JSON.parse(await fs.readFile(path.join(dir, 'lock', 'owner.json'), 'utf8'));
  assert.equal(owner.pid, 222);
  await stale();
  await fs.access(path.join(dir, 'lock'));
  await release();
});

test('acquireLock stale takeover yields exactly one holder for two contenders', async () => {
  const dir = await tempDir();
  const stale = await acquireLock(dir, { pid: 111, isAlive: () => true });
  assert.equal(typeof stale, 'function');
  const contenders = await Promise.all([
    acquireLock(dir, { pid: 222, isAlive: (pid) => pid !== 111 }),
    acquireLock(dir, { pid: 333, isAlive: (pid) => pid !== 111 }),
  ]);
  assert.equal(contenders.filter(Boolean).length, 1);
  await Promise.all(contenders.filter(Boolean).map((release) => release()));
});

test('acquireLock stale takeover does not steal a fresh lock after a delayed stale read', async () => {
  const dir = await tempDir();
  const stale = await acquireLock(dir, { pid: 111, isAlive: () => true });
  assert.equal(typeof stale, 'function');

  let resumeDelayed;
  const delayedCanResume = new Promise((resolve) => {
    resumeDelayed = resolve;
  });
  let delayedRead;
  const delayedReadStale = new Promise((resolve) => {
    delayedRead = resolve;
  });

  const delayed = acquireLock(dir, {
    pid: 333,
    isAlive: (pid) => pid !== 111,
    beforeTakeover: async (holder) => {
      assert.equal(holder.pid, 111);
      delayedRead();
      await delayedCanResume;
    },
  });
  await delayedReadStale;

  const winner = await acquireLock(dir, { pid: 222, isAlive: (pid) => pid !== 111 });
  assert.equal(typeof winner, 'function');
  const owner = JSON.parse(await fs.readFile(path.join(dir, 'lock', 'owner.json'), 'utf8'));
  assert.equal(owner.pid, 222);

  resumeDelayed();
  assert.equal(await delayed, null);
  await stale();
  await fs.access(path.join(dir, 'lock'));
  await winner();
  await assert.rejects(fs.access(path.join(dir, 'lock')), (err) => err.code === 'ENOENT');
});

test('current run can be written, read, and cleared', async () => {
  const dir = await tempDir();
  assert.equal(await readCurrentRun(dir), null);
  await writeCurrentRun(dir, { key: 'EXLM-1', runId: 'r1' });
  assert.deepEqual(await readCurrentRun(dir), { key: 'EXLM-1', runId: 'r1' });
  await clearCurrentRun(dir);
  assert.equal(await readCurrentRun(dir), null);
});

test('history appends JSON lines and returns the most recent entries', async () => {
  const dir = await tempDir();
  assert.deepEqual(await readHistory(dir), []);
  for (const n of [1, 2, 3]) await appendHistory(dir, { n });
  assert.deepEqual(await readHistory(dir, 2), [{ n: 2 }, { n: 3 }]);
});

test('cleanupRuns removes expired run dirs, leftovers, and only old retained dry-run work dirs', async () => {
  const root = await tempDir();
  const runsRoot = path.join(root, 'runs');
  const workRoot = path.join(root, 'work');
  await fs.mkdir(path.join(runsRoot, 'old'), { recursive: true });
  await fs.mkdir(path.join(runsRoot, 'new'), { recursive: true });
  await fs.mkdir(path.join(workRoot, 'stale'), { recursive: true });
  await fs.mkdir(path.join(workRoot, 'dry-new'), { recursive: true });
  await fs.mkdir(path.join(workRoot, 'dry-old'), { recursive: true });
  await fs.writeFile(path.join(workRoot, 'dry-new', '.otto-dry-run-retained'), 'new');
  await fs.writeFile(path.join(workRoot, 'dry-old', '.otto-dry-run-retained'), 'old');
  const now = Date.now();
  const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);
  await fs.utimes(path.join(runsRoot, 'old'), twentyDaysAgo, twentyDaysAgo);
  await fs.utimes(path.join(workRoot, 'dry-old', '.otto-dry-run-retained'), twentyDaysAgo, twentyDaysAgo);
  const removed = await cleanupRuns({ runsRoot, workRoot, retentionDays: 14, now });
  assert.deepEqual(
    removed.sort(),
    [path.join(runsRoot, 'old'), path.join(workRoot, 'dry-old'), path.join(workRoot, 'stale')].sort(),
  );
  await fs.access(path.join(runsRoot, 'new'));
  await fs.access(path.join(workRoot, 'dry-new'));
});

test('cleanupRuns tolerates missing directories', async () => {
  const root = await tempDir();
  assert.deepEqual(
    await cleanupRuns({ runsRoot: path.join(root, 'nope'), workRoot: path.join(root, 'nada'), retentionDays: 1 }),
    [],
  );
});
