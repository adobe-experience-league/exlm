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
  const fields = module
    .loadFieldActions(searchEngine)
    .registerFieldsToInclude([
      'el_solution',
      'el_type',
      'el_contenttype',
      'type',
      'el_product',
      'el_version',
      'date',
      'el_contenttype',
      'objecttype',
      'filetype',
      'outlookformacuri',
      'outlookuri',
      'connectortype',
      'urihash',
      'collection',
      'source',
      'author',
      'liboardinteractionstyle',
      'lithreadhassolution',
      'sourcetype',
      'el_interactionstyle',
      'contenttype',
      'el_rank_icon',
      'el_lirank',
      'el_solutions_authored',
      'el_reply_status',
      'el_kudo_status',
      'el_usergenerictext',
      'documenttype',
      'video_url',
      'sysdocumenttype',
      'language',
      'permanentid',
      '@foldingcollection',
      '@foldingparent',
      '@foldingchild',
      'el_rank_icon',
      'el_lirank',
      'liMessageLabels',
      'licommunityurl',
      'el_view_status',
      'video_url',
    ]);

  // searchEngine.dispatch(advancedQuery);
  searchEngine.dispatch(context);
  searchEngine.dispatch(searchConfiguration);
  searchEngine.dispatch(fields);
}

export const fragment = () => window.location.hash.slice(1);

export default async function coveoSearchEnginePOC({
  handleSearchEngineSubscription,
  renderPageNumbers,
  numberOfResults,
  renderSearchQuerySummary,
}) {
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
          numberOfValues: 8,
        });

        const headlessRoleFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_role',
          },
          numberOfValues: 8,
        });

        const headlessExperienceFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_level',
          },
          numberOfValues: 8,
        });

        const headlessPager = module.buildPager(headlessSearchEngine, {
          initialState: {
            page: 1,
          },
        });
        let headlessResultsPerPage = null;
        if (numberOfResults) {
          headlessResultsPerPage = module.buildResultsPerPage(headlessSearchEngine, {
            initialState: { numberOfResults },
          });
        }

        const headlessQuerySummary = module.buildQuerySummary(headlessSearchEngine);

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

        headlessPager.subscribe(() => {
          if (renderPageNumbers) {
            renderPageNumbers();
          }
        });

        headlessQuerySummary.subscribe(() => {
          if (renderSearchQuerySummary) {
            renderSearchQuerySummary();
          }
        });

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
        window.headlessStatusControllers = statusControllers;
        window.headlessPager = headlessPager;
        window.headlessResultsPerPage = headlessResultsPerPage;
        window.headlessQuerySummary = headlessQuerySummary;

        resolve({
          submitSearchHandler,
          searchInputKeydownHandler,
          searchInputKeyupHandler,
          clearSearchHandler,
          searchInputEventHandler,
        });

        const criteria = [['Relevance', module.buildRelevanceSortCriterion()]];

        const initialCriterion = criteria[0][1];

        const headlessBuildSort = module.buildSort(headlessSearchEngine, {
          initialState: { criterion: initialCriterion },
        });

        const sortWrapperEl = document.createElement('div');
        sortWrapperEl.classList.add('sort-dropdown-content');

        const sortingOptions = [
          { label: 'Relevance', sortCriteria: 'relevancy' },
          { label: 'Popularity', sortCriteria: 'el_view_count descending' },
          { label: 'Newest', sortCriteria: 'descending' },
          { label: 'Oldest', sortCriteria: 'ascending' },
        ];

        sortingOptions.forEach((option) => {
          const aElement = document.createElement('a');
          aElement.setAttribute('data-sort-criteria', option.sortCriteria);
          aElement.setAttribute('data-sort-caption', option.label);
          aElement.innerHTML = option.label;
          sortWrapperEl.appendChild(aElement);
        });
        const sortContainer = document.querySelector('.sort-container');
        sortContainer.appendChild(sortWrapperEl);
        const sortDropdown = sortContainer.querySelector('.sort-dropdown-content');
        const sortAnchors = sortDropdown.querySelectorAll('a');
        const sortBtn = sortContainer.querySelector('.sort-drop-btn');

        headlessBuildSort.sortBy(module.buildRelevanceSortCriterion());

        if (sortAnchors.length > 0) {
          sortAnchors.forEach((anchor) => {
            const anchorCaption = anchor.getAttribute('data-sort-caption');

            if (anchorCaption === sortBtn.innerHTML) {
              anchor.classList.add('selected');
            }

            anchor.addEventListener('click', () => {
              sortAnchors.forEach((anch) => {
                anch.classList.remove('selected');
              });
              anchor.classList.add('selected');
              sortDropdown.classList.remove('show');
              sortBtn.innerHTML = anchorCaption;

              switch (anchor.innerHTML) {
                case 'Relevance':
                  headlessBuildSort.sortBy(module.buildRelevanceSortCriterion());
                  break;
                case 'Popularity':
                  headlessBuildSort.sortBy(module.buildFieldSortCriterion('el_view_count', 'descending'));
                  break;
                case 'Newest':
                  headlessBuildSort.sortBy(module.buildDateSortCriterion('descending'));
                  break;
                case 'Oldest':
                  headlessBuildSort.sortBy(module.buildDateSortCriterion('ascending'));
                  break;
                default:
                  headlessBuildSort.sortBy(module.buildRelevanceSortCriterion());
              }
            });
          });
        }
      })
      .catch((e) => {
        // eslint-disable-next-line
        console.log('failed to load coveo headless module', e);
        reject(e);
      });
  });
}
