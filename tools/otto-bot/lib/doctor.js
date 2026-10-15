import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCopilotEnv } from './copilot.js';
import { runCommand } from './exec.js';
import { createGithubClient } from './github.js';
import { identitySlug } from './identity.js';
import { createJiraClient } from './jira.js';
import { dataPaths } from './paths.js';

const DEFAULT_DEPS = Object.freeze({ createJiraClient, createGithubClient, runCommand });

async function check(name, fn) {
  try {
    const detail = await fn();
    return { name, ok: true, detail };
  } catch (err) {
    return { name, ok: false, detail: err.message };
  }
}

export async function checkIdentity({ label, slug, creds, config, deps: overrides = {} }) {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const checks = [
    await check('jira', async () => {
      const me = await deps.createJiraClient({ baseUrl: config.jiraBaseUrl, token: creds.jiraPat }).myself();
      return `authenticated as ${me.name}`;
    }),
    await check('github', async () => {
      const gh = deps.createGithubClient({
        owner: config.githubOwner,
        repo: config.githubRepo,
        token: creds.githubPat,
      });
      const repo = await gh.getRepo();
      if (!repo.canPush) throw new Error(`no push permission on ${config.githubOwner}/${config.githubRepo}`);
      return `can push; token expires ${repo.tokenExpiry || 'never/unknown'}`;
    }),
    await check('copilot', async () => {
      const copilotHome = path.join(dataPaths(config.dataDir).copilotHomesDir, slug);
      await fs.mkdir(copilotHome, { recursive: true, mode: 0o700 });
      const result = await deps.runCommand(
        config.copilotBin,
        [
          '-p',
          'Reply with exactly: OK',
          '--no-ask-user',
          '--disable-builtin-mcps',
          '--no-color',
          `--model=${config.model}`,
        ],
        {
          env: buildCopilotEnv({ baseEnv: process.env, copilotHome, token: creds.copilotPat }),
          timeoutMs: 2 * 60 * 1000,
        },
      );
      if (result.code !== 0 || !/\bOK\b/.test(result.stdout)) {
        throw new Error(
          `Copilot CLI smoke test failed (exit ${result.code}): ${(result.stderr || result.stdout).slice(-500)}`,
        );
      }
      return 'Copilot CLI answered';
    }),
    await check('git-identity', async () => {
      if (!creds.gitName || !creds.gitEmail) throw new Error('gitName and gitEmail are required');
      return `${creds.gitName} <${creds.gitEmail}>`;
    }),
  ];
  return { label, checks };
}

export async function runDoctor({ config, users, deps }) {
  const entries = [
    ['master', identitySlug('master', true), users.master],
    ...Object.entries(users.users || {}).map(([name, creds]) => [name, identitySlug(name, false), creds]),
  ];
  const results = [];
  for (const [label, slug, creds] of entries) {
    results.push(await checkIdentity({ label, slug, creds, config, deps }));
  }
  return results;
}

export function doctorOk(results) {
  return results.every((r) => r.checks.every((c) => c.ok));
}

export function formatDoctor(results) {
  return results
    .flatMap((r) => r.checks.map((c) => `${c.ok ? '✔' : '✘'} ${r.label} ${c.name}: ${c.detail}`))
    .join('\n');
}
