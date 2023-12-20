import buildHeadlessSearchEngine from './engine.js';
import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';

const coveoToken = await loadCoveoToken();

function configureSearchHeadlessEngine({ module, searchEngine, searchHub, contextObject }) {
  // const advancedQuery = module.loadAdvancedSearchQueryActions(searchEngine).updateAdvancedSearchQueries({
  //   aq: advancedQueryRule || '',
  // });
  const context = module.loadContextActions(searchEngine).setContext(contextObject);
  const searchConfiguration = module.loadSearchConfigurationActions(searchEngine).updateSearchConfiguration({
    locale: document.documentElement.lang,
    searchHub,
  });
  const fields = module.loadFieldActions(searchEngine).registerFieldsToInclude(['el_solution', 'el_type']);

  // searchEngine.dispatch(advancedQuery);
  searchEngine.dispatch(context);
  searchEngine.dispatch(searchConfiguration);
  searchEngine.dispatch(fields);
}

export const fragment = () => window.location.hash.slice(1);

export default async function coveoSearchEnginePOC(handleSearchEngineSubscription) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line import/no-relative-packages
    import('./libs/browser/headless.esm.js')
      .then((module) => {
        const headlessSearchEngine = buildHeadlessSearchEngine(module, coveoToken);
        const statusControllers = module.buildSearchStatus(headlessSearchEngine);

        configureSearchHeadlessEngine({
          module,
          searchEngine: headlessSearchEngine,
          searchHub: 'Experience League Learning Hub',
          contextObject: { topic: 'Customers' },
          advancedQueryRule: null, // '@el_features="Customers"',
        });

        const headlessSearchBox = module.buildSearchBox(headlessSearchEngine, {
          options: {
            numberOfSuggestions: 0,
          },
        });

        const headlessTypeFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_type',
          },
        });

        const headlessRoleFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_role',
          },
        });

        const headlessExperienceFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_level',
          },
        });

        const urlManager = module.buildUrlManager(headlessSearchEngine, {
          initialState: { fragment: fragment() },
        });

        urlManager.subscribe(() => {
          const hash = `#${urlManager.state.fragment}`;
          if (!statusControllers.state.firstSearchExecuted) {
            window.history.replaceState(null, document.title, hash);
            return;
          }
          window.history.pushState(null, document.title, hash);
        });

        headlessSearchEngine.subscribe(handleSearchEngineSubscription);

        urlManager.synchronize(fragment());

        function onHashChange() {
          urlManager.synchronize(fragment());
        }
        window.addEventListener('hashchange', onHashChange);

        const submitSearchHandler = () => {
          const key = headlessSearchBox.state.value;
          const [currentSearchString] = window.location.hash.match(/\bq=([^&#]*)/) || [];
          if (currentSearchString) {
            window.location.hash = window.location.hash.replace(currentSearchString, `q=${key || ''}`);
          } else {
            window.location.hash = `#q=${key || ''}&${fragment()}`;
          }
        };
        const clearSearchHandler = () => {
          const [currentSearchString] = window.location.hash.match(/\bq=([^&#]*)/) || [];
          if (currentSearchString) {
            let updatedHash = window.location.hash.replace(currentSearchString, '');
            if (updatedHash.slice(1).startsWith('&')) {
              updatedHash = `#${updatedHash.slice(2)}`;
            }
            window.location.hash = updatedHash;
          }
        };
        const searchInputKeyupHandler = (e) => {
          // eslint-disable-next-line
          console.log('onKeyUp', e.target.value);
          headlessSearchBox.updateText(e.target.value);
        };
        const searchInputKeydownHandler = (e) => {
          if (e.key === 'Enter') {
            submitSearchHandler();
          }
        };
        const searchInputEventHandler = (e) => {
          if (e.target.value === '') {
            clearSearchHandler();
          }
        };

        window.headlessSearchBox = headlessSearchBox;
        window.headlessSearchEngine = headlessSearchEngine;
        window.headlessTypeFacet = headlessTypeFacet;
        window.headlessRoleFacet = headlessRoleFacet;
        window.headlessExperienceFacet = headlessExperienceFacet;

        resolve({
          submitSearchHandler,
          searchInputKeydownHandler,
          searchInputKeyupHandler,
          clearSearchHandler,
          searchInputEventHandler,
        });
      })
      .catch((e) => {
        // eslint-disable-next-line
        console.log('failed to load coveo headless module', e);
        reject(e);
      });
  });
}
