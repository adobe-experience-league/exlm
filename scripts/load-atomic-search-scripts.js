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

/**
 * Load Coveo Atomic from same-origin EDS assets.
 * Hosted under scripts/coveo-atomic/cdn (vendored @coveo/atomic@3.13.0) to avoid
 * cross-origin module/chunk CORS failures from static.cloud.coveo.com.
 */
export async function initiateCoveoAtomicSearch() {
  return new Promise((resolve, reject) => {
    loadScript('/scripts/coveo-atomic/cdn/atomic.esm.js', { type: 'module' })
      .then(async () => {
        resolve(true);
      })
      .catch((e) => {
        reject(e);
      });
  });
}
