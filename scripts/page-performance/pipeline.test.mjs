import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, it } from 'node:test';
import { runLocalPipeline } from './run-local.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('runLocalPipeline', () => {
  let dir;

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('discovers fixture sitemap urls, audits shards in parallel, writes summary', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-pipe-'));
    const result = await runLocalPipeline({
      configPath: join(repoRoot, 'scripts/page-performance/testdata/config.json'),
      outDir: dir,
      repoRoot,
    });
    assert.ok(result.urls.length >= 4);
    assert.ok(result.shards.length >= 2);
    assert.match(result.summaryMd, /Page performance report/);
    assert.equal(result.rows.filter((r) => r.status === 'ok').length, result.urls.length * 2);
  });
});
