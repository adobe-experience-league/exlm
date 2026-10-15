import { trimOutput } from './task.js';

const RETRY_HINT = 'To retry: fix the problem, remove the {{otto-failed}} label, and add {{otto}} again.';

const who = (identity) =>
  identity.isMaster ? `the otto-bot master account (${identity.fallbackReason})` : `${identity.name}'s credentials`;

export function buildPickupComment({ identity, runId }) {
  return `🤖 otto-bot picked this up using ${who(identity)}.
Run {{${runId}}}. I will comment again with a draft PR or the reason it failed.`;
}

export function buildDoneComment({ outcome, preview, runId }) {
  const { quality, result } = outcome;
  const lines = [
    `✅ otto-bot ${outcome.reusedPr ? 'updated the existing' : 'opened a'} draft PR: [${outcome.prUrl}|${
      outcome.prUrl
    }]`,
    `Branch preview: ${preview}`,
    quality.ok
      ? `Quality: passing (${quality.repairs} Copilot repair attempt(s)).`
      : `⚠️ Quality: still failing after ${quality.repairs} Copilot repair attempts. See the PR description.`,
    '',
    `*Summary:* ${result.summary}`,
  ];
  if (result.openQuestions.length) {
    lines.push('', '*Open questions:*', ...result.openQuestions.map((q) => `* ${q}`));
  }
  lines.push('', `Run {{${runId}}}. The PR is a draft and needs human review.`);
  return lines.join('\n');
}

export function buildFailedComment({ stage, message, details, runId, logDir }) {
  const detailBlock = details ? `\n{noformat}\n${trimOutput(details, 3000)}\n{noformat}` : '';
  return `❌ otto-bot failed at stage *${stage}*: ${message}${detailBlock}
Run {{${runId}}}. Logs are on the otto-bot VM in {{${logDir}}}.
${RETRY_HINT}`;
}

export function buildInterruptedComment({ runId, logDir }) {
  return `❌ otto-bot was interrupted (crash, timeout, or VM restart) during run {{${runId}}}.
Logs are on the otto-bot VM in {{${logDir}}}. A branch or PR may have been partly created.
${RETRY_HINT}`;
}

export function buildClaimRejectedComment({ identity, status }) {
  return `❌ otto-bot could not claim this ticket as ${identity.name}: Jira returned ${status}.
Their Jira token may be expired or missing permissions; ask them to re-run otto-bot onboarding.
${RETRY_HINT}`;
}
