import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG } from '../lib/config.js';
import { StageError } from '../lib/errors.js';
import { JiraError } from '../lib/jira.js';
import { LABELS, makeRunId, processTicket, recover, tick } from '../lib/lifecycle.js';
import { readCurrentRun, readHistory, writeCurrentRun } from '../lib/state.js';
import { silentLog, tempDir } from './helpers.js';

const NOW = new Date('2026-10-14T14:05:09.123Z');
const copilotToken = `github_pat_${'s'.repeat(30)}`;

const users = {
  master: {
    jiraUser: 'otto-master',
    jiraPat: 'master-jira-pat',
    githubPat: 'master-gh-pat',
    copilotPat: copilotToken,
    gitName: 'otto-bot',
    gitEmail: 'otto@example.com',
  },
  users: {
    jdoe: {
      jiraPat: 'jdoe-jira-pat',
      githubPat: 'jdoe-gh-pat',
      copilotPat: copilotToken,
      gitName: 'Jane',
      gitEmail: 'j@example.com',
    },
  },
};

const issue = (assignee = 'jdoe') => ({
  key: 'EXLM-1234',
  fields: { summary: 'Fix tabs', description: 'd', assignee: assignee ? { name: assignee } : null, labels: ['otto'] },
});

const outcome = {
  branch: 'exlm-1234',
  prUrl: 'https://github.com/o/r/pull/9',
  reusedPr: false,
  quality: { ok: true, repairs: 1 },
  result: { summary: 'Made the first tab focusable.', openQuestions: ['Copy OK?'] },
};

function fakeJira({ found = null, claimError = null, issueLabels = [LABELS.working] } = {}) {
  const calls = [];
  const createJiraClient = ({ token }) => ({
    searchOne: async (jql) => {
      calls.push({ token, op: 'search', jql });
      return found;
    },
    getIssue: async (key) => {
      calls.push({ token, op: 'getIssue', key });
      return { key, fields: { labels: issueLabels } };
    },
    updateLabels: async (key, change) => {
      calls.push({ token, op: 'labels', key, change });
      if (claimError && change.add?.includes(LABELS.working)) throw claimError;
    },
    addComment: async (key, body) => calls.push({ token, op: 'comment', key, body }),
  });
  return {
    calls,
    createJiraClient,
    labels: () => calls.filter((c) => c.op === 'labels'),
    comments: () => calls.filter((c) => c.op === 'comment'),
  };
}

async function setup() {
  const config = { ...DEFAULT_CONFIG, dataDir: await tempDir() };
  return { config, stateDir: path.join(config.dataDir, 'state') };
}

test('makeRunId is sortable and includes the ticket', () => {
  assert.equal(makeRunId('EXLM-1234', NOW), '20261014-140509-exlm-1234');
});

test('processTicket claims as the assignee, runs, and marks done', async () => {
  const { config, stateDir } = await setup();
  const jira = fakeJira();
  let runArgs;
  const result = await processTicket({
    issue: issue(),
    config,
    users,
    log: silentLog(),
    deps: {
      createJiraClient: jira.createJiraClient,
      now: () => NOW,
      runTicket: async (args) => {
        runArgs = args;
        assert.equal((await readCurrentRun(stateDir)).key, 'EXLM-1234', 'state is written before the run');
        return outcome;
      },
    },
  });
  assert.deepEqual(result, {
    key: 'EXLM-1234',
    runId: '20261014-140509-exlm-1234',
    outcome: 'done',
    prUrl: outcome.prUrl,
  });
  assert.equal(runArgs.identity.name, 'jdoe');
  assert.ok(runArgs.secrets.includes('master-jira-pat'));
  assert.deepEqual(
    jira.labels().map((c) => [c.token, c.change]),
    [
      ['jdoe-jira-pat', { remove: ['otto'], add: ['otto-working'] }],
      ['jdoe-jira-pat', { remove: ['otto-working'], add: ['otto-done'] }],
    ],
  );
  const [pickup, done] = jira.comments().map((c) => c.body);
  assert.ok(pickup.startsWith('Picking this up now.'));
  [pickup, done].forEach((body) => assert.ok(!/otto-bot|🤖|✅/.test(body)));
  assert.ok(done.includes(outcome.prUrl));
  assert.ok(done.includes('https://exlm-1234--exlm--adobe-experience-league.aem.page/'));
  assert.ok(done.includes('Copy OK?'));
  assert.equal(await readCurrentRun(stateDir), null);
  assert.equal((await readHistory(stateDir))[0].outcome, 'done');
  await fs.access(path.join(config.dataDir, 'runs', '20261014-140509-exlm-1234'));
});

