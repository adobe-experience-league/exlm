import util from 'node:util';
import { exec } from 'child_process';
import open from 'open';

const execAsync = util.promisify(exec);

let ref = await execAsync('git branch --show-current');
ref = ref.stdout.replace(/\//g, '-');

const [url = '/docs/authoring-guide-exl/using/markdown/cheatsheet', branch = ref] = process.argv.slice(2);

const owner = 'adobe-experience-league';
const repo = 'exlm';
const apiUrl = `https://admin.hlx.page/preview/${owner}/${repo}/${branch}${url}`;

// eslint-disable-next-line no-console
console.log('\x1b[32m', `Previewing: ${apiUrl}\n`);

const res = await fetch(apiUrl, { method: 'POST' });

if (res.ok) {
  const data = await res.json();
  await open(data.preview.url);
} else {
  // eslint-disable-next-line no-console
  console.log('API error');
}
