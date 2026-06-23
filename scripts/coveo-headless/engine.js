import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import {
  getCoveoOrganizationId,
  getCoveoSearchRouting,
  isCoveoPipelineTestEnabled,
} from '../data-service/coveo/coveo-search-config.js';
import { generateCustomContext, generateMlParameters, COVEO_SEARCH_CUSTOM_EVENTS } from '../search/search-utils.js';

export default async function buildHeadlessSearchEngine(module) {
  const coveoOrganizationId = getCoveoOrganizationId();
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
        }
        if (isCoveoPipelineTestEnabled()) {
          const { pipeline, searchHub } = getCoveoSearchRouting();
          bodyJSON.pipeline = pipeline;
          bodyJSON.searchHub = searchHub;
          // eslint-disable-next-line no-console
          console.info('[Coveo Pipeline Test] request routing', { pipeline, searchHub, method: metadata?.method });
        }
        const shouldWriteBody =
          (metadata?.method === 'querySuggest' && window.headlessSolutionProductKey) || isCoveoPipelineTestEnabled();
        if (shouldWriteBody) {
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
