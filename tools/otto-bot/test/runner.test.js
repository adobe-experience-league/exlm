import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG } from '../lib/config.js';
import { StageError } from '../lib/errors.js';
import { previewUrl, runTicket } from '../lib/runner.js';
import { REPAIR_FILE, RESULT_FILE, TASK_FILE } from '../lib/task.js';
import { silentLog, tempDir } from './helpers.js';

const ticket = {
  key: 'EXLM-1234',
  summary: 'Fix tabs focus',
  description: 'First tab skipped.',
  assignee: 'jdoe',
  labels: ['otto'],
  type: 'Bug',
  components: [],
};
const identity = {
  name: 'jdoe',
  slug: 'user-jdoe',
  isMaster: false,
  fallbackReason: null,
  creds: { githubPat: 'gh-push-123456', copilotPat: 'github_pat_copilot', gitName: 'Jane', gitEmail: 'j@x.com' },
};
const goodResult = { status: 'done', summary: 'Made first tab focusable.', testUrls: ['/en/docs'], openQuestions: [] };

function fakeSteps({
  result = goodResult,
  diff,
  diffs = null,
  quality = [true],
  existingPr = null,
  writeResult = true,
  writeAskpassError = null,
} = {}) {
  const calls = [];
  const githubClientArgs = [];
  const qualityQueue = [...quality];
  const diffQueue = diffs ? [...diffs] : null;
  const steps = {
    writeAskpass: async (dir) => {
      if (writeAskpassError) throw writeAskpassError;
      return path.join(dir, 'askpass.sh');
    },
    ensureMirror: async (args) => calls.push(['ensureMirror', args]),
    createWorktree: async (args) => {
      calls.push(['createWorktree', args]);
      await fs.mkdir(args.workDir, { recursive: true });
    },
    prepareWorktree: async ({ workDir }) => {
      calls.push(['prepareWorktree']);
      await fs.mkdir(path.join(workDir, '.otto'), { recursive: true });
    },
    removeWorktree: async (args) => calls.push(['removeWorktree', args]),
    runCopilot: async (args) => {
      calls.push(['runCopilot', args]);
      if (writeResult) await fs.writeFile(path.join(args.workDir, RESULT_FILE), JSON.stringify(result));
    },
    collectDiff: async () => {
      calls.push(['collectDiff']);
      return diffQueue?.shift() || diff || { changedFiles: ['blocks/tabs/tabs.js'], addedLines: ["tabindex: '0',"] };
    },
    runQuality: async () => {
      const ok = qualityQueue.length > 1 ? qualityQueue.shift() : qualityQueue[0];
      calls.push(['runQuality', ok]);
      return { ok, output: ok ? '' : 'lint error' };
    },
    commitAndPush: async (args) => {
      calls.push(['commitAndPush', args]);
      return 'abc123';
    },
    createGithubClient: (args) => {
      githubClientArgs.push(args);
      return {
        findOpenPr: async () => existingPr,
        createDraftPr: async (prArgs) => {
          calls.push(['createDraftPr', prArgs]);
          return { number: 9, html_url: 'https://github.com/o/r/pull/9' };
        },
        updatePr: async (number, prArgs) => {
          calls.push(['updatePr', number, prArgs]);
          return { ...existingPr, ...prArgs };
        },
        commentOnPr: async (number, body) => calls.push(['commentOnPr', number, body]),
        convertPullRequestToDraft: async (pr) => calls.push(['convertPullRequestToDraft', pr]),
      };
    },
  };
  return { steps, calls, githubClientArgs, names: () => calls.map(([n]) => n) };
}

async function run(fake, extra = {}) {
  const dataDir = await tempDir();
  const config = { ...DEFAULT_CONFIG, dataDir };
  return runTicket({
    ticket,
    identity,
    config,
    runId: 'run-1',
    log: silentLog(),
    secrets: ['gh-push-123456'],
    deps: { steps: fake.steps },
    ...extra,
  });
}

test('previewUrl builds the EDS branch preview URL', () => {
  assert.equal(
    previewUrl('exlm-1234', { owner: 'adobe-experience-league', repo: 'exlm' }),
    'https://exlm-1234--exlm--adobe-experience-league.aem.page/',
  );
});

