import { readUsersFile, saveUsers, validateIdentity } from './config.js';

const QUESTIONS = Object.freeze([
  ['jiraPat', 'Jira PAT: ', true],
  ['githubPat', 'GitHub PAT (repo push + PRs, SSO-authorized): ', true],
  ['copilotPat', 'Copilot fine-grained PAT (github_pat_..., Copilot Requests): ', true],
  ['gitName', 'Git author name: ', false],
  ['gitEmail', 'Git author email: ', false],
]);

export async function addUser({ usersPath, name, isMaster = false, ask }) {
  const users = await readUsersFile(usersPath);
  const entry = {};
  if (isMaster) entry.jiraUser = await ask('Jira username of the master account: ');
  for (const [field, question, hidden] of QUESTIONS) {
    entry[field] = await ask(question, { hidden });
  }
  const label = isMaster ? 'master' : `users.${name}`;
  const problems = validateIdentity(label, entry, { requireJiraUser: isMaster });
  if (problems.length) throw new Error(`Not saved:\n- ${problems.join('\n- ')}`);
  if (isMaster) {
    users.master = entry;
  } else {
    users.users = { ...users.users, [name]: entry };
  }
  await saveUsers(usersPath, users);
}

export async function removeUser({ usersPath, name }) {
  const users = await readUsersFile(usersPath);
  if (!users.users?.[name]) throw new Error(`${name} is not onboarded`);
  delete users.users[name];
  await saveUsers(usersPath, users);
}

export async function listUsers({ usersPath }) {
  const users = await readUsersFile(usersPath);
  return { master: users.master?.jiraUser ?? null, users: Object.keys(users.users || {}).sort() };
}
