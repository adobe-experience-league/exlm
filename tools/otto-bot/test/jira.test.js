import test from 'node:test';
import assert from 'node:assert/strict';
import { createJiraClient, issueUrl, JiraError, toTicket } from '../lib/jira.js';
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
  });
  assert.equal(toTicket({ key: 'EXLM-1', fields: {} }).assignee, null);
});

test('issueUrl builds a browse link', () => {
  assert.equal(issueUrl('https://jira.example.com/', 'EXLM-1'), 'https://jira.example.com/browse/EXLM-1');
});