test('blocked or invalid repair results fail instead of publishing stale success', async () => {
  const blocked = fakeSteps({ quality: [false, true] });
  let copilotRuns = 0;
  blocked.steps.runCopilot = async (args) => {
    blocked.calls.push(['runCopilot', args]);
    copilotRuns += 1;
    const result =
      copilotRuns === 1 ? goodResult : { status: 'blocked', summary: 'Need info', openQuestions: ['What?'] };
    await fs.writeFile(path.join(args.workDir, RESULT_FILE), JSON.stringify(result));
  };
  await assert.rejects(run(blocked), (err) => err.stage === 'blocked' && /What\?/.test(err.details));
  assert.ok(!blocked.names().includes('commitAndPush'));

  const invalid = fakeSteps({ quality: [false, true] });
  copilotRuns = 0;
  invalid.steps.runCopilot = async (args) => {
    invalid.calls.push(['runCopilot', args]);
    copilotRuns += 1;
    await fs.writeFile(path.join(args.workDir, RESULT_FILE), copilotRuns === 1 ? JSON.stringify(goodResult) : '{nope');
  };
  await assert.rejects(run(invalid), (err) => err.stage === 'copilot' && /valid JSON/.test(err.message));
  assert.ok(!invalid.names().includes('commitAndPush'));
});

test('final staged diff is guarded after quality and committed without restaging', async () => {
  const fake = fakeSteps({
    diffs: [
      { changedFiles: ['blocks/tabs/tabs.js'], addedLines: ['safe();'] },
      { changedFiles: ['fstab.yaml'], addedLines: ['mount: changed'] },
    ],
  });
  await assert.rejects(run(fake), (err) => err.stage === 'guardrails' && /fstab\.yaml/.test(err.details));
  assert.ok(!fake.names().includes('commitAndPush'));
});

test('happy path writes the task, runs Copilot once, pushes, and opens a draft PR', async () => {
  const fake = fakeSteps();
  const out = await run(fake);
  assert.equal(out.prUrl, 'https://github.com/o/r/pull/9');
  assert.equal(out.sha, 'abc123');
  assert.equal(out.reusedPr, false);
  assert.deepEqual(fake.names(), [
    'ensureMirror',
    'createWorktree',
    'prepareWorktree',
    'runCopilot',
    'collectDiff',
    'runQuality',
    'collectDiff',
    'commitAndPush',
    'createDraftPr',
    'removeWorktree',
  ]);
  const [, wt] = fake.calls.find(([n]) => n === 'createWorktree');
  assert.equal(wt.branch, 'exlm-1234');
  const copilot = fake.calls.find(([n]) => n === 'runCopilot')[1];
  assert.equal(copilot.token, 'github_pat_copilot');
  assert.equal(copilot.timeoutMs, 40 * 60 * 1000);
  assert.ok(copilot.copilotHome.endsWith(path.join('copilot-homes', 'user-jdoe')));
  assert.equal(copilot.redact('token gh-push-123456'), 'token [REDACTED]');
  const task = await fs.readFile(path.join(out.workDir, TASK_FILE), 'utf8');
  assert.ok(task.includes('EXLM-1234: Fix tabs focus'));
  const push = fake.calls.find(([n]) => n === 'commitAndPush')[1];
  assert.equal(push.gitName, 'Jane');
  assert.equal(push.env.OTTO_GIT_TOKEN, 'gh-push-123456');
  const ghArgs = fake.githubClientArgs[0];
  assert.equal(typeof ghArgs.redact, 'function');
  assert.equal(ghArgs.redact('token gh-push-123456'), 'token [REDACTED]');
  const pr = fake.calls.find(([n]) => n === 'createDraftPr')[1];
  assert.equal(pr.title, 'EXLM-1234: Fix tabs focus');
  assert.equal(pr.head, 'exlm-1234');
});

test('repairs with Copilot until quality passes', async () => {
  const fake = fakeSteps({ quality: [false, false, true] });
  const out = await run(fake);
  assert.equal(out.quality.ok, true);
  assert.equal(out.quality.repairs, 2);
  const copilotCalls = fake.calls.filter(([n]) => n === 'runCopilot').map(([, a]) => a);
  assert.equal(copilotCalls.length, 3);
  assert.equal(copilotCalls[1].timeoutMs, 10 * 60 * 1000);
  assert.equal(copilotCalls[2].sessionName, 'session-3');
  assert.ok((await fs.readFile(path.join(out.workDir, REPAIR_FILE), 'utf8')).includes('attempt 2 of 3'));
});

