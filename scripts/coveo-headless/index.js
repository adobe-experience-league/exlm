import buildHeadlessSearchEngine from './engine.js';
import { fetchLanguagePlaceholders } from '../scripts.js';
import { handleCoverSearchSubmit } from '../../blocks/browse-filters/browse-filter-utils.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../search/search-utils.js';

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
      'el_event_series',
      'el_event_start_time',
      'el_event_type',
      'el_event_speakers_name',
      'el_event_speakers_profile_picture_url',
      'el_id',
      'el_interactionstyle',
      'el_kudo_status',
      'el_lirank',
      'el_product',
      'el_rank_icon',
      'el_reply_status',
      'el_solution',
      'el_solutions_authored',
      'el_level',
      'el_course_duration',
      'el_course_module_count',
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

/**
 * Read/write the visible sort caption on a `.sort-drop-btn` (prefers `.sort-drop-btn-value`).
 * Pure DOM helpers — no Coveo state; safe to reuse for additional sort widgets.
 */
export function getSortButtonCaption(btn) {
  if (!btn) return '';
  const valueEl = btn.querySelector('.sort-drop-btn-value');
  return valueEl ? valueEl.textContent.trim() : btn.textContent.trim();
}

export function setSortButtonCaption(btn, caption) {
  if (!btn) return;
  const valueEl = btn.querySelector('.sort-drop-btn-value');
  if (valueEl) {
    valueEl.textContent = caption;
  } else {
    btn.textContent = caption;
  }
}

export const fragment = () => window.location.hash.slice(1);

const hashURL = fragment();

function buildHeadlessFacet(module, searchEngine, field, defaults = {}, overrides = {}) {
  const fieldOverrides = overrides[field] || {};
  const { numberOfValues: overrideCount, options: overrideOptions = {} } = fieldOverrides;
  return module.buildFacet(searchEngine, {
    options: {
      field,
      numberOfValues: overrideCount ?? defaults.numberOfValues ?? 8,
      ...overrideOptions,
    },
  });
}

/**
 * Builds a standalone sort controller and criterion builders without mounting a dropdown.
 * @param {Object} searchEngine - the headless search engine (e.g. window.headlessSearchEngine).
 */
export async function buildHeadlessSortController(searchEngine) {
  // eslint-disable-next-line import/no-relative-packages
  const module = await import('./libs/browser/headless.esm.js');
  const controller = module.buildSort(searchEngine, {
    initialState: { criterion: module.buildRelevanceSortCriterion() },
  });
  return {
    controller,
    criteria: {
      relevance: () => module.buildRelevanceSortCriterion(),
      date: (direction) => module.buildDateSortCriterion(direction),
      field: (field, direction) => module.buildFieldSortCriterion(field, direction),
    },
  };
}

export const buildEventsSearchSortController = buildHeadlessSortController;

/** Update a complete faceted-search state before executing one search. */
export function buildHeadlessSearchStateController(searchEngine, module) {
  const facetActions = module.loadFacetSetActions(searchEngine);
  const facetOptionsActions = module.loadFacetOptionsActions(searchEngine);
  const queryActions = module.loadQueryActions(searchEngine);
  const paginationActions = module.loadPaginationActions(searchEngine);
  const sortActions = module.loadSortCriteriaActions(searchEngine);
  return {
    toggleFacetValue(controller, selection) {
      searchEngine.dispatch(facetActions.toggleSelectFacetValue({ facetId: controller.state.facetId, selection }));
      searchEngine.dispatch(facetOptionsActions.updateFacetOptions());
    },
    setQuery(q) {
      searchEngine.dispatch(queryActions.updateQuery({ q }));
    },
    setPage(page) {
      searchEngine.dispatch(paginationActions.updatePage(page));
    },
    setSort(criterion) {
      searchEngine.dispatch(sortActions.updateSortCriterion(criterion));
    },
  };
}

