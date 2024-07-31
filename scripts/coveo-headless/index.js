import buildHeadlessSearchEngine from './engine.js';
import { fetchLanguagePlaceholders } from '../scripts.js';
import { handleCoverSearchSubmit } from '../../blocks/browse-filters/browse-filter-utils.js';

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const locales = new Map([
  ['es', 'es-ES'],
  ['pt-br', 'pt-BR'],
  ['zh-hans', 'zh-CN'],
  ['zh-hant', 'zh-TW'],
]);

function configureSearchHeadlessEngine({ module, searchEngine, searchHub, contextObject, advancedQueryRule }) {
  const advancedQuery = module.loadAdvancedSearchQueryActions(searchEngine).registerAdvancedSearchQueries({
    aq: advancedQueryRule || '',
  });
  const context = contextObject ? module.loadContextActions(searchEngine).setContext(contextObject) : null;
  const searchConfiguration = module.loadSearchConfigurationActions(searchEngine).updateSearchConfiguration({
    locale: locales.get(document.querySelector('html').lang) || document.querySelector('html').lang || 'en',
    searchHub,
  });
  const fields = module
    .loadFieldActions(searchEngine)
    .registerFieldsToInclude([
      '@foldingchild',
      '@foldingcollection',
      '@foldingparent',
      'author',
      'author_bio_page',
      'author_name',
      'author_type',
      'authorname',
      'authortype',
      'collection',
      'connectortype',
      'contenttype',
      'date',
      'documenttype',
      'el_author_type',
      'el_contenttype',
      'el_id',
      'el_interactionstyle',
      'el_kudo_status',
      'el_lirank',
      'el_product',
      'el_rank_icon',
      'el_reply_status',
      'el_solution',
      'el_solutions_authored',
      'el_type',
      'el_usergenerictext',
      'el_version',
      'el_view_status',
      'exl_description',
      'exl_thumbnail',
      'filetype',
      'id',
      'language',
      'liMessageLabels',
      'liboardinteractionstyle',
      'licommunityurl',
      'lithreadhassolution',
      'objecttype',
      'outlookformacuri',
      'outlookuri',
      'permanentid',
      'role',
      'source',
      'sourcetype',
      'sysdocumenttype',
      'type',
      'urihash',
      'video_url',
    ]);

  searchEngine.dispatch(advancedQuery);
  if (context) {
    searchEngine.dispatch(context);
  }
  searchEngine.dispatch(searchConfiguration);
  searchEngine.dispatch(fields);
}

export const fragment = () => window.location.hash.slice(1);

const hashURL = fragment();

