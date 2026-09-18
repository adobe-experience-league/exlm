const LOW_SCORE = 90;

const METRIC_AUDITS = {
  fcpMs: 'first-contentful-paint',
  lcpMs: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbtMs: 'total-blocking-time',
  siMs: 'speed-index',
  ttfbMs: 'server-response-time',
  inpMs: 'interaction-to-next-paint',
};

/** Lab thresholds aligned with Lighthouse / CWV guidance (poor). */
const POOR = {
  fcpMs: 3000,
  lcpMs: 4000,
  cls: 0.25,
  tbtMs: 600,
  siMs: 5800,
  ttfbMs: 1800,
};

const LABELS = {
  fcpMs: 'FCP',
  lcpMs: 'LCP',
  cls: 'CLS',
  tbtMs: 'TBT',
  siMs: 'Speed Index',
  ttfbMs: 'TTFB',
};

export function urlKey(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '') || '/'}`;
  } catch {
    return String(url || '');
  }
}

export function numAudit(audit) {
  if (!audit || typeof audit.numericValue !== 'number' || Number.isNaN(audit.numericValue)) {
    return null;
  }
  return audit.numericValue;
}

export function extractMetrics(lhr) {
  const audits = lhr?.audits || {};
  const out = {};
  for (const [key, id] of Object.entries(METRIC_AUDITS)) {
    out[key] = numAudit(audits[id]);
  }
  return out;
}

export function extractInsights(lhr, limit = 5) {
  const audits = lhr?.audits || {};
  const refs = lhr?.categories?.performance?.auditRefs || [];
  const groups = new Set(['insights', 'load-opportunities', 'diagnostics']);
  const wanted = new Set(refs.filter((ref) => groups.has(ref.group)).map((ref) => ref.id));
  const items = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (!audit || typeof audit.score !== 'number' || audit.score >= 0.9) continue;
    const isOpportunity = audit.details?.type === 'opportunity';
    if (wanted.size && !wanted.has(id) && !isOpportunity) continue;
    items.push({
      id,
      title: audit.title || id,
      displayValue: audit.displayValue || '',
      score: audit.score,
    });
  }
  items.sort((a, b) => a.score - b.score);
  return items.slice(0, limit);
}

export function metricReasons(metrics) {
  const reasons = [];
  for (const [key, limit] of Object.entries(POOR)) {
    const value = metrics[key];
    if (value == null || value <= limit) continue;
    const label = LABELS[key];
    const shown = key === 'cls' ? Number(value).toFixed(3) : `${Math.round(value)} ms`;
    reasons.push(`${label} ${shown} is poor (threshold ${key === 'cls' ? limit : `${limit} ms`})`);
  }
  return reasons;
}

export function rowReasons(row) {
  if (row.status !== 'ok') return [row.error || 'audit failed'];
  const reasons = metricReasons(row);
  for (const insight of row.insights || []) {
    const extra = insight.displayValue ? ` (${insight.displayValue})` : '';
    reasons.push(`${insight.title}${extra}`);
  }
  if (typeof row.score === 'number' && row.score < LOW_SCORE && !reasons.length) {
    reasons.push(`Performance score ${row.score} is below ${LOW_SCORE}`);
  }
  return reasons;
}

export function isLowScore(row) {
  return row.status === 'ok' && typeof row.score === 'number' && row.score < LOW_SCORE;
}

export function buildRunInsights(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!isLowScore(row) && row.status === 'ok') continue;
    for (const insight of row.insights || []) {
      const key = insight.title || insight.id;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([title, count]) => ({ title, count }));
}

export function buildRunSuggestion(rows) {
  const failed = rows.filter((r) => r.status !== 'ok');
  const low = rows.filter(isLowScore).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const errorBit = failed.length
    ? `${failed.length} audit(s) errored. Re-run those URLs; do not treat the week as a full picture.`
    : '';
  if (!low.length) {
    if (errorBit) return errorBit;
    return `All ${rows.length} audited views scored ${LOW_SCORE}+. No performance follow-up from this sample.`;
  }
  const worst = low[0];
  const why = rowReasons(worst)[0] || 'low Lighthouse score';
  const lowBit = `${low.length} of ${rows.length} views scored below ${LOW_SCORE}. Worst: ${worst.formFactor} ${urlKey(
    worst.url,
  )} (${worst.score}). Primary: ${why}.`;
  return errorBit ? `${errorBit} ${lowBit}` : lowBit;
}

export { LOW_SCORE };
