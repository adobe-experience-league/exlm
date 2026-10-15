import path from 'node:path';

export function dataPaths(dataDir) {
  return {
    mirrorDir: path.join(dataDir, 'mirror', 'exlm.git'),
    stateDir: path.join(dataDir, 'state'),
    binDir: path.join(dataDir, 'bin'),
    copilotHomesDir: path.join(dataDir, 'copilot-homes'),
    workRoot: path.join(dataDir, 'work'),
    runsRoot: path.join(dataDir, 'runs'),
  };
}

export function runPaths(dataDir, runId) {
  const base = dataPaths(dataDir);
  return { ...base, workDir: path.join(base.workRoot, runId), runDir: path.join(base.runsRoot, runId) };
}
