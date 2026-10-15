import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const LOCK_DIR = 'lock';
const TAKEOVER_DIR = 'lock.takeover';
const LOCK_OWNER_FILE = 'owner.json';
const CURRENT_FILE = 'current.json';
const HISTORY_FILE = 'history.jsonl';
const TAKEOVER_STALE_MS = 60 * 1000;

function defaultIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

async function readLockOwner(lockPath) {
  try {
    const stat = await fs.stat(lockPath);
    if (!stat.isDirectory()) return { pid: Number(await fs.readFile(lockPath, 'utf8')) || null };
    return JSON.parse(await fs.readFile(path.join(lockPath, LOCK_OWNER_FILE), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    if (err instanceof SyntaxError) return null;
    throw err;
  }
}

async function acquireTakeoverLock(stateDir, owner) {
  const takeoverPath = path.join(stateDir, TAKEOVER_DIR);
  const ownerPath = path.join(takeoverPath, LOCK_OWNER_FILE);
  try {
    await fs.mkdir(takeoverPath);
    await fs.writeFile(ownerPath, `${JSON.stringify(owner)}\n`, { flag: 'wx' });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const stat = await fs.stat(takeoverPath).catch((statErr) => {
      if (statErr.code === 'ENOENT') return null;
      throw statErr;
    });
    if (!stat || Date.now() - stat.mtimeMs <= TAKEOVER_STALE_MS) return null;
    const stalePath = path.join(stateDir, `${TAKEOVER_DIR}.stale-${owner.token}`);
    try {
      await fs.rename(takeoverPath, stalePath);
      await fs.rm(stalePath, { recursive: true, force: true });
    } catch (takeoverErr) {
      if (!['ENOENT', 'ENOTDIR'].includes(takeoverErr.code)) throw takeoverErr;
      return null;
    }
    return acquireTakeoverLock(stateDir, owner);
  }
  return async () => {
    const current = await readLockOwner(takeoverPath);
    if (current?.token === owner.token) {
      await fs.rm(takeoverPath, { recursive: true, force: true });
    }
  };
}

export async function acquireLock(
  stateDir,
  { pid = process.pid, isAlive = defaultIsAlive, beforeTakeover = async () => {} } = {},
) {
  await fs.mkdir(stateDir, { recursive: true });
  const token = `${pid}-${Date.now()}-${randomUUID()}`;
  const lockPath = path.join(stateDir, LOCK_DIR);
  const ownerPath = path.join(lockPath, LOCK_OWNER_FILE);
  const owner = { pid, token, createdAt: new Date().toISOString() };
  try {
    await fs.mkdir(lockPath);
    await fs.writeFile(ownerPath, `${JSON.stringify(owner)}\n`, { flag: 'wx' });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const holder = await readLockOwner(lockPath);
    if (holder?.pid && isAlive(holder.pid)) return null;
    await beforeTakeover(holder);
    const releaseTakeover = await acquireTakeoverLock(stateDir, owner);
    if (!releaseTakeover) return null;
    try {
      const current = await readLockOwner(lockPath);
      // Only the contender that still sees the originally stale token may clear it.
      // If another contender already installed a fresh lock, returning null preserves
      // that live holder and avoids moving a valid lock aside.
      if (current?.token !== holder?.token) return null;
      await fs.rm(lockPath, { recursive: true, force: true });
    } finally {
      await releaseTakeover();
    }
    return acquireLock(stateDir, { pid, isAlive, beforeTakeover });
  }
  return async () => {
    const current = await readLockOwner(lockPath);
    if (current?.token === token) {
      await fs.rm(lockPath, { recursive: true, force: true });
    }
  };
}

export async function readCurrentRun(stateDir) {
  try {
    return JSON.parse(await fs.readFile(path.join(stateDir, CURRENT_FILE), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeCurrentRun(stateDir, run) {
  await fs.mkdir(stateDir, { recursive: true });
  const tmp = path.join(stateDir, `${CURRENT_FILE}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, `${JSON.stringify(run)}\n`);
  await fs.rename(tmp, path.join(stateDir, CURRENT_FILE));
}

export async function clearCurrentRun(stateDir) {
  await fs.rm(path.join(stateDir, CURRENT_FILE), { force: true });
}

export async function appendHistory(stateDir, entry) {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.appendFile(path.join(stateDir, HISTORY_FILE), `${JSON.stringify(entry)}\n`);
}

export async function readHistory(stateDir, limit = 10) {
  const text = await fs.readFile(path.join(stateDir, HISTORY_FILE), 'utf8').catch(() => '');
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .slice(-limit);
}
