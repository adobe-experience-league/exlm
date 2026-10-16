import { StageError } from './errors.js';
import { runCommand } from './exec.js';
import { createRedactor } from './redact.js';
import { trimOutput } from './task.js';

export const COAUTHOR_TRAILER = 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>';

const BEFORE_URL = 'https://main--exlm--adobe-experience-league.aem.live';

export class GithubError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'GithubError';
    this.status = status;
  }
}

export function createGithubClient({
  owner,
  repo,
  token,
  fetchImpl = fetch,
  apiBase = 'https://api.github.com',
  redact = createRedactor([token]),
}) {
  const repoPath = `/repos/${owner}/${repo}`;
  const redactString = (value) => (typeof value === 'string' ? redact(value) : value);

  async function request(method, pathname, body) {
    const res = await fetchImpl(`${apiBase}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new GithubError(
        res.status,
        `GitHub ${method} ${pathname.split('?')[0]} failed: ${res.status} ${text.slice(0, 300)}`,
      );
    }
    return { data: text ? JSON.parse(text) : null, headers: res.headers };
  }

  async function graphql(query, variables) {
    const { data } = await request('POST', '/graphql', { query, variables });
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const message = data.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join('; ');
      throw new StageError('pr', redactString(`GitHub GraphQL failed: ${message || 'unknown error'}`));
    }
    return data;
  }

  return {
    async getRepo() {
      const { data, headers } = await request('GET', repoPath);
      return {
        canPush: data?.permissions?.push === true,
        tokenExpiry: headers.get('github-authentication-token-expiration'),
      };
    },

    async findOpenPr(branch) {
      const params = new URLSearchParams({ state: 'open', head: `${owner}:${branch}` });
      const { data } = await request('GET', `${repoPath}/pulls?${params}`);
      return data?.[0] ?? null;
    },

    async createDraftPr({ title, body, head, base }) {
      const { data } = await request('POST', `${repoPath}/pulls`, {
        title: redactString(title),
        body: redactString(body),
        head,
        base,
        draft: true,
      });
      return data;
    },

    async updatePr(number, { title, body }) {
      const { data } = await request('PATCH', `${repoPath}/pulls/${number}`, {
        title: redactString(title),
        body: redactString(body),
      });
      return data;
    },

    async commentOnPr(number, body) {
      await request('POST', `${repoPath}/issues/${number}/comments`, { body: redactString(body) });
    },

    async convertPullRequestToDraft(pr) {
      if (!pr.node_id)
        throw new StageError('pr', `Cannot convert PR #${pr.number} to draft because node_id is missing`);
      const data = await graphql(
        `
          mutation ConvertPullRequestToDraft($pullRequestId: ID!) {
            convertPullRequestToDraft(input: { pullRequestId: $pullRequestId }) {
              pullRequest {
                isDraft
              }
            }
          }
        `,
        { pullRequestId: pr.node_id },
      );
      const isDraft = data?.data?.convertPullRequestToDraft?.pullRequest?.isDraft;
      if (isDraft !== true) {
        throw new StageError('pr', redactString(`GitHub did not confirm PR #${pr.number} was converted to draft`));
      }
    },
  };
}

export function buildCommitMessage({ ticket, result, redact = (value) => String(value ?? '') }) {
  return `${ticket.key}: ${redact(ticket.summary)}\n\n${redact(result.summary)}\n\n${COAUTHOR_TRAILER}\n`;
}

export async function commitAndPush({
  workDir,
  branch,
  message,
  gitName,
  gitEmail,
  env = process.env,
  run = runCommand,
}) {
  const step = async (name, args, input) => {
    const res = await run('git', args, { cwd: workDir, env, input, timeoutMs: 5 * 60 * 1000 });
    if (res.code !== 0) throw new StageError('push', `git ${name} failed`, res.stderr.trim());
    return res.stdout.trim();
  };

  const identity = ['-c', `user.name=${gitName}`, '-c', `user.email=${gitEmail}`];
  await step('commit', [...identity, 'commit', '--no-verify', '-F', '-'], message);
  await step('push', ['push', '--no-verify', '--force', 'origin', `HEAD:refs/heads/${branch}`]);
  return step('rev-parse', ['rev-parse', 'HEAD']);
}

export function toTestPath(p) {
  return `$${p}${p.includes('?') ? '&' : '?'}martech=off`;
}

export function buildPrTitle({ ticket, qualityOk }) {
  return `${qualityOk ? '' : '[quality failing] '}${ticket.key}: ${ticket.summary}`;
}

export function buildPrBody({ ticket, jiraUrl, result, quality, identity, runId }) {
  const testLines = ['$', ...result.testUrls.map(toTestPath)].join('\n');
  const who = identity.isMaster
    ? `the otto-bot master account (${identity.fallbackReason})`
    : `${identity.name}'s credentials`;
  const warning = quality.ok
    ? ''
    : `## ⚠️ Quality failing

\`npm run quality\` still fails after ${quality.repairs} Copilot repair attempt(s). Fix before marking ready for review.

\`\`\`text
${trimOutput(quality.output, 6000)}
\`\`\`

`;
  const questions = result.openQuestions.length
    ? `
## Open questions

${result.openQuestions.map((q) => `- ${q}`).join('\n')}
`
    : '';

  return `${warning}Jira ID: [${ticket.key}](${jiraUrl})

Test URLs:

- Before: ${BEFORE_URL}

${testLines}

## AI Review Notes

- Summary: ${result.summary}
- Implemented using ${who}.
- Run ID: ${runId}
${questions}
---

Generated by otto-bot
`;
}
