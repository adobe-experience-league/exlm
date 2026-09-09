import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadConfig } from './load-config.mjs';
import { isMainModule, repoRootFrom, resolveSitemapSource } from './paths.mjs';
import { selectUrls } from './select-urls.mjs';
import { shardIndexes, shardUrls } from './shard.mjs';
import { collectSitemapUrls } from './sitemap.mjs';

export async function discover({ configPath, outDir, repoRoot = repoRootFrom(import.meta.url) } = {}) {
  const root = repoRoot;
  const cfgPath = configPath || join(root, 'performance/config.json');
  const dest = outDir || join(root, 'performance-reports');
  const cfg = await loadConfig(cfgPath);
  const sitemapSource = resolveSitemapSource(cfg.sitemapUrl, root);
  const urlOverride = process.env.PERF_URL || null;
  const allUrls = urlOverride ? [urlOverride] : await collectSitemapUrls(sitemapSource, cfg);
  const urls = urlOverride ? allUrls : selectUrls(allUrls, cfg);
  if (!urls.length) {
    throw new Error('No URLs left after sitemap collect + include/exclude/maxUrls');
  }
  const shards = shardUrls(urls, cfg.shards);
  const generatedAt = new Date().toISOString();
  const plan = {
    generatedAt,
    sitemapUrl: cfg.sitemapUrl,
    sitemapSource,
    discoveredCount: allUrls.length,
    urlCount: urls.length,
    urls,
    shardIndexes: shardIndexes(shards.length),
    shardSizes: shards.map((s) => s.length),
    formFactors: cfg.formFactors,
    auditor: cfg.auditor,
    artifactRetentionDays: cfg.artifactRetentionDays,
    keepLastRuns: cfg.keepLastRuns,
  };

  await mkdir(join(dest, 'shards'), { recursive: true });
  await writeFile(join(dest, 'plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  await writeFile(join(dest, 'selected-urls.json'), `${JSON.stringify({ urls }, null, 2)}\n`, 'utf8');
  await Promise.all(
    shards.map((shardUrlsForIndex, index) =>
      writeFile(
        join(dest, 'shards', `${index}.json`),
        `${JSON.stringify({ shard: index, urls: shardUrlsForIndex }, null, 2)}\n`,
        'utf8',
      ),
    ),
  );

  return { cfg, plan, shards, dest };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  discover({
    outDir: process.env.PERF_OUT_DIR ? resolve(process.env.PERF_OUT_DIR) : undefined,
  })
    .then(({ plan, dest }) => {
      console.log(`Discovered ${plan.urlCount} URLs into ${plan.shardIndexes.length} shards at ${dest}`);
      console.log(JSON.stringify({ shardIndexes: plan.shardIndexes, urlCount: plan.urlCount }));
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
