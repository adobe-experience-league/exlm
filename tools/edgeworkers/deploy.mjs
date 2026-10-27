import { readFile } from 'node:fs/promises';
import EdgeGrid from 'akamai-edgegrid';

export default async function deploy({
  client,
  edgeWorkerId,
  bundle,
  report = console.log,
  delay = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
}) {
  if (!/^\d+$/.test(edgeWorkerId)) throw new Error('AKAMAI_EDGEWORKER_ID must be numeric');
  const base = `/edgeworkers/v1/ids/${edgeWorkerId}`;
  const api = async (path, options = {}) => {
    const { statusCode, body } = await client.send({ path, ...options });
    if (statusCode < 200 || statusCode >= 300)
      throw new Error(`EdgeWorkers API ${path} failed with HTTP ${statusCode}`);
    return typeof body === 'string' ? JSON.parse(body) : body;
  };
  const uploaded = await api(`${base}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/gzip' },
    body: bundle,
  });
  if (!uploaded.version) throw new Error('Upload returned no version');
  report(`Uploaded EdgeWorker ${edgeWorkerId} version ${uploaded.version}`);
  const activation = await api(`${base}/activations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { network: 'STAGING', version: uploaded.version },
  });
  if (!activation.activationId) throw new Error('Activation returned no activationId');
  for (let attempt = 0; attempt < 60; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- Poll one activation until it reaches a terminal state.
    const status = await api(`${base}/activations/${activation.activationId}`, { method: 'GET' });
    report(`Staging activation ${activation.activationId}: ${status.status}`);
    if (status.status === 'COMPLETE') return uploaded.version;
    if (['ERROR', 'FAILED', 'CANCELLED', 'DEACTIVATED'].includes(status.status))
      throw new Error(`Staging activation ${status.status}`);
    // eslint-disable-next-line no-await-in-loop -- Respect the polling interval before the next request.
    await delay(10000);
  }
  throw new Error('Timed out waiting for staging activation; check Akamai status before retrying');
}

if (process.env.GITHUB_ACTIONS === 'true' && process.argv[1]?.endsWith('/deploy.mjs')) {
  const required = [
    'AKAMAI_CLIENT_TOKEN',
    'AKAMAI_CLIENT_SECRET',
    'AKAMAI_ACCESS_TOKEN',
    'AKAMAI_HOST',
    'AKAMAI_EDGEWORKER_ID',
  ];
  required.forEach((key) => {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  });
  const client = new EdgeGrid(
    process.env.AKAMAI_CLIENT_TOKEN,
    process.env.AKAMAI_CLIENT_SECRET,
    process.env.AKAMAI_ACCESS_TOKEN,
    process.env.AKAMAI_HOST,
  );
  await deploy({
    client,
    edgeWorkerId: process.env.AKAMAI_EDGEWORKER_ID,
    bundle: await readFile(new URL('./dist/header.tgz', import.meta.url)),
  });
}
