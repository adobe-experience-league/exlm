import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { reportSlug } from './paths.mjs';

function lighthouseFlags(formFactor, constants) {
  if (formFactor === 'mobile') {
    return {
      onlyCategories: ['performance'],
      formFactor: 'mobile',
      throttlingMethod: 'simulate',
      output: 'html',
    };
  }
  return {
    onlyCategories: ['performance'],
    formFactor: 'desktop',
    screenEmulation: constants.screenEmulationMetrics.desktop,
    throttling: constants.throttling.desktopDense4G,
    throttlingMethod: 'simulate',
    output: 'html',
  };
}

function num(audit) {
  if (!audit || typeof audit.numericValue !== 'number') return null;
  return audit.numericValue;
}

export async function createLighthouseSession() {
  let lighthouseMod;
  let constants;
  let chromeLauncher;
  try {
    [lighthouseMod, constants, chromeLauncher] = await Promise.all([
      import('lighthouse'),
      import('lighthouse/core/config/constants.js'),
      import('chrome-launcher'),
    ]);
  } catch (err) {
    throw new Error(`Cannot import lighthouse. Install with: npm install lighthouse@^12 --no-save. ${err.message}`);
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  return {
    async auditUrl({ url, formFactor, outDir }) {
      const lighthouse = lighthouseMod.default || lighthouseMod;
      const result = await lighthouse(url, {
        ...lighthouseFlags(formFactor, constants),
        port: chrome.port,
      });
      const lhr = result.lhr;
      const html = Array.isArray(result.report) ? result.report[0] : result.report;
      const scoreFrac = lhr?.categories?.performance?.score;
      const slug = reportSlug(url, formFactor);
      await mkdir(outDir, { recursive: true });
      const htmlPath = join(outDir, `${slug}.report.html`);
      await writeFile(htmlPath, html, 'utf8');
      const audits = lhr?.audits || {};
      return {
        url,
        formFactor,
        status: 'ok',
        error: null,
        score: typeof scoreFrac === 'number' ? Math.round(scoreFrac * 100) : null,
        lcpMs: num(audits['largest-contentful-paint']),
        cls: num(audits['cumulative-layout-shift']),
        tbtMs: num(audits['total-blocking-time']),
        ttfbMs: num(audits['server-response-time']),
        totalByteWeight: num(audits['total-byte-weight']),
        htmlPath,
        auditor: 'lighthouse',
      };
    },
    async close() {
      await chrome.kill();
    },
  };
}
