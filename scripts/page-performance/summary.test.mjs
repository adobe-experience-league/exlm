import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { summarize } from './summarize.mjs';
import { buildSummaryMarkdown, mergeShardSummaries } from './summary.mjs';

describe('buildSummaryMarkdown', () => {
  it('renders an ok row and sanitizes error pipes', () => {
    const md = buildSummaryMarkdown(
      [
        {
          url: 'https://demo.example/en/home',
          formFactor: 'mobile',
          status: 'ok',
          score: 91,
          fcpMs: 900,
          lcpMs: 1800,
          cls: 0.01,
          tbtMs: 40,
          siMs: 1100,
          ttfbMs: 90,
        },
        {
          url: 'https://demo.example/en/docs',
          formFactor: 'desktop',
          status: 'error',
          error: 'timeout |\nline two',
        },
      ],
      '2026-09-09T00:00:00.000Z',
    );
    assert.match(md, /Page performance report/);
    assert.match(md, /91/);
    assert.match(md, /FCP \(ms\)/);
    assert.doesNotMatch(md, /Bytes/);
    assert.match(md, /ERROR: timeout \/ line two/);
    assert.doesNotMatch(md, /timeout \|/);
    assert.doesNotMatch(md, /\| Type \|/);
  });

  it('adds a Type column when selectedByType is present', () => {
    const md = buildSummaryMarkdown(
      [
        {
          url: 'https://demo.example/en/docs?martech=off',
          formFactor: 'mobile',
          status: 'ok',
          score: 90,
          fcpMs: 800,
          lcpMs: 1200,
          cls: 0,
          tbtMs: 10,
          siMs: 1000,
          ttfbMs: 80,
        },
      ],
      '2026-09-09T00:00:00.000Z',
      [{ id: 'docs', url: 'https://demo.example/en/docs' }],
    );
    assert.match(md, /\| Type \| URL \|/);
    assert.match(md, /\| docs \| https:\/\/demo\.example\/en\/docs\?martech=off \|/);
  });
});

describe('mergeShardSummaries', () => {
  it('concatenates rows from every shard in shard order', () => {
    const merged = mergeShardSummaries([
      { shard: 1, rows: [{ url: 'b' }] },
      { shard: 0, rows: [{ url: 'a' }] },
    ]);
    assert.deepEqual(
      merged.rows.map((r) => r.url),
      ['a', 'b'],
    );
  });
});

describe('summarize missing shards', () => {
  let dir;

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('fails when plan.json lists a shard with no summary', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-sum-'));
    await mkdir(join(dir, 'shards', '0'), { recursive: true });
    await writeFile(join(dir, 'plan.json'), JSON.stringify({ shardIndexes: [0, 1], urls: ['https://demo.example/a'] }));
    await writeFile(
      join(dir, 'shards', '0', 'summary.json'),
      JSON.stringify({ shard: 0, rows: [{ url: 'https://demo.example/a', formFactor: 'mobile', status: 'ok' }] }),
    );
    await assert.rejects(() => summarize({ outDir: dir }), /missing shard summaries: 1/);
  });
});
