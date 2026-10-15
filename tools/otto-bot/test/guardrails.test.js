import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { checkDiff, collectDiff, globToRegExp } from '../lib/guardrails.js';
import { git, tempDir } from './helpers.js';

test('globToRegExp matches path globs', () => {
  assert.ok(globToRegExp('.github/**').test('.github/workflows/a.yaml'));
  assert.ok(globToRegExp('**/.secrets').test('.secrets'));
  assert.ok(globToRegExp('**/.secrets').test('tools/otto-bot/.secrets'));
  assert.ok(globToRegExp('.env*').test('.env.local'));
  assert.ok(!globToRegExp('.env*').test('blocks/.env'));
  assert.ok(globToRegExp('scripts/lib-franklin.js').test('scripts/lib-franklin.js'));
  assert.ok(!globToRegExp('scripts/lib-franklin.js').test('scripts/lib-franklinXjs'));
  assert.ok(!globToRegExp('blocks/*.js').test('blocks/tabs/tabs.js'));
});

test('checkDiff passes a clean diff', () => {
  const result = checkDiff({
    changedFiles: ['blocks/tabs/tabs.js'],
    addedLines: ["  tabindex: i === 0 ? '0' : '-1',"],
    protectedPaths: ['.github/**'],
    secrets: ['supersecretvalue'],
  });
  assert.deepEqual(result, { ok: true, violations: [] });
});

test('checkDiff flags protected paths, literal secrets, and token patterns without echoing them', () => {
  const result = checkDiff({
    changedFiles: ['.github/workflows/x.yaml', 'blocks/a.js'],
    addedLines: ['const a = "supersecretvalue";', `const b = 'github_pat_${'x'.repeat(30)}';`],
    protectedPaths: ['.github/**'],
    secrets: ['supersecretvalue'],
  });
  assert.equal(result.ok, false);
  assert.equal(result.violations.length, 3);
  assert.ok(result.violations[0].includes('.github/workflows/x.yaml'));
  assert.ok(result.violations.every((v) => !v.includes('supersecretvalue') && !v.includes('github_pat_x')));
});

test('collectDiff stages all changes and reports files and added lines vs base', async () => {
  const dir = await tempDir();
  await git(dir, 'init', '-b', 'main');
  await fs.writeFile(path.join(dir, 'a.js'), 'one\n');
  await fs.writeFile(path.join(dir, 'gone.js'), 'bye\n');
  await git(dir, 'add', '-A');
  await git(dir, 'commit', '-m', 'base');
  await git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  await fs.writeFile(path.join(dir, 'a.js'), 'one\ntwo\n');
  await fs.rm(path.join(dir, 'gone.js'));
  await fs.mkdir(path.join(dir, 'blocks'));
  await fs.writeFile(path.join(dir, 'blocks', 'new.js'), 'three\n');
  const diff = await collectDiff(dir);
  assert.deepEqual(diff.changedFiles.sort(), ['a.js', 'blocks/new.js', 'gone.js']);
  assert.deepEqual(diff.addedLines.sort(), ['three', 'two']);
});
