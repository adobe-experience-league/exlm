import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { loadConfig } from './load-config.mjs';

describe('loadConfig', () => {
  let dir;

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('loads required fields and fills defaults', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(
      path,
      JSON.stringify({
        sitemapUrl: 'https://experienceleague.adobe.com/sitemap-index.xml',
      }),
    );
    const cfg = await loadConfig(path);
    assert.equal(cfg.sitemapUrl, 'https://experienceleague.adobe.com/sitemap-index.xml');
    assert.deepEqual(cfg.include, []);
    assert.deepEqual(cfg.exclude, []);
    assert.equal(cfg.maxUrls, 20);
    assert.equal(cfg.select, 'stride');
    assert.deepEqual(cfg.formFactors, ['mobile', 'desktop']);
    assert.equal(cfg.query.martech, 'off');
    assert.equal(cfg.shards, 4);
    assert.equal(cfg.concurrencyPerShard, 1);
    assert.equal(cfg.auditor, 'stub');
    assert.equal(cfg.artifactRetentionDays, 14);
    assert.equal(cfg.keepLastRuns, 5);
    assert.equal(cfg.concurrencyPerShard, 1);
    assert.deepEqual(cfg.allowedHosts, []);
  });

  it('rejects missing sitemapUrl', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(path, JSON.stringify({ maxUrls: 3 }));
    await assert.rejects(() => loadConfig(path), /sitemapUrl/);
  });

  it('rejects invalid include regex', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(path, JSON.stringify({ sitemapUrl: 'https://example.com/sitemap.xml', include: ['(unclosed'] }));
    await assert.rejects(() => loadConfig(path), /invalid regex/i);
  });

  it('rejects shards below 1', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(path, JSON.stringify({ sitemapUrl: 'https://example.com/sitemap.xml', shards: 0 }));
    await assert.rejects(() => loadConfig(path), /shards/);
  });

  it('rejects concurrencyPerShard below 1', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(path, JSON.stringify({ sitemapUrl: 'https://example.com/sitemap.xml', concurrencyPerShard: 0 }));
    await assert.rejects(() => loadConfig(path), /concurrencyPerShard/);
  });

  it('rejects keepLastRuns below 1', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-cfg-'));
    const path = join(dir, 'performance.json');
    await writeFile(path, JSON.stringify({ sitemapUrl: 'https://example.com/sitemap.xml', keepLastRuns: 0 }));
    await assert.rejects(() => loadConfig(path), /keepLastRuns/);
  });
});
