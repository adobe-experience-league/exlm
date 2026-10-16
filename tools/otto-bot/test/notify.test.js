import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../lib/config.js';
import { buildNotification, createNotifier } from '../lib/notify.js';
import { silentLog } from './helpers.js';

const config = { ...DEFAULT_CONFIG, slackWebhookUrl: 'https://hooks.slack.com/triggers/T/1/abc' };
const ticket = { key: 'EXLM-6161', summary: 'First tab is skipped' };
const identity = { name: 'gsnair', fallbackReason: null, creds: { gitEmail: 'gsnair@adobe.com' } };
const KEYS = ['status', 'ticket', 'message', 'jira_link', 'pr_link', 'owner'];
const isHttps = (value) => new URL(value).protocol === 'https:';

const events = {
  'picked-up': { ticket, identity },
  done: {
    ticket,
    identity,
    outcome: {
      prUrl: 'https://github.com/adobe-experience-league/exlm/pull/2979',
      reusedPr: false,
      quality: { ok: false },
      result: { summary: 'Fixed tab order.', openQuestions: ['Copy OK?'] },
    },
  },
  failed: { ticket, identity, stage: 'push', reason: 'git push failed' },
  welcome: { name: 'jdoe', email: 'jdoe@adobe.com' },
};

test('every event fills all workflow variables with real https links', () => {
  Object.entries(events).forEach(([event, data]) => {
    const payload = buildNotification(event, data, config);
    assert.deepEqual(Object.keys(payload).sort(), [...KEYS].sort(), event);
    KEYS.forEach((k) => assert.ok(payload[k], `${event}.${k} is empty`));
    assert.ok(isHttps(payload.jira_link) && isHttps(payload.pr_link), event);
  });
});

test('payload content per event', () => {
  const picked = buildNotification('picked-up', events['picked-up'], config);
  assert.equal(picked.ticket, 'EXLM-6161 · First tab is skipped');
  assert.equal(picked.jira_link, 'https://jira.corp.adobe.com/browse/EXLM-6161');
  assert.ok(picked.pr_link.includes('head%3Aexlm-6161'));
  assert.equal(picked.owner, 'gsnair@adobe.com');

  const done = buildNotification('done', events.done, config);
  assert.equal(done.status, '✅ Draft PR ready');
  assert.equal(done.pr_link, events.done.outcome.prUrl);
  assert.ok(done.message.includes('Quality checks are still failing') && done.message.includes('Copy OK?'));

  assert.ok(buildNotification('failed', events.failed, config).message.includes('push step: git push failed'));
  const interrupted = buildNotification('failed', { ticket, identity, stage: 'interrupted' }, config);
  assert.ok(interrupted.message.includes('interrupted'));
  assert.equal(buildNotification('welcome', events.welcome, config).owner, 'jdoe@adobe.com');
});

test('fallback identities are named as the master account', () => {
  const master = {
    name: 'otto-master',
    fallbackReason: 'the ticket is unassigned',
    creds: { gitEmail: 'm@adobe.com' },
  };
  const payload = buildNotification('picked-up', { ticket, identity: master }, config);
  assert.ok(payload.message.includes('the master account (the ticket is unassigned)'));
  assert.equal(payload.owner, 'm@adobe.com');
});

test('notifier posts a redacted JSON payload to the webhook', async () => {
  const sent = [];
  const fetchImpl = async (url, init) => {
    sent.push({ url, init });
    return { ok: true, status: 200 };
  };
  const notify = createNotifier({
    config,
    log: silentLog(),
    redact: (v) => v.replaceAll('git push failed', '[REDACTED]'),
    fetchImpl,
  });
  assert.equal(await notify('failed', events.failed), true);
  assert.equal(sent[0].url, config.slackWebhookUrl);
  assert.equal(sent[0].init.method, 'POST');
  const body = JSON.parse(sent[0].init.body);
  assert.ok(body.message.includes('[REDACTED]') && !body.message.includes('git push failed'));
});

test('notifier is a no-op without a webhook and never throws on Slack errors', async () => {
  let called = false;
  const off = createNotifier({
    config: { ...config, slackWebhookUrl: '' },
    log: silentLog(),
    fetchImpl: async () => {
      called = true;
    },
  });
  assert.equal(await off('welcome', events.welcome), false);
  assert.equal(called, false);

  const log = silentLog();
  const broken = createNotifier({ config, log, fetchImpl: async () => ({ ok: false, status: 400 }) });
  assert.equal(await broken('welcome', events.welcome), false);
  const down = createNotifier({ config, log, fetchImpl: async () => Promise.reject(new Error('ECONNRESET')) });
  assert.equal(await down('welcome', events.welcome), false);
  assert.equal(log.lines.filter(([level]) => level === 'warn').length, 2);
  assert.ok(!JSON.stringify(log.lines).includes('hooks.slack.com'));
});
