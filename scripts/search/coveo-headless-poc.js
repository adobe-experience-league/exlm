import buildHeadlessSearchEngine from '../data-service/coveo/headless-engine.js';
import loadCoveoToken from '../data-service/coveo/coveo-token-service.js';
import BrowseCardsCoveoDataAdaptor from '../browse-card/browse-cards-coveo-data-adaptor.js';
import buildCard from '../browse-card/browse-card.js';

const coveoToken = await loadCoveoToken();

export default async function coveoSearchEnginePOC() {
  const resultsEl = document.createElement('div');
  resultsEl.style.display = 'grid';
  resultsEl.style.gridTemplateColumns = 'repeat(4, 1fr)';
  resultsEl.style.gap = '8px';

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

        const contentTypeCategoryField = module
          .loadCategoryFacetSetActions(headlessSearchEngine)
          .registerCategoryFacet({
            numberOfValues: 10,
            facetId: '@el_contenttype',
            field: 'el_contenttype',
            delimitingCharacter: '|',
            sortCriteria: 'occurrences',
          });
        const roleTypeCategoryField = module.loadCategoryFacetSetActions(headlessSearchEngine).registerCategoryFacet({
          numberOfValues: 10,
          facetId: '@el_role',
          field: 'el_role',
          delimitingCharacter: '|',
          sortCriteria: 'occurrences',
        });

        window.headlessCategoryFacet = module.loadCategoryFacetSetActions(headlessSearchEngine);

        headlessSearchEngine.dispatch(advancedQuery);
        headlessSearchEngine.dispatch(context);
        headlessSearchEngine.dispatch(searchConfiguration);
        headlessSearchEngine.dispatch(fields);
        headlessSearchEngine.dispatch(contentTypeCategoryField);
        headlessSearchEngine.dispatch(roleTypeCategoryField);
      }

      configureSearchHeadlessEngine(
        headlessSearchEngine,
        'Experience League Learning Hub',
        { topic: 'Customers' },
        '@el_features="Customers"',
      );

      headlessSearchEngine.subscribe(async () => {
        // eslint-disable-next-line
        const search = headlessSearchEngine.state.search;
        // eslint-disable-next-line
        const results = search.results;
        resultsEl.innerHTML = '';
        if (results.length > 0) {
          const cardsData = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
          cardsData.forEach((cardData) => {
            const cardDiv = document.createElement('div');
            buildCard(cardDiv, cardData);
            resultsEl.appendChild(cardDiv);
          });
        } else {
          resultsEl.innerHTML = 'No results';
        }
        return resultsEl;
      });

      headlessSearchEngine.executeFirstSearch();
      // eslint-disable-next-line
      console.log(headlessSearchEngine, 'hello search engine data');

      const headlessSearchBox = module.buildSearchBox(headlessSearchEngine, {
        options: {
          numberOfSuggestions: 0,
        },
      });

      const browseFiltersSection = document.querySelector('.browse-filters-form');
      const filterInputSection = browseFiltersSection.querySelector('.filter-input-search');
      const searchIcon = filterInputSection.querySelector('.icon-search');
      const searchInput = filterInputSection.querySelector('input');

      searchInput.addEventListener('change', (e) => {
        // eslint-disable-next-line
        console.log('onChange', e.target.value);
      });
      searchInput.addEventListener('keyup', (e) => {
        // eslint-disable-next-line
        console.log('onKeyUp', e.target.value);
        headlessSearchBox.updateText(e.target.value);
      });

      searchIcon.addEventListener('click', () => headlessSearchBox.submit());

      // window.headlessCategoryFacet = headlessCategoryFacet;
      window.headlessSearchBox = headlessSearchBox;
      window.headlessSearchEngine = headlessSearchEngine;

      browseFiltersSection.appendChild(resultsEl);
      // targetedDiv.insertBefore(searchInput, targetedDiv.lastChild);
      // targetedDiv.insertBefore(resultsEl, targetedDiv.lastChild);
    });
  }, 1000);
}
