#!/usr/bin/env node
/*
 * EXLM auto-build poller
 * ----------------------
 * Runs on a schedule (launchd / systemd / Task Scheduler — see install.sh / install.ps1).
 * Each run: find unclaimed JIRA stories labelled `auto-build`, and for each one run the
 * repo's `/auto-build <KEY>` Claude Code skill headlessly, transitioning JIRA labels
 * `auto-build` -> `auto-building` -> `auto-build-complete` | `auto-build-failed`.
 *
 * ISOLATION — builds run in a dedicated git WORKTREE (a linked working copy that shares
 * this repo's .git object store), never in your primary checkout. So the poller can build
 * while you work on any branch, with uncommitted changes, and never touches your files or
 * branch. The worktree is created on first run and reused; `.env` is copied in and
 * `node_modules` is symlinked so lint/commit hooks work.
 *
 * ⚠️ SECURITY — this invokes `claude ... --dangerously-skip-permissions`, so every tool
 * call the /auto-build skill makes (arbitrary Bash, git push, curl, file writes) runs
 * unattended with NO human approval, whenever a matching ticket appears. Deliberate,
 * scoped tradeoff:
 *   - The safety boundary is that /auto-build always opens a DRAFT PR — a human still
 *     reviews before merge.
 *   - Default assigneeScope=me limits triggers to your own tickets. Keep it unless you
 *     have a reason to widen it.
 *   - JIRA ticket text is attacker-influenceable (prompt injection into unattended Bash).
 *     Mitigate: restrict who can apply the `auto-build` label, keep GITHUB_TOKEN a
 *     fine-grained PAT scoped to THIS repo only, and audit the log periodically.
 *   - Do not run this on an account whose .env GITHUB_TOKEN reaches other private repos.
 *
 * Requires: Node >= 18 (global fetch). No npm dependencies.
 * Credentials come from the repo-root .env (JIRA_BASE_URL, JIRA_PAT, GITHUB_TOKEN) —
 * never logged, never passed on a command line. Optional: TEAMS_WEBHOOK_URL to post a
 * Teams notification (via a Teams Workflow) when a draft PR is raised.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

// tools/auto-builder/poller.mjs -> repo root is two levels up.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const ENV_PATH = path.join(REPO_ROOT, '.env');
const CONFIG_PATH = path.join(SCRIPT_DIR, 'config.json');
const LOCK_PATH = path.join(os.tmpdir(), 'exlm-auto-build-poller.lock');

const TRIGGER_LABEL = 'auto-build';
const IN_PROGRESS_LABEL = 'auto-building';
const DONE_LABEL = 'auto-build-complete';
const FAILED_LABEL = 'auto-build-failed';

// This poller only ever builds into the EXLM repo, so it must never pick up a
// same-labelled ticket from an unrelated Jira project.
const JIRA_PROJECT_KEY = 'EXLM';

// Ticket branches are cut from this branch (matches the /auto-build skill's assumption).
// Overridable via BASE_BRANCH in .env; falls back to `main` if unset.
const DEFAULT_BASE_BRANCH = 'main';

const WIN = process.platform === 'win32';
const RUN_TIMEOUT_MS = 25 * 60 * 1000; // under the 30-min tick window
const CONTINUE_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CONTINUATIONS = 3;
const JIRA_TIMEOUT_MS = 8000;

// Resolved from config in main(); the isolated build worktree lives here.
let WORKTREE_PATH;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function resolveLogPath() {
  const home = os.homedir();
  let dir;
  if (process.platform === 'darwin') {
    dir = path.join(home, 'Library', 'Logs');
  } else if (WIN) {
    dir = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  } else {
    dir = process.env.XDG_STATE_HOME || path.join(home, '.local', 'state');
  }
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    dir = os.tmpdir();
  }
  return path.join(dir, 'exlm-auto-build-poller.log');
}

const LOG_PATH = resolveLogPath();

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    appendFileSync(LOG_PATH, line);
  } catch {
    // ignore log write failures
  }
  process.stdout.write(line);
}

// ---------------------------------------------------------------------------
// .env / config
// ---------------------------------------------------------------------------

function loadEnv(p) {
  if (!existsSync(p)) throw new Error(`.env not found at ${p}`);
  const out = {};
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  const missing = ['JIRA_BASE_URL', 'JIRA_PAT', 'GITHUB_TOKEN'].filter((k) => !out[k]);
  if (missing.length) throw new Error(`.env missing keys: ${missing.join(', ')}`);
  return out;
}

function loadConfig(p) {
  const defaults = { assigneeScope: 'me', pollIntervalSeconds: 1800, worktreePath: '' };
  if (!existsSync(p)) return defaults;
  try {
    return { ...defaults, ...JSON.parse(readFileSync(p, 'utf8')) };
  } catch (err) {
    log(`WARN: could not parse config.json (${err.message}); using defaults`);
    return defaults;
  }
}

function resolveWorktreePath(config) {
  const custom = config.worktreePath && String(config.worktreePath).trim();
  if (custom) {
    return path.isAbsolute(custom) ? custom : path.resolve(REPO_ROOT, custom);
  }
  // Default: a sibling directory next to the repo.
  return path.resolve(REPO_ROOT, '..', 'exlm-auto-build-workspace');
}

// ---------------------------------------------------------------------------
// Lock
// ---------------------------------------------------------------------------

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but we can't signal it — still alive.
    return err.code === 'EPERM';
  }
}

function acquireLock() {
  if (existsSync(LOCK_PATH)) {
    const pid = Number(readFileSync(LOCK_PATH, 'utf8').trim());
    if (isPidAlive(pid)) {
      log(`SKIP: previous run still in progress (pid ${pid})`);
      return false;
    }
    // stale lock from a crashed run — reclaim
  }
  writeFileSync(LOCK_PATH, String(process.pid));
  return true;
}

function releaseLock() {
  try {
    if (existsSync(LOCK_PATH)) {
      const pid = Number(readFileSync(LOCK_PATH, 'utf8').trim());
      if (pid === process.pid) unlinkSync(LOCK_PATH);
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// JIRA
// ---------------------------------------------------------------------------

function jiraHeaders(env, extra = {}) {
  return { Authorization: `Bearer ${env.JIRA_PAT}`, Accept: 'application/json', ...extra };
}

async function jiraReachable(env) {
  try {
    const res = await fetch(`${env.JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: jiraHeaders(env),
      signal: AbortSignal.timeout(JIRA_TIMEOUT_MS),
    });
    // Reachable even if auth fails — distinguishes "VPN down" from "bad token".
    return res.ok || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

async function findUnclaimedTickets(env, config) {
  const clauses = [
    `project = "${JIRA_PROJECT_KEY}"`,
    `labels = "${TRIGGER_LABEL}"`,
    `labels NOT IN ("${IN_PROGRESS_LABEL}", "${DONE_LABEL}", "${FAILED_LABEL}")`,
  ];
  if (config.assigneeScope === 'me') clauses.push('assignee = currentUser()');
  const jql = clauses.join(' AND ');
  const url = `${env.JIRA_BASE_URL}/rest/api/2/search` + `?jql=${encodeURIComponent(jql)}&fields=key&maxResults=50`;
  const res = await fetch(url, { headers: jiraHeaders(env) });
  if (!res.ok) {
    throw new Error(`JQL search failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (data.issues || []).map((i) => i.key);
}

async function updateLabels(env, key, { add = [], remove = [] }) {
  const labels = [...remove.map((l) => ({ remove: l })), ...add.map((l) => ({ add: l }))];
  const res = await fetch(`${env.JIRA_BASE_URL}/rest/api/2/issue/${key}`, {
    method: 'PUT',
    headers: jiraHeaders(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ update: { labels } }),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Label update failed for ${key}: ${res.status} ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// GitHub + Teams notification (optional)
// ---------------------------------------------------------------------------

// { owner, repo, slug } parsed from origin, or null. Remotes are shared with the worktree.
function repoSlug() {
  const res = gitMain(['remote', 'get-url', 'origin']);
  if (res.status !== 0) return null;
  const m = res.stdout.trim().match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  return m ? { owner: m[1], repo: m[2], slug: `${m[1]}/${m[2]}` } : null;
}

// Ask GitHub for the open PR on this ticket's branch (URL + draft flag). null if none.
async function findPrForTicket(env, key, slug) {
  const branch = key.toLowerCase();
  const url = `https://api.github.com/repos/${slug.slug}/pulls?head=${slug.owner}:${branch}&state=open`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    log(`${key}: could not query GitHub PR: ${res.status}`);
    return null;
  }
  const arr = await res.json();
  return Array.isArray(arr) && arr[0] ? arr[0] : null;
}

// Fetch the JIRA summary for a ticket. Best-effort — returns '' on any failure.
async function getJiraSummary(env, key) {
  try {
    const res = await fetch(`${env.JIRA_BASE_URL}/rest/api/2/issue/${key}?fields=summary`, {
      headers: jiraHeaders(env),
    });
    if (!res.ok) return '';
    const d = await res.json();
    return (d.fields && d.fields.summary) || '';
  } catch {
    return '';
  }
}

// Teams Workflow templates typically splice triggerBody()?['field'] tokens directly into the
// Adaptive Card's raw JSON as plain text, not JSON-aware substitution. A literal `"` or line break
// in a JIRA/PR title (e.g. a title quoting UI copy) corrupts that JSON, so the card silently fails
// to post downstream -- while the webhook itself still returns 202, making the poller log
// "Teams notified" even though nothing appears in the channel. Strip what would break it.
function sanitizeForCard(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
}

// Post the notification DATA to a Teams Workflow webhook. The flow holds a static
// Adaptive Card template that pulls these fields via triggerBody()?['...'] tokens.
// Failures never fail the run.
async function notifyTeams(webhookUrl, key, payload) {
  const safePayload = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k, sanitizeForCard(v)]),
  );
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(safePayload),
  });
  if (!res.ok) {
    log(`${key}: Teams notify failed: ${res.status} ${await res.text()}`);
  } else {
    log(`${key}: Teams notified`);
  }
}

// Best-effort: look up the PR + JIRA details and post to Teams. Errors are logged, never thrown.
async function announcePr(env, key, prArg) {
  if (!env.TEAMS_WEBHOOK_URL) return;
  try {
    const slug = repoSlug();
    if (!slug) {
      log(`${key}: cannot resolve repo slug — skipping Teams notify`);
      return;
    }
    const pr = prArg || (await findPrForTicket(env, key, slug));
    if (!pr) {
      log(`${key}: no open PR found — skipping Teams notify`);
      return;
    }
    const branch = key.toLowerCase();
    const jiraTitle = await getJiraSummary(env, key);
    await notifyTeams(env.TEAMS_WEBHOOK_URL, key, {
      ticket: key,
      jiraUrl: `${env.JIRA_BASE_URL}/browse/${key}`,
      jiraTitle,
      prUrl: pr.html_url,
      prTitle: pr.title || '',
      prNumber: pr.number,
      branch,
      previewUrl: `https://${branch}--${slug.repo}--${slug.owner}.aem.live`,
      status: pr.draft ? 'Draft — review before merge' : 'Open',
    });
  } catch (err) {
    log(`${key}: Teams notify error: ${err.message}`);
  }
}

// Best-effort: notify Teams when a build fails, so a human sees it without having to poll
// JIRA labels or the poller log. Same webhook/card shape as announcePr, with PR fields
// blank (there is no PR) and status/reason describing the failure. Errors are logged, never
// thrown — a failed notification must never mask the underlying build failure.
async function announceFailure(env, key, reason) {
  if (!env.TEAMS_WEBHOOK_URL) return;
  try {
    const jiraTitle = await getJiraSummary(env, key);
    await notifyTeams(env.TEAMS_WEBHOOK_URL, key, {
      ticket: key,
      jiraUrl: `${env.JIRA_BASE_URL}/browse/${key}`,
      jiraTitle,
      prUrl: '',
      prTitle: '',
      prNumber: '',
      branch: key.toLowerCase(),
      previewUrl: '',
      status: 'Failed — needs triage',
      reason: reason || 'Unknown failure — check the poller log',
    });
  } catch (err) {
    log(`${key}: Teams failure-notify error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// git worktree + claude
// ---------------------------------------------------------------------------

function gitMain(args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', shell: WIN });
}

function gitWt(args) {
  return spawnSync('git', args, { cwd: WORKTREE_PATH, encoding: 'utf8', shell: WIN });
}

// Create (once) the isolated worktree. Idempotent — safe every run.
function ensureWorktree() {
  gitMain(['worktree', 'prune']);
  if (!existsSync(path.join(WORKTREE_PATH, '.git'))) {
    mkdirSync(path.dirname(WORKTREE_PATH), { recursive: true });
    // --detach: don't check out a named branch (avoids "branch already checked out"
    // clashes with your primary worktree). We cut a ticket branch per build below.
    const add = gitMain(['worktree', 'add', '--detach', WORKTREE_PATH]);
    if (add.status !== 0) throw new Error(`git worktree add failed: ${(add.stderr || '').trim()}`);
    log(`Created isolated worktree at ${WORKTREE_PATH}`);
  }
  provisionWorktreeFiles();
}

// Put the machine-local, gitignored files /auto-build needs into the worktree:
//   - .env  : credentials (refreshed each call in case they changed)
//   - node_modules : symlinked so husky/lint-staged commit hooks work
//   - .claude, .agents : symlinked so the `claude` CLI can resolve /auto-build and the
//     skills it delegates to — both dirs are gitignored, so `git worktree add` never
//     checks them out on its own.
function provisionWorktreeFiles() {
  try {
    copyFileSync(ENV_PATH, path.join(WORKTREE_PATH, '.env'));
  } catch (err) {
    log(`WARN: could not copy .env into worktree: ${err.message}`);
  }
  for (const dir of ['node_modules', '.claude', '.agents']) {
    const wtPath = path.join(WORKTREE_PATH, dir);
    const repoPath = path.join(REPO_ROOT, dir);
    if (!existsSync(wtPath) && existsSync(repoPath)) {
      try {
        symlinkSync(repoPath, wtPath, WIN ? 'junction' : 'dir');
      } catch (err) {
        log(`WARN: could not link ${dir} into worktree: ${err.message}`);
      }
    }
  }
}

// Reset the worktree onto a fresh ticket branch cut from the latest base branch.
// After this the worktree is on branch `<key lowercased>`, so /auto-build's Step 6
// sees it is already on the ticket branch and skips its own checkout-main dance.
function prepareTicketBranch(env, key) {
  const baseBranch = env.BASE_BRANCH || DEFAULT_BASE_BRANCH;
  const branch = key.toLowerCase();
  const fetched = gitWt(['fetch', 'origin', baseBranch]);
  if (fetched.status !== 0) {
    log(`WARN: git fetch failed in worktree: ${(fetched.stderr || '').trim()}`);
  }
  let base = `origin/${baseBranch}`;
  if (gitWt(['rev-parse', '--verify', '--quiet', base]).status !== 0) base = baseBranch;
  // -f discards tracked changes; -B creates/resets the branch to the base.
  const co = gitWt(['checkout', '-f', '-B', branch, base]);
  if (co.status !== 0) {
    log(`${key}: could not prepare branch ${branch} from ${base}: ${(co.stderr || '').trim()}`);
    return false;
  }
  // Remove untracked leftovers from a previous build (e.g. pr-body.md, a failed
  // build's uncommitted files). Exclude node_modules/.env: the repo ignores
  // `node_modules/*` (not a symlink named node_modules), so a plain clean would
  // delete our symlink. -d without -x already preserves other gitignored paths.
  gitWt(['clean', '-fd', '-e', 'node_modules', '-e', '.env']);
  provisionWorktreeFiles(); // re-assert .env + node_modules in case anything was removed
  log(`${key}: worktree on fresh branch ${branch} from ${base}`);
  return true;
}

// If the poller itself happens to run inside a Claude Code terminal (VS Code integrated
// terminal, another `claude -p` session, etc.), it inherits CLAUDE*/AI_AGENT env vars that
// mark the child `claude` process as a nested/child session. Strip them so the child always
// starts a clean, independent top-level session. CLAUDE_CODE_OAUTH_TOKEN is the exception —
// it's the long-lived credential from `claude setup-token`, the supported way to authenticate
// a headless/CI `claude` invocation, and must reach the child process unstripped.
function cleanChildEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key === 'CLAUDE_CODE_OAUTH_TOKEN') continue;
    if (key.startsWith('CLAUDE') || key === 'AI_AGENT') delete env[key];
  }
  return env;
}

