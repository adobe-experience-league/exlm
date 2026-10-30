/* eslint-env node */

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixtures = new Map();
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
};

let server;
let baseURL;

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function numberedLines(count, prefix = 'line') {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index}`);
}

function siblingPres(lines, { code = true } = {}) {
  return lines
    .map((line) => {
      const text = `${escapeHtml(line)}\n`;
      return code ? `<pre><code>${text}</code></pre>` : `<pre>${text}</pre>`;
    })
    .join('');
}

function brPre(lines) {
  return `<pre><code>${lines.map((line) => escapeHtml(line)).join('<br>')}</code></pre>`;
}

function newlinePre(lines) {
  return `<pre><code>${lines.map((line) => escapeHtml(line)).join('\n')}</code></pre>`;
}

function codeBlock({ className, codeCellHtml, metaCells = [] }) {
  const rows = [
    `<div><div>${codeCellHtml}</div></div>`,
    ...metaCells.map((cell) => `<div><div>${escapeHtml(cell)}</div></div>`),
  ];
  return `<div class="${className}">${rows.join('')}</div>`;
}

function pageDocument(markup) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body>
${markup}
<script>
  window.addEventListener('error', (event) => {
    const error = event.error;
    document.body.dataset.error = (error && (error.stack || error.message)) || event.message;
    document.body.dataset.ready = 'true';
  });
</script>
<script type="module">
  import decorate from '/blocks/code/code.js';
  try {
    const blocks = [...document.querySelectorAll('.code')];
    await blocks.reduce(async (chain, block) => {
      await chain;
      await decorate(block);
    }, Promise.resolve());
  } catch (error) {
    document.body.dataset.error = error instanceof Error ? error.stack || error.message : String(error);
  }
  document.body.dataset.ready = 'true';
</script>
</body>
</html>`;
}

function isInsideRepo(filePath) {
  const relative = path.relative(repoRoot, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/__fixture') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fixtures.get(url.searchParams.get('id')) || '');
    return;
  }

  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(repoRoot, relativePath);
  if (!isInsideRepo(filePath)) {
    res.writeHead(403);
    res.end();
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end();
  }
}

async function decorateFixture(page, markup) {
  const id = String(fixtures.size);
  fixtures.set(id, pageDocument(markup));
  const pageErrors = [];
  const onPageError = (error) => {
    pageErrors.push(error);
  };
  page.on('pageerror', onPageError);
  await page.goto(`${baseURL}/__fixture?id=${encodeURIComponent(id)}`);
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  const inlineError = await page.locator('body').getAttribute('data-error');
  page.off('pageerror', onPageError);
  if (inlineError) throw new Error(inlineError);
  if (pageErrors.length) throw pageErrors[0];
}

function codeText(page, root = page) {
  return root.locator('pre code').textContent();
}

function inlineMaxHeight(root) {
  return root.locator('pre').evaluate((element) => element.style.maxHeight);
}

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('21 sibling pres over threshold 20 show more and toggle', async ({ page }) => {
  const lines = [
    '---',
    'name: <insert company name>',
    '{{dimensionHeader}}',
    'title: "Experience League"',
    ...numberedLines(17, 'field'),
  ];
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(lines),
      metaCells: ['', '', '20'],
    }),
  );

  await expect(page.locator('pre')).toHaveCount(1);
  const pre = page.locator('pre');
  await expect(pre).toHaveClass(/language-html/);
  await expect(pre).toHaveAttribute('data-collapsed', 'true');
  expect(await inlineMaxHeight(page)).toBe('30em');
  expect(await codeText(page)).toBe(lines.join('\n'));

  const button = page.locator('button.code-toggle-button');
  await expect(button).toHaveText('Show more');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAttribute('type', 'button');

  await button.click();
  await expect(button).toHaveText('Show less');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(await inlineMaxHeight(page)).toBe('');
  await expect(pre).toHaveAttribute('data-collapsed', 'false');

  await button.click();
  await expect(button).toHaveText('Show more');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(pre).toHaveAttribute('data-collapsed', 'true');
  expect(await inlineMaxHeight(page)).toBe('30em');
});

test('20 sibling pres at threshold 20 do not show a button', async ({ page }) => {
  const lines = numberedLines(20);
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(lines),
      metaCells: ['', '', '20'],
    }),
  );

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('pre')).toHaveCount(1);
  expect(await codeText(page)).toBe(lines.join('\n'));
});

test('two sibling pres under the default threshold stay one pre without a button', async ({ page }) => {
  const lines = ['alpha', 'beta'];
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(lines),
    }),
  );

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('pre')).toHaveCount(1);
  expect(await codeText(page)).toBe('alpha\nbeta');
});

