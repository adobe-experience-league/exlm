import { getConfig } from '../../scripts.js';
import { COVEO_TOKEN } from '../../session-keys.js';

/**
 * Session-cached Coveo token fetcher
 * Ensures only ONE HTTP request per browser session for optimal performance
 */

// In-memory promise cache to prevent duplicate concurrent requests
let tokenFetchPromise = null;

/**
 * Fetches token from AIO Runtime service
 * @returns {Promise<string>} The Coveo search token
 * @private
 */
async function fetchCoveoTokenFromService() {
  const { coveoTokenUrl } = getConfig();

  try {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Token] Fetching token from service:', coveoTokenUrl);

    const response = await fetch(coveoTokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use default credentials to send cookies/origin headers
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Token service returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error('Token service returned empty token');
    }

    // Cache the token in sessionStorage for subsequent page loads
    try {
      sessionStorage.setItem(COVEO_TOKEN, data.token);
      // eslint-disable-next-line no-console
      console.debug('[Coveo Token] Token cached successfully in sessionStorage');
    } catch (e) {
      // sessionStorage might be full or disabled
      // eslint-disable-next-line no-console
      console.warn('[Coveo Token] Failed to cache token:', e.message);
    }

    // eslint-disable-next-line no-console
    console.info('[Coveo Token] Token fetched successfully from service');
    return data.token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Coveo Token] Failed to fetch token from service:', error);
    throw new Error(`Failed to load Coveo token: ${error.message}`);
  }
}

/**
 * Fetches Coveo token from AIO Runtime service with session caching
 * @returns {Promise<string>} The Coveo search token
 * @throws {Error} If token fetch fails after all attempts
 */
export default async function loadCoveoToken() {
  // 1. Check sessionStorage first (cached from previous page loads)
  try {
    const cachedToken = sessionStorage.getItem(COVEO_TOKEN);
    if (cachedToken) {
      // eslint-disable-next-line no-console
      console.debug('[Coveo Token] Using cached token from sessionStorage');
      return cachedToken;
    }
  } catch (e) {
    // sessionStorage might be disabled in private mode
    // eslint-disable-next-line no-console
    console.warn('[Coveo Token] sessionStorage not available:', e.message);
  }

  // 2. Check if a fetch is already in progress (prevents duplicate concurrent requests)
  if (tokenFetchPromise) {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Token] Token fetch already in progress, waiting...');
    return tokenFetchPromise;
  }

  // 3. Fetch token from AIO Runtime service
  tokenFetchPromise = fetchCoveoTokenFromService();

  try {
    const token = await tokenFetchPromise;
    return token;
  } finally {
    // Clear the promise cache after completion (success or failure)
    tokenFetchPromise = null;
  }
}
