import { COVEO_TOKEN, COVEO_PIPELINE_TEST_BEARER, COVEO_PIPELINE_TEST_TOKEN } from '../../session-keys.js';
import {
  captureCoveoBearerTokenFromUrl,
  getCoveoBearerTokenForPipelineTest,
  getCoveoTokenUrl,
  isCoveoPipelineTestEnabled,
} from './coveo-search-config.js';

/**
 * Session-cached Coveo token fetcher
 * Ensures only ONE HTTP request per browser session for optimal performance
 */

let tokenFetchPromise = null;
let tokenFetchPromiseTest = null;

function getTokenStorageKey() {
  return isCoveoPipelineTestEnabled() ? COVEO_PIPELINE_TEST_TOKEN : COVEO_TOKEN;
}

async function fetchCoveoTokenFromService() {
  const tokenUrl = getCoveoTokenUrl();

  try {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Token] Fetching token from service:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Token service returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error('Token service returned empty token');
    }

    try {
      sessionStorage.setItem(getTokenStorageKey(), data.token);
      // eslint-disable-next-line no-console
      console.debug('[Coveo Token] Token cached successfully in sessionStorage');
    } catch (e) {
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

function loadPipelineTestBearerToken() {
  captureCoveoBearerTokenFromUrl();
  const bearer = getCoveoBearerTokenForPipelineTest();
  if (bearer) {
    // eslint-disable-next-line no-console
    console.info('[Coveo Pipeline Test] Using Sarika prod API key (matches curl Bearer)');
    return Promise.resolve(bearer);
  }
  return fetchCoveoTokenFromService();
}

export default async function loadCoveoToken() {
  if (isCoveoPipelineTestEnabled()) {
    const bearer = getCoveoBearerTokenForPipelineTest();
    if (bearer) {
      return bearer;
    }
  }

  const storageKey = getTokenStorageKey();

  try {
    const cachedToken = sessionStorage.getItem(storageKey);
    if (cachedToken) {
      // eslint-disable-next-line no-console
      console.debug('[Coveo Token] Using cached token from sessionStorage');
      return cachedToken;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Coveo Token] sessionStorage not available:', e.message);
  }

  const inFlightPromise = isCoveoPipelineTestEnabled() ? tokenFetchPromiseTest : tokenFetchPromise;
  if (inFlightPromise) {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Token] Token fetch already in progress, waiting...');
    return inFlightPromise;
  }

  const fetchPromise = isCoveoPipelineTestEnabled()
    ? loadPipelineTestBearerToken()
    : fetchCoveoTokenFromService();
  if (isCoveoPipelineTestEnabled()) {
    tokenFetchPromiseTest = fetchPromise;
  } else {
    tokenFetchPromise = fetchPromise;
  }

  try {
    return await fetchPromise;
  } finally {
    if (isCoveoPipelineTestEnabled()) {
      tokenFetchPromiseTest = null;
    } else {
      tokenFetchPromise = null;
    }
  }
}

export function clearCoveoTokenCache() {
  try {
    sessionStorage.removeItem(COVEO_TOKEN);
    sessionStorage.removeItem(COVEO_PIPELINE_TEST_TOKEN);
    sessionStorage.removeItem(COVEO_PIPELINE_TEST_BEARER);
  } catch (e) {
    // ignore
  }
}
