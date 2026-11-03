import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG } from '../lib/config.js';
import { runCopilot } from '../lib/copilot.js';
import { commitAndPush, createGithubClient, pushBranch } from '../lib/github.js';
import { createJiraClient } from '../lib/jira.js';
import { processTicket, recover } from '../lib/lifecycle.js';
import { buildNotification } from '../lib/notify.js';
import { readCurrentRun, readHistory, writeCurrentRun } from '../lib/state.js';
import { RESULT_FILE } from '../lib/task.js';
import { jsonResponse, silentLog, tempDir } from './helpers.js';

async function fixture({ lateJira = false, pickupDenied = false, githubDeniedAt = 'push', masterDenied = null } = {}) {
  const config = { ...DEFAULT_CONFIG, dataDir: await tempDir() };
  const stateDir = path.join(config.dataDir, 'state');
  const account = (name) => ({
    jiraPat: `${name}-jira-secret`,
    githubPat: `${name}-github-secret`,
    copilotPat: `github_pat_${name}_copilot_secret`,
    gitName: name,
    gitEmail: `${name}@example.com`,
  });
  const users = { master: { ...account('master'), jiraUser: 'otto-master' }, users: { jane: account('jane') } };
  const comments = [];
  const labels = new Set(['otto']);
  const notifications = [];
  const pushes = [];
  const sessions = [];
  const commits = [];
  const prs = [];
  const log = silentLog();
  const jiraFactory = ({ token }) =>
    createJiraClient({
      baseUrl: config.jiraBaseUrl,
      token,
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(init.body);
        const changes = body.update?.labels;
        const deny =
          token === users.master.jiraPat
            ? masterDenied === 'jira'
            : !lateJira ||
              changes?.some((change) => change.add === 'otto-done') ||
              (pickupDenied && body.body?.startsWith('Picking this up'));
        if (deny) return jsonResponse({ error: `denied ${token}` }, 403);
        if (body.body) comments.push(body.body);
        changes?.forEach((change) => {
          if (change.remove) labels.delete(change.remove);
          if (change.add) labels.add(change.add);
        });
        return new Response(null, { status: 204 });
      },
    });
  const gitRun = async (_cmd, args, { env, input } = {}) => {
    if (args.includes('commit')) commits.push({ input, args });
    if (args.includes('push')) {
      pushes.push(env.OTTO_GIT_TOKEN);
      if ((githubDeniedAt === 'push' && env.OTTO_GIT_TOKEN !== users.master.githubPat) || masterDenied === 'github') {
        return { code: 128, stdout: '', stderr: 'remote: Permission to o/r.git denied to jane.' };
      }
    }
    return { code: 0, stdout: 'abc123\n', stderr: '' };
  };
  const deps = {
    createJiraClient: jiraFactory,
    notify: async (event, data) => notifications.push(buildNotification(event, data, config)),
    steps: {
      writeAskpass: async () => '/test/askpass',
      ensureMirror: async () => {},
      createWorktree: async ({ workDir }) => fs.mkdir(workDir, { recursive: true }),
      prepareWorktree: async ({ workDir }) => fs.mkdir(path.join(workDir, '.otto')),
      removeWorktree: async () => {},
      collectDiff: async () => ({ changedFiles: ['blocks/tabs/tabs.js'], addedLines: ['safe();'] }),
      runQuality: async () => ({ ok: true, output: '' }),
      runCopilot: (args) =>
        runCopilot({
          ...args,
          run: async (_cmd, _argv, options) => {
            sessions.push(options.env);
            if (args.token !== users.master.copilotPat || masterDenied === 'copilot')
              return { code: 1, signal: null, timedOut: false, stdout: '', stderr: 'Error: Authentication failed' };
            await fs.writeFile(
              path.join(args.workDir, RESULT_FILE),
              JSON.stringify({
                status: 'done',
                summary: 'Fixed tabs.',
                testUrls: ['/en/docs'],
                openQuestions: [],
              }),
            );
            return { code: 0, signal: null, timedOut: false, stdout: 'done', stderr: '' };
          },
        }),
      commitAndPush: (args) => commitAndPush({ ...args, run: gitRun }),
      pushBranch: (args) => pushBranch({ ...args, run: gitRun }),
      createGithubClient: ({ token, ...args }) =>
        createGithubClient({
          ...args,
          token,
          fetchImpl: async (_url, init) => {
            if (init.method === 'GET') return jsonResponse([]);
            if (
              token !== users.master.githubPat &&
              (githubDeniedAt === 'pr' || (githubDeniedAt === 'audit' && init.method === 'PATCH'))
            )
              return jsonResponse({ message: 'Resource not accessible by personal access token' }, 403);
            const body = JSON.parse(init.body);
            prs.push(body);
            return jsonResponse({ number: 9, html_url: 'https://github.com/o/r/pull/9', ...body }, 201);
          },
        }),
    },
  };
  const execute = () =>
    processTicket({
      issue: { key: 'EXLM-1234', fields: { summary: 'Fix tabs', assignee: { name: 'jane' }, labels: ['otto'] } },
      config,
      users,
      log,
      deps,
    });
  return { execute, config, users, stateDir, comments, labels, notifications, pushes, sessions, commits, prs, log };
}

