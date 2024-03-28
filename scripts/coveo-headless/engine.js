import { generateCustomContext, generateMlParameters, COVEO_SEARCH_CUSTOM_EVENTS } from '../search/search-utils.js';

export default function buildHeadlessSearchEngine(module, coveoToken) {
  return module.buildSearchEngine({
    configuration: {
      organizationId: 'adobesystemsincorporatednonprod1', // 'adobev2prod9e382h1q',
      organizationEndpoints: module.getOrganizationEndpoints('adobesystemsincorporatednonprod1'), // ('adobev2prod9e382h1q'),
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
