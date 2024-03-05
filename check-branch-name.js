import { spawn } from 'node:child_process';

async function run(cmd) {
  const out = await new Promise((resolve) => {
    const buffers = [];
    const p = spawn(cmd, { cwd: process.cwd(), shell: true });
    p.stdout.on('data', (buffer) => buffers.push(buffer));
    p.stdout.on('end', () => resolve(Buffer.concat(buffers).toString('utf-8')));
  });

  return out.replaceAll(/\n$/g, '');
}

const [origin, branch] = await Promise.all([run('git remote get-url origin'), run('git rev-parse --abbrev-ref HEAD')]);
const match = origin.match(/([^:/]+)\/([^./]+?)\.git$/);

if (!match) {
  // eslint-disable-next-line no-console
  console.log(`not a github repo: ${origin}`);
  process.exit(2);
}

const [, repo, owner] = match;
// --repo--owner.hlx.live
const rightPart = 2 + repo.length + 2 + owner.length + 9;
const len = branch.length + rightPart;

if (len > 63) {
  // eslint-disable-next-line no-console
  console.log(`branch name '${branch}' too long (${len - rightPart}). max allowed ${63 - rightPart}`);
  process.exit(2);
}
