import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isMainModule, repoRootFrom } from './paths.mjs';
import { buildSummaryMarkdown, mergeShardSummaries } from './summary.mjs';

export async function summarize({ outDir, repoRoot = repoRootFrom(import.meta.url) } = {}) {
  const dest = outDir || join(repoRoot, 'performance-reports');
  const shardRoot = join(dest, 'shards');
  const entries = await readdir(shardRoot, { withFileTypes: true });
  const shards = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const summaryPath = join(shardRoot, entry.name, 'summary.json');
    try {
      const parsed = JSON.parse(await readFile(summaryPath, 'utf8'));
      shards.push(parsed);
    } catch {
      // shard url lists live alongside directories
    }
  }
  if (!shards.length) {
    throw new Error(`No shard summary.json files found under ${shardRoot}`);
  }

  try {
    const plan = JSON.parse(await readFile(join(dest, 'plan.json'), 'utf8'));
    const expected = new Set((plan.shardIndexes || []).map(String));
    const found = new Set(shards.map((s) => String(s.shard)));
    const missing = [...expected].filter((id) => !found.has(id));
    if (missing.length) {
      throw new Error(`missing shard summaries: ${missing.join(', ')}`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // local callers can summarize without a plan file
    } else {
      throw err;
    }
  }

  const generatedAt = new Date().toISOString();
  const { rows } = mergeShardSummaries(shards);
  const summaryMd = buildSummaryMarkdown(rows, generatedAt);
  const summaryJson = { generatedAt, rowCount: rows.length, rows };
  await writeFile(join(dest, 'summary.md'), summaryMd, 'utf8');
  await writeFile(join(dest, 'summary.json'), `${JSON.stringify(summaryJson, null, 2)}\n`, 'utf8');
  return { dest, summaryMd, summaryJson, rows };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  summarize({
    outDir: process.env.PERF_OUT_DIR ? resolve(process.env.PERF_OUT_DIR) : undefined,
  })
    .then(({ dest, rows }) => {
      console.log(`Wrote summary for ${rows.length} rows to ${dest}`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
