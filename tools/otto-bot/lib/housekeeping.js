import fs from 'node:fs/promises';
import path from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;
const DRY_RUN_MARKER = '.otto-dry-run-retained';

async function listDirs(root) {
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(root, e.name));
}

export async function cleanupRuns({ runsRoot, workRoot, retentionDays, now = Date.now() }) {
  const removed = [];
  const cutoff = now - retentionDays * DAY_MS;
  for (const dir of await listDirs(runsRoot)) {
    const stat = await fs.stat(dir);
    if (stat.mtimeMs < cutoff) {
      await fs.rm(dir, { recursive: true, force: true });
      removed.push(dir);
    }
  }
  // Non-dry-run work dirs only exist during a run; any present while the lock is held are leftovers.
  // Retained dry-run worktrees are intentionally kept for inspection until the retention cutoff.
  for (const dir of await listDirs(workRoot)) {
    const marker = path.join(dir, DRY_RUN_MARKER);
    const markerStat = await fs.stat(marker).catch(() => null);
    if (!markerStat || markerStat.mtimeMs < cutoff) {
      await fs.rm(dir, { recursive: true, force: true });
      removed.push(dir);
    }
  }
  return removed;
}
