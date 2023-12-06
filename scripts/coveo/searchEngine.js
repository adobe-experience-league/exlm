import { 
  buildSearchEngine,
  getOrganizationEndpoints,
  loadAdvancedSearchQueryActions,
  loadSearchConfigurationActions,
  loadFieldActions
} from "@coveo/headless";
import loadCoveoToken from "../data-service/coveo/coveo-token-service.js";

export async function buildCoveoSearchHeadlessEngine () {
  const headlessEngine = buildSearchEngine({
    configuration: {
      organizationId: "adobesystemsincorporatednonprod1",
      accessToken: await loadCoveoToken(),
      organizationEndpoints: getOrganizationEndpoints('adobesystemsincorporatednonprod1')
    },
  });

  return headlessEngine;
}

function configureSearchHeadlessEngine(engine, searchHub, contextObject, advancedQueryRule) {
  const advancedQuery = loadAdvancedSearchQueryActions(engine).updateAdvancedSearchQueries({
    aq: advancedQueryRule || ''
  });
  const context = loadContextActions(engine).setContext(contextObject);
  const searchConfiguration = loadSearchConfigurationActions(engine).updateSearchConfiguration({
    locale: 'en',
    searchHub
  });
  const fields = loadFieldActions(engine).registerFieldsToInclude(['el_solution', 'el_type']);
  engine.dispatch(advancedQuery);
  engine.dispatch(context);
  engine.dispatch(searchConfiguration);
  engine.dispatch(fields);
}

export async function initCoveo() {
  let searchEngine = await buildCoveoSearchHeadlessEngine();
  if (searchEngine) {
    configureSearchHeadlessEngine(
      searchEngine,
      'Experience League Learning Hub',
      { topic: 'Customers' },
      '@el_features="Customers"'
    );
    searchEngine.executeFirstSearch();
    searchEngine.subscribe(() => {
      console.log(searchEngine.state.search.results);
    });
  } 
}
