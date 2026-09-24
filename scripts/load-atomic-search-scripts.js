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

// Self-hosted Coveo Atomic entry point. The full `dist/atomic` distribution (entry + lazy p-*.js
// chunks + lang/assets) is vendored under scripts/coveo-atomic/libs/atomic via that folder's
// package.json/copy script. Atomic resolves its chunks/assets relative to this URL, so it must
// point at the vendored atomic.esm.js — see scripts/coveo-atomic/libs/index.js to upgrade.
const ATOMIC_ESM_URL = '/scripts/coveo-atomic/libs/atomic/atomic.esm.js';

export async function initiateCoveoAtomicSearch() {
  return new Promise((resolve, reject) => {
    loadScript(ATOMIC_ESM_URL, { type: 'module' })
      .then(async () => {
        resolve(true);
      })
      .catch((e) => {
        reject(e);
      });
  });
}
