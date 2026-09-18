import { join, resolve } from 'node:path';
import { auditShard } from './audit.mjs';
import { discover } from './discover.mjs';
import { isMainModule, repoRootFrom } from './paths.mjs';
import { summarize } from './summarize.mjs';

export async function runLocalPipeline({ configPath, outDir, repoRoot = repoRootFrom(import.meta.url) } = {}) {
  const dest = outDir || join(repoRoot, 'performance-reports');
  const { plan, shards } = await discover({ configPath, outDir: dest, repoRoot });
  await Promise.all(
    plan.shardIndexes.map((shardIndex) => auditShard({ shardIndex, configPath, outDir: dest, repoRoot })),
  );
  const { summaryMd, summaryJson, rows } = await summarize({ outDir: dest, repoRoot });
  return {
    outDir: dest,
    urls: plan.urls,
    shards,
    summaryMd,
    summaryJson,
    rows,
  };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  runLocalPipeline({
    outDir: process.env.PERF_OUT_DIR ? resolve(process.env.PERF_OUT_DIR) : undefined,
  })
    .then(({ outDir, urls, rows }) => {
      console.log(`Audited ${urls.length} URLs (${rows.length} rows). Reports: ${outDir}`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
