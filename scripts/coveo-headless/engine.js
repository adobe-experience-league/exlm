import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import { getConfig } from '../scripts.js';
import { generateCustomContext, generateMlParameters, COVEO_SEARCH_CUSTOM_EVENTS } from '../search/search-utils.js';

export default async function buildHeadlessSearchEngine(module) {
  const { coveoOrganizationId } = getConfig();
  const coveoToken = await loadCoveoToken();
  return module.buildSearchEngine({
    configuration: {
      organizationId: coveoOrganizationId,
      accessToken: coveoToken,
      // Headless 3 defaults to Event Protocol (`next`). Search stays on legacy UA,
      // same as Atomic, so the existing Experience League pipeline keeps receiving events.
      analytics: { analyticsMode: 'legacy' },
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