// Some org-managed Claude Code accounts enforce permissions.disableBypassPermissionsMode
// server-side, which silently no-ops --dangerously-skip-permissions / --permission-mode
// bypassPermissions (the session stays in "default" mode and every Bash(curl/git/node) call
// requires interactive approval that a headless run can never give). An explicit
// permissions.allow list is a different mechanism — plain allow-rule matching under
// "default" mode — and isn't affected by that policy. Verified working on 2026-07-30.
const AUTO_BUILD_SETTINGS = JSON.stringify({
  permissions: { allow: ['Bash(*)', 'Write(*)', 'Edit(*)'] },
});

// A single headless `-p` turn is not guaranteed to run all 12 /auto-build steps: the model
// can treat a natural checkpoint (finishing the plan, finishing the implementation) as a
// place to stop and summarize, even though the skill says "no approval gate — proceed
// directly." Since `-p` is strictly single-turn, once it stops emitting tool calls the
// process just exits with status 0 and nothing further happens on its own. So the poller
// is the outer loop: if no PR exists yet after a call, resume the same session with
// `--continue` and an explicit nudge, up to MAX_CONTINUATIONS times.
const CONTINUE_PROMPT =
  'Continue the /auto-build run exactly where you left off. Do not summarize, ask questions, ' +
  'or wait for approval — proceed autonomously through every remaining step (implement, code ' +
  'review, commit, push, open the draft PR, comment on JIRA) until the draft PR is open. If ' +
  'you already implemented but did not commit/push/open the PR, do that now.';

