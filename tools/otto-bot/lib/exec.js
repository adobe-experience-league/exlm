import { spawn } from 'node:child_process';

export function runCommand(cmd, args = [], options = {}) {
  const { cwd, env, input, timeoutMs = 0, killGraceMs = 30000 } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    let killTimer;
    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
            killTimer = setTimeout(() => child.kill('SIGKILL'), killGraceMs);
          }, timeoutMs)
        : undefined;
    const stopTimers = () => {
      clearTimeout(timer);
      clearTimeout(killTimer);
    };
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', (err) => {
      stopTimers();
      reject(err);
    });
    child.on('close', (code, signal) => {
      stopTimers();
      resolve({
        code,
        signal,
        timedOut,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input === undefined ? undefined : input);
  });
}
