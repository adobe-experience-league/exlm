import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { test } from 'node:test';
import yaml from 'js-yaml';
import { selectTests } from './select-tests.js';
import { MARKER } from './report.js';

const execution = yaml.load(fs.readFileSync(new URL('../../.github/workflows/qa-tests.yaml', import.meta.url), 'utf8'));
const reporting = yaml.load(
  fs.readFileSync(new URL('../../.github/workflows/qa-report.yaml', import.meta.url), 'utf8'),
);
const { script } = reporting.jobs.report.steps.find((step) => step.name === 'Update advisory PR comment').with;
const { constructor: AsyncFunction } = Object.getPrototypeOf(async () => {});

async function reportRun({ stale = false, missing = false, oldAttempt = false, existing = [] } = {}) {
  const writes = [];
  const errors = [];
  const sha = 'a'.repeat(40);
  const plan = selectTests(['blocks/grid-cards/grid-cards.js'], [], ['grid-cards']);
  const files = {
    'plan.json': plan,
    'functional.json': {
      errors: [],
      suites: [{ specs: [{ title: 'Card navigation', tests: [{ status: 'unexpected' }] }] }],
    },
  };
  const context = {
    repo: { owner: 'adobe-experience-league', repo: 'exlm' },
    serverUrl: 'https://github.com',
    payload: {
      repository: { full_name: 'adobe-experience-league/exlm' },
      workflow_run: {
        id: 123,
        run_attempt: 1,
        head_sha: sha,
        conclusion: 'failure',
        pull_requests: [{ number: 42 }],
      },
    },
  };
  const github = {
    rest: {
      actions: { getWorkflowRun: async () => ({ data: { run_attempt: oldAttempt ? 2 : 1 } }) },
      pulls: {
        get: async () => ({
          data: {
            number: 42,
            state: 'open',
            draft: false,
            head: { sha: stale ? 'b'.repeat(40) : sha, repo: { full_name: 'adobe-experience-league/exlm' } },
          },
        }),
      },
      issues: {
        listComments: () => {},
        createComment: async (data) => writes.push({ action: 'create', ...data }),
        updateComment: async (data) => writes.push({ action: 'update', ...data }),
      },
    },
    paginate: async () => existing,
  };
  const fakeFs = {
    existsSync: (filename) => Boolean(files[filename.split('/').pop()]),
    statSync: () => ({ size: 100 }),
    readFileSync: (filename) => JSON.stringify(files[filename.split('/').pop()]),
  };
  const core = { notice: () => {}, error: (error) => errors.push(error), setFailed: (error) => errors.push(error) };
  await new AsyncFunction('require', 'context', 'github', 'core', 'process', script)(
    (name) => ({ 'node:fs': fakeFs, 'node:path': path, 'node:url': { pathToFileURL } })[name],
    context,
    github,
    core,
    { env: { EVIDENCE_OUTCOME: missing ? 'failure' : 'success' } },
  );
  return { writes, errors, sha };
}

test('execution has no PR write permission and evidence has one predictable root', () => {
  assert.deepEqual(execution.permissions, { contents: 'read' });
  assert.match(execution.jobs.test.if, /head\.repo\.full_name == github\.repository/);
  assert.equal(
    execution.jobs.test.steps.find((step) => step.uses === 'actions/checkout@v4').with['persist-credentials'],
    false,
  );
  assert.equal(
    execution.jobs.test.steps.find((step) => step.name === 'Upload QA evidence').with.path,
    'tools/qa/results/',
  );
  assert.deepEqual(reporting.on.workflow_run.workflows, ['QA Pilot Tests']);
  assert.match(
    reporting.jobs.report.steps.find((step) => step.uses === 'actions/checkout@v4').with.ref,
    /default_branch/,
  );
});

test('posts failed test results to the associated PR at the tested SHA', async () => {
  const { writes, errors, sha } = await reportRun();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].issue_number, 42);
  assert.match(writes[0].body, /1 failed/);
  assert.match(writes[0].body, /Card navigation/);
  assert.ok(writes[0].body.includes(sha));
  assert.deepEqual(errors, []);
});

test('updates the bot-owned comment instead of a user-supplied marker', async () => {
  const { writes } = await reportRun({
    existing: [
      { id: 1, user: { login: 'someone' }, body: MARKER },
      { id: 2, user: { login: 'github-actions[bot]' }, body: MARKER },
    ],
  });
  assert.equal(writes[0].action, 'update');
  assert.equal(writes[0].comment_id, 2);
});

test('does not post results for outdated commits or superseded attempts', async () => {
  assert.deepEqual((await reportRun({ stale: true })).writes, []);
  assert.deepEqual((await reportRun({ oldAttempt: true })).writes, []);
});

test('reports missing artifacts as an explicit error, never a pass', async () => {
  const { writes, errors } = await reportRun({ missing: true });
  assert.equal(writes.length, 1);
  assert.match(writes[0].body, /not a pass/);
  assert.ok(errors.length > 0);
});
