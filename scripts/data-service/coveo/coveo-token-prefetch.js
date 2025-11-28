/**
 * Coveo Token Prefetch (Performance Optimized)
 *
 * - Prefetches token early (called from loadLazy) using requestIdleCallback
 * - Runs in browser idle time → non-blocking for LCP/FCP
 * - Executes in parallel with block loading
 * - Ensures token is ready before user interacts with header search
 *
 * Note: Header search uses Coveo everywhere, so prefetch is required globally.
 
*/

import loadCoveoToken from './coveo-token-service.js';

// Prefetch Coveo token during idle time, Skips if token is already cached.

function prefetchCoveoTokenIdle() {
  // Check if token is already cached
  const cached = sessionStorage.getItem('coveoToken');
  if (cached) {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Prefetch] Token already cached, skipping prefetch');
    return;
  }

  // Prefetch token for header search (used on all pages)
  const prefetch = () => {
    // eslint-disable-next-line no-console
    console.info('[Coveo Prefetch] Starting token prefetch...');

    loadCoveoToken()
      .then(() => {
        // eslint-disable-next-line no-console
        console.info('[Coveo Prefetch] Token prefetched and cached successfully');
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('[Coveo Prefetch] Prefetch failed (blocks will fetch when needed):', error.message);
      });
  };

  // Use idle time to avoid impacting main thread; fallback to setTimeout

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 1000 });
  } else {
    // Fallback: start immediately but don't block
    setTimeout(prefetch, 0);
  }
}

// Initialize token prefetch early (called from loadLazy).

export default function initCoveoPrefetch() {
  // Start prefetch immediately - don't wait for 'load' event
  prefetchCoveoTokenIdle();
}
