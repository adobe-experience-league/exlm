import { generateCustomContext, generateMlParameters } from '../search/search-utils.js';

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
        return request;
      },
    },
  });
}
