export const TASK_FILE = '.otto/task.md';
export const REPAIR_FILE = '.otto/repair.md';
export const RESULT_FILE = '.otto/result.json';

export const INITIAL_PROMPT = `Read ${TASK_FILE} and complete the task it describes. When you are finished, write ${RESULT_FILE} exactly as ${TASK_FILE} specifies.`;
export const REPAIR_PROMPT = `Read ${REPAIR_FILE} and fix the quality failures it describes. Keep ${RESULT_FILE} accurate.`;

const escapeTags = (text) =>
  String(text || '').replace(/<\/?(ticket-[a-z]+)>/gi, (match) => match.replace('<', '&lt;').replace('>', '&gt;'));

const list = (items) => (items?.length ? items.map((item) => `- ${item}`).join('\n') : '- None');
const codeList = (items) => (items?.length ? items.map((item) => `- \`${item}\``).join('\n') : '- None');

export function trimOutput(text, max = 12000) {
  const value = String(text || '');
  if (value.length <= max) return value;
  return `[...truncated ${value.length - max} chars]\n${value.slice(-max)}`;
}

export function buildTaskMarkdown(ticket, { protectedPaths = [] } = {}) {
  return `# otto-bot task: ${escapeTags(ticket.key)}: ${escapeTags(ticket.summary)}

You are implementing a Jira ticket in the Adobe Experience League \`exlm\` repository (AEM Edge Delivery Services).

## Ticket

- Key: ${escapeTags(ticket.key)}
- Summary: ${escapeTags(ticket.summary)}
- Type: ${escapeTags(ticket.type)}
- Assignee: ${escapeTags(ticket.assignee || 'Unassigned')}
- Labels:
${list((ticket.labels || []).map(escapeTags))}
- Components:
${list((ticket.components || []).map(escapeTags))}

<ticket-description>
${escapeTags(ticket.description)}
</ticket-description>

## Required rules

- Read and follow \`AGENTS.md\` before editing.
- Implement only this ticket; do not broaden scope.
- Do not modify protected paths:
${codeList(protectedPaths)}
- Do not read or print secrets.
- Do not run \`git commit\`, create branches, push, or open pull requests.
- Run the smallest relevant tests first, then the project quality command if available.
- Keep changes surgical and directly related to the ticket.

## Result contract

When finished, write valid JSON to \`${RESULT_FILE}\` with this shape:

\`\`\`json
{
  "status": "done",
  "summary": "What changed and why",
  "testUrls": ["/relative/test/url"],
  "openQuestions": []
}
\`\`\`

Use \`"status": "blocked"\` only when the task cannot be completed without human input. Keep \`summary\` non-empty. Use relative paths for \`testUrls\`; do not include absolute URLs.
`;
}

export function buildRepairMarkdown({ attempt, maxRepairs, output }) {
  return `# otto-bot repair: attempt ${attempt} of ${maxRepairs}

The previous implementation did not pass quality checks. Read the failing output below, fix the issues, rerun the relevant checks, and keep \`${RESULT_FILE}\` accurate.

## Failing output

\`\`\`
${trimOutput(output)}
\`\`\`

Do not run \`git commit\`, create branches, push, or open pull requests.
`;
}

export class ResultError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResultError';
  }
}

function assertStringArray(value, name, validate = () => true) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !validate(item))) {
    throw new ResultError(`${name} must be an array of valid strings`);
  }
  return value;
}

export function parseResult(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new ResultError(`result must be valid JSON: ${err.message}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ResultError('result must be a JSON object');
  }
  if (!['done', 'blocked'].includes(data.status)) {
    throw new ResultError('status must be "done" or "blocked"');
  }
  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    throw new ResultError('summary must be a non-empty string');
  }

  return {
    status: data.status,
    summary: data.summary,
    testUrls: assertStringArray(data.testUrls, 'testUrls', (url) => url.startsWith('/') && !url.startsWith('//')),
    openQuestions: assertStringArray(data.openQuestions, 'openQuestions'),
  };
}
