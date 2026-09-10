import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { isMainModule, repoRootFrom } from './paths.mjs';

export async function cleanupLocal(outDir) {
  const dest = outDir || join(repoRootFrom(import.meta.url), 'performance-reports');
  await rm(dest, { recursive: true, force: true });
  return dest;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  cleanupLocal(process.env.PERF_OUT_DIR)
    .then((dest) => {
      console.log(`Removed ${dest}`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
