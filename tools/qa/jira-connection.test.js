import assert from 'assert/strict';
import fs from 'fs';
import { test } from 'node:test';
import yaml from 'js-yaml';
import checkJiraConnection from './jira-connection.js';

const config = { baseUrl: 'https://jira.example.test', token: 'test-token-not-a-credential' };
const user = { self: 'https://jira.example.test/rest/api/2/user?username=qa-fixture', name: 'qa-fixture' };
const jsonResponse = (body) => Response.json(body);

test('uses Bearer authentication, blocks redirects, preserves context paths and returns no account details', async () => {
  let requested;
  const result = await checkJiraConnection({
    ...config,
    baseUrl: `${config.baseUrl}/jira/`,
    fetchImpl: async (url, options) => {
      requested = { url, options };
      return jsonResponse(user);
    },
  });
  assert.equal(requested.url, `${config.baseUrl}/jira/rest/api/2/myself`);
  assert.equal(requested.options.headers.Authorization, `Bearer ${config.token}`);
  assert.equal(requested.options.headers.Accept, 'application/json');
  assert.equal(requested.options.redirect, 'manual');
  assert.ok(requested.options.signal instanceof AbortSignal);
  assert.deepEqual(result, { status: 200 });
});

test('rejects missing credentials and unsafe URLs before making a request', async () => {
  const fetchImpl = async () => {
    assert.fail('Invalid configuration must not send a request.');
  };
  await assert.rejects(checkJiraConnection({ ...config, fetchImpl, token: '' }), /JIRA_PAT_PR_QA.*missing/);
  await assert.rejects(checkJiraConnection({ ...config, fetchImpl, token: 'line\nbreak' }), /line breaks/);
  const urls = [
    '',
    'not a URL',
    'http://jira.example.test',
    'https://user:password@jira.example.test',
    `${config.baseUrl}?a=1`,
    `${config.baseUrl}#fragment`,
  ];
  await Promise.all(
    urls.map((baseUrl) => assert.rejects(checkJiraConnection({ ...config, fetchImpl, baseUrl }), /JIRA_BASE_URL/)),
  );
});

test('rejects HTTP errors and redirects without exposing response bodies', async () => {
  await Promise.all(
    [301, 302, 307, 401, 403, 404, 429, 500].map(async (status) => {
      const response = new Response('private response body', { status });
      await assert.rejects(
        checkJiraConnection({ ...config, fetchImpl: async () => response }),
        (error) => !error.message.includes('private response body') && /Jira/.test(error.message),
      );
    }),
  );
});

test('does not mistake HTML, invalid JSON or an anonymous JSON response for successful authentication', async () => {
  const responses = [
    new Response('<html>SSO</html>', { headers: { 'content-type': 'text/html' } }),
    new Response('invalid-json', { headers: { 'content-type': 'application/json' } }),
    jsonResponse({}),
    jsonResponse(null),
    jsonResponse({ self: user.self, name: '' }),
  ];
  await Promise.all(
    responses.map((response) =>
      assert.rejects(checkJiraConnection({ ...config, fetchImpl: async () => response }), /Jira/),
    ),
  );
});

test('reports network/TLS errors and timeouts without leaking low-level exception details', async () => {
  const fetchImpl = async () => {
    throw new Error(`private diagnostic ${config.token}`);
  };
  await assert.rejects(checkJiraConnection({ ...config, fetchImpl }), {
    message: 'Unable to reach Jira. Check runner DNS, corporate network/proxy access, and trusted TLS certificates.',
  });
  await assert.rejects(
    checkJiraConnection({
      ...config,
      fetchImpl: async () => {
        throw new DOMException('private timeout details', 'TimeoutError');
      },
    }),
    /timed out/,
  );
});

test('connection workflow is restricted to pushes or manual runs on the trusted pilot branch', () => {
  const workflow = yaml.load(
    fs.readFileSync(new URL('../../.github/workflows/qa-jira-connection.yaml', import.meta.url), 'utf8'),
  );
  assert.deepEqual(Object.keys(workflow.on), ['push', 'workflow_dispatch']);
  assert.deepEqual(workflow.on.push.branches, ['exlm-6172']);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(
    workflow.jobs.connect.if,
    "github.repository == 'adobe-experience-league/exlm' && github.ref == 'refs/heads/exlm-6172'",
  );
  const checkout = workflow.jobs.connect.steps.find((step) => step.uses === 'actions/checkout@v4');
  assert.match(checkout.with.ref, /^\$\{\{ github\.sha \}\}$/);
  assert.equal(checkout.with['persist-credentials'], false);
  const step = workflow.jobs.connect.steps.find((entry) => entry.env);
  assert.match(step.env.JIRA_PAT_PR_QA, /^\$\{\{ secrets\.JIRA_PAT_PR_QA \}\}$/);
  assert.match(step.env.JIRA_BASE_URL, /^\$\{\{ vars\.JIRA_BASE_URL \}\}$/);
  assert.equal(step.run, 'node tools/qa/jira-connection.js');
});