test('sibling pres without expandable are joined and do not show a button', async ({ page }) => {
  const lines = numberedLines(21);
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html',
      codeCellHtml: siblingPres(lines),
    }),
  );

  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.locator('pre')).toHaveCount(1);
  expect(await codeText(page)).toBe(lines.join('\n'));
});

test('one pre with br separators over the default threshold shows more', async ({ page }) => {
  const lines = numberedLines(16, 'br');
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: brPre(lines),
    }),
  );

  await expect(page.locator('pre')).toHaveCount(1);
  await expect(page.locator('button.code-toggle-button')).toHaveText('Show more');
  expect(await codeText(page)).toBe(lines.join('\n'));
  expect(await inlineMaxHeight(page)).toBe('22.5em');
});

test('one pre with newline-separated json lines shows more at the default threshold', async ({ page }) => {
  const lines = numberedLines(21, 'json');
  const source = lines.join('\n');
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-json expandable',
      codeCellHtml: newlinePre(lines),
    }),
  );

  await expect(page.locator('pre')).toHaveCount(1);
  await expect(page.locator('pre')).toHaveClass(/language-json/);
  await expect(page.locator('button.code-toggle-button')).toHaveText('Show more');
  expect(await inlineMaxHeight(page)).toBe('22.5em');
  expect(await codeText(page)).toBe(source);
});

test('line numbering and highlight cells are copied onto the joined pre', async ({ page }) => {
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(numberedLines(21)),
      metaCells: ['4', '1-3, 6', '20'],
    }),
  );

  const pre = page.locator('pre');
  await expect(pre).toHaveCount(1);
  await expect(pre).toHaveAttribute('data-start', '4');
  await expect(pre).toHaveAttribute('data-line', '1-3, 6');
});

test('language-none stays on the pre and still shows more', async ({ page }) => {
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-none expandable',
      codeCellHtml: siblingPres(numberedLines(21)),
      metaCells: ['', '', '20'],
    }),
  );

  await expect(page.locator('pre')).toHaveClass(/language-none/);
  await expect(page.locator('button.code-toggle-button')).toHaveText('Show more');
});

test('an empty first sibling pre stays a leading newline when over threshold', async ({ page }) => {
  const codeCellHtml = `<pre><code></code></pre>${siblingPres(['alpha', 'beta'])}`;
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml,
      metaCells: ['', '', '1'],
    }),
  );

  const text = await codeText(page);
  expect(text.startsWith('\n')).toBe(true);
  expect(text).toBe('\nalpha\nbeta');
  await expect(page.locator('button.code-toggle-button')).toHaveText('Show more');
});

test('expanding one code block leaves the other collapsed', async ({ page }) => {
  const firstLines = numberedLines(21, 'first');
  const secondLines = numberedLines(21, 'second');
  const markup = [
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(firstLines),
      metaCells: ['', '', '20'],
    }),
    codeBlock({
      className: 'code language-html expandable',
      codeCellHtml: siblingPres(secondLines),
      metaCells: ['', '', '20'],
    }),
  ].join('');
  await decorateFixture(page, markup);

  const blocks = page.locator('.code');
  const firstButton = blocks.nth(0).locator('button.code-toggle-button');
  const secondButton = blocks.nth(1).locator('button.code-toggle-button');
  await firstButton.click();

  await expect(firstButton).toHaveText('Show less');
  await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
  await expect(blocks.nth(0).locator('pre')).toHaveAttribute('data-collapsed', 'false');
  await expect(secondButton).toHaveText('Show more');
  await expect(secondButton).toHaveAttribute('aria-expanded', 'false');
  await expect(blocks.nth(1).locator('pre')).toHaveAttribute('data-collapsed', 'true');
  expect(await inlineMaxHeight(blocks.nth(1))).toBe('30em');
});

test('sibling pres without an inner code element are still joined', async ({ page }) => {
  const lines = ['keep <angles> & "quotes"', '  indented'];
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html',
      codeCellHtml: siblingPres(lines, { code: false }),
    }),
  );

  await expect(page.locator('pre')).toHaveCount(1);
  await expect(page.locator('pre code')).toHaveCount(1);
  expect(await codeText(page)).toBe('keep <angles> & "quotes"\n  indented');
});

test('markup characters and two-space indent round-trip through textContent', async ({ page }) => {
  const special = `  <tag> > "quotes" 'apos' { braces } {{mustache}}`;
  await decorateFixture(
    page,
    codeBlock({
      className: 'code language-html',
      codeCellHtml: siblingPres([special, 'after']),
    }),
  );

  expect(await codeText(page)).toBe(`${special}\nafter`);
});
