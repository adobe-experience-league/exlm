import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const IDENTITY_FIELDS = Object.freeze(['jiraPat', 'githubPat', 'copilotPat', 'gitName', 'gitEmail']);
export const SECRET_FIELDS = Object.freeze(['jiraPat', 'githubPat', 'copilotPat']);

export const DEFAULT_CONFIG = Object.freeze({
  jiraBaseUrl: 'https://jira.corp.adobe.com',
  jql: 'project = EXLM AND labels = otto AND labels not in (otto-working, otto-done, otto-failed) ORDER BY updated ASC',
  githubOwner: 'adobe-experience-league',
  githubRepo: 'exlm',
  baseBranch: 'main',
  model: 'auto',
  copilotBin: 'copilot',
  dataDir: path.join(os.homedir(), 'var'),
  copilotTimeoutMinutes: 40,
  repairTimeoutMinutes: 10,
  maxRepairs: 3,
  runRetentionDays: 14,
  slackWebhookUrl: '',
  protectedPaths: [
    '.github/**',
    'scripts/lib-franklin.js',
    'fstab.yaml',
    'tools/otto-bot/**',
    '.env*',
    '**/.env*',
    '**/.secrets',
    'skills-lock.json',
  ],
});

export function defaultConfigDir(env = process.env) {
  return env.OTTO_CONFIG_DIR || path.join(os.homedir(), '.config', 'otto-bot');
}

export function validateIdentity(label, entry, { requireJiraUser = false } = {}) {
  if (!entry || typeof entry !== 'object') return [`${label}: missing`];
  const problems = IDENTITY_FIELDS.filter((f) => typeof entry[f] !== 'string' || !entry[f].trim()).map(
    (f) => `${label}.${f}: missing`,
  );
  if (requireJiraUser && (typeof entry.jiraUser !== 'string' || !entry.jiraUser.trim())) {
    problems.push(`${label}.jiraUser: missing`);
  }
  if (typeof entry.copilotPat === 'string' && entry.copilotPat && !entry.copilotPat.startsWith('github_pat_')) {
    problems.push(
      `${label}.copilotPat: must be a fine-grained PAT (github_pat_...) with the Copilot Requests permission`,
    );
  }
  return problems;
}

export function validateUsers(users) {
  if (!users || typeof users !== 'object') return ['users.json must contain a JSON object'];
  return [
    ...validateIdentity('master', users.master, { requireJiraUser: true }),
    ...Object.entries(users.users || {}).flatMap(([name, entry]) => validateIdentity(`users.${name}`, entry)),
  ];
}

export async function assertPrivateFile(file) {
  const stat = await fs.stat(file);
  if (stat.mode % 0o100 !== 0) {
    throw new Error(`${file} must not be readable by group/others (run: chmod 600 ${file})`);
  }
}

export async function readUsersFile(usersPath) {
  try {
    return JSON.parse(await fs.readFile(usersPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { master: null, users: {} };
    throw err;
  }
}

export async function saveUsers(usersPath, users) {
  await fs.mkdir(path.dirname(usersPath), { recursive: true, mode: 0o700 });
  await fs.chmod(path.dirname(usersPath), 0o700);
  const tmp = `${usersPath}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(users, null, 2)}\n`, { mode: 0o600 });
  await fs.chmod(tmp, 0o600);
  await fs.rename(tmp, usersPath);
}

export async function loadConfig(configDir = defaultConfigDir()) {
  const configPath = path.join(configDir, 'config.json');
  const usersPath = path.join(configDir, 'users.json');
  const fileConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
  await assertPrivateFile(usersPath);
  const users = await readUsersFile(usersPath);
  const problems = validateUsers(users);
  if (problems.length) throw new Error(`Invalid users.json:\n- ${problems.join('\n- ')}`);
  return { config: { ...DEFAULT_CONFIG, ...fileConfig }, users, configDir, usersPath };
}

export function allSecrets(users) {
  const entries = [users.master, ...Object.values(users.users || {})];
  return entries.flatMap((entry) => SECRET_FIELDS.map((f) => entry?.[f]).filter(Boolean));
}
