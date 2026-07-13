import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import {
  COVEO_SEARCH_TEST,
  getCoveoOrganizationId,
  getCoveoSearchRouting,
  isCoveoPipelineTestEnabled,
  isCoveoProdOrgQaEnabled,
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
        if (isCoveoProdOrgQaEnabled()) {
          const { pipeline, searchHub } = getCoveoSearchRouting();
          bodyJSON.pipeline = pipeline;
          if (isCoveoPipelineTestEnabled()) {
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
          } else {
            bodyJSON.searchHub = searchHub;
          }
          // eslint-disable-next-line no-console
          console.info('[Coveo QA] request routing', {
            pipeline,
            searchHub: bodyJSON.searchHub,
            method: metadata?.method,
          });
        }
        const shouldWriteBody =
          (metadata?.method === 'querySuggest' && window.headlessSolutionProductKey) || isCoveoProdOrgQaEnabled();
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
