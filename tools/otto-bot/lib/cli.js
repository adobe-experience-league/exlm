import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG, allSecrets, defaultConfigDir, loadConfig, readUsersFile } from './config.js';
import { doctorOk, formatDoctor, runDoctor } from './doctor.js';
import { resolveIdentity } from './identity.js';
import { createJiraClient, toTicket } from './jira.js';
import { makeRunId, processTicket, tick } from './lifecycle.js';
import { createLogger } from './log.js';
import { createNotifier } from './notify.js';
import { dataPaths } from './paths.js';
import { ask as promptAsk } from './prompt.js';
import { createRedactor } from './redact.js';
import { runTicket } from './runner.js';
import { acquireLock, readCurrentRun, readHistory } from './state.js';
import { addUser, listUsers, removeUser } from './users.js';

const USAGE = `Usage:
  otto tick                          Poll Jira once and process at most one ticket (systemd runs this)
  otto run <KEY> [--dry-run]         Process one ticket now; --dry-run skips push, PR, and Jira writes
  otto doctor                        Check every identity's Jira, GitHub, and Copilot credentials
  otto users add <jira-username>     Onboard a teammate (prompts for tokens)
  otto users add --master            Set the master (fallback) account
  otto users list | remove <name>    List or remove onboarded teammates
  otto status                        Show the current run and recent history
  otto notify-test                   Send a test Slack message (needs slackWebhookUrl in config.json)`;

const KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/;

async function readConfigFile(configDir) {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(await fs.readFile(path.join(configDir, 'config.json'), 'utf8')) };
  } catch {
    return null;
  }
}

async function sendWelcome({ configDir, usersPath, name, isMaster, log, deps }) {
  const config = await readConfigFile(configDir);
  if (!config?.slackWebhookUrl) return;
  const users = await readUsersFile(usersPath);
  const entry = isMaster ? users.master : users.users?.[name];
  const notify = deps.notify || createNotifier({ config, log, redact: createRedactor(allSecrets(users)) });
  await notify('welcome', { name: isMaster ? entry.jiraUser : name, email: entry.gitEmail });
}

async function usersCommand([sub, name], { usersPath, configDir, out, ask, log, deps }) {
  if (sub === 'add' && name) {
    const isMaster = name === '--master';
    await addUser({ usersPath, name: isMaster ? 'master' : name, isMaster, ask });
    out(`Saved ${isMaster ? 'master account' : name} to ${usersPath}. Run "otto doctor" next.`);
    await sendWelcome({ configDir, usersPath, name, isMaster, log, deps });
    return 0;
  }
  if (sub === 'remove' && name) {
    await removeUser({ usersPath, name });
    out(`Removed ${name}.`);
    return 0;
  }
  if (sub === 'list') {
    const { master, users } = await listUsers({ usersPath });
    out(`master: ${master ?? '(not set)'}`);
    users.forEach((u) => out(`- ${u}`));
    return 0;
  }
  out(USAGE);
  return 2;
}

async function runCommandForKey([key, flag], { loaded, log, out, deps }) {
  if (!KEY_RE.test(key || '')) {
    out(`"${key}" is not a Jira key like EXLM-1234`);
    return 2;
  }
  const { config, users } = loaded;
  const jira = (deps.createJiraClient || createJiraClient)({
    baseUrl: config.jiraBaseUrl,
    token: users.master.jiraPat,
  });
  const issue = await jira.getIssue(key);
  const release = await acquireLock(dataPaths(config.dataDir).stateDir);
  if (!release) {
    out('Another otto-bot run is in progress; try again later.');
    return 1;
  }
  const redact = createRedactor(allSecrets(users));
  if (flag === '--dry-run') {
    try {
      const ticket = toTicket(issue);
      const outcome = await (deps.runTicket || runTicket)({
        ticket,
        identity: resolveIdentity(users, ticket.assignee),
        config,
        runId: `${makeRunId(key)}-dry`,
        log,
        secrets: allSecrets(users),
        dryRun: true,
        deps,
      });
      out(`Dry run complete. Worktree kept at ${outcome.workDir}`);
      out(redact(`PR title: ${outcome.title}\n\n${outcome.body}`));
      return 0;
    } finally {
      await release();
    }
  }
  try {
    const result = await processTicket({ issue, config, users, log, deps });
    out(JSON.stringify(result));
    return result.outcome === 'done' ? 0 : 1;
  } finally {
    await release();
  }
}

async function statusCommand({ config, out }) {
  const { stateDir } = dataPaths(config.dataDir);
  const current = await readCurrentRun(stateDir);
  out(current ? `Running: ${current.key} (run ${current.runId}, as ${current.identity})` : 'Idle');
  const history = await readHistory(stateDir, 10);
  if (history.length) out('Recent runs:');
  history.forEach((h) => out(`- ${h.key} ${h.outcome} ${h.prUrl || h.stage || ''}`.trimEnd()));
  return 0;
}

export async function main(argv, { env = process.env, out = console.log, ask = promptAsk, deps = {} } = {}) {
  const [command, ...rest] = argv;
  const configDir = defaultConfigDir(env);
  const usersPath = path.join(configDir, 'users.json');
  let log = createLogger({ write: deps.write });
  try {
    if (!command || command === 'help' || command === '--help') {
      out(USAGE);
      return 0;
    }
    if (command === 'users') return await usersCommand(rest, { usersPath, configDir, out, ask, log, deps });
    if (!['tick', 'run', 'doctor', 'status', 'notify-test'].includes(command)) {
      out(USAGE);
      return 2;
    }

    const loaded = await loadConfig(configDir);
    log = createLogger({
      redact: createRedactor([...allSecrets(loaded.users), loaded.config.slackWebhookUrl].filter(Boolean)),
      write: deps.write,
    });
    switch (command) {
      case 'tick': {
        const result = await tick({ config: loaded.config, users: loaded.users, log, deps });
        log.info('tick complete', result);
        return 0;
      }
      case 'run':
        return await runCommandForKey(rest, { loaded, log, out, deps });
      case 'doctor': {
        const results = await runDoctor({ config: loaded.config, users: loaded.users, deps });
        out(createRedactor(allSecrets(loaded.users))(formatDoctor(results)));
        return doctorOk(results) ? 0 : 1;
      }
      case 'notify-test': {
        if (!loaded.config.slackWebhookUrl) {
          out('slackWebhookUrl is not set in config.json; Slack notifications are off.');
          return 1;
        }
        const redact = createRedactor(allSecrets(loaded.users));
        const notify = deps.notify || createNotifier({ config: loaded.config, log, redact });
        const sent = await notify('welcome', {
          name: loaded.users.master.jiraUser,
          email: loaded.users.master.gitEmail,
        });
        out(sent ? 'Test message sent to Slack.' : 'Slack message failed; see the warning above.');
        return sent ? 0 : 1;
      }
      default:
        return await statusCommand({ config: loaded.config, out });
    }
  } catch (err) {
    log.error(`otto ${command} failed`, { error: err.message, stack: err.stack });
    return 1;
  }
}