test('processTicket falls back to master for unassigned tickets', async () => {
  const { config } = await setup();
  const jira = fakeJira();
  await processTicket({
    issue: issue(null),
    config,
    users,
    log: silentLog(),
    deps: { createJiraClient: jira.createJiraClient, now: () => NOW, runTicket: async () => outcome },
  });
  assert.ok(jira.labels().every((c) => c.token === 'master-jira-pat'));
  assert.ok(jira.comments()[0].body.startsWith('Picking this up now.'));
});

test('stage failures mark the ticket failed with a redacted reason', async () => {
  const { config, stateDir } = await setup();
  const jira = fakeJira();
  const result = await processTicket({
    issue: issue(),
    config,
    users,
    log: silentLog(),
    deps: {
      createJiraClient: jira.createJiraClient,
      now: () => NOW,
      runTicket: async () => {
        throw new StageError('copilot', 'Copilot CLI exited with code 1', `bad token ${copilotToken}`);
      },
    },
  });
  assert.equal(result.outcome, 'failed');
  assert.equal(result.stage, 'copilot');
  assert.deepEqual(jira.labels()[1].change, { remove: ['otto-working'], add: ['otto-failed'] });
  const failed = jira.comments()[1].body;
  assert.ok(failed.includes('*copilot*'));
  assert.ok(failed.includes('[REDACTED]'));
  assert.ok(!failed.includes(copilotToken));
  assert.equal(await readCurrentRun(stateDir), null);
});

test('unexpected errors are reported as stage internal', async () => {
  const { config } = await setup();
  const jira = fakeJira();
  const result = await processTicket({
    issue: issue(),
    config,
    users,
    log: silentLog(),
    deps: {
      createJiraClient: jira.createJiraClient,
      now: () => NOW,
      runTicket: async () => {
        throw new TypeError('boom');
      },
    },
  });
  assert.equal(result.stage, 'internal');
  assert.ok(jira.comments()[1].body.includes('boom'));
});

test('a rejected claim with the assignee token is failed by master without running', async () => {
  const { config } = await setup();
  const jira = fakeJira({ claimError: new JiraError(401, 'unauthorized') });
  let ran = false;
  const result = await processTicket({
    issue: issue(),
    config,
    users,
    log: silentLog(),
    deps: {
      createJiraClient: jira.createJiraClient,
      now: () => NOW,
      runTicket: async () => {
        ran = true;
      },
    },
  });
  assert.equal(ran, false);
  assert.deepEqual(result, {
    key: 'EXLM-1234',
    runId: '20261014-140509-exlm-1234',
    outcome: 'failed',
    stage: 'claim',
  });
  const masterLabels = jira.labels().filter((c) => c.token === 'master-jira-pat');
  assert.deepEqual(masterLabels[0].change, { remove: ['otto'], add: ['otto-failed'] });
  assert.ok(jira.comments()[0].body.includes("couldn't pick this up as jdoe"));
});

test('a network error during claim leaves the ticket for the next tick', async () => {
  const { config, stateDir } = await setup();
  const jira = fakeJira({ claimError: new TypeError('fetch failed') });
  await assert.rejects(
    processTicket({
      issue: issue(),
      config,
      users,
      log: silentLog(),
      deps: { createJiraClient: jira.createJiraClient, now: () => NOW, runTicket: async () => outcome },
    }),
    /fetch failed/,
  );
  assert.equal(jira.calls.length, 1);
  assert.deepEqual(await readCurrentRun(stateDir), {
    key: 'EXLM-1234',
    runId: '20261014-140509-exlm-1234',
    identity: 'jdoe',
    startedAt: NOW.toISOString(),
  });
});

