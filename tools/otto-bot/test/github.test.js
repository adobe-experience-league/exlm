import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildCommitMessage,
  buildPrBody,
  buildPrTitle,
  COAUTHOR_TRAILER,
  commitAndPush,
  createGithubClient,
  GithubError,
  toTestPath,
} from '../lib/github.js';
import { createWorktree, ensureMirror } from '../lib/workspace.js';
import { fakeFetch, git, gitBare, jsonResponse, makeRemote, tempDir } from './helpers.js';

const ticket = { key: 'EXLM-1234', summary: 'Fix tabs focus' };
const result = {
  status: 'done',
  summary: 'Made the first tab focusable.',
  testUrls: ['/en/docs'],
  openQuestions: ['Check tabs.'],
};

test('getRepo reports push permission and token expiry', async () => {
  const fetch = fakeFetch(() =>
    jsonResponse({ permissions: { push: true } }, 200, {
      'github-authentication-token-expiration': '2027-01-01 00:00:00 UTC',
    }),
  );
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 'tok-12345678', fetchImpl: fetch.impl });
  assert.deepEqual(await gh.getRepo(), { canPush: true, tokenExpiry: '2027-01-01 00:00:00 UTC' });
  assert.equal(fetch.calls[0].url, 'https://api.github.com/repos/o/r');
  assert.ok(fetch.calls[0].headers.Authorization.startsWith('Bearer '));
  assert.ok(fetch.calls[0].headers.Authorization.endsWith('12345678'));
});

test('findOpenPr queries by owner:branch', async () => {
  const fetch = fakeFetch(() => jsonResponse([{ number: 7, html_url: 'https://github.com/o/r/pull/7' }]));
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 't', fetchImpl: fetch.impl });
  assert.equal((await gh.findOpenPr('exlm-1234')).number, 7);
  const url = new URL(fetch.calls[0].url);
  assert.equal(url.searchParams.get('head'), 'o:exlm-1234');
  assert.equal(url.searchParams.get('state'), 'open');
});

test('createDraftPr always opens a draft', async () => {
  const fetch = fakeFetch(() => jsonResponse({ number: 8, html_url: 'u' }, 201));
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 't', fetchImpl: fetch.impl });
  await gh.createDraftPr({ title: 't', body: 'b', head: 'exlm-1', base: 'main' });
  assert.equal(fetch.calls[0].method, 'POST');
  assert.deepEqual(fetch.calls[0].body, { title: 't', body: 'b', head: 'exlm-1', base: 'main', draft: true });
});

test('convertPullRequestToDraft uses the PR node id', async () => {
  const fetch = fakeFetch(() =>
    jsonResponse({ data: { convertPullRequestToDraft: { pullRequest: { isDraft: true } } } }),
  );
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 't', fetchImpl: fetch.impl });
  await gh.convertPullRequestToDraft({ number: 8, node_id: 'PR_node' });
  assert.equal(fetch.calls[0].method, 'POST');
  assert.equal(new URL(fetch.calls[0].url).pathname, '/graphql');
  assert.deepEqual(fetch.calls[0].body.variables, { pullRequestId: 'PR_node' });
});

test('convertPullRequestToDraft refuses PRs without a node id', async () => {
  const gh = createGithubClient({
    owner: 'o',
    repo: 'r',
    token: 't',
    fetchImpl: fakeFetch(() => jsonResponse(null)).impl,
  });
  await assert.rejects(
    gh.convertPullRequestToDraft({ number: 8 }),
    (err) => err.stage === 'pr' && /node_id/.test(err.message),
  );
});

test('createDraftPr and comments redact GitHub-bound strings', async () => {
  const fetch = fakeFetch(() => jsonResponse({ number: 8, html_url: 'u' }, 201));
  const redact = (value) => String(value).replaceAll('SECRET-XYZ', '[redacted]');
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 't', fetchImpl: fetch.impl, redact });
  await gh.createDraftPr({
    title: 'Fix SECRET-XYZ leak',
    body: 'Body SECRET-XYZ leak',
    head: 'exlm-1',
    base: 'main',
  });
  await gh.commentOnPr(8, 'Comment SECRET-XYZ leak');

  assert.equal(fetch.calls[0].body.title.includes('SECRET-XYZ'), false);
  assert.equal(fetch.calls[0].body.title.includes('[redacted]'), true);
  assert.equal(fetch.calls[0].body.body.includes('SECRET-XYZ'), false);
  assert.equal(fetch.calls[0].body.body.includes('[redacted]'), true);
  assert.equal(fetch.calls[1].body.body.includes('SECRET-XYZ'), false);
  assert.equal(fetch.calls[1].body.body.includes('[redacted]'), true);
});

