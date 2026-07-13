import { getConfig } from '../../scripts.js';
import { COVEO_TOKEN, COVEO_PIPELINE_TEST_BEARER, COVEO_PIPELINE_TEST_TOKEN } from '../../session-keys.js';
import {
  captureCoveoBearerTokenFromUrl,
  getCoveoBearerTokenForPipelineTest,
  isCoveoProdOrgQaEnabled,
} from './coveo-search-config.js';

/**
 * EXLM-5173: Sarika prod API key only — never site / vault search tokens.
 */
export function loadPipelineTestCoveoToken() {
  captureCoveoBearerTokenFromUrl();
  const bearer = getCoveoBearerTokenForPipelineTest();
  // eslint-disable-next-line no-console
  console.info('[Coveo QA] Using Sarika prod API key only (no site token)');
  return bearer;
}

let tokenFetchPromise = null;

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
      sessionStorage.setItem(COVEO_TOKEN, data.token);
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

export default async function loadCoveoToken() {
  if (isCoveoProdOrgQaEnabled()) {
    return loadPipelineTestCoveoToken();
  }

  try {
    const cachedToken = sessionStorage.getItem(COVEO_TOKEN);
    if (cachedToken) {
      // eslint-disable-next-line no-console
      console.debug('[Coveo Token] Using cached token from sessionStorage');
      return cachedToken;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Coveo Token] sessionStorage not available:', e.message);
  }

  if (tokenFetchPromise) {
    // eslint-disable-next-line no-console
    console.debug('[Coveo Token] Token fetch already in progress, waiting...');
    return tokenFetchPromise;
  }

  tokenFetchPromise = fetchCoveoTokenFromService();
  try {
    return await tokenFetchPromise;
  } finally {
    tokenFetchPromise = null;
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