export default async function initiateCoveoHeadlessSearch({
  handleSearchEngineSubscription,
  renderPageNumbers,
  numberOfResults,
  renderSearchQuerySummary,
  handleSearchBoxSubscription,
  facetOverrides = {},
  facetFields = ['el_contenttype', 'el_role', 'el_level', 'el_product', 'author_type', 'el_event_series'],
  hideAqFromUrl = false,
  baseAdvancedQuery = '',
  skipGenericSortDropdown = false,
  tabId = '',
  lockedFacets = {},
  publishGlobals = true,
  onUrlRestore,
  deferInitialSearch = false,
}) {
  // Facet selections that scope the page and survive URL restore / reset (e.g. { el_contenttype: ['Course'] }).
  // Needed when the query pipeline ignores aq for a Tab (Courses), so scope has to travel as a facet selection.
  const lockedFragmentParams = Object.entries(lockedFacets)
    .filter(([, values]) => values?.length)
    .map(([field, values]) => `f-${field}=${values.map(encodeURIComponent).join(',')}`);
  const allFacetFields = Array.from(new Set([...facetFields, ...Object.keys(lockedFacets)]));
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line import/no-relative-packages
    import('./libs/browser/headless.esm.js')
      .then(async (module) => {
        const headlessSearchEngine = await buildHeadlessSearchEngine(module);
        const statusControllers = module.buildSearchStatus(headlessSearchEngine);
        const subscriptions = [];

        configureSearchHeadlessEngine({
          module,
          searchEngine: headlessSearchEngine,
          searchHub: 'Experience League Learning Hub',
          contextObject: null,
          advancedQueryRule: baseAdvancedQuery,
        });

        if (tabId) {
          module.buildTab(headlessSearchEngine, {
            initialState: { isActive: true },
            options: { id: tabId, expression: '' },
          });
        }

        const headlessSearchBox = module.buildSearchBox(headlessSearchEngine, {
          options: {
            numberOfSuggestions: 5,
            id: 'component-search',
          },
        });

        const facets = Object.fromEntries(
          allFacetFields.map((field) => [
            field,
            buildHeadlessFacet(module, headlessSearchEngine, field, {}, facetOverrides),
          ]),
        );

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

        const fragmentForSynchronization = () => {
          const rawFragment = fragment();
          if (!tabId && !lockedFragmentParams.length && !hideAqFromUrl) return rawFragment;

          const lockedKeys = Object.keys(lockedFacets).map((field) => `f-${field}=`);
          const parameters = rawFragment
            .split('&')
            .filter(
              (param) =>
                param &&
                !param.startsWith('tab=') &&
                !(hideAqFromUrl && param.startsWith('aq=')) &&
                !lockedKeys.some((key) => param.startsWith(key)),
            );

          if (tabId) parameters.push(`tab=${encodeURIComponent(tabId)}`);
          if (hideAqFromUrl) parameters.push(`aq=${encodeURIComponent(baseAdvancedQuery)}`);
          parameters.push(...lockedFragmentParams);
          return parameters.join('&');
        };
        onUrlRestore?.(fragment());
        const urlManager = module.buildUrlManager(headlessSearchEngine, {
          initialState: { fragment: fragmentForSynchronization() },
        });

        if (hideAqFromUrl && !baseAdvancedQuery) {
          // eslint-disable-next-line no-console
          console.warn(
            'initiateCoveoHeadlessSearch: hideAqFromUrl is enabled without baseAdvancedQuery — aq will be cleared (and never reapplied) on every hash change.',
          );
        }

        // Used by events-search to keep its static aq out of the URL.
        function visibleHash() {
          const rawFragment = urlManager.state.fragment;
          const hiddenKeys = [];
          if (hideAqFromUrl) hiddenKeys.push('aq');
          if (tabId) hiddenKeys.push('tab');
          Object.keys(lockedFacets).forEach((field) => hiddenKeys.push(`f-${field}`));
          const visibleFragment = hiddenKeys.length
            ? rawFragment
                .split('&')
                .filter((param) => param && !hiddenKeys.some((key) => param.startsWith(`${key}=`)))
                .join('&')
            : rawFragment;
          return visibleFragment ? `#${visibleFragment}` : window.location.pathname + window.location.search;
        }

        function currentVisibleUrl() {
          return window.location.hash || window.location.pathname + window.location.search;
        }

        let batchingState = false;
        function writeVisibleUrl(replace = !statusControllers.state.firstSearchExecuted) {
          if (batchingState) return;
          const hash = visibleHash();
          if (hash === currentVisibleUrl()) return;
          if (replace) window.history.replaceState(null, document.title, hash);
          else window.history.pushState(null, document.title, hash);
        }

        function batchStateUpdates(update, { replace = !statusControllers.state.firstSearchExecuted } = {}) {
          batchingState = true;
          try {
            return update();
          } finally {
            batchingState = false;
            writeVisibleUrl(replace);
          }
        }

        subscriptions.push(urlManager.subscribe(() => writeVisibleUrl()));

        if (handleSearchEngineSubscription) {
          subscriptions.push(headlessSearchEngine.subscribe(handleSearchEngineSubscription));
        }

        subscriptions.push(
          headlessPager.subscribe(() => {
            if (renderPageNumbers) {
              renderPageNumbers();
            }
          }),
        );

        subscriptions.push(
          headlessQuerySummary.subscribe(() => {
            if (renderSearchQuerySummary) {
              renderSearchQuerySummary();
            }
          }),
        );

        function rerunSearch() {
          const logSubmit = logSearchboxSubmit;
          headlessSearchEngine.dispatch(
            headlessSearchActionCreators.executeSearch(typeof logSubmit === 'function' ? logSubmit() : undefined),
          );
        }

        if (!deferInitialSearch) urlManager.synchronize(fragmentForSynchronization());

        function onHashChange() {
          onUrlRestore?.(fragment());
          batchStateUpdates(() => urlManager.synchronize(fragmentForSynchronization()), { replace: true });
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

        if (publishGlobals) {
          window.headlessSearchBox = headlessSearchBox;
          window.headlessSearchEngine = headlessSearchEngine;
          window.headlessTypeFacet = facets.el_contenttype;
          window.headlessRoleFacet = facets.el_role;
          window.headlessExperienceFacet = facets.el_level;
          window.headlessProductFacet = facets.el_product;
          window.headlessAuthorTypeFacet = facets.author_type;
          window.headlessEventSeriesFacet = facets.el_event_series;
          window.headlessStatusControllers = statusControllers;
          window.headlessPager = headlessPager;
          window.headlessResultsPerPage = headlessResultsPerPage;
          window.headlessQuerySummary = headlessQuerySummary;
          window.headlessContext = headlessContext;
          window.headlessQueryActionCreators = headlessQueryActionCreators;
          window.headlessSearchActionCreators = headlessSearchActionCreators;
          window.logSearchboxSubmit = logSearchboxSubmit;
        }

        if (handleSearchBoxSubscription) {
          subscriptions.push(headlessSearchBox.subscribe(handleSearchBoxSubscription));
        }

        /* TODO: Sorting segments to be extracted & restructured and incorporate them into the browse filters, as this file serves coveo engine methods */
        // events-search opts out (skipGenericSortDropdown) to render its own conditional sort dropdown.
        // Only `if` guard added, the block below is the unchanged generic dropdown.
        if (!skipGenericSortDropdown) {
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
            aElement.textContent = option.label;
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
            isSortValueInHash.forEach((item) => {
              if (item.includes('sortCriteria')) {
                const scValue = decodeURIComponent(item.split('=')[1]);
                // eslint-disable-next-line
                switch (scValue) {
                  case 'relevancy':
                    setSortButtonCaption(sortBtn, sortLabel.relevance);
                    criteria = [[sortLabel.relevance, module.buildRelevanceSortCriterion()]];
                    break;
                  case '@el_view_count descending':
                    setSortButtonCaption(sortBtn, sortLabel.popularity);
                    criteria = [[sortLabel.popularity, module.buildFieldSortCriterion('el_view_count', 'descending')]];
                    break;
                  case 'date descending':
                    setSortButtonCaption(sortBtn, sortLabel.newest);
                    criteria = [[sortLabel.newest, module.buildDateSortCriterion('descending')]];
                    break;
                  case 'date ascending':
                    setSortButtonCaption(sortBtn, sortLabel.oldest);
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

                if (anchorCaption === getSortButtonCaption(sortBtn)) {
                  anchor.classList.add('selected');
                }

                anchor.addEventListener('click', (e) => {
                  e.preventDefault();
                  sortAnchors.forEach((anch) => {
                    anch.classList.remove('selected');
                  });
                  anchor.classList.add('selected');
                  sortDropdown.classList.remove('show');
                  setSortButtonCaption(sortBtn, anchorCaption);

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
        }
        const readyEvent = new CustomEvent(COVEO_SEARCH_CUSTOM_EVENTS.READY);
        document.dispatchEvent(readyEvent);
        resolve({
          engine: headlessSearchEngine,
          searchBox: headlessSearchBox,
          status: statusControllers,
          pager: headlessPager,
          facets,
          stateController: buildHeadlessSearchStateController(headlessSearchEngine, module),
          batchStateUpdates,
          executeSearch: rerunSearch,
          destroy: () => {
            subscriptions.forEach((unsubscribe) => unsubscribe());
            window.removeEventListener('hashchange', onHashChange);
          },
          resetSearchHandler: () => {
            // Reset user choices without losing the page's fixed query scope.
            const parameters = [];
            if (baseAdvancedQuery) parameters.push(`aq=${encodeURIComponent(baseAdvancedQuery)}`);
            if (tabId) parameters.push(`tab=${encodeURIComponent(tabId)}`);
            parameters.push(...lockedFragmentParams);
            urlManager.synchronize(parameters.join('&'));
          },
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
