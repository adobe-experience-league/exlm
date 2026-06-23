import { getConfig } from '../../scripts.js';
import { COVEO_PIPELINE_TEST_BEARER } from '../../session-keys.js';

/** Default prod Coveo routing for Events Search / Headless. */
export const COVEO_SEARCH_DEFAULTS = Object.freeze({
  searchHub: 'Experience League Learning Hub',
  pipeline: 'Experience League Learning Pipeline',
});

/** Sarika UGP-15301 PipelineTest routing (matches ticket curl). */
export const COVEO_SEARCH_TEST = Object.freeze({
  searchHub: 'ExperienceLeagueLearningPipelineTest',
  pipeline: 'Experience League Learning PipelineTest',
});

/** Prod Coveo org / endpoint from Sarika's curl. */
export const COVEO_PROD_ORG_ID = 'adobev2prod9e382h1q';
export const COVEO_PROD_SEARCH_BASE_URL = 'https://platform.cloud.coveo.com/rest/search/v2';

const BEARER_TOKEN_PARAM = 'coveoBearerToken';
const PIPELINE_TEST_PARAM = 'coveoPipelineTest';

/** @type {boolean | null} null = not initialized */
let pipelineTestEnabled = null;

function readPipelineTestOptOutFromUrl() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get(PIPELINE_TEST_PARAM) === 'false';
}

function stripBearerTokenFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(BEARER_TOKEN_PARAM)) return;
    url.searchParams.delete(BEARER_TOKEN_PARAM);
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch (e) {
    // ignore
  }
}

export function getCoveoBearerTokenForPipelineTest() {
  try {
    return sessionStorage.getItem(COVEO_PIPELINE_TEST_BEARER);
  } catch (e) {
    return null;
  }
}

/** Persist Sarika prod API key from URL once per session (never commit the key). */
export function captureCoveoBearerTokenFromUrl() {
  if (typeof window === 'undefined') return null;
  const token = new URLSearchParams(window.location.search).get(BEARER_TOKEN_PARAM);
  if (!token) return getCoveoBearerTokenForPipelineTest();
  try {
    sessionStorage.setItem(COVEO_PIPELINE_TEST_BEARER, token);
    // eslint-disable-next-line no-console
    console.info('[Coveo Pipeline Test] Bearer token stored in sessionStorage');
    stripBearerTokenFromUrl();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Coveo Pipeline Test] Failed to store bearer token:', e.message);
  }
  return token;
}

/**
 * EXLM-5173 branch: Events Search always routes like Sarika's PipelineTest curl.
 * Opt out only with ?coveoPipelineTest=false
 */
export function initCoveoPipelineTestForEventsSearch() {
  if (typeof window === 'undefined') return false;
  captureCoveoBearerTokenFromUrl();
  pipelineTestEnabled = !readPipelineTestOptOutFromUrl();
  if (pipelineTestEnabled) {
    // eslint-disable-next-line no-console
    console.info('[Coveo Pipeline Test] EXLM-5173 — hardcoded Sarika routing', {
      org: COVEO_PROD_ORG_ID,
      ...COVEO_SEARCH_TEST,
      bearerToken: getCoveoBearerTokenForPipelineTest() ? 'session' : 'missing — add ?coveoBearerToken=<prod API key>',
    });
  }
  return pipelineTestEnabled;
}

/** @deprecated Use initCoveoPipelineTestForEventsSearch on EXLM-5173 branch */
export function initCoveoPipelineTestFromUrl() {
  return initCoveoPipelineTestForEventsSearch();
}

export function isCoveoPipelineTestEnabled() {
  if (pipelineTestEnabled === null) {
    return initCoveoPipelineTestForEventsSearch();
  }
  return pipelineTestEnabled;
}

/** @returns {{ searchHub: string, pipeline: string }} */
export function getCoveoSearchRouting() {
  return isCoveoPipelineTestEnabled() ? COVEO_SEARCH_TEST : COVEO_SEARCH_DEFAULTS;
}

export function getCoveoOrganizationId() {
  const { coveoOrganizationId } = getConfig();
  return isCoveoPipelineTestEnabled() ? COVEO_PROD_ORG_ID : coveoOrganizationId;
}

export function getCoveoSearchResultsUrl() {
  const { coveoSearchResultsUrl } = getConfig();
  if (!isCoveoPipelineTestEnabled()) return coveoSearchResultsUrl;
  return `${COVEO_PROD_SEARCH_BASE_URL}?organizationId=${COVEO_PROD_ORG_ID}`;
}

/** Suffix for coveo-token when PipelineTest is active (converter may honor searchHub param). */
export function getCoveoTokenUrlSuffix() {
  if (!isCoveoPipelineTestEnabled()) return '';
  const { searchHub } = COVEO_SEARCH_TEST;
  return `&searchHub=${encodeURIComponent(searchHub)}&pipelineTest=true`;
}