export default async function initiateCoveoHeadlessSearch({
  handleSearchEngineSubscription,
  renderPageNumbers,
  numberOfResults,
  renderSearchQuerySummary,
  handleSearchBoxSubscription,
}) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line import/no-relative-packages
    import('./libs/browser/headless.esm.js')
      .then(async (module) => {
        const headlessSearchEngine = await buildHeadlessSearchEngine(module);
        const statusControllers = module.buildSearchStatus(headlessSearchEngine);

        configureSearchHeadlessEngine({
          module,
          searchEngine: headlessSearchEngine,
          searchHub: 'Experience League Learning Hub',
          contextObject: null,
          advancedQueryRule: '',
        });

        const headlessSearchBox = module.buildSearchBox(headlessSearchEngine, {
          options: {
            numberOfSuggestions: 5,
            id: 'component-search',
          },
        });

        const headlessTypeFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_contenttype',
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

        const headlessProductFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'el_product',
          },
          numberOfValues: 8,
        });

        const headlessAuthorTypeFacet = module.buildFacet(headlessSearchEngine, {
          options: {
            field: 'author_type',
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

        const headlessContext = module.buildContext(headlessSearchEngine);
        const headlessQueryActionCreators = module.loadAdvancedSearchQueryActions(headlessSearchEngine);
        const headlessSearchActionCreators = module.loadSearchActions(headlessSearchEngine);
        const { logSearchboxSubmit } = module.loadSearchAnalyticsActions(headlessSearchEngine);

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
          handleCoverSearchSubmit(key);
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
        const searchInputKeyupHandler = async (e) => {
          const searchText = e.target.value;
          if (headlessSearchBox.state.value === searchText) {
            return;
          }
          headlessSearchBox.updateText(searchText);
          e.target.classList.add('suggestion-interactive');
        };
        const searchInputKeydownHandler = (e) => {
          if (e.key === 'Enter') {
            submitSearchHandler();
            const searchBlock = document.querySelector('.browse-filters-search');
            const searchSuggestionsPopoverEl = searchBlock?.querySelector('.search-suggestions-popover');
            const searchInputEl = searchBlock?.querySelector('.suggestion-interactive');
            if (searchInputEl) {
              searchInputEl.classList.remove('suggestion-interactive');
            }

            if (searchSuggestionsPopoverEl) {
              searchSuggestionsPopoverEl.classList.remove('search-suggestions-popover-visible');
              searchSuggestionsPopoverEl.classList.add('search-suggestions-popover-hide');
              setTimeout(() => {
                // We need this minor delay to make sure that search popOver does not flash when we press enter due to multiple re-renders from searchBox state subscription
                searchSuggestionsPopoverEl.classList.remove('search-suggestions-popover-hide');
              }, 0);
            }
          } else {
            const isArrowUp = e.key === 'ArrowUp';
            const isArrowDown = e.key === 'ArrowDown';
            if (!isArrowDown && !isArrowUp) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            const searchSuggestionsPopover = document.querySelector(
              '.browse-filters-search .search-suggestions-popover',
            );
            if (!searchSuggestionsPopover) {
              return;
            }
            const targetElement = isArrowUp
              ? searchSuggestionsPopover.querySelector('li:last-child')
              : searchSuggestionsPopover.querySelector('li');
            if (targetElement) {
              targetElement.focus();
              e.target.value = targetElement.textContent;
            }
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
        window.headlessProductFacet = headlessProductFacet;
        window.headlessAuthorTypeFacet = headlessAuthorTypeFacet;
        window.headlessStatusControllers = statusControllers;
        window.headlessPager = headlessPager;
        window.headlessResultsPerPage = headlessResultsPerPage;
        window.headlessQuerySummary = headlessQuerySummary;
        window.headlessContext = headlessContext;
        window.headlessQueryActionCreators = headlessQueryActionCreators;
        window.headlessSearchActionCreators = headlessSearchActionCreators;
        window.logSearchboxSubmit = logSearchboxSubmit;

        headlessSearchBox.subscribe(handleSearchBoxSubscription);

        /* TODO: Sorting segments to be extracted & restructured and incorporate them into the browse filters, as this file serves coveo engine methods */
        const sortLabel = {
          relevance: placeholders.filterSortRelevanceLabel,
          popularity: placeholders.filerSortPopularityLabel,
          newest: placeholders.filterSortNewestLabel,
          oldest: placeholders.filterSortOldestLabel,
        };
        const sortWrapperEl = document.createElement('div');
        sortWrapperEl.classList.add('sort-dropdown-content');

        const sortingOptions = [
          { label: sortLabel.relevance, sortCriteria: 'relevancy' },
          { label: sortLabel.popularity, sortCriteria: 'el_view_count descending' },
          { label: sortLabel.newest, sortCriteria: 'descending' },
          { label: sortLabel.oldest, sortCriteria: 'ascending' },
        ];

        sortingOptions.forEach((option) => {
          const aElement = document.createElement('a');
          aElement.setAttribute('href', '/');
          aElement.setAttribute('data-sort-criteria', option.sortCriteria);
          aElement.setAttribute('data-sort-caption', option.label);
          aElement.innerHTML = option.label;
          sortWrapperEl.appendChild(aElement);
        });

        const sortContainer = document.querySelector('.sort-container');
        if (sortContainer) {
          sortContainer.appendChild(sortWrapperEl);
          const sortDropdown = sortContainer.querySelector('.sort-dropdown-content');
          const sortAnchors = sortDropdown.querySelectorAll('a');
          const sortBtn = sortContainer.querySelector('.sort-drop-btn');
          let criteria = [[]];
          const isSortValueInHash = hashURL.split('&');
          // eslint-disable-next-line
          isSortValueInHash.filter((item) => {
            if (item.includes('sortCriteria')) {
              const scValue = decodeURIComponent(item.split('=')[1]);
              // eslint-disable-next-line
              switch (scValue) {
                case 'relevancy':
                  sortBtn.innerHTML = sortLabel.relevance;
                  criteria = [[sortLabel.relevance, module.buildRelevanceSortCriterion()]];
                  break;
                case '@el_view_count descending':
                  sortBtn.innerHTML = sortLabel.popularity;
                  criteria = [[sortLabel.popularity, module.buildFieldSortCriterion('el_view_count', 'descending')]];
                  break;
                case 'date descending':
                  sortBtn.innerHTML = sortLabel.newest;
                  criteria = [[sortLabel.newest, module.buildDateSortCriterion('descending')]];
                  break;
                case 'date ascending':
                  sortBtn.innerHTML = sortLabel.oldest;
                  criteria = [[sortLabel.oldest, module.buildDateSortCriterion('ascending')]];
                  break;
              }
            }
          });

          const initialCriterion = criteria[0][1];

          const headlessBuildSort = module.buildSort(headlessSearchEngine, {
            initialState: { criterion: initialCriterion },
          });

          if (sortAnchors.length > 0) {
            sortAnchors.forEach((anchor) => {
              const anchorCaption = anchor.getAttribute('data-sort-caption');
              const anchorSortCriteria = anchor.getAttribute('data-sort-criteria');

              if (anchorCaption === sortBtn.innerHTML) {
                anchor.classList.add('selected');
              }

              anchor.addEventListener('click', (e) => {
                e.preventDefault();
                sortAnchors.forEach((anch) => {
                  anch.classList.remove('selected');
                });
                anchor.classList.add('selected');
                sortDropdown.classList.remove('show');
                sortBtn.innerHTML = anchorCaption;

                // eslint-disable-next-line
                switch (anchorSortCriteria) {
                  case 'relevancy':
                    headlessBuildSort.sortBy(module.buildRelevanceSortCriterion());
                    break;
                  case 'el_view_count descending':
                    headlessBuildSort.sortBy(module.buildFieldSortCriterion('el_view_count', 'descending'));
                    break;
                  case 'descending':
                    headlessBuildSort.sortBy(module.buildDateSortCriterion('descending'));
                    break;
                  case 'ascending':
                    headlessBuildSort.sortBy(module.buildDateSortCriterion('ascending'));
                    break;
                }
              });
            });
          }
        }

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
