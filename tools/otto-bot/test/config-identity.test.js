import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { allSecrets, DEFAULT_CONFIG, loadConfig, readUsersFile, saveUsers, validateUsers } from '../lib/config.js';
import { identitySlug, resolveIdentity } from '../lib/identity.js';
import { dataPaths, runPaths } from '../lib/paths.js';
import { tempDir } from './helpers.js';

const identity = (over = {}) => ({
  jiraPat: 'jira-token-123',
  githubPat: 'github-token-123',
  copilotPat: `github_pat_${'c'.repeat(30)}`,
  gitName: 'Jane Doe',
  gitEmail: 'jdoe@example.com',
  ...over,
});

const usersFixture = () => ({
  master: { ...identity({ jiraPat: 'master-jira-1' }), jiraUser: 'otto-master', gitName: 'otto-bot' },
  users: { jdoe: identity() },
});

async function writeConfigDir({ usersMode = 0o600, users = usersFixture() } = {}) {
  const dir = await tempDir();
  await fs.writeFile(path.join(dir, 'config.json'), JSON.stringify({ model: 'claude-x' }));
  const usersPath = path.join(dir, 'users.json');
  await fs.writeFile(usersPath, JSON.stringify(users));
  await fs.chmod(usersPath, usersMode);
  return dir;
}

test('loadConfig merges defaults with config.json and loads users', async () => {
  const dir = await writeConfigDir();
  const { config, users, usersPath } = await loadConfig(dir);
  assert.equal(config.model, 'claude-x');
  assert.equal(config.maxRepairs, 3);
  assert.equal(config.copilotTimeoutMinutes, 40);
  assert.equal(config.jql, DEFAULT_CONFIG.jql);
  assert.equal(users.users.jdoe.gitName, 'Jane Doe');
  assert.equal(usersPath, path.join(dir, 'users.json'));
});

test('loadConfig refuses a group-readable users.json', async () => {
  const dir = await writeConfigDir({ usersMode: 0o640 });
  await assert.rejects(loadConfig(dir), /chmod 600/);
});

test('loadConfig rejects invalid users.json', async () => {
  const dir = await writeConfigDir({ users: { master: null, users: {} } });
  await assert.rejects(loadConfig(dir), /master: missing/);
});

test('validateUsers reports missing fields and classic Copilot PATs', () => {
  const problems = validateUsers({
    master: identity({ copilotPat: 'ghp_classic' }),
    users: { bob: { jiraPat: 'x' } },
  });
  assert.ok(problems.includes('master.jiraUser: missing'));
  assert.ok(problems.some((p) => p.startsWith('master.copilotPat: must be a fine-grained PAT')));
  assert.ok(problems.includes('users.bob.githubPat: missing'));
});

test('allSecrets returns every PAT of every identity', () => {
  const secrets = allSecrets(usersFixture());
  assert.ok(secrets.includes('master-jira-1'));
  assert.ok(secrets.includes('jira-token-123'));
  assert.equal(secrets.length, 6);
});

test('saveUsers writes users.json with mode 0600 and readUsersFile reads it back', async () => {
  const usersPath = path.join(await tempDir(), 'nested', 'users.json');
  assert.deepEqual(await readUsersFile(usersPath), { master: null, users: {} });
  await saveUsers(usersPath, usersFixture());
  const stat = await fs.stat(usersPath);
  assert.equal(stat.mode % 0o1000, 0o600);
  assert.equal((await readUsersFile(usersPath)).master.jiraUser, 'otto-master');
});

test('saveUsers tightens an existing parent directory to mode 0700', async () => {
  const dir = path.join(await tempDir(), 'existing');
  await fs.mkdir(dir, { mode: 0o755 });
  await fs.chmod(dir, 0o755);
  await saveUsers(path.join(dir, 'users.json'), usersFixture());
  const stat = await fs.stat(dir);
  // eslint-disable-next-line no-bitwise
  assert.equal(stat.mode & 0o777, 0o700);
});

test('resolveIdentity uses the onboarded assignee', () => {
  const id = resolveIdentity(usersFixture(), 'jdoe');
  assert.equal(id.name, 'jdoe');
  assert.equal(id.isMaster, false);
  assert.equal(id.slug, 'user-jdoe');
  assert.equal(id.creds.gitName, 'Jane Doe');
  assert.equal(id.fallbackReason, null);
});

test('resolveIdentity falls back to master for unknown or missing assignees', () => {
  const unknown = resolveIdentity(usersFixture(), 'stranger');
  assert.equal(unknown.isMaster, true);
  assert.equal(unknown.name, 'otto-master');
  assert.equal(unknown.slug, 'master');
  assert.equal(unknown.fallbackReason, 'assignee stranger is not onboarded');
  assert.equal(resolveIdentity(usersFixture(), null).fallbackReason, 'the ticket is unassigned');
});

test('identitySlug sanitizes names and never collides with master', () => {
  assert.equal(identitySlug('John.Doe@corp', false), 'user-john.doe_corp');
  assert.equal(identitySlug('master', false), 'user-master');
  assert.equal(identitySlug('anything', true), 'master');
});

test('dataPaths and runPaths lay out the data directory', () => {
  const p = runPaths('/data', 'run-1');
  assert.equal(p.mirrorDir, '/data/mirror/exlm.git');
  assert.equal(p.stateDir, '/data/state');
  assert.equal(p.copilotHomesDir, '/data/copilot-homes');
  assert.equal(p.workDir, '/data/work/run-1');
  assert.equal(p.runDir, '/data/runs/run-1');
  assert.equal(dataPaths('/data').runsRoot, '/data/runs');
});
