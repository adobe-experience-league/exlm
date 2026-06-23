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

const PIPELINE_TEST_PARAM = 'coveoPipelineTest';

/** @type {boolean | null} null = derive from URL on first read */
let pipelineTestEnabled = null;

/**
 * Call from events-search before Coveo init when testing PipelineTest on stage/prod.
 * Opt-in only: ?coveoPipelineTest=true
 */
export function initCoveoPipelineTestFromUrl() {
  if (typeof window === 'undefined') return false;
  pipelineTestEnabled = new URLSearchParams(window.location.search).get(PIPELINE_TEST_PARAM) === 'true';
  if (pipelineTestEnabled) {
    // eslint-disable-next-line no-console
    console.info('[Coveo Pipeline Test] enabled — routing to Sarika PipelineTest hub/pipeline');
  }
  return pipelineTestEnabled;
}

export function isCoveoPipelineTestEnabled() {
  if (pipelineTestEnabled === null) {
    return initCoveoPipelineTestFromUrl();
  }
  return pipelineTestEnabled;
}

/** @returns {{ searchHub: string, pipeline: string }} */
export function getCoveoSearchRouting() {
  return isCoveoPipelineTestEnabled() ? COVEO_SEARCH_TEST : COVEO_SEARCH_DEFAULTS;
}

/** Suffix for coveo-token when PipelineTest is active (converter may honor searchHub param). */
export function getCoveoTokenUrlSuffix() {
  if (!isCoveoPipelineTestEnabled()) return '';
  const { searchHub } = COVEO_SEARCH_TEST;
  return `&searchHub=${encodeURIComponent(searchHub)}&pipelineTest=true`;
}
