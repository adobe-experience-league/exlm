import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { ROOT, RESULTS } from './select-tests.js';

const kind = process.argv[2];
if (!['functional', 'visual'].includes(kind)) throw new Error('Choose functional or visual tests.');
const plan = JSON.parse(fs.readFileSync(path.join(RESULTS, 'plan.json'), 'utf8'));
const blocks = plan[kind];
if (!Array.isArray(blocks) || blocks.some((block) => !/^[a-z0-9-]+$/.test(block))) {
  throw new Error('Invalid block selection.');
}
if (!blocks.length) {
  console.log(`No ${kind} tests selected. This is not a coverage pass; see plan.json.`);
} else {
  const config = kind === 'functional' ? 'tools/qa/playwright.config.js' : 'tools/visual-tests/playwright.config.ts';
  const specs = blocks.map((block) =>
    kind === 'functional' ? `tools/qa/tests/${block}.spec.js` : `tools/visual-tests/blocks/${block}/${block}.spec.js`,
  );
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/@playwright/test/cli.js',
      'test',
      `--config=${config}`,
      `--output=tools/qa/results/${kind}-artifacts`,
      '--reporter=json,html',
      ...specs,
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(RESULTS, `${kind}.json`),
        PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(RESULTS, `${kind}-html`),
        PLAYWRIGHT_HTML_OPEN: 'never',
      },
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
