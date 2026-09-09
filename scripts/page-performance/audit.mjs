import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { auditUrl as stubAudit } from './auditor-stub.mjs';
import { loadConfig } from './load-config.mjs';
import { isMainModule, mapLimit, repoRootFrom } from './paths.mjs';
import { applyPageQuery } from './select-urls.mjs';

async function loadAuditor(kind) {
  if (kind === 'stub') {
    return {
      auditUrl: stubAudit,
      close: async () => {},
    };
  }
  const { createLighthouseSession } = await import('./auditor-lighthouse.mjs');
  return createLighthouseSession();
}

export async function auditShard({
  shardIndex = Number(process.env.SHARD_INDEX || 0),
  configPath,
  outDir,
  repoRoot = repoRootFrom(import.meta.url),
} = {}) {
  const root = repoRoot;
  const dest = outDir || join(root, 'performance-reports');
  const cfg = await loadConfig(configPath || join(root, 'performance/config.json'));
  const shardFile = join(dest, 'shards', `${shardIndex}.json`);
  const { urls } = JSON.parse(await readFile(shardFile, 'utf8'));
  const shardOut = join(dest, 'shards', String(shardIndex));
  await mkdir(shardOut, { recursive: true });

  const jobs = [];
  for (const url of urls) {
    const target = applyPageQuery(url, cfg.query);
    for (const formFactor of cfg.formFactors) {
      jobs.push({ url: target, formFactor });
    }
  }

  const session = await loadAuditor(cfg.auditor);
  const rows = [];
  try {
    const results = await mapLimit(jobs, cfg.concurrencyPerShard, async (job) => {
      try {
        return await session.auditUrl({ ...job, outDir: shardOut });
      } catch (err) {
        return {
          url: job.url,
          formFactor: job.formFactor,
          status: 'error',
          error: err.message,
          score: null,
          lcpMs: null,
          cls: null,
          tbtMs: null,
          ttfbMs: null,
          totalByteWeight: null,
          htmlPath: null,
          auditor: cfg.auditor,
        };
      }
    });
    rows.push(...results);
  } finally {
    await session.close();
  }

  const summary = {
    shard: shardIndex,
    generatedAt: new Date().toISOString(),
    rows: rows.map(({ htmlPath, ...rest }) => rest),
  };
  await writeFile(join(shardOut, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return { shardIndex, rows, shardOut };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  auditShard({
    shardIndex: Number(process.env.SHARD_INDEX || 0),
    outDir: process.env.PERF_OUT_DIR ? resolve(process.env.PERF_OUT_DIR) : undefined,
  })
    .then(({ shardIndex, rows }) => {
      const ok = rows.filter((r) => r.status === 'ok').length;
      console.log(`Shard ${shardIndex}: ${ok}/${rows.length} ok`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
