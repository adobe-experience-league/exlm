import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import {
  COVEO_SEARCH_TEST,
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
          const { pipeline } = getCoveoSearchRouting();
          bodyJSON.pipeline = pipeline;
          delete bodyJSON.searchHub;
          if (request.url) {
            try {
              const url = new URL(request.url);
              if (url.searchParams.has('searchHub')) {
                url.searchParams.delete('searchHub');
                request.url = url.toString();
              }
            } catch (e) {
              // ignore
            }
          }
          // eslint-disable-next-line no-console
          console.info('[Coveo Pipeline Test] request routing', { pipeline, method: metadata?.method });
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
          if (isCoveoPipelineTestEnabled() && data?.body?.pipeline === COVEO_SEARCH_TEST.pipeline) {
            const { warnings } = data.body;
            if (Array.isArray(warnings)) {
              data.body.warnings = warnings.filter(
                (w) => !/searchHub in the query parameters was overridden/i.test(String(w)),
              );
            }
          }
          const processSearchResponseEvent = new CustomEvent(COVEO_SEARCH_CUSTOM_EVENTS.PROCESS_SEARCH_RESPONSE, {});
          document.dispatchEvent(processSearchResponseEvent);
          return data;
        },
      },
    },
  });
}
