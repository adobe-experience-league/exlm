import fs from 'node:fs/promises';
import path from 'node:path';
import { buildDoneComment, buildFailedComment, buildInterruptedComment, buildPickupComment } from './comments.js';
import { allSecrets } from './config.js';
import { createCredentialContext } from './credentials.js';
import { StageError } from './errors.js';
import { formatFallbackWarnings, withFallbackWarnings } from './fallback-warnings.js';
import { createGithubClient } from './github.js';
import { cleanupRuns } from './housekeeping.js';
import { resolveIdentity } from './identity.js';
import { createJiraClient, JiraError, toTicket } from './jira.js';
import { createNotifier } from './notify.js';
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

const notifierFor = ({ config, log, redact, deps }) => deps.notify || createNotifier({ config, log, redact });

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
  const warningText = formatFallbackWarnings(current.warnings);
  await jira.addComment(
    current.key,
    redact(
      `${buildInterruptedComment({ runId: current.runId })}${
        warningText ? `\nCredential fallback warning:\n${warningText}` : ''
      }`,
    ),
  );
  await jira.updateLabels(current.key, { remove: [LABELS.working], add: [LABELS.failed] });
  await notifierFor({ config, log, redact, deps })('failed', {
    ticket: toTicket({ ...issue, key: current.key }),
    identity: resolveIdentity(users, current.identity),
    stage: 'interrupted',
    warnings: current.warnings,
  });
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
  const base = { key: ticket.key, runId };
  const notify = notifierFor({ config, log, redact, deps });
  const current = { ...base, identity: identity.name, startedAt: deps.now().toISOString() };
  const credentials = createCredentialContext({
    identity,
    master: users.master,
    log,
    requestedUser: ticket.assignee || identity.name,
    onFallback: async () => writeCurrentRun(stateDir, { ...current, warnings: credentials.warnings }),
  });
  const jira = (operation) =>
    credentials.run('jira', (account) =>
      operation(
        deps.createJiraClient({
          baseUrl: config.jiraBaseUrl,
          token: account.creds.jiraPat,
        }),
      ),
    );
  log.info('claiming ticket', { ...base, identity: identity.name });
  await writeCurrentRun(stateDir, current);
  await fs.mkdir(runDir, { recursive: true });
  log.attachFile(path.join(runDir, 'otto.log'));
  try {
    await jira((client) => client.updateLabels(ticket.key, { remove: [LABELS.trigger], add: [LABELS.working] }));
  } catch (error) {
    if (!credentials.warnings.length && !(error instanceof JiraError && [401, 403].includes(error.status))) throw error;
    const summary = { ...base, outcome: 'failed', stage: 'claim' };
    if (credentials.warnings.length) summary.warnings = [...credentials.warnings];
    log.error('claim failed after credential fallback; Jira could not be updated', {
      ...summary,
      error: redact(error.message),
    });
    await appendHistory(stateDir, { ...summary, finishedAt: deps.now().toISOString() });
    await clearCurrentRun(stateDir);
    await notify('failed', {
      ticket,
      identity,
      stage: 'claim',
      reason: redact(error.message),
      warnings: credentials.warnings,
    });
    return summary;
  }

  let outcome;
  let failure;
  try {
    try {
      await jira((client) => client.addComment(ticket.key, redact(buildPickupComment())));
    } catch (error) {
      if (error instanceof StageError) throw error;
      if (error instanceof JiraError && [401, 403].includes(error.status))
        throw new StageError('claim', 'Jira pickup comment was denied', redact(error.message));
      log.warn('pickup comment failed', { error: redact(error.message) });
    }
    await notify('picked-up', { ticket, identity, warnings: credentials.warnings });
    outcome = await deps.runTicket({
      ticket,
      identity,
      credentials,
      config,
      runId,
      log,
      secrets,
      deps: { steps: deps.steps },
    });
  } catch (err) {
    failure = err;
  }

  let summary;
  try {
    if (outcome) {
      const preview = previewUrl(outcome.branch, { owner: config.githubOwner, repo: config.githubRepo });
      await jira((client) => client.addComment(ticket.key, redact(buildDoneComment({ outcome, preview }))));
      await jira((client) => client.updateLabels(ticket.key, { remove: [LABELS.working], add: [LABELS.done] }));
      summary = { ...base, outcome: 'done', prUrl: outcome.prUrl };
    } else {
      const stage = failure instanceof StageError ? failure.stage : 'internal';
      log.error('run failed', { stage, error: redact(failure.message), stack: redact(failure.stack) });
      const comment = buildFailedComment({
        stage,
        message: failure.message,
        details: failure.details || '',
        runId,
      });
      await jira((client) => client.addComment(ticket.key, redact(comment)));
      await jira((client) => client.updateLabels(ticket.key, { remove: [LABELS.working], add: [LABELS.failed] }));
      summary = { ...base, outcome: 'failed', stage };
    }
    if (credentials.warnings.length) {
      let prWarningCount = outcome?.warnings?.length || 0;
      let jiraWarningCount;
      do {
        await jira((client) =>
          client.addComment(
            ticket.key,
            redact(`Credential fallback warning:\n${formatFallbackWarnings(credentials.warnings)}`),
          ),
        );
        jiraWarningCount = credentials.warnings.length;
        if (outcome?.baseBody && prWarningCount !== credentials.warnings.length) {
          await credentials.run('github', (account) =>
            (deps.steps?.createGithubClient || createGithubClient)({
              owner: config.githubOwner,
              repo: config.githubRepo,
              token: account.creds.githubPat,
              redact,
            }).updatePr(outcome.prNumber, {
              title: outcome.title,
              body: withFallbackWarnings(outcome.baseBody, credentials.warnings),
            }),
          );
          prWarningCount = credentials.warnings.length;
        }
      } while (jiraWarningCount !== credentials.warnings.length);
    }
  } catch (error) {
    failure = error;
    summary = { ...base, outcome: 'failed', stage: 'reporting', ...(outcome ? { prUrl: outcome.prUrl } : {}) };
    log.error('could not finish Jira/PR reporting', { ...summary, error: redact(error.message) });
    await jira((client) =>
      client.updateLabels(ticket.key, {
        remove: [LABELS.working, LABELS.done],
        add: [LABELS.failed],
      }),
    ).catch((labelError) => log.error('could not mark Jira failed', { error: redact(labelError.message) }));
  }
  if (credentials.warnings.length) summary.warnings = [...credentials.warnings];
  await notify(summary.outcome, {
    ticket,
    identity,
    outcome,
    warnings: credentials.warnings,
    ...(failure ? { stage: summary.stage, reason: redact(failure.message) } : {}),
  });
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
    return {
      status: result.outcome,
      key: result.key,
      runId: result.runId,
      ...(result.warnings?.length ? { warnings: result.warnings } : {}),
    };
  } finally {
    await release();
  }
}
