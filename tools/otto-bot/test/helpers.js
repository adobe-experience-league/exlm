import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCommand } from '../lib/exec.js';

export function tempDir(prefix = 'otto-test-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

export function fakeFetch(handler) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || 'GET',
      headers: init.headers || {},
      body: init.body ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    return handler(call);
  };
  return { impl, calls };
}

export async function git(cwd, ...args) {
  const result = await runCommand(
    'git',
    ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'init.defaultBranch=main', ...args],
    { cwd },
  );
  if (result.code !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}

// Bare repos need --git-dir: newer git (safe.bareRepository=explicit) refuses implicit bare discovery.
export function gitBare(gitDir, ...args) {
  return git(path.dirname(gitDir), `--git-dir=${gitDir}`, ...args);
}

export async function makeRemote() {
  const dir = await tempDir('otto-remote-');
  const src = path.join(dir, 'src');
  const bare = path.join(dir, 'remote.git');
  await fs.mkdir(src);
  await git(src, 'init', '-b', 'main');
  await fs.writeFile(path.join(src, 'README.md'), '# test\n');
  await git(src, 'add', '-A');
  await git(src, 'commit', '-m', 'init');
  await git(dir, 'clone', '--bare', src, bare);
  return { dir, bare };
}

export function silentLog() {
  const lines = [];
  return {
    lines,
    info: (msg, data) => lines.push(['info', msg, data]),
    warn: (msg, data) => lines.push(['warn', msg, data]),
    error: (msg, data) => lines.push(['error', msg, data]),
    attachFile: () => {},
  };
}
