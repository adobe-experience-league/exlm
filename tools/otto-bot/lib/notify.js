import { issueUrl } from './jira.js';

const MESSAGE_LIMIT = 1500;
const TIMEOUT_MS = 10_000;

const trim = (text) => {
  const value = String(text ?? '').trim();
  return value.length > MESSAGE_LIMIT ? `${value.slice(0, MESSAGE_LIMIT - 1)}…` : value;
};

const repoUrl = (config) => `https://github.com/${config.githubOwner}/${config.githubRepo}`;
const branchPrsUrl = (config, branch) => `${repoUrl(config)}/pulls?q=${encodeURIComponent(`is:pr head:${branch}`)}`;
const ticketLine = (ticket) => (ticket.summary ? `${ticket.key} · ${ticket.summary}` : ticket.key);
const ownerName = (identity) =>
  identity.fallbackReason ? `the master account (${identity.fallbackReason})` : identity.name;

// The Slack workflow's buttons only accept real https URLs, so every payload carries both links.
export function buildNotification(event, data, config) {
  const jira = (key) => issueUrl(config.jiraBaseUrl, key);
  switch (event) {
    case 'picked-up':
      return {
        status: '👀 Picked up',
        ticket: ticketLine(data.ticket),
        message: `On it for ${ownerName(data.identity)}. I'll post here when the draft PR is ready.`,
        jira_link: jira(data.ticket.key),
        pr_link: branchPrsUrl(config, data.ticket.key.toLowerCase()),
        owner: data.identity.creds.gitEmail,
      };
    case 'done': {
      const { outcome } = data;
      const lines = [outcome.result.summary];
      if (!outcome.quality.ok) lines.push('⚠️ Quality checks are still failing, see the PR description.');
      if (outcome.result.openQuestions?.length)
        lines.push(`Open questions: ${outcome.result.openQuestions.join(' · ')}`);
      lines.push('It is a draft, so please review it before it goes further.');
      return {
        status: outcome.reusedPr ? '🔁 Draft PR updated' : '✅ Draft PR ready',
        ticket: ticketLine(data.ticket),
        message: lines.join('\n'),
        jira_link: jira(data.ticket.key),
        pr_link: outcome.prUrl,
        owner: data.identity.creds.gitEmail,
      };
    }
    case 'failed':
      return {
        status: '❌ Needs attention',
        ticket: ticketLine(data.ticket),
        message: `${
          data.stage === 'interrupted'
            ? 'My run was interrupted (crash, timeout, or VM restart), so a branch or PR may be half done.'
            : `Got stuck at the ${data.stage} step: ${data.reason}`
        }\nTo retry, remove otto-failed and add otto again.`,
        jira_link: jira(data.ticket.key),
        pr_link: branchPrsUrl(config, data.ticket.key.toLowerCase()),
        owner: data.identity.creds.gitEmail,
      };
    case 'welcome':
      return {
        status: '👋 Welcome aboard',
        ticket: `${data.name} is now set up with Otto`,
        message: "Add the otto label to any EXLM ticket and I'll open a draft PR for it.",
        jira_link: `${config.jiraBaseUrl.replace(/\/+$/, '')}/issues/?jql=${encodeURIComponent('labels = otto')}`,
        pr_link: `${repoUrl(config)}/pulls?q=${encodeURIComponent('is:pr is:draft is:open')}`,
        owner: data.email,
      };
    default:
      throw new Error(`Unknown notification event ${event}`);
  }
}

export async function sendNotification(url, payload, { fetchImpl = fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Slack webhook returned ${res.status}`);
}

// Best-effort: a Slack problem is logged and never fails a ticket.
export function createNotifier({ config, log, redact = (v) => v, fetchImpl }) {
  const url = config.slackWebhookUrl;
  return async (event, data) => {
    if (!url) return false;
    try {
      const payload = buildNotification(event, data, config);
      const safe = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, trim(redact(String(v ?? '')))]));
      await sendNotification(url, safe, { fetchImpl });
      return true;
    } catch (err) {
      log.warn('slack notification failed', { event, error: err.name === 'TimeoutError' ? 'timed out' : err.message });
      return false;
    }
  };
}
