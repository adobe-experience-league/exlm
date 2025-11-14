/**
 * Coveo Token Prefetch Strategy for Lighthouse Performance Optimization
 * 
 * Strategy: Start prefetch EARLY (during loadLazy) but NON-BLOCKING
 * - Runs in parallel with block initialization (not after 3 seconds)
 * - Uses requestIdleCallback to avoid blocking main thread
 * - Token ready by the time user interacts with search
 * 
 * Timing:
 * - Starts immediately when called (~500ms after page load)
 * - Runs in browser idle time (non-blocking)
 * - Completes in ~50-100ms
 * - Blocks can load in parallel without waiting
 * 
 * Impact on Lighthouse:
 * - No blocking of LCP (uses idle callback)
 * - No blocking of FCP (non-blocking fetch)
 * - Parallel with block loading (not sequential)
 * - Token ready before user types in header search
 * 
 * Note: All pages use Coveo for header search query suggestions,
 * so token is always needed and should be prefetched universally.
 */

import loadCoveoToken from './coveo-token-service.js';

/**
 * Prefetch Coveo token during idle time
 * Starts immediately but uses requestIdleCallback for non-blocking execution
 */
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
        // Don't throw - this is a prefetch optimization, not critical
        // Blocks will fetch token themselves if prefetch fails
        // eslint-disable-next-line no-console
        console.warn('[Coveo Prefetch] Prefetch failed (blocks will fetch when needed):', error.message);
      });
  };

  // Use requestIdleCallback if available for optimal performance
  // Short timeout to ensure it runs soon (not waiting indefinitely)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 1000 });
  } else {
    // Fallback: start immediately but don't block
    setTimeout(prefetch, 0);
  }
}

/**
 * Initialize prefetch strategy
 * Call this EARLY (from loadLazy, not delayed) to prefetch before blocks need it
 */
export default function initCoveoPrefetch() {
  // Start prefetch immediately - don't wait for 'load' event
  prefetchCoveoTokenIdle();
}

