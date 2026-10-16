import test from 'node:test';
import assert from 'node:assert/strict';
import { createJiraClient, issueUrl, JiraError, selectComments, toTicket } from '../lib/jira.js';
import { fakeFetch, jsonResponse } from './helpers.js';

const issue = {
  key: 'EXLM-1234',
  fields: {
    summary: 'Fix tabs focus',
    description: 'First tab is skipped.\nAC: every tab focusable.',
    assignee: { name: 'jdoe' },
    labels: ['otto'],
    issuetype: { name: 'Bug' },
    components: [{ name: 'Blocks' }],
  },
};

test('searchOne sends JQL with bearer auth and returns the first issue', async () => {
  const fetch = fakeFetch(() => jsonResponse({ issues: [issue] }));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com/', token: 'tok-12345678', fetchImpl: fetch.impl });
  const found = await jira.searchOne('labels = otto');
  assert.equal(found.key, 'EXLM-1234');
  const url = new URL(fetch.calls[0].url);
  assert.equal(url.origin + url.pathname, 'https://jira.example.com/rest/api/2/search');
  assert.equal(url.searchParams.get('jql'), 'labels = otto');
  assert.equal(url.searchParams.get('maxResults'), '1');
  assert.equal(fetch.calls[0].headers.Authorization, 'Bearer tok-12345678');
});

test('searchOne returns null when nothing matches', async () => {
  const fetch = fakeFetch(() => jsonResponse({ issues: [] }));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com', token: 't', fetchImpl: fetch.impl });
  assert.equal(await jira.searchOne('x'), null);
});

test('updateLabels removes then adds in one PUT', async () => {
  const fetch = fakeFetch(() => jsonResponse(null, 204));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com', token: 't', fetchImpl: fetch.impl });
  await jira.updateLabels('EXLM-1234', { remove: ['otto'], add: ['otto-working'] });
  assert.equal(fetch.calls[0].method, 'PUT');
  assert.equal(fetch.calls[0].url, 'https://jira.example.com/rest/api/2/issue/EXLM-1234');
  assert.deepEqual(fetch.calls[0].body, { update: { labels: [{ remove: 'otto' }, { add: 'otto-working' }] } });
});

test('addComment posts the body', async () => {
  const fetch = fakeFetch(() => jsonResponse({ id: '1' }, 201));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com', token: 't', fetchImpl: fetch.impl });
  await jira.addComment('EXLM-1234', 'hello');
  assert.equal(fetch.calls[0].method, 'POST');
  assert.equal(fetch.calls[0].url, 'https://jira.example.com/rest/api/2/issue/EXLM-1234/comment');
  assert.deepEqual(fetch.calls[0].body, { body: 'hello' });
});

test('HTTP errors throw JiraError with the status', async () => {
  const fetch = fakeFetch(() => new Response('denied', { status: 403 }));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com', token: 't', fetchImpl: fetch.impl });
  await assert.rejects(jira.myself(), (err) => err instanceof JiraError && err.status === 403);
});

test('toTicket maps Jira fields', () => {
  assert.deepEqual(toTicket(issue), {
    key: 'EXLM-1234',
    summary: 'Fix tabs focus',
    description: 'First tab is skipped.\nAC: every tab focusable.',
    assignee: 'jdoe',
    labels: ['otto'],
    type: 'Bug',
    components: ['Blocks'],
    comments: [],
  });
  assert.equal(toTicket({ key: 'EXLM-1', fields: {} }).assignee, null);
});

test('getIssue requests comments', async () => {
  const fetch = fakeFetch(() => jsonResponse(issue));
  const jira = createJiraClient({ baseUrl: 'https://jira.example.com', token: 't', fetchImpl: fetch.impl });
  await jira.getIssue('EXLM-1234');
  assert.ok(new URL(fetch.calls[0].url).searchParams.get('fields').split(',').includes('comment'));
});

test('toTicket keeps human comments and drops otto comments', () => {
  const withComments = {
    ...issue,
    fields: {
      ...issue.fields,
      comment: {
        comments: [
          {
            author: { displayName: 'Jane Doe', name: 'jdoe' },
            created: '2026-10-01',
            body: 'Use the PDF spec section 2.',
          },
          { author: { name: 'gsnair' }, body: "Picking this up now. I'll share a draft PR here once it's ready." },
          { author: { name: 'gsnair' }, body: "I couldn't finish this one. It got stuck at the *push* step: boom" },
          { author: { name: 'gsnair' }, body: 'Draft PR is up: [x|x]' },
          { author: { name: 'otto' }, body: '🤖 otto-bot picked this up using the master account.' },
          { author: { name: 'ruhis' }, body: '   ' },
          { author: { name: 'ruhis' }, body: 'Also rename the helper.' },
        ],
      },
    },
  };
  assert.deepEqual(toTicket(withComments).comments, [
    { author: 'Jane Doe', created: '2026-10-01', body: 'Use the PDF spec section 2.' },
    { author: 'ruhis', created: '', body: 'Also rename the helper.' },
  ]);
});

test('selectComments enforces count, per-comment, and total limits', () => {
  const raw = Array.from({ length: 5 }, (_, i) => ({ author: { name: `u${i}` }, body: `c${i}`.padEnd(10, 'x') }));
  assert.deepEqual(
    selectComments(raw, { count: 3, perComment: 100, total: 1000 }).map((c) => c.author),
    ['u2', 'u3', 'u4'],
  );
  assert.deepEqual(
    selectComments(raw, { count: 5, perComment: 100, total: 25 }).map((c) => c.author),
    ['u3', 'u4'],
  );
  const [long] = selectComments([{ body: 'a'.repeat(50) }], { count: 5, perComment: 10, total: 1000 });
  assert.ok(long.body.startsWith('a'.repeat(10)));
  assert.ok(long.body.includes('[...truncated 40 chars]'));
  assert.equal(long.author, 'Unknown');
});

test('issueUrl builds a browse link', () => {
  assert.equal(issueUrl('https://jira.example.com/', 'EXLM-1'), 'https://jira.example.com/browse/EXLM-1');
});