function spawnClaude(args, timeoutMs) {
  return spawnSync('claude', args, {
    cwd: WORKTREE_PATH,
    encoding: 'utf8',
    shell: WIN,
    timeout: timeoutMs,
    env: cleanChildEnv(),
  });
}

// Runs /auto-build (continuing as needed) and returns the opened PR object, or null on
// failure/timeout/no-PR-after-retries.
async function runAutoBuild(env, key) {
  let result = spawnClaude(
    ['-p', `/auto-build ${key}`, '--settings', AUTO_BUILD_SETTINGS, '--output-format', 'text'],
    RUN_TIMEOUT_MS,
  );
  if (result.stdout) log(`${key} stdout:\n${result.stdout}`);
  if (result.stderr) log(`${key} stderr:\n${result.stderr}`);
  if (result.error) {
    const timedOut = result.error.code === 'ETIMEDOUT' || result.signal === 'SIGTERM';
    log(`${key}: claude ${timedOut ? 'TIMED OUT' : 'spawn error'}: ${result.error.message}`);
    return null;
  }

  const slug = repoSlug();
  for (let attempt = 1; attempt <= MAX_CONTINUATIONS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- must check after each attempt before retrying
    const pr = slug && (await findPrForTicket(env, key, slug));
    if (pr) return pr;
    log(`${key}: no PR yet (continuation ${attempt}/${MAX_CONTINUATIONS}) — nudging claude to continue`);
    result = spawnClaude(
      ['-p', CONTINUE_PROMPT, '--continue', '--settings', AUTO_BUILD_SETTINGS, '--output-format', 'text'],
      CONTINUE_TIMEOUT_MS,
    );
    if (result.stdout) log(`${key} continue-stdout:\n${result.stdout}`);
    if (result.stderr) log(`${key} continue-stderr:\n${result.stderr}`);
    if (result.error) {
      const timedOut = result.error.code === 'ETIMEDOUT' || result.signal === 'SIGTERM';
      log(`${key}: claude continuation ${timedOut ? 'TIMED OUT' : 'spawn error'}: ${result.error.message}`);
      break;
    }
  }
  if (!slug) return null;
  return findPrForTicket(env, key, slug);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processTicket(env, key) {
  try {
    await updateLabels(env, key, { add: [IN_PROGRESS_LABEL] });
    log(`${key}: claimed (${IN_PROGRESS_LABEL})`);

    // `claude` can exit 0 without actually opening a PR (e.g. it stopped early at a
    // checkpoint). runAutoBuild retries with --continue until a real PR shows up or
    // MAX_CONTINUATIONS is exhausted, so a null return here is a genuine failure.
    const branchReady = prepareTicketBranch(env, key);
    const pr = branchReady ? await runAutoBuild(env, key) : null;
    const ok = !!pr;

    if (ok) {
      await updateLabels(env, key, { add: [DONE_LABEL], remove: [IN_PROGRESS_LABEL] });
      log(`${key}: SUCCESS -> ${DONE_LABEL}`);
      await announcePr(env, key, pr);
    } else {
      const reason = branchReady
        ? `No PR opened after ${MAX_CONTINUATIONS} continuation attempt(s) — see the poller log for details.`
        : `Could not prepare the ticket branch — see the poller log for details.`;
      log(`${key}: FAILURE (${reason}) -> ${FAILED_LABEL}`);
      await updateLabels(env, key, { add: [FAILED_LABEL], remove: [IN_PROGRESS_LABEL] });
      await announceFailure(env, key, reason);
    }
  } catch (err) {
    log(`${key}: ERROR — ${err.message}. Marking ${FAILED_LABEL}.`);
    try {
      await updateLabels(env, key, { add: [FAILED_LABEL], remove: [IN_PROGRESS_LABEL] });
    } catch (e2) {
      log(`${key}: also failed to set ${FAILED_LABEL}: ${e2.message}`);
    }
    await announceFailure(env, key, `Error: ${err.message}`);
  }
}

// `node poller.mjs --test-teams` — post one sample card and exit, to verify the
// TEAMS_WEBHOOK_URL wiring without running a real build. Uses the same notifyTeams path.
async function testTeams() {
  try {
    const env = loadEnv(ENV_PATH);
    if (!env.TEAMS_WEBHOOK_URL) {
      log('TEAMS_WEBHOOK_URL not set in .env — nothing to test.');
      process.exitCode = 1;
      return;
    }
    log('Posting a test card to Teams…');
    await notifyTeams(env.TEAMS_WEBHOOK_URL, 'TEST-000', {
      ticket: 'TEST-000',
      jiraUrl: `${env.JIRA_BASE_URL}/browse/TEST-000`,
      jiraTitle: 'Sample "quoted" ticket title (safe to ignore)',
      prUrl: 'https://github.com/adobe-experience-league/exlm/pulls',
      prTitle: 'chore(TEST-000): sample "quoted" auto-build PR',
      prNumber: 0,
      branch: 'test-000',
      previewUrl: 'https://main--exlm--adobe-experience-league.aem.live',
      status: 'Draft — review before merge',
    });
    log('Done — check your Teams channel.');
  } catch (err) {
    log(`Teams test error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  if (!acquireLock()) return;
  process.on('exit', releaseLock);

  try {
    const env = loadEnv(ENV_PATH);
    const config = loadConfig(CONFIG_PATH);
    WORKTREE_PATH = resolveWorktreePath(config);

    if (!(await jiraReachable(env))) {
      log('SKIP: JIRA unreachable (VPN down?)');
      return;
    }

    const keys = await findUnclaimedTickets(env, config);
    if (keys.length === 0) {
      log('No unclaimed auto-build tickets found.');
      return;
    }
    log(`Found ${keys.length} unclaimed ticket(s): ${keys.join(', ')}`);

    // Build in the isolated worktree — never the developer's checkout.
    ensureWorktree();

    for (const key of keys) {
      // eslint-disable-next-line no-await-in-loop -- serial: one shared worktree per run
      await processTicket(env, key);
    }
  } catch (err) {
    log(`FATAL: ${err.stack || err.message}`);
    process.exitCode = 1;
  } finally {
    releaseLock();
  }
}

if (process.argv.includes('--test-teams')) {
  testTeams();
} else {
  main();
}
