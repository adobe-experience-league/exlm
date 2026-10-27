const OMIT_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding',
  'etag',
  'last-modified',
  'content-md5',
  'digest',
  'accept-ranges',
  'cache-control',
  'cdn-cache-control',
  'surrogate-control',
  'expires',
  'age',
]);

export function responseHeaders(response, outcome) {
  const headers = {};
  const source = response.getHeaders();
  const connectionHeaders = (response.getHeader('connection') || [])
    .join(',')
    .toLowerCase()
    .split(',')
    .map((name) => name.trim());
  Object.entries(source).forEach(([name, value]) => {
    if (!OMIT_RESPONSE_HEADERS.has(name.toLowerCase()) && !connectionHeaders.includes(name.toLowerCase())) {
      headers[name] = value;
    }
  });
  // The composed response is deliberately not cached during the spike. Subrequests can be cached.
  headers['cache-control'] = ['private, no-store'];
  headers['x-exl-edge-header'] = [outcome];
  return headers;
}

export function languageForPath(path) {
  const parts = path.split('/');
  const raw = path.startsWith('/content/') ? parts[4] : parts[1];
  const lang = (raw || 'en').replace(/\.html$/, '');
  const aliases = { 'pt-BR': 'pt-br', 'zh-CN': 'zh-hans', 'zh-TW': 'zh-hant' };
  return aliases[lang] || (/^[a-z]{2}(?:-[a-z]{2,4})?$/.test(lang) ? lang : 'en');
}

export function injectHeader(element, markup, variant) {
  if (element.getAttribute('data-exl-edge-header')) return;
  element.setAttribute('data-exl-edge-header', variant);
  element.prepend(markup);
}

async function loadFragment(httpRequest, lang, variant, report) {
  const path = `/${lang}/global-fragments/${variant}.plain.html`;
  try {
    const response = await httpRequest(path, { headers: { Accept: ['text/html'] }, timeout: 1000 });
    if (response.status !== 200 || !(response.getHeader('content-type') || []).join('').includes('text/html')) {
      throw new Error(`Header fragment ${path} returned ${response.status} or non-HTML content`);
    }
    const fragment = await response.text();
    if (!fragment.trim() || fragment.length > 200000 || !/<a\s[^>]*href=/i.test(fragment)) {
      throw new Error(`Header fragment ${path} is empty, oversized, or has no links`);
    }
    return fragment;
  } catch (error) {
    report(error.message);
    if (lang !== 'en') return loadFragment(httpRequest, 'en', variant, report);
    return null;
  }
}

export async function assemble(request, services, config) {
  const { httpRequest, createResponse, rewrite, report } = services;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return createResponse(405, { allow: ['GET, HEAD'], 'cache-control': ['no-store'] }, '');
  }
  // Preserve page negotiation and authentication, but request a complete, decoded representation.
  const headers = request.getHeaders();
  const excluded = new Set([
    'host',
    'connection',
    'content-length',
    'accept-encoding',
    'range',
    'if-range',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ]);
  const connectionHeaders = Object.entries(headers)
    .filter(([name]) => name.toLowerCase() === 'connection')
    .flatMap(([, values]) =>
      values
        .join(',')
        .toLowerCase()
        .split(',')
        .map((name) => name.trim()),
    );
  const pageHeaders = {};
  Object.entries(headers).forEach(([name, value]) => {
    const lower = name.toLowerCase();
    if (!excluded.has(lower) && !connectionHeaders.includes(lower) && !/^(if-|x-ak|akamai-)/.test(lower)) {
      pageHeaders[name] = value;
    }
  });
  let page;
  try {
    page = await httpRequest(`${request.path}${request.query ? `?${request.query}` : ''}`, {
      method: request.method,
      headers: pageHeaders,
      timeout: 3000,
    });
  } catch (error) {
    report(`Page subrequest failed: ${error.message}`);
    return createResponse(502, { 'cache-control': ['no-store'] }, 'Page origin unavailable');
  }
  const send = (outcome, body = page.body) =>
    createResponse(page.status, responseHeaders(page, outcome), request.method === 'HEAD' ? '' : body);
  const html = (page.getHeader('content-type') || []).join('').toLowerCase().includes('text/html');
  const fragmentRequest = request.path.includes('/global-fragments/') || request.path.endsWith('.plain.html');
  if (!config.enabled || request.method !== 'GET' || page.status !== 200 || !html || fragmentRequest) {
    return send('bypass');
  }
  if (!['header', 'header-v2'].includes(config.variant)) {
    report(`Invalid header variant: ${config.variant}`);
    return send('invalid-config');
  }
  const lang = languageForPath(request.path);
  const fragment = await loadFragment(httpRequest, lang, config.variant, report);
  if (!fragment) return send('fragment-unavailable');
  // Authoring markers are controls, not crawlable destinations. Restore them only during enhancement.
  const publicFragment = fragment.replace(/\bhref=(["'])(@[^"']*)\1/g, 'data-exl-nav-href=$1$2$1');
  const markup =
    `<nav data-exl-edge-nav data-variant="${config.variant}" data-lang="${lang}" aria-label="Main navigation">` +
    `<div data-exl-edge-fragment>${publicFragment}</div></nav>`;
  return send('assembled', rewrite(page.body, markup, config.variant));
}