for (const options of [
  {},
  { lateJira: true },
  { lateJira: true, githubDeniedAt: 'pr' },
  { lateJira: true, githubDeniedAt: 'audit' },
]) {
  test(`fallback completes and audits all services (${JSON.stringify(options)})`, async () => {
    const f = await fixture(options);
    const result = await f.execute();
    assert.equal(result.outcome, 'done');
    assert.deepEqual(new Set(result.warnings.map((w) => w.service)), new Set(['jira', 'github', 'copilot']));
    assert.deepEqual([...f.labels], ['otto-done']);
    assert.equal(f.commits.length, 1);
    assert.ok(f.commits[0].args.includes('user.name=jane'));
    assert.deepEqual(
      f.pushes,
      options.githubDeniedAt ? ['jane-github-secret'] : ['jane-github-secret', 'master-github-secret'],
    );
    assert.ok(f.sessions[0].COPILOT_HOME.endsWith('user-jane'));
    assert.ok(f.sessions[1].COPILOT_HOME.endsWith('master'));
    assert.equal(f.sessions[1].OTTO_GIT_TOKEN, undefined);
    const history = (await readHistory(f.stateDir))[0];
    assert.deepEqual(history.warnings, result.warnings);
    assert.equal(await readCurrentRun(f.stateDir), null);
    for (const service of ['jira', 'github', 'copilot']) {
      assert.ok(f.comments.some((body) => body.includes(`${service}: jane -> master account otto-master`)));
      assert.ok(f.prs.at(-1).body.includes(`${service}: jane -> master account otto-master`));
      assert.ok(f.notifications.at(-1).message.includes(`${service}: jane -> master account otto-master`));
    }
    assert.equal(f.notifications.at(-1).owner, 'jane@example.com');
    const audit = JSON.stringify({
      history,
      comments: f.comments,
      prs: f.prs,
      notifications: f.notifications,
      log: f.log.lines,
    });
    for (const creds of [f.users.master, f.users.users.jane]) {
      for (const key of ['jiraPat', 'githubPat', 'copilotPat']) assert.ok(!audit.includes(creds[key]));
    }
  });
}

for (const service of ['jira', 'github', 'copilot']) {
  test(`master ${service} denial is a real failure with persisted fallback warnings`, async () => {
    const f = await fixture({ masterDenied: service });
    const result = await f.execute();
    assert.equal(result.outcome, 'failed');
    assert.ok(result.warnings.some((w) => w.service === service));
    assert.equal((await readHistory(f.stateDir))[0].outcome, 'failed');
    assert.ok(!f.notifications.some((n) => n.status === '✅ Draft PR ready'));
    assert.equal(f.prs.length, 0);
    if (service === 'jira') assert.equal(f.sessions.length, 0);
  });
}

for (const pickupDenied of [false, true]) {
  test(`master Jira denial after claiming fails visibly (pickup=${pickupDenied})`, async () => {
    const f = await fixture({ masterDenied: 'jira', lateJira: true, pickupDenied });
    const result = await f.execute();
    assert.equal(result.outcome, 'failed');
    assert.equal((await readHistory(f.stateDir))[0].outcome, 'failed');
    assert.ok(result.warnings.some((w) => w.service === 'jira'));
    assert.ok(!f.notifications.some((n) => n.status === '✅ Draft PR ready'));
    if (pickupDenied) assert.equal(f.sessions.length, 0);
    assert.ok(f.log.lines.some(([level]) => level === 'error'));
  });
}

test('recovery carries credential warnings into interruption reporting', async () => {
  const f = await fixture();
  const warnings = [{ service: 'copilot', requestedUser: 'jane', effectiveUser: 'otto-master', reason: 'denied' }];
  await writeCurrentRun(f.stateDir, { key: 'EXLM-1234', runId: 'old', identity: 'jane', warnings });
  const comments = [];
  await recover({
    config: f.config,
    users: f.users,
    log: f.log,
    deps: {
      createJiraClient: () => ({
        getIssue: async () => ({ fields: { labels: ['otto-working'] } }),
        addComment: async (_key, body) => comments.push(body),
        updateLabels: async () => {},
      }),
      notify: async (event, data) => f.notifications.push(buildNotification(event, data, f.config)),
    },
  });
  assert.ok(comments[0].includes('copilot: jane -> master account otto-master'));
  assert.ok(f.notifications[0].message.includes('copilot'));
  assert.deepEqual((await readHistory(f.stateDir))[0].warnings, warnings);
});
