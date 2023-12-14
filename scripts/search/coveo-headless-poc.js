import buildHeadlessSearchEngine from '../data-service/coveo/headless-engine.js';
import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';

const coveoToken = await loadCoveoToken();

export default async function coveoSearchEnginePOC() {
  const resultsEl = document.createElement('div');

  const resultTemplate = (data) => {
    const resultContent = `<div class="topic-result">
          <div class="topic-content">
            <h2>${data.title}</h2>
            <p>${data.raw.el_type}</p>
          </div>
        </div>`;
    return resultContent;
  };

  // or via dymanic import
  setTimeout(async () => {
    // eslint-disable-next-line import/no-relative-packages
    import('../coveo/browser/headless.esm.js').then((module) => {
      const headlessSearchEngine = buildHeadlessSearchEngine(module, coveoToken);

      function configureSearchHeadlessEngine(searchEngine, searchHub, contextObject, advancedQueryRule) {
        const advancedQuery = module.loadAdvancedSearchQueryActions(searchEngine).updateAdvancedSearchQueries({
          aq: advancedQueryRule || '',
        });
        const context = module.loadContextActions(searchEngine).setContext(contextObject);
        const searchConfiguration = module.loadSearchConfigurationActions(searchEngine).updateSearchConfiguration({
          locale: document.documentElement.lang,
          searchHub,
        });
        const fields = module.loadFieldActions(searchEngine).registerFieldsToInclude(['el_solution', 'el_type']);

        headlessSearchEngine.dispatch(advancedQuery);
        headlessSearchEngine.dispatch(context);
        headlessSearchEngine.dispatch(searchConfiguration);
        headlessSearchEngine.dispatch(fields);
      }

      configureSearchHeadlessEngine(
        headlessSearchEngine,
        'Experience League Learning Hub',
        { topic: 'Customers' },
        '@el_features="Customers"',
      );

      headlessSearchEngine.subscribe(() => {
        // eslint-disable-next-line
        const search = headlessSearchEngine.state.search;
        // eslint-disable-next-line
        const results = search.results;

        if (results.length > 0) {
          results.forEach((result) => {
            // eslint-disable-next-line
            resultsEl.innerHTML += resultTemplate(result);
          });
        }
        return resultsEl;
      });

      headlessSearchEngine.executeFirstSearch();
      // eslint-disable-next-line
      console.log(headlessSearchEngine, 'hello search engine data');

      const targetedDiv = document.querySelector('main > div:nth-child(1) .default-content-wrapper');
      const searchInput = document.createElement('input');
      searchInput.id = 'searchField';
      searchInput.className = 'search-input';
      searchInput.setAttribute('placeholder', 'hello search engine');
      searchInput.setAttribute('onChange', `console.log("hello onChange")`);
      searchInput.setAttribute('onKeyDown', `console.log("hello onKeyDown")`);

      targetedDiv.insertBefore(searchInput, targetedDiv.lastChild);
      targetedDiv.insertBefore(resultsEl, targetedDiv.lastChild);
    });
  }, 1000);
}