test('default GitHub redactor strips the client token from PR bodies', async () => {
  const fetch = fakeFetch(() => jsonResponse({ number: 8, html_url: 'u' }, 201));
  const token = 'ghp_abcdefghijklmnopqrstuvwxyz';
  const gh = createGithubClient({ owner: 'o', repo: 'r', token, fetchImpl: fetch.impl });
  await gh.createDraftPr({ title: 't', body: `Token: ${token}`, head: 'exlm-1', base: 'main' });

  assert.equal(fetch.calls[0].body.body.includes(token), false);
  assert.equal(fetch.calls[0].body.body.includes('[REDACTED]'), true);
});

test('GitHub HTTP errors throw GithubError with the status', async () => {
  const fetch = fakeFetch(() => new Response('{"message":"Validation Failed"}', { status: 422 }));
  const gh = createGithubClient({ owner: 'o', repo: 'r', token: 't', fetchImpl: fetch.impl });
  await assert.rejects(gh.commentOnPr(1, 'x'), (err) => err instanceof GithubError && err.status === 422);
});

test('toTestPath prefixes $ and disables martech', () => {
  assert.equal(toTestPath('/en/docs'), '$/en/docs?martech=off');
  assert.equal(toTestPath('/en/search?q=a'), '$/en/search?q=a&martech=off');
});

test('buildPrTitle flags failing quality', () => {
  assert.equal(buildPrTitle({ ticket, qualityOk: true }), 'EXLM-1234: Fix tabs focus');
  assert.equal(buildPrTitle({ ticket, qualityOk: false }), '[quality failing] EXLM-1234: Fix tabs focus');
});

test('buildPrBody follows the repo PR template', () => {
  const body = buildPrBody({
    ticket,
    jiraUrl: 'https://jira.example.com/browse/EXLM-1234',
    result,
    quality: { ok: true, repairs: 1, output: '' },
    identity: { name: 'jdoe', isMaster: false, fallbackReason: null },
    runId: 'run-1',
  });
  assert.ok(body.includes('Jira ID: [EXLM-1234](https://jira.example.com/browse/EXLM-1234)'));
  assert.ok(body.includes('- Before: https://main--exlm--adobe-experience-league.aem.live'));
  assert.ok(body.includes('\n$\n$/en/docs?martech=off\n'));
  assert.ok(body.includes('## AI Review Notes'));
  assert.ok(body.includes('## Open questions\n\n- Check tabs.'));
  assert.ok(body.includes('Generated by otto-bot'));
  assert.ok(!body.includes('Quality failing'));
});

test('buildPrBody adds a warning section with output when quality fails', () => {
  const body = buildPrBody({
    ticket,
    jiraUrl: 'u',
    result,
    quality: { ok: false, repairs: 3, output: 'error no-unused-vars' },
    identity: { name: 'otto-master', isMaster: true, fallbackReason: 'the ticket is unassigned' },
    runId: 'run-1',
  });
  assert.ok(body.startsWith('## ⚠️ Quality failing'));
  assert.ok(body.includes('error no-unused-vars'));
  assert.ok(body.includes('the ticket is unassigned'));
});

test('buildCommitMessage includes the ticket, summary, and Copilot trailer', () => {
  const msg = buildCommitMessage({ ticket, result });
  assert.ok(msg.startsWith('EXLM-1234: Fix tabs focus\n\nMade the first tab focusable.'));
  assert.ok(msg.trimEnd().endsWith(COAUTHOR_TRAILER));
});

test('buildCommitMessage redacts ticket and result text', () => {
  const msg = buildCommitMessage({
    ticket: { key: 'EXLM-1234', summary: 'Fix SECRET-XYZ' },
    result: { summary: 'Changed SECRET-XYZ' },
    redact: (value) => String(value).replaceAll('SECRET-XYZ', '[REDACTED]'),
  });
  assert.equal(msg.includes('SECRET-XYZ'), false);
  assert.ok(msg.includes('[REDACTED]'));
});

test('commitAndPush commits as the identity and force-pushes the branch', async () => {
  const remote = await makeRemote();
  const root = await tempDir();
  const mirrorDir = path.join(root, 'mirror.git');
  const workDir = path.join(root, 'work');
  await ensureMirror({ mirrorDir, remoteUrl: remote.bare });
  await createWorktree({ mirrorDir, workDir, branch: 'exlm-1234', baseBranch: 'main' });
  await fs.writeFile(path.join(workDir, 'fix.js'), 'export default 1;\n');
  await git(workDir, 'add', '-A');

  const sha = await commitAndPush({
    workDir,
    branch: 'exlm-1234',
    message: buildCommitMessage({ ticket, result }),
    gitName: 'Jane Doe',
    gitEmail: 'jdoe@example.com',
  });
  assert.equal(await gitBare(remote.bare, 'rev-parse', 'refs/heads/exlm-1234'), sha);
  assert.equal(
    await gitBare(remote.bare, 'log', '-1', '--format=%an <%ae>', 'exlm-1234'),
    'Jane Doe <jdoe@example.com>',
  );
});
