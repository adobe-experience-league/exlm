import fs from 'node:fs/promises';
import path from 'node:path';
import { StageError } from './errors.js';
import { runCommand } from './exec.js';

const ASKPASS = `#!/bin/sh
case "$1" in
  Username*) echo x-access-token ;;
  *) echo "$OTTO_GIT_TOKEN" ;;
esac
`;

export function branchName(key) {
  return key.toLowerCase();
}

export async function writeAskpass(dir) {
  await fs.mkdir(dir, { recursive: true });
  const askpassPath = path.join(dir, 'askpass.sh');
  await fs.writeFile(askpassPath, ASKPASS, { mode: 0o700 });
  await fs.chmod(askpassPath, 0o700);
  return askpassPath;
}

export function gitAuthEnv({ askpassPath, token, baseEnv = process.env }) {
  return { ...baseEnv, GIT_ASKPASS: askpassPath, OTTO_GIT_TOKEN: token, GIT_TERMINAL_PROMPT: '0' };
}

async function mustGit(run, args, opts = {}) {
  const result = await run('git', args, opts);
  if (result.code !== 0) {
    throw new StageError('workspace', `git ${args.find((arg) => !arg.startsWith('-'))} failed`, result.stderr.trim());
  }
  return result.stdout.trim();
}

const exists = (p) =>
  fs.access(p).then(
    () => true,
    () => false,
  );

export async function ensureMirror({ mirrorDir, remoteUrl, env = process.env, run = runCommand }) {
  if (!(await exists(mirrorDir))) {
    await fs.mkdir(path.dirname(mirrorDir), { recursive: true });
    await mustGit(run, ['clone', '--bare', remoteUrl, mirrorDir], { env });
    await mustGit(
      run,
      [`--git-dir=${mirrorDir}`, 'config', 'remote.origin.fetch', '+refs/heads/*:refs/remotes/origin/*'],
      {
        env,
      },
    );
  }
  await mustGit(run, [`--git-dir=${mirrorDir}`, 'remote', 'set-url', 'origin', remoteUrl], { env });
  await mustGit(run, [`--git-dir=${mirrorDir}`, 'fetch', '--prune', 'origin'], { env });
  await mustGit(run, [`--git-dir=${mirrorDir}`, 'worktree', 'prune'], { env });
}

export async function createWorktree({ mirrorDir, workDir, branch, baseBranch, run = runCommand }) {
  await fs.mkdir(path.dirname(workDir), { recursive: true });
  await mustGit(run, [
    `--git-dir=${mirrorDir}`,
    'worktree',
    'add',
    '--force',
    '-B',
    branch,
    workDir,
    `origin/${baseBranch}`,
  ]);
}

export async function prepareWorktree({ workDir, log, run = runCommand }) {
  const install = await run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: workDir,
    timeoutMs: 15 * 60 * 1000,
  });
  if (install.code !== 0) throw new StageError('workspace', 'npm ci failed', install.stderr.slice(-4000));

  const skills = await run('npx', ['--yes', 'skills', 'experimental_install'], {
    cwd: workDir,
    timeoutMs: 5 * 60 * 1000,
  });
  if (skills.code !== 0)
    log.warn('skills install failed; continuing without repo skills', { stderr: skills.stderr.slice(-1000) });

  // Setup tools (e.g. skills install rewriting skills-lock.json) must not leak into the ticket's diff.
  await mustGit(run, ['checkout', '--', '.'], { cwd: workDir });

  const commonDir = path.resolve(workDir, await mustGit(run, ['rev-parse', '--git-common-dir'], { cwd: workDir }));
  const excludePath = path.join(commonDir, 'info', 'exclude');
  await fs.mkdir(path.dirname(excludePath), { recursive: true });
  const current = await fs.readFile(excludePath, 'utf8').catch(() => '');
  if (!current.split('\n').includes('.otto/')) {
    await fs.appendFile(excludePath, `${current && !current.endsWith('\n') ? '\n' : ''}.otto/\n`);
  }
  await fs.mkdir(path.join(workDir, '.otto'), { recursive: true });
}

export async function removeWorktree({ mirrorDir, workDir, run = runCommand }) {
  const result = await run('git', [`--git-dir=${mirrorDir}`, 'worktree', 'remove', '--force', workDir]);
  if (result.code !== 0) {
    await fs.rm(workDir, { recursive: true, force: true });
    await run('git', [`--git-dir=${mirrorDir}`, 'worktree', 'prune']);
  }
}
