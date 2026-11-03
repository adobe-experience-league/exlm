import test from 'node:test';
import assert from 'node:assert/strict';
import { createCredentialContext } from '../lib/credentials.js';
import { StageError } from '../lib/errors.js';
import { GithubError } from '../lib/github.js';
import { JiraError } from '../lib/jira.js';
import { silentLog } from './helpers.js';

const identity = {
  name: 'jdoe',
  slug: 'user-jdoe',
  isMaster: false,
  creds: { jiraPat: 'user-jira', githubPat: 'user-github', copilotPat: 'user-copilot' },
};
const master = { jiraUser: 'otto-master', jiraPat: 'master-jira', githubPat: 'master-github' };

test('permission fallback switches only the affected service and records a safe audit event', async () => {
  const saved = [];
  const log = silentLog();
  const credentials = createCredentialContext({ identity, master, log, onFallback: async (w) => saved.push(w) });
  const tokens = [];
  const value = await credentials.run('jira', async (account) => {
    tokens.push(account.creds.jiraPat);
    if (!account.isMaster) throw new JiraError(403, 'denied user-jira');
    return 'done';
  });
  assert.equal(value, 'done');
  assert.deepEqual(tokens, ['user-jira', 'master-jira']);
  assert.equal(credentials.account('github').creds.githubPat, 'user-github');
  assert.deepEqual(credentials.warnings, [
    { service: 'jira', requestedUser: 'jdoe', effectiveUser: 'otto-master', reason: 'HTTP 403 permission denied' },
  ]);
  assert.equal(saved.length, 1);
  assert.ok(log.lines.some(([level]) => level === 'warn'));
  assert.ok(!JSON.stringify(saved).includes('user-jira'));
  await credentials.run('jira', async (account) => assert.equal(account.isMaster, true));
  assert.equal(credentials.warnings.length, 1);
});

test('fallback never loops when master is denied and never retries unrelated errors', async () => {
  for (const error of [
    new Error('fetch failed'),
    new GithubError(404, 'not found'),
    new GithubError(429, 'rate limit'),
    new GithubError(403, 'API rate limit exceeded'),
    new StageError('guardrails', 'permission denied'),
    new StageError('copilot', 'timed out'),
  ]) {
    const credentials = createCredentialContext({ identity, master, log: silentLog() });
    let attempts = 0;
    await assert.rejects(
      credentials.run('github', async () => {
        attempts += 1;
        throw error;
      }),
      (err) => err === error,
    );
    assert.equal(attempts, 1);
    assert.equal(credentials.warnings.length, 0);
  }
  const credentials = createCredentialContext({ identity, master, log: silentLog() });
  let attempts = 0;
  await assert.rejects(
    credentials.run('github', async () => {
      attempts += 1;
      throw new GithubError(401, 'Bad credentials');
    }),
    /Bad credentials/,
  );
  assert.equal(attempts, 2);
  await assert.rejects(
    credentials.run('github', async () => {
      attempts += 1;
      throw new GithubError(401, 'Bad credentials');
    }),
    /Bad credentials/,
  );
  assert.equal(attempts, 3);
});

test('an audit persistence failure stops before using elevated credentials', async () => {
  const credentials = createCredentialContext({
    identity,
    master,
    log: silentLog(),
    onFallback: async () => {
      throw new Error('disk full');
    },
  });
  let attempts = 0;
  await assert.rejects(
    credentials.run('jira', async () => {
      attempts += 1;
      throw new JiraError(403, 'denied');
    }),
    (error) => error.stage === 'reporting' && /persist/.test(error.message),
  );
  assert.equal(attempts, 1);
  assert.equal(credentials.account('jira').isMaster, false);
});
