import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FORM_FACTORS,
  buildSummaryMarkdown,
  ensureMartechOff,
  extractMetrics,
  loadUrls,
  slugForReport,
} from './page-performance-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

async function loadLighthouse() {
  try {
    const mod = await import('lighthouse');
    return mod.default || mod;
  } catch (err) {
    throw new Error(
      `Cannot import lighthouse. Install it first (CI does this lean). Local: npm install lighthouse --no-save. ${err.message}`,
    );
  }
}

async function loadChromeLauncher() {
  try {
    return await import('chrome-launcher');
  } catch (err) {
    throw new Error(
      `Cannot import chrome-launcher. Install lighthouse (it pulls chrome-launcher) or: npm install chrome-launcher --no-save. ${err.message}`,
    );
  }
}

function lighthouseFlags(formFactor) {
  const isMobile = formFactor === 'mobile';
  return {
    onlyCategories: ['performance'],
    formFactor: isMobile ? 'mobile' : 'desktop',
    screenEmulation: isMobile
      ? undefined
      : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: 'simulate',
    output: 'html',
  };
}

async function auditOne({ lighthouse, chrome, url, formFactor, outDir }) {
  const target = ensureMartechOff(url);
  const result = await lighthouse(target, {
    ...lighthouseFlags(formFactor),
    port: chrome.port,
  });
  const lhr = result.lhr;
  const html = Array.isArray(result.report) ? result.report[0] : result.report;
  const metrics = extractMetrics(lhr);
  const slug = slugForReport(target, formFactor);
  const htmlPath = join(outDir, `${slug}.report.html`);
  await writeFile(htmlPath, html, 'utf8');
  return {
    url: target,
    formFactor,
    status: 'ok',
    error: null,
    htmlPath,
    ...metrics,
  };
}

export async function runPagePerformance({
  configPath = join(repoRoot, 'performance', 'urls.json'),
  outDir = join(repoRoot, 'performance-reports'),
  urlOverride = process.env.PERF_URL || null,
} = {}) {
  const generatedAt = new Date().toISOString();
  const urls = urlOverride ? [urlOverride] : await loadUrls(configPath);

  const lighthouse = await loadLighthouse();
  const { launch } = await loadChromeLauncher();

  await mkdir(outDir, { recursive: true });

  let chrome;
  try {
    chrome = await launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });
  } catch (err) {
    throw new Error(`Failed to launch Chrome for Lighthouse: ${err.message}`);
  }

  const rows = [];
  try {
    for (const url of urls) {
      for (const formFactor of FORM_FACTORS) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const row = await auditOne({ lighthouse, chrome, url, formFactor, outDir });
          rows.push(row);
          console.log(`OK ${formFactor} ${row.url} score=${row.score}`);
        } catch (err) {
          const target = ensureMartechOff(url);
          rows.push({
            url: target,
            formFactor,
            status: 'error',
            error: err.message,
            score: null,
            lcpMs: null,
            cls: null,
            inpMs: null,
            tbtMs: null,
            ttfbMs: null,
            totalByteWeight: null,
            htmlPath: null,
          });
          console.error(`ERROR ${formFactor} ${target}: ${err.message}`);
        }
      }
    }
  } finally {
    if (chrome) await chrome.kill();
  }

  const summaryMd = buildSummaryMarkdown(rows, generatedAt);
  const summaryJson = {
    generatedAt,
    rows: rows.map(({ htmlPath, ...rest }) => rest),
  };

  await writeFile(join(outDir, 'summary.md'), summaryMd, 'utf8');
  await writeFile(join(outDir, 'summary.json'), `${JSON.stringify(summaryJson, null, 2)}\n`, 'utf8');

  return { outDir, summaryMd, summaryJson, rows };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runPagePerformance({
    outDir: process.env.PERF_OUT_DIR
      ? resolve(process.env.PERF_OUT_DIR)
      : join(repoRoot, 'performance-reports'),
  })
    .then(({ outDir }) => {
      console.log(`Wrote reports to ${outDir}`);
      process.exitCode = 0;
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
