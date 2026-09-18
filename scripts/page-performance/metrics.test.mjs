import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRunSuggestion, extractInsights, extractMetrics, metricReasons, urlKey } from './metrics.mjs';
import { cronMatches, parseEnabled, shouldRun } from './gate.mjs';

describe('urlKey', () => {
  it('strips query so type lookup survives martech=off', () => {
    assert.equal(
      urlKey('https://experienceleague.adobe.com/en/docs?martech=off'),
      urlKey('https://experienceleague.adobe.com/en/docs'),
    );
  });
});

describe('extractMetrics', () => {
  it('reads usual Lighthouse performance audits', () => {
    const metrics = extractMetrics({
      audits: {
        'first-contentful-paint': { numericValue: 1200 },
        'largest-contentful-paint': { numericValue: 2500 },
        'cumulative-layout-shift': { numericValue: 0.04 },
        'total-blocking-time': { numericValue: 80 },
        'speed-index': { numericValue: 1800 },
        'server-response-time': { numericValue: 90 },
      },
    });
    assert.equal(metrics.fcpMs, 1200);
    assert.equal(metrics.lcpMs, 2500);
    assert.equal(metrics.siMs, 1800);
  });
});

describe('extractInsights', () => {
  it('keeps failing opportunity and insight audits', () => {
    const insights = extractInsights({
      categories: {
        performance: {
          auditRefs: [
            { id: 'unused-javascript', group: 'load-opportunities' },
            { id: 'lcp-insight', group: 'insights' },
          ],
        },
      },
      audits: {
        'unused-javascript': {
          title: 'Reduce unused JavaScript',
          displayValue: 'Est savings of 400 ms',
          score: 0.2,
          details: { type: 'opportunity' },
        },
        'lcp-insight': { title: 'LCP breakdown', score: 0.4, displayValue: '' },
        'first-contentful-paint': { title: 'FCP', score: 0.5 },
      },
    });
    assert.equal(insights[0].id, 'unused-javascript');
    assert.ok(insights.some((i) => i.id === 'lcp-insight'));
    assert.ok(!insights.some((i) => i.id === 'first-contentful-paint'));
  });
});

describe('metricReasons', () => {
  it('flags poor LCP', () => {
    const reasons = metricReasons({ lcpMs: 9580, fcpMs: 800, cls: 0.01, tbtMs: 10, siMs: 900, ttfbMs: 80 });
    assert.ok(reasons.some((r) => r.startsWith('LCP')));
  });
});

describe('buildRunSuggestion', () => {
  it('summarizes the worst low score', () => {
    const text = buildRunSuggestion([
      {
        url: 'https://demo.example/en/home?martech=off',
        formFactor: 'mobile',
        status: 'ok',
        score: 41,
        lcpMs: 9580,
        insights: [{ title: 'Render blocking requests', displayValue: '1.2 s' }],
      },
      { url: 'https://demo.example/en/docs', formFactor: 'desktop', status: 'ok', score: 99, lcpMs: 800, insights: [] },
    ]);
    assert.match(text, /1 of 2/);
    assert.match(text, /41/);
    assert.match(text, /LCP|Render blocking/);
  });

  it('mentions errors and low scores together', () => {
    const text = buildRunSuggestion([
      { url: 'https://demo.example/en/home', formFactor: 'mobile', status: 'error', error: 'timeout' },
      {
        url: 'https://demo.example/en/docs',
        formFactor: 'mobile',
        status: 'ok',
        score: 41,
        lcpMs: 9580,
        insights: [],
      },
    ]);
    assert.match(text, /errored/);
    assert.match(text, /41|below 90/);
  });
});

describe('gate', () => {
  it('treats empty enabled as on', () => {
    assert.equal(parseEnabled(''), true);
    assert.equal(parseEnabled('false'), false);
  });

  it('matches Monday 08:00 UTC', () => {
    const monday8 = new Date(Date.UTC(2026, 8, 14, 8, 0, 0));
    assert.equal(cronMatches('0 8 * * 1', monday8), true);
    assert.equal(cronMatches('0 8 * * 1', new Date(Date.UTC(2026, 8, 14, 8, 5, 0))), true);
    assert.equal(cronMatches('0 8 * * 1', new Date(Date.UTC(2026, 8, 14, 9, 0, 0))), false);
  });

  it('pauses scheduled runs and still allows manual', () => {
    const monday8 = new Date(Date.UTC(2026, 8, 14, 8, 0, 0));
    assert.equal(shouldRun({ eventName: 'schedule', enabled: 'false', now: monday8 }).run, false);
    assert.equal(shouldRun({ eventName: 'workflow_dispatch', enabled: 'false', now: monday8 }).run, true);
  });

  it('honors skipUntil on the schedule', () => {
    const monday8 = new Date(Date.UTC(2026, 8, 14, 8, 0, 0));
    assert.equal(
      shouldRun({
        eventName: 'schedule',
        skipUntil: '2026-10-01',
        now: monday8,
      }).reason,
      'skip-until',
    );
  });

  it('skips invalid schedule instead of throwing', () => {
    const result = shouldRun({
      eventName: 'schedule',
      schedule: 'not-a-cron',
      now: new Date(Date.UTC(2026, 8, 14, 8, 0, 0)),
    });
    assert.equal(result.run, false);
    assert.equal(result.reason, 'invalid-schedule');
  });
});
