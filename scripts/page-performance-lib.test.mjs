import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, after } from 'node:test';
import {
  ensureMartechOff,
  loadUrls,
  slugForReport,
  extractMetrics,
  buildSummaryMarkdown,
} from './page-performance-lib.mjs';

describe('ensureMartechOff', () => {
  it('appends martech=off when missing', () => {
    assert.equal(
      ensureMartechOff('https://experienceleague.adobe.com/en/home'),
      'https://experienceleague.adobe.com/en/home?martech=off',
    );
  });

  it('preserves existing martech=off', () => {
    assert.equal(
      ensureMartechOff('https://experienceleague.adobe.com/en/home?martech=off'),
      'https://experienceleague.adobe.com/en/home?martech=off',
    );
  });

  it('appends with & when other query params exist', () => {
    assert.equal(
      ensureMartechOff('https://experienceleague.adobe.com/en/home?foo=1'),
      'https://experienceleague.adobe.com/en/home?foo=1&martech=off',
    );
  });
});

describe('loadUrls', () => {
  let dir;

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('loads urls from config', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-urls-'));
    const path = join(dir, 'urls.json');
    await writeFile(path, JSON.stringify({ urls: ['https://example.com/a'] }));
    assert.deepEqual(await loadUrls(path), ['https://example.com/a']);
  });

  it('throws on empty urls', async () => {
    dir = await mkdtemp(join(tmpdir(), 'perf-urls-'));
    const path = join(dir, 'urls.json');
    await writeFile(path, JSON.stringify({ urls: [] }));
    await assert.rejects(() => loadUrls(path), /empty/i);
  });
});

describe('slugForReport', () => {
  it('builds a filesystem-safe stem', () => {
    const slug = slugForReport('https://experienceleague.adobe.com/en/home?martech=off', 'mobile');
    assert.match(slug, /mobile/);
    assert.doesNotMatch(slug, /[/?&=:]/);
  });
});

describe('extractMetrics', () => {
  it('reads score and core audits', () => {
    const metrics = extractMetrics({
      categories: { performance: { score: 0.87 } },
      audits: {
        'largest-contentful-paint': { numericValue: 2100 },
        'cumulative-layout-shift': { numericValue: 0.01 },
        'interaction-to-next-paint': { numericValue: 150 },
        'total-blocking-time': { numericValue: 200 },
        'server-response-time': { numericValue: 120 },
        'total-byte-weight': { numericValue: 900000 },
      },
    });
    assert.equal(metrics.score, 87);
    assert.equal(metrics.lcpMs, 2100);
    assert.equal(metrics.cls, 0.01);
    assert.equal(metrics.inpMs, 150);
    assert.equal(metrics.tbtMs, 200);
    assert.equal(metrics.ttfbMs, 120);
    assert.equal(metrics.totalByteWeight, 900000);
  });
});

describe('buildSummaryMarkdown', () => {
  it('includes a table header and row', () => {
    const md = buildSummaryMarkdown(
      [
        {
          url: 'https://example.com',
          formFactor: 'mobile',
          status: 'ok',
          score: 90,
          lcpMs: 2000,
          cls: 0.01,
          inpMs: 100,
          tbtMs: 50,
          ttfbMs: 80,
          totalByteWeight: 1000,
          error: null,
        },
      ],
      '2026-08-20T08:00:00.000Z',
    );
    assert.match(md, /Page performance report/);
    assert.match(md, /mobile/);
    assert.match(md, /90/);
  });
});
