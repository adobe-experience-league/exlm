import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const RESULTS = path.join(ROOT, 'tools/qa/results');

export function selectTests(changedFiles, visualBlocks, functionalBlocks) {
  const changedBlocks = [...new Set(changedFiles.map((file) => file.match(/^blocks\/([^/]+)\//)?.[1]).filter(Boolean))];
  const shared = changedFiles.some(
    (file) =>
      /^(scripts|styles|icons|fonts|solutions|tools\/qa|tools\/visual-tests)\//.test(file) ||
      /^(head\.html|fstab\.yaml|paths\.json|package(-lock)?\.json)$/.test(file) ||
      file.startsWith('.github/workflows/qa-'),
  );
  const blocks = [...new Set(shared ? [...visualBlocks, ...functionalBlocks, ...changedBlocks] : changedBlocks)].sort();
  const visual = blocks.filter((block) => visualBlocks.includes(block));
  const functional = blocks.filter((block) => functionalBlocks.includes(block));
  return {
    changedFiles,
    blocks,
    reason: shared ? 'Shared code or QA tooling changed: expanding regression coverage.' : 'Changed blocks only.',
    visual,
    functional,
    gaps: blocks.filter((block) => !visual.includes(block) && !functional.includes(block)),
    functionalGaps: blocks.filter((block) => !functional.includes(block)),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [base, head] = process.argv.slice(2);
  if (![base, head].every((sha) => /^[a-f0-9]{40}$/.test(sha || ''))) {
    throw new Error('Provide full base and head commit SHAs.');
  }
  const changedFiles = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${base}...${head}`, '--'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
  const visualBlocks = fs
    .readdirSync(path.join(ROOT, 'tools/visual-tests/blocks'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((block) => fs.existsSync(path.join(ROOT, `tools/visual-tests/blocks/${block}/${block}.spec.js`)));
  const functionalBlocks = fs
    .readdirSync(path.join(ROOT, 'tools/qa/tests'))
    .filter((file) => file.endsWith('.spec.js'))
    .map((file) => file.slice(0, -'.spec.js'.length));
  fs.mkdirSync(RESULTS, { recursive: true });
  const plan = selectTests(changedFiles, visualBlocks, functionalBlocks);
  fs.writeFileSync(path.join(RESULTS, 'plan.json'), JSON.stringify(plan, null, 2));
  console.log(JSON.stringify(plan, null, 2));
}
