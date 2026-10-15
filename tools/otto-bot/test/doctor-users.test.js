import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { DEFAULT_CONFIG, readUsersFile } from '../lib/config.js';
import { checkIdentity, doctorOk, formatDoctor, runDoctor } from '../lib/doctor.js';
import { addUser, listUsers, removeUser } from '../lib/users.js';
import { tempDir } from './helpers.js';

const creds = {
  jiraUser: 'otto-master',
  jiraPat: 'jira-pat-123',
  githubPat: 'gh-pat-123',
  copilotPat: `github_pat_${'c'.repeat(30)}`,
  gitName: 'otto-bot',
  gitEmail: 'otto@example.com',
};

function fakeDeps({ jiraOk = true, canPush = true, copilotOut = 'OK', copilotCode = 0 } = {}) {
  const calls = [];
  return {
    calls,
    createJiraClient: ({ token }) => ({
      myself: async () => {
        if (!jiraOk) throw new Error('Jira GET /rest/api/2/myself failed: 401');
        return { name: `user-of-${token}` };
      },
    }),
    createGithubClient: () => ({ getRepo: async () => ({ canPush, tokenExpiry: '2027-01-01 00:00:00 UTC' }) }),
    runCommand: async (cmd, args, opts) => {
      calls.push({ cmd, args, opts });
      return { code: copilotCode, stdout: copilotOut, stderr: '', timedOut: false };
    },
  };
}

test('checkIdentity passes when every credential works', async () => {
  const config = { ...DEFAULT_CONFIG, dataDir: await tempDir() };
  const deps = fakeDeps();
  const result = await checkIdentity({ label: 'master', slug: 'master', creds, config, deps });
  assert.deepEqual(
    result.checks.map((c) => [c.name, c.ok]),
    [
      ['jira', true],
      ['github', true],
      ['copilot', true],
      ['git-identity', true],
    ],
  );
  assert.ok(result.checks[1].detail.includes('2027-01-01'));
  const copilotCall = deps.calls[0];
  assert.equal(copilotCall.opts.env.COPILOT_GITHUB_TOKEN, creds.copilotPat);
  assert.ok(copilotCall.opts.env.COPILOT_HOME.endsWith(path.join('copilot-homes', 'master')));
  assert.ok(copilotCall.args.includes('--no-ask-user'));
});

test('checkIdentity reports each failing credential', async () => {
  const config = { ...DEFAULT_CONFIG, dataDir: await tempDir() };
  const result = await checkIdentity({
    label: 'jdoe',
    slug: 'user-jdoe',
    creds: { ...creds, gitEmail: '' },
    config,
    deps: fakeDeps({ jiraOk: false, canPush: false, copilotCode: 1 }),
  });
  assert.deepEqual(
    result.checks.map((c) => c.ok),
    [false, false, false, false],
  );
  assert.ok(result.checks[0].detail.includes('401'));
});

test('runDoctor checks master and every user, and formatDoctor summarizes', async () => {
  const config = { ...DEFAULT_CONFIG, dataDir: await tempDir() };
  const users = { master: creds, users: { jdoe: creds } };
  const results = await runDoctor({ config, users, deps: fakeDeps() });
  assert.deepEqual(
    results.map((r) => r.label),
    ['master', 'jdoe'],
  );
  assert.equal(doctorOk(results), true);
  assert.ok(formatDoctor(results).includes('✔ master jira'));
});

test('addUser prompts for secrets hidden, validates, and saves; removeUser deletes', async () => {
  const usersPath = path.join(await tempDir(), 'users.json');
  const answers = {
    'Jira username of the master account: ': 'otto-master',
    'Jira PAT: ': 'jira-pat-123',
    'GitHub PAT (repo push + PRs, SSO-authorized): ': 'gh-pat-123',
    'Copilot fine-grained PAT (github_pat_..., Copilot Requests): ': creds.copilotPat,
    'Git author name: ': 'otto-bot',
    'Git author email: ': 'otto@example.com',
  };
  const asked = [];
  const ask = async (question, { hidden = false } = {}) => {
    asked.push([question, hidden]);
    return answers[question];
  };
  await addUser({ usersPath, name: 'master', isMaster: true, ask });
  await addUser({ usersPath, name: 'jdoe', ask });
  assert.ok(asked.filter(([q]) => q.includes('PAT')).every(([, hidden]) => hidden));
  assert.deepEqual(await listUsers({ usersPath }), { master: 'otto-master', users: ['jdoe'] });
  await removeUser({ usersPath, name: 'jdoe' });
  assert.deepEqual((await readUsersFile(usersPath)).users, {});
  await assert.rejects(removeUser({ usersPath, name: 'jdoe' }), /not onboarded/);
});

test('addUser rejects a classic Copilot PAT without saving', async () => {
  const usersPath = path.join(await tempDir(), 'users.json');
  const ask = async (question) => (question.startsWith('Copilot') ? 'ghp_classic' : 'value-123');
  await assert.rejects(addUser({ usersPath, name: 'jdoe', ask }), /fine-grained/);
  assert.deepEqual(await readUsersFile(usersPath), { master: null, users: {} });
});
