import { runCommand } from './exec.js';

export async function runQuality({ workDir, run = runCommand, timeoutMs = 15 * 60 * 1000 }) {
  const result = await run('npm', ['run', 'quality'], { cwd: workDir, timeoutMs });
  const timeoutNote = result.timedOut ? '\n[otto-bot] npm run quality timed out' : '';
  return { ok: result.code === 0, output: `${result.stdout}\n${result.stderr}${timeoutNote}`.trim() };
}

export async function qualityLoop({ check, repair, guard, maxRepairs }) {
  let result = await check();
  let repairs = 0;
  while (!result.ok && repairs < maxRepairs) {
    repairs += 1;
    await repair({ attempt: repairs, output: result.output });
    await guard();
    result = await check();
  }
  return { ok: result.ok, repairs, output: result.output };
}