test('opens a warning PR when quality still fails after 3 repairs', async () => {
  const fake = fakeSteps({ quality: [false] });
  const out = await run(fake);
  assert.equal(out.quality.ok, false);
  assert.equal(out.quality.repairs, 3);
  assert.equal(fake.calls.filter(([n]) => n === 'runCopilot').length, 4);
  const pr = fake.calls.find(([n]) => n === 'createDraftPr')[1];
  assert.ok(pr.title.startsWith('[quality failing]'));
  assert.ok(pr.body.startsWith('## ⚠️ Quality failing'));
});

test('reuses an existing open PR and comments on it', async () => {
  const fake = fakeSteps({ existingPr: { number: 5, html_url: 'https://github.com/o/r/pull/5' } });
  const out = await run(fake);
  assert.equal(out.reusedPr, true);
  assert.equal(out.prUrl, 'https://github.com/o/r/pull/5');
  assert.ok(!fake.names().includes('createDraftPr'));
  assert.ok(fake.names().includes('updatePr'));
  const comment = fake.calls.find(([n]) => n === 'commentOnPr');
  assert.equal(comment[1], 5);
  assert.ok(comment[2].includes('run-1'));
});

test('converts a reused ready PR back to draft before updating it', async () => {
  const existingPr = { number: 5, node_id: 'PR_node', draft: false, html_url: 'https://github.com/o/r/pull/5' };
  const fake = fakeSteps({ existingPr });
  const out = await run(fake);
  assert.equal(out.reusedPr, true);
  const names = fake.names();
  assert.ok(names.indexOf('convertPullRequestToDraft') < names.indexOf('updatePr'));
  assert.equal(fake.calls.find(([n]) => n === 'convertPullRequestToDraft')[1], existingPr);
});

test('blocked result fails with stage blocked and still removes the worktree', async () => {
  const fake = fakeSteps({
    result: { status: 'blocked', summary: 'Need design input', openQuestions: ['Which color?'] },
  });
  await assert.rejects(run(fake), (err) => err.stage === 'blocked' && /Which color\?/.test(err.details));
  assert.ok(fake.names().includes('removeWorktree'));
});

test('missing result.json fails the copilot stage', async () => {
  const fake = fakeSteps({ writeResult: false });
  await assert.rejects(run(fake), (err) => err.stage === 'copilot' && /result\.json/.test(err.message));
});

test('askpass setup failures fail the workspace stage', async () => {
  const fake = fakeSteps({ writeAskpassError: new Error('askpass denied') });
  await assert.rejects(
    run(fake),
    (err) => err instanceof StageError && err.stage === 'workspace' && /askpass denied/.test(err.message),
  );
});

test('empty diff and protected paths fail the guardrails stage', async () => {
  await assert.rejects(
    run(fakeSteps({ diff: { changedFiles: [], addedLines: [] } })),
    (err) => err.stage === 'guardrails' && /no changes/.test(err.message),
  );
  await assert.rejects(
    run(fakeSteps({ diff: { changedFiles: ['.github/workflows/x.yaml'], addedLines: [] } })),
    (err) => err.stage === 'guardrails' && /\.github\/workflows\/x\.yaml/.test(err.details),
  );
});

test('a leaked credential in the diff fails the guardrails stage', async () => {
  const fake = fakeSteps({ diff: { changedFiles: ['a.js'], addedLines: ['const t = "gh-push-123456";'] } });
  await assert.rejects(run(fake), (err) => err.stage === 'guardrails');
});

test('PR API failures fail the pr stage', async () => {
  const fake = fakeSteps();
  fake.steps.createGithubClient = () => ({
    findOpenPr: async () => {
      throw new Error('GitHub GET /pulls failed: 502');
    },
  });
  await assert.rejects(run(fake), (err) => err.stage === 'pr');
});

test('dry run skips push and PR, keeps the worktree, and returns the PR text', async () => {
  const fake = fakeSteps();
  const out = await run(fake, { dryRun: true });
  assert.equal(out.dryRun, true);
  assert.ok(out.body.includes('Jira ID:'));
  assert.ok(!fake.names().includes('commitAndPush'));
  assert.ok(!fake.names().includes('createDraftPr'));
  assert.ok(!fake.names().includes('removeWorktree'));
});
