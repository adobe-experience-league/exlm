import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import { getConfig } from '../scripts.js';
import { generateCustomContext, generateMlParameters, COVEO_SEARCH_CUSTOM_EVENTS } from '../search/search-utils.js';
import { COVEO_EXCLUDE_STALE_UPCOMING_AQ, BASE_COVEO_ADVANCED_QUERY } from '../browse-card/browse-cards-constants.js';

/**
 * Ensure Browse / Headless searches never return past Upcoming Events (EXLM-5361).
 * URL hash `aq=` can overwrite `headlessBaseSolutionQuery`, so enforce at request time.
 * @param {string} aq
 * @returns {string}
 */
function withExcludeStaleUpcoming(aq) {
  const existing = (aq || '').trim();
  // Already constrained (Events Hub base aq / prior merge).
  if (existing.includes('el_event_start_time >= now')) {
    return existing;
  }
  if (!existing) {
    // Prefer page-configured base (Browse products/topics, Events V2, etc.).
    const pageBase =
      typeof window !== 'undefined' ? String(window.headlessBaseSolutionQuery || '').trim() : '';
    if (pageBase) {
      return pageBase.includes('el_event_start_time >= now')
        ? pageBase
        : `(${pageBase}) AND (${COVEO_EXCLUDE_STALE_UPCOMING_AQ})`;
    }
    // Fallback when Headless has not set a page base yet.
    return `(${BASE_COVEO_ADVANCED_QUERY}) AND (${COVEO_EXCLUDE_STALE_UPCOMING_AQ})`;
  }
  return `(${existing}) AND (${COVEO_EXCLUDE_STALE_UPCOMING_AQ})`;
}

export default async function buildHeadlessSearchEngine(module) {
  const { coveoOrganizationId } = getConfig();
  const coveoToken = await loadCoveoToken();
  return module.buildSearchEngine({
    configuration: {
      organizationId: coveoOrganizationId,
      organizationEndpoints: module.getOrganizationEndpoints(coveoOrganizationId),
      accessToken: coveoToken,
      preprocessRequest: (request, clientOrigin, metadata) => {
        const { body } = request;
        const bodyJSON = JSON.parse(body || '{}');
        if (metadata?.method === 'querySuggest' && window.headlessSolutionProductKey) {
          bodyJSON.mlParameters = generateMlParameters(window.headlessSolutionProductKey);
          const { context } = bodyJSON;
          const customContext = generateCustomContext(window.headlessSolutionProductKey);
          bodyJSON.context = {
            ...context,
            ...customContext,
          };
          request.body = JSON.stringify(bodyJSON);
        }
        // Drop stale Upcoming at query time (Browse filters + any Headless consumer).
        if (metadata?.method === 'search') {
          bodyJSON.aq = withExcludeStaleUpcoming(bodyJSON.aq);
          request.body = JSON.stringify(bodyJSON);
        }
        const preProcessEvent = new CustomEvent(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, {
          detail: {
            method: metadata?.method,
          },
        });
        document.dispatchEvent(preProcessEvent);
        return request;
      },
      search: {
        preprocessSearchResponseMiddleware: (data) => {
          const processSearchResponseEvent = new CustomEvent(COVEO_SEARCH_CUSTOM_EVENTS.PROCESS_SEARCH_RESPONSE, {});
          document.dispatchEvent(processSearchResponseEvent);
          return data;
        },
      },
    },
  });
}
