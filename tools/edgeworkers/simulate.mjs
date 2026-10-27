import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { assemble } from './header/assembly.js';
import { adaptResponse, createResponse, rewrite } from './local-adapter.mjs';

const root = new URL('../../', import.meta.url);
const fixtureRoot = new URL('./fixtures/', import.meta.url);
const assets = new Map([
  ['/blocks/header/edge-header.js', ['blocks/header/edge-header.js', 'text/javascript']],
  ['/styles/styles.css', ['styles/styles.css', 'text/css']],
]);

export default function createSimulator({
  upstream,
  variant = 'header-v2',
  enabled = true,
  report = console.error,
} = {}) {
  const origin = upstream ? new URL(upstream) : null;
  if (origin && (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password)) {
    throw new Error('UPSTREAM must be an HTTP(S) origin without credentials');
  }
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const asset = assets.get(url.pathname);
      if (asset) {
        res.writeHead(200, { 'content-type': asset[1] });
        res.end(await readFile(new URL(asset[0], root)));
        return;
      }
      const result = await assemble(
        {
          method: req.method,
          path: url.pathname,
          query: url.search.slice(1),
          getHeaders: () =>
            Object.fromEntries(
              Object.entries(req.headers).map(([name, value]) => [name, Array.isArray(value) ? value : [value]]),
            ),
        },
        {
          createResponse,
          rewrite,
          report,
          httpRequest: async (path, options = {}) => {
            if (origin) {
              const target = new URL(path, origin);
              if (target.origin !== origin.origin) throw new Error('Cross-origin subrequests are not allowed');
              const headers = Object.fromEntries(
                Object.entries(options.headers || {}).map(([name, values]) => [name, values.join(', ')]),
              );
              const response = await fetch(target, {
                method: options.method || 'GET',
                headers,
                redirect: 'manual',
                signal: AbortSignal.timeout(options.timeout || 3000),
              });
              return adaptResponse(response);
            }
            const fragment = path.includes('/global-fragments/');
            let content = await readFile(new URL(fragment ? 'header.plain.html' : 'page.html', fixtureRoot), 'utf8');
            if (!fragment)
              content = content.replace('</head>', '<link rel="stylesheet" href="/styles/styles.css"></head>');
            return adaptResponse(
              new Response(options.method === 'HEAD' ? null : content, {
                headers: { 'content-type': 'text/html; charset=utf-8' },
              }),
            );
          },
        },
        { enabled, variant },
      );
      res.writeHead(result.status, result.headers);
      if (result.body && req.method !== 'HEAD') {
        if (typeof result.body === 'string') res.end(result.body);
        else
          Readable.fromWeb(result.body)
            .on('error', (error) => {
              report(error.message);
              res.destroy(error);
            })
            .pipe(res);
      } else res.end();
    } catch (error) {
      report(`Simulator failure: ${error.message}`);
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
      res.end('Simulator upstream or assembly failure');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  const server = createSimulator({
    upstream: process.env.UPSTREAM,
    variant: process.env.HEADER_VARIANT || 'header-v2',
    enabled: process.env.EDGE_HEADER_ENABLED !== '0',
  });
  server.listen(port, '127.0.0.1', () => console.log(`Header assembly simulator: http://127.0.0.1:${port}/en/docs`));
}
