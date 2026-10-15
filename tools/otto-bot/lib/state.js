import fs from 'node:fs/promises';
import path from 'node:path';

const LOCK_FILE = 'lock';
const CURRENT_FILE = 'current.json';
const HISTORY_FILE = 'history.jsonl';

function defaultIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

export async function acquireLock(stateDir, { pid = process.pid, isAlive = defaultIsAlive } = {}) {
  await fs.mkdir(stateDir, { recursive: true });
  const lockPath = path.join(stateDir, LOCK_FILE);
  try {
    await fs.writeFile(lockPath, String(pid), { flag: 'wx' });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const holder = Number(await fs.readFile(lockPath, 'utf8'));
    if (holder && isAlive(holder)) return null;
    await fs.rm(lockPath, { force: true });
    return acquireLock(stateDir, { pid, isAlive });
  }
  return async () => {
    await fs.rm(lockPath, { force: true });
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
  await fs.writeFile(path.join(stateDir, CURRENT_FILE), `${JSON.stringify(run)}\n`);
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
