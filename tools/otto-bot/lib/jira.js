import { isOttoComment } from './comments.js';

const FIELDS = 'summary,description,assignee,labels,issuetype,components,status,comment';
export const COMMENT_LIMITS = Object.freeze({ count: 20, perComment: 4000, total: 20000 });

export class JiraError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'JiraError';
    this.status = status;
  }
}

export function createJiraClient({ baseUrl, token, fetchImpl = fetch }) {
  const base = baseUrl.replace(/\/+$/, '');

  async function request(method, pathname, body) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetchImpl(`${base}${pathname}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new JiraError(
        res.status,
        `Jira ${method} ${pathname.split('?')[0]} failed: ${res.status} ${text.slice(0, 300)}`,
      );
    }
    return text ? JSON.parse(text) : null;
  }

  const issuePath = (key) => `/rest/api/2/issue/${encodeURIComponent(key)}`;

  return {
    async searchOne(jql) {
      const params = new URLSearchParams({ jql, maxResults: '1', fields: FIELDS });
      const data = await request('GET', `/rest/api/2/search?${params}`);
      return data?.issues?.[0] ?? null;
    },
    getIssue: (key) => request('GET', `${issuePath(key)}?fields=${FIELDS}`),
    myself: () => request('GET', '/rest/api/2/myself'),
    async updateLabels(key, { add = [], remove = [] }) {
      const labels = [...remove.map((label) => ({ remove: label })), ...add.map((label) => ({ add: label }))];
      await request('PUT', issuePath(key), { update: { labels } });
    },
    async addComment(key, body) {
      await request('POST', `${issuePath(key)}/comment`, { body });
    },
  };
}

export function selectComments(rawComments, limits = COMMENT_LIMITS) {
  const human = (rawComments || [])
    .filter((c) => c && typeof c.body === 'string' && c.body.trim() && !isOttoComment(c.body))
    .map((c) => ({
      author: c.author?.displayName || c.author?.name || 'Unknown',
      created: c.created || '',
      body:
        c.body.length > limits.perComment
          ? `${c.body.slice(0, limits.perComment)}\n[...truncated ${c.body.length - limits.perComment} chars]`
          : c.body,
    }));
  const recent = human.slice(-limits.count);
  let total = recent.reduce((sum, c) => sum + c.body.length, 0);
  while (recent.length && total > limits.total) total -= recent.shift().body.length;
  return recent;
}

export function toTicket(issue) {
  const f = issue.fields || {};
  return {
    key: issue.key,
    summary: f.summary || '',
    description: f.description || '',
    assignee: f.assignee?.name ?? null,
    labels: f.labels || [],
    type: f.issuetype?.name || '',
    components: (f.components || []).map((c) => c.name),
    comments: selectComments(f.comment?.comments),
  };
}

export function issueUrl(baseUrl, key) {
  return `${baseUrl.replace(/\/+$/, '')}/browse/${key}`;
}
