export const scriptPromises = new Map();

export const loadScript = (src, attrs = {}) => {
  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  let script = document.querySelector(`script[src="${src}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = src;
    Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
    document.head.appendChild(script);
  }

  const promise = new Promise((resolve, reject) => {
    if (script.hasAttribute('data-loaded')) {
      resolve(script);
    } else {
      script.addEventListener(
        'load',
        () => {
          script.setAttribute('data-loaded', 'true');
          resolve(script);
        },
        { once: true },
      );
      script.addEventListener('error', reject, { once: true });
    }
  });

  scriptPromises.set(src, promise);
  return promise;
};

const loadStylesheet = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Latest Atomic CDN (cloud-only).
 *
 * Use the minor segment (`v3.62`) — it tracks the latest 3.62.x and sends CORS
 * (`Access-Control-Allow-Origin: *`). The stub re-exports the commit bundle, which
 * also sends CORS. Pinning a patch URL is unnecessary while the minor segment
 * already resolves to 3.62.0 (headless 3.57.2 inside Atomic).
 *
 * @see https://docs.coveo.com/en/atomic/latest/usage/
 */
const COVEO_ATOMIC_CDN = 'https://static.cloud.coveo.com/atomic/v3.62';

export async function initiateCoveoAtomicSearch() {
  loadStylesheet(`${COVEO_ATOMIC_CDN}/themes/coveo.css`);
  return new Promise((resolve, reject) => {
    loadScript(`${COVEO_ATOMIC_CDN}/atomic.esm.js`, { type: 'module', crossorigin: 'anonymous' })
      .then(async () => {
        resolve(true);
      })
      .catch((e) => {
        reject(e);
      });
  });
}
