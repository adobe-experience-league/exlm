import { trimOutput } from './task.js';

const RETRY_HINT = 'To retry, remove the {{otto-failed}} label and add {{otto}} again.';

export function buildPickupComment() {
  return `Picking this up now. I'll share a draft PR here once it's ready.`;
}

export function buildDoneComment({ outcome, preview }) {
  const { quality, result } = outcome;
  const lines = [
    `${outcome.reusedPr ? 'Updated the draft PR' : 'Draft PR is up'}: [${outcome.prUrl}|${outcome.prUrl}]`,
    `Preview: ${preview}`,
    '',
    result.summary,
  ];
  if (!quality.ok) {
    lines.push('', 'Heads up: quality checks are still failing on this one. Details are in the PR description.');
  }
  if (result.openQuestions.length) {
    lines.push('', 'A few open questions:', ...result.openQuestions.map((q) => `* ${q}`));
  }
  lines.push('', `It's still a draft, so please give it a review before it goes further.`);
  return lines.join('\n');
}

export function buildFailedComment({ stage, message, details, runId }) {
  const detailBlock = details ? `\n{noformat}\n${trimOutput(details, 3000)}\n{noformat}` : '';
  return `I couldn't finish this one. It got stuck at the *${stage}* step: ${message}${detailBlock}
${RETRY_HINT} (ref {{${runId}}})`;
}

export function buildInterruptedComment({ runId }) {
  return `My work on this was interrupted before it finished, so a branch or PR may be half done.
${RETRY_HINT} (ref {{${runId}}})`;
}

export function buildClaimRejectedComment({ identity, status }) {
  return `I couldn't pick this up as ${identity.name}: Jira returned ${status}.
Their Jira token may have expired or be missing permissions, so they'll need to redo their otto-bot setup.
${RETRY_HINT}`;
}
