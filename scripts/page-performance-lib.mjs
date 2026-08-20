import { readFile } from 'node:fs/promises';

export const FORM_FACTORS = ['mobile', 'desktop'];

export function ensureMartechOff(url) {
  const u = new URL(url);
  if (!u.searchParams.has('martech')) {
    u.searchParams.set('martech', 'off');
  }
  return u.toString();
}

export async function loadUrls(configPath) {
  let raw;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch (err) {
    throw new Error(`Missing performance URL config at ${configPath}: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${configPath}: ${err.message}`);
  }
  if (!parsed || !Array.isArray(parsed.urls) || parsed.urls.length === 0) {
    throw new Error(`URL list in ${configPath} is empty or missing`);
  }
  for (const url of parsed.urls) {
    if (typeof url !== 'string' || !url.trim()) {
      throw new Error(`Invalid URL entry in ${configPath}`);
    }
  }
  return parsed.urls.map((u) => u.trim());
}

export function slugForReport(url, formFactor) {
  const u = new URL(url);
  const pathPart = `${u.hostname}${u.pathname}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${pathPart}-${formFactor}`.slice(0, 120);
}

function num(audit) {
  if (!audit || typeof audit.numericValue !== 'number') return null;
  return audit.numericValue;
}

export function extractMetrics(lhr) {
  const audits = lhr?.audits || {};
  const scoreFrac = lhr?.categories?.performance?.score;
  return {
    score: typeof scoreFrac === 'number' ? Math.round(scoreFrac * 100) : null,
    lcpMs: num(audits['largest-contentful-paint']),
    cls: num(audits['cumulative-layout-shift']),
    inpMs: num(audits['interaction-to-next-paint']),
    tbtMs: num(audits['total-blocking-time']),
    ttfbMs: num(audits['server-response-time']),
    totalByteWeight: num(audits['total-byte-weight']),
  };
}

function fmt(v, digits = 0) {
  if (v == null || Number.isNaN(v)) return '—';
  return typeof v === 'number' ? v.toFixed(digits) : String(v);
}

function sanitizeMdCell(text) {
  return String(text).replace(/\r?\n/g, ' ').replace(/\|/g, '/');
}

export function buildSummaryMarkdown(rows, generatedAt) {
  const lines = [
    `# Page performance report`,
    ``,
    `Generated: ${generatedAt}`,
    ``,
    `| URL | Device | Status | Score | LCP (ms) | CLS | INP (ms) | TBT (ms) | TTFB (ms) | Bytes |`,
    `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`,
  ];
  for (const r of rows) {
    if (r.status !== 'ok') {
      const errText = sanitizeMdCell(r.error || 'failed');
      lines.push(`| ${r.url} | ${r.formFactor} | ERROR: ${errText} | — | — | — | — | — | — | — |`);
      continue;
    }
    lines.push(
      `| ${r.url} | ${r.formFactor} | ok | ${fmt(r.score)} | ${fmt(r.lcpMs)} | ${fmt(r.cls, 3)} | ${fmt(
        r.inpMs,
      )} | ${fmt(r.tbtMs)} | ${fmt(r.ttfbMs)} | ${fmt(r.totalByteWeight)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
