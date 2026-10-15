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
  await acquireLock(dir, { pid: 111, isAlive: () => true });
  const release = await acquireLock(dir, { pid: 222, isAlive: (pid) => pid !== 111 });
  assert.equal(typeof release, 'function');
  assert.equal(await fs.readFile(path.join(dir, 'lock'), 'utf8'), '222');
  await release();
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

test('cleanupRuns removes expired run dirs and every leftover work dir', async () => {
  const root = await tempDir();
  const runsRoot = path.join(root, 'runs');
  const workRoot = path.join(root, 'work');
  await fs.mkdir(path.join(runsRoot, 'old'), { recursive: true });
  await fs.mkdir(path.join(runsRoot, 'new'), { recursive: true });
  await fs.mkdir(path.join(workRoot, 'stale'), { recursive: true });
  const now = Date.now();
  const twentyDaysAgo = new Date(now - 20 * 24 * 60 * 60 * 1000);
  await fs.utimes(path.join(runsRoot, 'old'), twentyDaysAgo, twentyDaysAgo);
  const removed = await cleanupRuns({ runsRoot, workRoot, retentionDays: 14, now });
  assert.deepEqual(removed.sort(), [path.join(runsRoot, 'old'), path.join(workRoot, 'stale')].sort());
  await fs.access(path.join(runsRoot, 'new'));
});

test('cleanupRuns tolerates missing directories', async () => {
  const root = await tempDir();
  assert.deepEqual(
    await cleanupRuns({ runsRoot: path.join(root, 'nope'), workRoot: path.join(root, 'nada'), retentionDays: 1 }),
    [],
  );
});
