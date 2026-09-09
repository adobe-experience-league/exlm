import { resolve } from 'node:path';
import { loadConfig } from './load-config.mjs';
import { isMainModule, repoRootFrom } from './paths.mjs';

export function artifactsToDelete(artifacts, { prefix, keepLastRuns }) {
  const relevant = artifacts.filter(
    (a) => typeof a.name === 'string' && a.name.startsWith(prefix) && a.expired !== true,
  );
  const byRun = new Map();
  for (const artifact of relevant) {
    const runId = artifact.workflow_run?.id;
    const created = artifact.created_at || '';
    if (!byRun.has(runId)) {
      byRun.set(runId, { created, items: [] });
    }
    const entry = byRun.get(runId);
    entry.items.push(artifact);
    if (created > entry.created) entry.created = created;
  }

  const newestFirst = [...byRun.entries()].sort(
    (a, b) => new Date(b[1].created).getTime() - new Date(a[1].created).getTime(),
  );
  const keep = new Set(newestFirst.slice(0, keepLastRuns).map(([id]) => id));
  return relevant.filter((artifact) => !keep.has(artifact.workflow_run?.id));
}

async function githubJson(url, token, method = 'GET') {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'exlm-page-performance-demo',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${method} ${url} failed: ${res.status} ${body}`);
  }
  if (method === 'DELETE') return null;
  return res.json();
}

export async function listAllArtifacts({ repo, token }) {
  const out = [];
  let page = 1;
  while (true) {
    const data = await githubJson(
      `https://api.github.com/repos/${repo}/actions/artifacts?per_page=100&page=${page}`,
      token,
    );
    const batch = data.artifacts || [];
    out.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return out;
}

export async function deleteArtifacts(artifacts, { repo, token }) {
  for (const artifact of artifacts) {
    try {
      await githubJson(`https://api.github.com/repos/${repo}/actions/artifacts/${artifact.id}`, token, 'DELETE');
      console.log(`Deleted artifact ${artifact.id} (${artifact.name})`);
    } catch (err) {
      if (/ 403 | 401 | 404 /.test(String(err.message))) {
        console.warn(`Skip delete ${artifact.id}: ${err.message}`);
        continue;
      }
      throw err;
    }
  }
}

export async function cleanupGitHubArtifacts({ repo, token, prefix = 'page-performance-', keepLastRuns = 5 }) {
  if (!token) throw new Error('GITHUB_TOKEN is required to delete artifacts');
  if (!repo) throw new Error('GITHUB_REPOSITORY is required');
  const artifacts = await listAllArtifacts({ repo, token });
  const doomed = artifactsToDelete(artifacts, { prefix, keepLastRuns });
  await deleteArtifacts(doomed, { repo, token });
  return { scanned: artifacts.length, deleted: doomed.length, keptRuns: keepLastRuns };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const repoRoot = repoRootFrom(import.meta.url);
  const cfg = await loadConfig(resolve(repoRoot, 'performance/config.json'));
  cleanupGitHubArtifacts({
    repo: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
    prefix: 'page-performance-',
    keepLastRuns: cfg.keepLastRuns,
  })
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
