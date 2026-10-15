import fs from 'node:fs/promises';
import path from 'node:path';
import { StageError } from './errors.js';
import { runCommand } from './exec.js';
import { createRedactor } from './redact.js';

export const DENIED_TOOLS = Object.freeze([
  'shell(git push)',
  'shell(git commit)',
  'shell(gh)',
  'shell(curl)',
  'shell(wget)',
]);

export const ENV_ALLOWLIST = Object.freeze(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'USER', 'SHELL']);

export function buildCopilotArgs({ prompt, model, logDir, shareFile }) {
  return [
    '-p',
    prompt,
    '--allow-all-tools',
    `--deny-tool=${DENIED_TOOLS.join(',')}`,
    '--no-ask-user',
    '--disable-builtin-mcps',
    `--model=${model}`,
    '--no-color',
    `--log-dir=${logDir}`,
    `--share=${shareFile}`,
  ];
}

export function buildCopilotEnv({ baseEnv, copilotHome, token }) {
  const env = {};
  ENV_ALLOWLIST.forEach((name) => {
    if (baseEnv[name] !== undefined) env[name] = baseEnv[name];
  });
  return { ...env, COPILOT_HOME: copilotHome, COPILOT_GITHUB_TOKEN: token, CI: '1', NO_COLOR: '1' };
}

export async function runCopilot({
  copilotBin,
  workDir,
  prompt,
  model,
  timeoutMs,
  copilotHome,
  token,
  runDir,
  sessionName,
  baseEnv = process.env,
  run = runCommand,
}) {
  const redact = createRedactor([token]);
  await fs.mkdir(copilotHome, { recursive: true, mode: 0o700 });
  await fs.chmod(copilotHome, 0o700);
  const args = buildCopilotArgs({
    prompt,
    model,
    logDir: path.join(runDir, 'copilot'),
    shareFile: path.join(runDir, `${sessionName}.md`),
  });
  const result = await run(copilotBin, args, {
    cwd: workDir,
    env: buildCopilotEnv({ baseEnv, copilotHome, token }),
    timeoutMs,
  });
  await fs.writeFile(
    path.join(runDir, `${sessionName}.out.log`),
    redact(
      `exit=${result.code} signal=${result.signal}\n--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}\n`,
    ),
  );
  if (result.timedOut) {
    throw new StageError('copilot', `Copilot CLI timed out after ${Math.round(timeoutMs / 60000)} minutes`);
  }
  if (result.code !== 0) {
    throw new StageError('copilot', `Copilot CLI exited with code ${result.code}`, redact(result.stderr.slice(-4000)));
  }
  return { stdout: result.stdout, stderr: result.stderr };
}
