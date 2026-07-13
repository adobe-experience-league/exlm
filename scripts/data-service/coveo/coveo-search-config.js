import { getConfig } from '../../scripts.js';
import { COVEO_PIPELINE_TEST_BEARER } from '../../session-keys.js';

/** Production Coveo routing (opt-in via ?coveoPipelineTest=false). */
export const COVEO_SEARCH_DEFAULTS = Object.freeze({
  searchHub: 'Experience League Learning Hub',
  pipeline: 'Experience League Learning Pipeline',
});

/** PipelineTest routing — default on EXLM-5173 Events Search QA. */
export const COVEO_SEARCH_TEST = Object.freeze({
  searchHub: 'ExperienceLeagueLearningPipelineTest',
  pipeline: 'Experience League Learning PipelineTest',
});

/** Prod Coveo org / endpoint (EXLM-5359 / Sarika curl). */
export const COVEO_PROD_ORG_ID = 'adobev2prod9e382h1q';
export const COVEO_PROD_SEARCH_BASE_URL = 'https://platform.cloud.coveo.com/rest/search/v2';

/**
 * EXLM-5173 QA branch only — Sarika prod API key (same as ticket curl).
 * REMOVE before merging to main.
 */
const COVEO_PIPELINE_TEST_API_KEY = 'xx7fb3414b-3741-4a47-96d9-8270b6b10958';

const BEARER_TOKEN_PARAM = 'coveoBearerToken';
const PIPELINE_TEST_PARAM = 'coveoPipelineTest';

/** @type {boolean | null} null = not initialized */
let prodOrgQaEnabled = null;
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
    return sessionStorage.getItem(COVEO_PIPELINE_TEST_BEARER) || COVEO_PIPELINE_TEST_API_KEY;
  } catch (e) {
    return COVEO_PIPELINE_TEST_API_KEY;
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
    console.info('[Coveo QA] Bearer token stored in sessionStorage');
    stripBearerTokenFromUrl();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Coveo QA] Failed to store bearer token:', e.message);
  }
  return token;
}

/**
 * EXLM-5173 Events Search QA:
 * - Always route to prod Coveo org + platform.cloud.coveo.com (EXLM-5359 endpoint).
 * - Default pipeline = PipelineTest.
 * - Opt into real production pipeline with ?coveoPipelineTest=false
 */
export function initCoveoPipelineTestForEventsSearch() {
  if (typeof window === 'undefined') return false;
  captureCoveoBearerTokenFromUrl();
  prodOrgQaEnabled = true;
  pipelineTestEnabled = !readPipelineTestOptOutFromUrl();
  try {
    sessionStorage.removeItem('coveoToken');
    sessionStorage.removeItem('coveoPipelineTestToken');
  } catch (e) {
    // ignore
  }
  const routing = pipelineTestEnabled ? COVEO_SEARCH_TEST : COVEO_SEARCH_DEFAULTS;
  // eslint-disable-next-line no-console
  console.info('[Coveo QA] EXLM-5173 Events Search routing', {
    org: COVEO_PROD_ORG_ID,
    mode: pipelineTestEnabled ? 'PipelineTest' : 'Production pipeline',
    ...routing,
    bearerToken: getCoveoBearerTokenForPipelineTest() ? 'configured' : 'missing',
  });
  return prodOrgQaEnabled;
}

/** @deprecated Use initCoveoPipelineTestForEventsSearch on EXLM-5173 branch */
export function initCoveoPipelineTestFromUrl() {
  return initCoveoPipelineTestForEventsSearch();
}

/** True when Events Search is forcing prod org / endpoint / API key. */
export function isCoveoProdOrgQaEnabled() {
  return prodOrgQaEnabled === true;
}

/** True when PipelineTest pipeline is active (default on this QA branch). */
export function isCoveoPipelineTestEnabled() {
  return pipelineTestEnabled === true;
}

/** Suffix for coveo-token when PipelineTest pipeline is selected. */
export function getCoveoTokenUrlSuffix() {
  if (!isCoveoPipelineTestEnabled()) return '';
  const { searchHub } = COVEO_SEARCH_TEST;
  return `&searchHub=${encodeURIComponent(searchHub)}&pipelineTest=true`;
}

export function getCoveoTokenUrl() {
  const { coveoTokenUrl, lang } = getConfig();
  if (!isCoveoProdOrgQaEnabled()) return coveoTokenUrl;
  const language = lang || 'en';
  return `https://experienceleague.adobe.com/api/action/coveo-token?lang=${language}${getCoveoTokenUrlSuffix()}`;
}

/** @returns {{ searchHub: string, pipeline: string }} */
export function getCoveoSearchRouting() {
  return isCoveoPipelineTestEnabled() ? COVEO_SEARCH_TEST : COVEO_SEARCH_DEFAULTS;
}

export function getCoveoOrganizationId() {
  const { coveoOrganizationId } = getConfig();
  return isCoveoProdOrgQaEnabled() ? COVEO_PROD_ORG_ID : coveoOrganizationId;
}

export function getCoveoSearchResultsUrl(options = {}) {
  const { fetchFacets = false } = options;
  const { coveoSearchResultsUrl } = getConfig();
  if (!isCoveoProdOrgQaEnabled()) {
    return fetchFacets ? `${coveoSearchResultsUrl}/values/batch` : coveoSearchResultsUrl;
  }
  const path = fetchFacets ? '/values/batch' : '';
  return `${COVEO_PROD_SEARCH_BASE_URL}${path}?organizationId=${COVEO_PROD_ORG_ID}`;
}
