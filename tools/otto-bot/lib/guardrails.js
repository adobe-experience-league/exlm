import { runCommand } from './exec.js';
import { SECRET_LINE_PATTERNS } from './redact.js';

export function globToRegExp(glob) {
  let source = '';
  let i = 0;
  while (i < glob.length) {
    const ch = glob[i];
    if (glob.startsWith('**/', i)) {
      source += '(?:.*/)?';
      i += 3;
    } else if (glob.startsWith('**', i)) {
      source += '.*';
      i += 2;
    } else if (ch === '*') {
      source += '[^/]*';
      i += 1;
    } else if (ch === '?') {
      source += '[^/]';
      i += 1;
    } else {
      source += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      i += 1;
    }
  }
  return new RegExp(`^${source}$`);
}

export function checkDiff({ changedFiles, addedLines, protectedPaths, secrets }) {
  const violations = [];
  const matchers = protectedPaths.map((glob) => ({ glob, re: globToRegExp(glob) }));
  changedFiles.forEach((file) => {
    const hit = matchers.find(({ re }) => re.test(file));
    if (hit) violations.push(`changed protected path ${file} (rule ${hit.glob})`);
  });
  const literals = secrets.filter((s) => typeof s === 'string' && s.length >= 8);
  addedLines.forEach((line, index) => {
    if (literals.some((secret) => line.includes(secret))) {
      violations.push(`added line ${index + 1} contains a configured credential`);
    } else if (SECRET_LINE_PATTERNS.some((re) => re.test(line))) {
      violations.push(`added line ${index + 1} looks like a token or private key`);
    }
  });
  return { ok: violations.length === 0, violations };
}

async function gitOut(run, workDir, args) {
  const result = await run('git', args, { cwd: workDir });
  if (result.code !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

export async function collectDiff(workDir, baseRef = 'origin/main', run = runCommand) {
  await gitOut(run, workDir, ['add', '-A']);
  const names = await gitOut(run, workDir, ['diff', '--cached', '--no-renames', '--name-only', baseRef]);
  const patch = await gitOut(run, workDir, ['diff', '--cached', '--no-renames', '-U0', baseRef]);
  return {
    changedFiles: names.split('\n').filter(Boolean),
    addedLines: patch
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1)),
  };
}
