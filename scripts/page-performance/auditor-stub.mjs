import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { escapeHtml, reportSlug } from './paths.mjs';

function numericFrom(url, formFactor, salt, min, max) {
  const hex = createHash('sha256').update(`${url}|${formFactor}|${salt}`).digest('hex').slice(0, 8);
  const n = parseInt(hex, 16) / 0xffffffff;
  return min + n * (max - min);
}

export async function auditUrl({ url, formFactor, outDir }) {
  const score = Math.round(numericFrom(url, formFactor, 'score', 72, 99));
  const fcpMs = Math.round(numericFrom(url, formFactor, 'fcp', 600, 2800));
  const lcpMs = Math.round(numericFrom(url, formFactor, 'lcp', 800, 3200));
  const cls = Number(numericFrom(url, formFactor, 'cls', 0.001, 0.12).toFixed(3));
  const tbtMs = Math.round(numericFrom(url, formFactor, 'tbt', 0, 250));
  const siMs = Math.round(numericFrom(url, formFactor, 'si', 900, 4000));
  const ttfbMs = Math.round(numericFrom(url, formFactor, 'ttfb', 40, 280));
  const slug = reportSlug(url, formFactor);
  await mkdir(outDir, { recursive: true });
  const htmlPath = join(outDir, `${slug}.report.html`);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Stub report ${escapeHtml(formFactor)}</title></head>
<body>
  <h1>Stub Lighthouse report</h1>
  <p>This demo auditor does not launch Chrome. Swap config.auditor to "lighthouse" for a real run.</p>
  <dl>
    <dt>URL</dt><dd>${escapeHtml(url)}</dd>
    <dt>Device</dt><dd>${formFactor}</dd>
    <dt>Score</dt><dd>${score}</dd>
    <dt>FCP (ms)</dt><dd>${fcpMs}</dd>
    <dt>LCP (ms)</dt><dd>${lcpMs}</dd>
    <dt>CLS</dt><dd>${cls}</dd>
  </dl>
</body></html>
`;
  await writeFile(htmlPath, html, 'utf8');
  return {
    url,
    formFactor,
    status: 'ok',
    error: null,
    score,
    fcpMs,
    lcpMs,
    cls,
    tbtMs,
    siMs,
    ttfbMs,
    inpMs: null,
    insights: [],
    htmlPath,
    auditor: 'stub',
  };
}