test('recover marks an interrupted run failed using master', async () => {
  const { config, stateDir } = await setup();
  const jira = fakeJira();
  assert.equal(
    await recover({ config, users, log: silentLog(), deps: { createJiraClient: jira.createJiraClient } }),
    false,
  );
  const secretRunId = 'r-master-jira-pat';
  await writeCurrentRun(stateDir, { key: 'EXLM-1234', runId: secretRunId, identity: 'jdoe' });
  assert.equal(
    await recover({ config, users, log: silentLog(), deps: { createJiraClient: jira.createJiraClient } }),
    true,
  );
  assert.deepEqual(jira.labels()[0], {
    token: 'master-jira-pat',
    op: 'labels',
    key: 'EXLM-1234',
    change: { remove: ['otto-working'], add: ['otto-failed'] },
  });
  assert.ok(jira.comments()[0].body.includes('interrupted'));
  assert.ok(jira.comments()[0].body.includes('[REDACTED]'));
  assert.ok(!jira.comments()[0].body.includes(secretRunId));
  assert.ok(!jira.comments()[0].body.includes('master-jira-pat'));
  assert.equal(await readCurrentRun(stateDir), null);
  assert.equal((await readHistory(stateDir))[0].stage, 'interrupted');
});

test('recover clears state without failing Jira when the claim did not happen', async () => {
  const { config, stateDir } = await setup();
  const jira = fakeJira({ issueLabels: [LABELS.trigger] });
  await writeCurrentRun(stateDir, { key: 'EXLM-1234', runId: 'r1', identity: 'jdoe' });
  assert.equal(
    await recover({ config, users, log: silentLog(), deps: { createJiraClient: jira.createJiraClient } }),
    false,
  );
  assert.equal(jira.labels().length, 0);
  assert.equal(await readCurrentRun(stateDir), null);
});

test('recover clears malformed current.json without blocking future ticks', async () => {
  const { config, stateDir } = await setup();
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(path.join(stateDir, 'current.json'), '{nope');
  const log = silentLog();
  assert.equal(await recover({ config, users, log, deps: { createJiraClient: fakeJira().createJiraClient } }), false);
  assert.equal(await readCurrentRun(stateDir), null);
  assert.ok(log.lines.some(([, msg]) => msg === 'clearing malformed recovery state'));
});

test('tick is idle when nothing is labeled and uses the configured JQL', async () => {
  const { config } = await setup();
  const jira = fakeJira();
  const result = await tick({ config, users, log: silentLog(), deps: { createJiraClient: jira.createJiraClient } });
  assert.deepEqual(result, { status: 'idle' });
  assert.deepEqual(jira.calls, [{ token: 'master-jira-pat', op: 'search', jql: config.jql }]);
});

test('tick skips while another live process holds the lock', async () => {
  const { config, stateDir } = await setup();
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(path.join(stateDir, 'lock'), String(process.pid));
  const jira = fakeJira();
  const result = await tick({ config, users, log: silentLog(), deps: { createJiraClient: jira.createJiraClient } });
  assert.deepEqual(result, { status: 'locked' });
  assert.equal(jira.calls.length, 0);
});

test('tick recovers, processes one ticket, and releases the lock', async () => {
  const { config, stateDir } = await setup();
  await writeCurrentRun(stateDir, { key: 'EXLM-1', runId: 'old', identity: 'jdoe' });
  const jira = fakeJira({ found: issue() });
  const result = await tick({
    config,
    users,
    log: silentLog(),
    deps: { createJiraClient: jira.createJiraClient, now: () => NOW, runTicket: async () => outcome },
  });
  assert.deepEqual(result, { status: 'done', key: 'EXLM-1234', runId: '20261014-140509-exlm-1234' });
  assert.equal(jira.labels()[0].key, 'EXLM-1', 'recovery ran first');
  await assert.rejects(fs.access(path.join(stateDir, 'lock')));
});
