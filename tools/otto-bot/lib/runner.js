import fs from 'node:fs/promises';
import path from 'node:path';
import { runCopilot } from './copilot.js';
import { StageError } from './errors.js';
import { buildCommitMessage, buildPrBody, buildPrTitle, commitAndPush, createGithubClient } from './github.js';
import { checkDiff, collectDiff } from './guardrails.js';
import { issueUrl } from './jira.js';
import { runPaths } from './paths.js';
import { qualityLoop, runQuality } from './quality.js';
import { createRedactor } from './redact.js';
import {
  buildRepairMarkdown,
  buildTaskMarkdown,
  INITIAL_PROMPT,
  parseResult,
  REPAIR_FILE,
  REPAIR_PROMPT,
  RESULT_FILE,
  TASK_FILE,
} from './task.js';
import {
  branchName,
  createWorktree,
  ensureMirror,
  gitAuthEnv,
  prepareWorktree,
  removeWorktree,
  writeAskpass,
} from './workspace.js';

const MINUTE_MS = 60 * 1000;

export const DEFAULT_STEPS = Object.freeze({
  writeAskpass,
  ensureMirror,
  createWorktree,
  prepareWorktree,
  removeWorktree,
  runCopilot,
  collectDiff,
  runQuality,
  commitAndPush,
  createGithubClient,
});

export function previewUrl(branch, { owner, repo }) {
  return `https://${branch}--${repo}--${owner}.aem.page/`;
}

async function readResult(workDir) {
  let text;
  try {
    text = await fs.readFile(path.join(workDir, RESULT_FILE), 'utf8');
  } catch {
    throw new StageError('copilot', `Copilot finished without writing ${RESULT_FILE}`);
  }
  try {
    return parseResult(text);
  } catch (err) {
    throw new StageError('copilot', err.message);
  }
}

export async function runTicket({ ticket, identity, config, runId, log, secrets, dryRun = false, deps = {} }) {
  const steps = { ...DEFAULT_STEPS, ...deps.steps };
  const paths = runPaths(config.dataDir, runId);
  const { workDir, runDir } = paths;
  const branch = branchName(ticket.key);
  const baseRef = `origin/${config.baseBranch}`;
  const remoteUrl = `https://github.com/${config.githubOwner}/${config.githubRepo}.git`;
  const copilotHome = path.join(paths.copilotHomesDir, identity.slug);
  await fs.mkdir(runDir, { recursive: true });
  const askpassPath = await steps.writeAskpass(paths.binDir);
  const gitEnv = gitAuthEnv({ askpassPath, token: identity.creds.githubPat });

  let session = 0;
  const copilot = async (prompt, timeoutMinutes) => {
    session += 1;
    log.info('copilot session start', { session, timeoutMinutes });
    await steps.runCopilot({
      copilotBin: config.copilotBin,
      workDir,
      prompt,
      model: config.model,
      timeoutMs: timeoutMinutes * MINUTE_MS,
      copilotHome,
      token: identity.creds.copilotPat,
      runDir,
      sessionName: `session-${session}`,
    });
  };

  const guard = async () => {
    const diff = await steps.collectDiff(workDir, baseRef);
    if (diff.changedFiles.length === 0) throw new StageError('guardrails', 'Copilot made no changes');
    const check = checkDiff({ ...diff, protectedPaths: config.protectedPaths, secrets });
    if (!check.ok) {
      throw new StageError('guardrails', 'The change breaks otto-bot guardrails', check.violations.join('\n'));
    }
    log.info('guardrails passed', { files: diff.changedFiles.length });
  };

  let worktreeCreated = false;
  try {
    try {
      await steps.ensureMirror({ mirrorDir: paths.mirrorDir, remoteUrl, env: gitEnv });
      await steps.createWorktree({ mirrorDir: paths.mirrorDir, workDir, branch, baseBranch: config.baseBranch });
      worktreeCreated = true;
      await steps.prepareWorktree({ workDir, log });
    } catch (err) {
      throw err instanceof StageError ? err : new StageError('workspace', err.message);
    }
    await fs.writeFile(
      path.join(workDir, TASK_FILE),
      buildTaskMarkdown(ticket, { protectedPaths: config.protectedPaths }),
    );

    await copilot(INITIAL_PROMPT, config.copilotTimeoutMinutes);
    let result = await readResult(workDir);
    if (result.status === 'blocked') {
      throw new StageError('blocked', result.summary, result.openQuestions.join('\n'));
    }
    await guard();

    const quality = await qualityLoop({
      check: () => steps.runQuality({ workDir }),
      repair: async ({ attempt, output }) => {
        log.warn('quality failed; asking Copilot to repair', { attempt });
        await fs.writeFile(
          path.join(workDir, REPAIR_FILE),
          buildRepairMarkdown({ attempt, maxRepairs: config.maxRepairs, output }),
        );
        await copilot(REPAIR_PROMPT, config.repairTimeoutMinutes);
      },
      guard,
      maxRepairs: config.maxRepairs,
    });
    result = await readResult(workDir).catch(() => result);

    const title = buildPrTitle({ ticket, qualityOk: quality.ok });
    const body = buildPrBody({
      ticket,
      jiraUrl: issueUrl(config.jiraBaseUrl, ticket.key),
      result,
      quality,
      identity,
      runId,
    });
    const outcome = { dryRun, branch, workDir, result, quality, title, body };
    if (dryRun) return outcome;

    let sha;
    try {
      sha = await steps.commitAndPush({
        workDir,
        branch,
        message: buildCommitMessage({ ticket, result }),
        gitName: identity.creds.gitName,
        gitEmail: identity.creds.gitEmail,
        env: gitEnv,
      });
    } catch (err) {
      throw err instanceof StageError ? err : new StageError('push', err.message);
    }
    log.info('pushed branch', { branch, sha });

    try {
      const gh = steps.createGithubClient({
        owner: config.githubOwner,
        repo: config.githubRepo,
        token: identity.creds.githubPat,
        redact: createRedactor(secrets),
      });
      const existing = await gh.findOpenPr(branch);
      if (existing) {
        await gh.updatePr(existing.number, { title, body });
        await gh.commentOnPr(existing.number, `🤖 otto-bot pushed \`${sha}\` from run \`${runId}\`.`);
        return { ...outcome, sha, prUrl: existing.html_url, prNumber: existing.number, reusedPr: true };
      }
      const pr = await gh.createDraftPr({ title, body, head: branch, base: config.baseBranch });
      return { ...outcome, sha, prUrl: pr.html_url, prNumber: pr.number, reusedPr: false };
    } catch (err) {
      throw new StageError('pr', err.message);
    }
  } finally {
    if (worktreeCreated && !dryRun) {
      await steps
        .removeWorktree({ mirrorDir: paths.mirrorDir, workDir })
        .catch((err) => log.warn('could not remove worktree', { error: err.message }));
    }
  }
}
