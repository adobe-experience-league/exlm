import { trimOutput } from './task.js';

const RETRY_HINT = 'To retry, remove the {{otto-failed}} label and add {{otto}} again.';
const PICKUP_TEXT = `Picking this up now. I'll share a draft PR here once it's ready.`;
const DONE_PREFIX = 'Draft PR is up:';
const UPDATED_PREFIX = 'Updated the draft PR:';
const FAILED_PREFIX = "I couldn't finish this one.";
const INTERRUPTED_PREFIX = 'My work on this was interrupted';
const REJECTED_PREFIX = "I couldn't pick this up as ";
// Older releases posted bot-branded comments.
const LEGACY_PATTERN = /^\s*(🤖\s*|❌\s*|✅\s*|⚠️\s*)?otto-bot\b/i;

const OTTO_PREFIXES = [PICKUP_TEXT, DONE_PREFIX, UPDATED_PREFIX, FAILED_PREFIX, INTERRUPTED_PREFIX, REJECTED_PREFIX];

export function isOttoComment(body) {
  const text = String(body || '').trimStart();
  return OTTO_PREFIXES.some((prefix) => text.startsWith(prefix)) || LEGACY_PATTERN.test(text);
}

export function buildPickupComment() {
  return PICKUP_TEXT;
}

export function buildDoneComment({ outcome, preview }) {
  const { quality, result } = outcome;
  const lines = [
    `${outcome.reusedPr ? UPDATED_PREFIX : DONE_PREFIX} [${outcome.prUrl}|${outcome.prUrl}]`,
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
  return `${FAILED_PREFIX} It got stuck at the *${stage}* step: ${message}${detailBlock}
${RETRY_HINT} (ref {{${runId}}})`;
}

export function buildInterruptedComment({ runId }) {
  return `${INTERRUPTED_PREFIX} before it finished, so a branch or PR may be half done.
${RETRY_HINT} (ref {{${runId}}})`;
}

export function buildClaimRejectedComment({ identity, status }) {
  return `${REJECTED_PREFIX}${identity.name}: Jira returned ${status}.
Their Jira token may have expired or be missing permissions, so they'll need to redo their otto-bot setup.
${RETRY_HINT}`;
}
