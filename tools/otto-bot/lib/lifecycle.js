import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildClaimRejectedComment,
  buildDoneComment,
  buildFailedComment,
  buildInterruptedComment,
  buildPickupComment,
} from './comments.js';
import { allSecrets } from './config.js';
import { StageError } from './errors.js';
import { cleanupRuns } from './housekeeping.js';
import { resolveIdentity } from './identity.js';
import { createJiraClient, JiraError, toTicket } from './jira.js';
import { dataPaths, runPaths } from './paths.js';
import { createRedactor } from './redact.js';
import { previewUrl, runTicket } from './runner.js';
import { acquireLock, appendHistory, clearCurrentRun, readCurrentRun, writeCurrentRun } from './state.js';

export const LABELS = Object.freeze({
  trigger: 'otto',
  working: 'otto-working',
  done: 'otto-done',
  failed: 'otto-failed',
});

const DEFAULT_DEPS = Object.freeze({ createJiraClient, runTicket, now: () => new Date() });

export function makeRunId(key, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `${stamp}-${key.toLowerCase()}`;
}

const masterJira = (config, users, deps) =>
  deps.createJiraClient({ baseUrl: config.jiraBaseUrl, token: users.master.jiraPat });

export async function recover({ config, users, log, deps: overrides = {} }) {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const { stateDir } = dataPaths(config.dataDir);
  let current;
  try {
    current = await readCurrentRun(stateDir);
  } catch (err) {
    if (err instanceof SyntaxError) {
      log.warn('clearing malformed recovery state', { error: err.message });
      await clearCurrentRun(stateDir);
      return false;
    }
    throw err;
  }
  if (!current) return false;
  const secrets = allSecrets(users);
  const redact = createRedactor(secrets);
  log.warn('recovering interrupted run', current);
  const jira = masterJira(config, users, deps);
  const issue = await jira.getIssue(current.key);
  const labels = issue?.fields?.labels || [];
  if (!labels.includes(LABELS.working)) {
    log.warn('clearing recovery state for an unclaimed run', { key: current.key, runId: current.runId, labels });
    await clearCurrentRun(stateDir);
    return false;
  }
  await jira.addComment(current.key, redact(buildInterruptedComment({ runId: current.runId })));
  await jira.updateLabels(current.key, { remove: [LABELS.working], add: [LABELS.failed] });
  await appendHistory(stateDir, {
    ...current,
    outcome: 'failed',
    stage: 'interrupted',
    finishedAt: deps.now().toISOString(),
  });
  await clearCurrentRun(stateDir);
  return true;
}

export async function processTicket({ issue, config, users, log, deps: overrides = {} }) {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const secrets = allSecrets(users);
  const redact = createRedactor(secrets);
  const ticket = toTicket(issue);
  const identity = resolveIdentity(users, ticket.assignee);
  const runId = makeRunId(ticket.key, deps.now());
  const { stateDir } = dataPaths(config.dataDir);
  const { runDir } = runPaths(config.dataDir, runId);
  const jira = deps.createJiraClient({ baseUrl: config.jiraBaseUrl, token: identity.creds.jiraPat });
  const base = { key: ticket.key, runId };
  log.info('claiming ticket', { ...base, identity: identity.name });
  await writeCurrentRun(stateDir, { ...base, identity: identity.name, startedAt: deps.now().toISOString() });

  try {
    await jira.updateLabels(ticket.key, { remove: [LABELS.trigger], add: [LABELS.working] });
  } catch (err) {
    if (err instanceof JiraError && [401, 403].includes(err.status) && !identity.isMaster) {
      const master = masterJira(config, users, deps);
      await master.addComment(ticket.key, redact(buildClaimRejectedComment({ identity, status: err.status })));
      await master.updateLabels(ticket.key, { remove: [LABELS.trigger], add: [LABELS.failed] });
      await appendHistory(stateDir, {
        ...base,
        outcome: 'failed',
        stage: 'claim',
        finishedAt: deps.now().toISOString(),
      });
      await clearCurrentRun(stateDir);
      return { ...base, outcome: 'failed', stage: 'claim' };
    }
    throw err;
  }

  await fs.mkdir(runDir, { recursive: true });
  log.attachFile(path.join(runDir, 'otto.log'));
  await jira
    .addComment(ticket.key, redact(buildPickupComment()))
    .catch((err) => log.warn('pickup comment failed', { error: err.message }));

  let outcome;
  let failure;
  try {
    outcome = await deps.runTicket({ ticket, identity, config, runId, log, secrets, deps: { steps: deps.steps } });
  } catch (err) {
    failure = err;
  }

  let summary;
  if (outcome) {
    const preview = previewUrl(outcome.branch, { owner: config.githubOwner, repo: config.githubRepo });
    await jira.addComment(ticket.key, redact(buildDoneComment({ outcome, preview })));
    await jira.updateLabels(ticket.key, { remove: [LABELS.working], add: [LABELS.done] });
    summary = { ...base, outcome: 'done', prUrl: outcome.prUrl };
  } else {
    const stage = failure instanceof StageError ? failure.stage : 'internal';
    log.error('run failed', { stage, error: failure.message, stack: failure.stack });
    const comment = buildFailedComment({
      stage,
      message: failure.message,
      details: failure.details || '',
      runId,
    });
    await jira.addComment(ticket.key, redact(comment));
    await jira.updateLabels(ticket.key, { remove: [LABELS.working], add: [LABELS.failed] });
    summary = { ...base, outcome: 'failed', stage };
  }
  await appendHistory(stateDir, { ...summary, finishedAt: deps.now().toISOString() });
  await clearCurrentRun(stateDir);
  log.info('run finished', summary);
  return summary;
}

export async function tick({ config, users, log, deps: overrides = {} }) {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const paths = dataPaths(config.dataDir);
  const release = await acquireLock(paths.stateDir);
  if (!release) {
    log.info('another otto-bot run holds the lock; skipping');
    return { status: 'locked' };
  }
  try {
    await cleanupRuns({ runsRoot: paths.runsRoot, workRoot: paths.workRoot, retentionDays: config.runRetentionDays });
    await recover({ config, users, log, deps });
    const issue = await masterJira(config, users, deps).searchOne(config.jql);
    if (!issue) {
      log.info('no tickets labeled otto');
      return { status: 'idle' };
    }
    const result = await processTicket({ issue, config, users, log, deps });
    return { status: result.outcome, key: result.key, runId: result.runId };
  } finally {
    await release();
  }
}
