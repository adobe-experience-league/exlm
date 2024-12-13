import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import {
  createTag,
  htmlToElement,
  getPathDetails,
  fetchLanguagePlaceholders,
  matchesAnyTheme,
} from '../../scripts/scripts.js';
import {
  roleOptions,
  contentTypeOptions,
  expTypeOptions,
  productTypeOptions,
  getObjectByName,
  getFiltersPaginationText,
  getBrowseFiltersResultCount,
  getSelectedTopics,
  getParsedSolutionsQuery,
  getCoveoFacets,
  getObjectById,
  toggleSearchSuggestionsVisibility,
  showSearchSuggestionsOnInputClick,
  handleCoverSearchSubmit,
  authorOptions,
  fetchPerspectiveIndex,
} from './browse-filter-utils.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { BASE_COVEO_ADVANCED_QUERY } from '../../scripts/browse-card/browse-cards-constants.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';
import { COVEO_SEARCH_CUSTOM_EVENTS } from '../../scripts/search/search-utils.js';
import { formattedTags, handleTopicSelection, dispatchCoveoAdvancedQuery, coveoFacetMap } from './browse-topics.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

let isCoveoHeadlessLoaded = false;
let coveoHeadlessPromise = null;
const CLASS_BROWSE_FILTER_FORM = '.browse-filters-form';

const fragment = () => window.location.hash.slice(1);
const dropdownOptions = [roleOptions, contentTypeOptions];
const tags = [];
let tagsProxy;
const buildCardsShimmer = new BrowseCardShimmer(getBrowseFiltersResultCount());

function isArticleLandingPage() {
  return matchesAnyTheme(/^article-.*/);
}

/**
 * debounce fn execution
 */
const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(timer);
    args.unshift(this);
    timer = setTimeout(fn(args), ms);
  };
};

/**
 * Renders the pagination for the browse filters section.
 *
 * This function updates the pagination UI based on the current page, total pages,
 * and the state of the `headlessPager`.
 */
function renderPageNumbers() {
  const browseFiltersBlock = document.querySelector('.browse-filters');
  const filtersPaginationEl = browseFiltersBlock?.querySelector('.browse-filters-pagination');
  if (!filtersPaginationEl || !window.headlessPager) {
    return;
  }
  const browseResults = browseFiltersBlock.querySelector('.browse-filters-results');
  const currentPageNumber = window.headlessPager?.state?.currentPage || 1;
  const pgCount = window.headlessPager?.state?.maxPage || 1;
  const paginationTextEl = filtersPaginationEl.querySelector('.browse-filters-pagination-text');
  const inputText = filtersPaginationEl.querySelector('input');
  inputText.value = currentPageNumber;
  paginationTextEl.textContent = getFiltersPaginationText(pgCount);

  const leftNavButton = filtersPaginationEl.querySelector('.nav-arrow');
  const rightNavButton = filtersPaginationEl.querySelector('.nav-arrow.right-nav-arrow');
  if (currentPageNumber === 1) {
    leftNavButton.classList.add('nav-arrow-hidden');
    leftNavButton.disabled = true;
  } else {
    leftNavButton.classList.remove('nav-arrow-hidden');
    leftNavButton.disabled = undefined;
  }
  if (currentPageNumber === pgCount) {
    rightNavButton.classList.add('nav-arrow-hidden');
    rightNavButton.disabled = true;
  } else {
    rightNavButton.classList.remove('nav-arrow-hidden');
    rightNavButton.disabled = undefined;
  }
  if (pgCount === 1) {
    filtersPaginationEl.classList.add('browse-filters-pagination-hidden');
    browseResults.classList.add('browse-filters-one-pg-result');
  } else {
    filtersPaginationEl.classList.remove('browse-filters-pagination-hidden');
    browseResults.classList.remove('browse-filters-one-pg-result');
  }
}

/**
 * Appends a tag to the tags container in the provided block and updates the tagsProxy.
 *
 * @param {HTMLElement} block - The parent block where the tag should be appended.
 * @param {Object} tag - The tag object containing 'name', 'value', and 'label'.
 * @param {string} [source='checkboxChange']
 */
async function appendTag(block, tag, source = 'checkboxChange') {
  const tagsContainer = block.querySelector('.browse-tags-container');
  const tagEl = htmlToElement(`
    <button class="browse-tags" ${tag.id ? `data-type="${tag.id}"` : ''} value="${tag.value}">
      <span>${tag.name}</span>
      <span>: </span>
      <span>${tag.label}</span>
      <span class="icon icon-close"></span>
    </button>
  `);
  if (source === 'checkboxChange') {
    decorateIcons(tagEl);
  }
  tagsContainer.append(tagEl);
  tagsProxy.push({
    name: tag.name,
    value: tag.value,
  });
}

/**
 * Hides or shows sections within a filter block, excluding the 'browse-topics' section.
 *
 * @param {HTMLElement} block - The parent element containing filter sections.
 * @param {boolean} show - If true, show the sections; otherwise, hide them.
 */
function hideSectionsWithinFilter(block, show) {
  const siblings = Array.from(block.children);

  // eslint-disable-next-line no-plusplus
  for (let i = 1; i < siblings.length; i++) {
    if (!siblings[i].classList.contains('browse-topics')) {
      const classOp = show ? 'remove' : 'add';
      siblings[i].classList?.[classOp]('browse-hide-section');
    }
  }
}

/**
 * Hides or shows sections below a given filter.
 *
 * @param {HTMLElement} block - The HTML element to apply the filter to.
 * @param {boolean} show - A boolean indicating whether to show or hide the sections.
 */
function hideSectionsBelowFilter(block, show) {
  const parent = block.closest('.section');
  if (parent) {
    const siblings = Array.from(parent.parentNode.children);
    const clickedIndex = siblings.indexOf(parent);
    for (let index = clickedIndex + 1; index < siblings.length; index += 1) {
      const alwaysShowAttribute = siblings[index].dataset.alwaysShow;
      const alwaysShow = alwaysShowAttribute && alwaysShowAttribute.toLowerCase() === 'true';
      if (!siblings[index].classList.contains('browse-rail') && !alwaysShow) {
        const classOperation = show ? 'remove' : 'add';
        siblings[index].classList?.[classOperation]('browse-hide-section');
      }
    }
  }
}

function isFilterSelectionActive(block) {
  if (!block) {
    return false;
  }
  const searchEl = block.querySelector('.filter-input-search > .search-input');
  const selectedTopics = Array.from(block.querySelectorAll('.browse-topics-item-active')).reduce((acc, curr) => {
    const id = curr.dataset.topicname;
    acc.push(id);
    return acc;
  }, []);
  const hasActiveTopics = block.querySelector('.browse-topics') !== null && selectedTopics.length > 0;
  if (hasActiveTopics || tagsProxy?.length !== 0 || searchEl.value) {
    return true;
  }
  return false;
}

/**
 * Updates the status of the clear filter button and filter-related UI elements based on the current state.
 * It also dispatches a coveo query if necessary.
 *
 * @param {HTMLElement} block
 */
function updateClearFilterStatus(block) {
  const clearFilterBtn = block.querySelector('.browse-filters-clear');
  const browseFiltersContainer = document.querySelector('.browse-filters-container');
  const browseFiltersSection = block.matches('.browse-filters-form')
    ? block
    : block.querySelector('.browse-filters-form');
  if (!browseFiltersSection) {
    return;
  }
  const selectionContainer = browseFiltersSection.querySelector('.browse-filters-input-container');
  const containsSelection = selectionContainer.classList.contains('browse-filters-input-selected');
  const coveoQueryConfig = { query: '', fireSelection: true };
  let dispatchCoveoQuery = false;
  const isActive = isFilterSelectionActive(block);
  if (isActive) {
    clearFilterBtn.disabled = false;
    hideSectionsBelowFilter(block, false);
    browseFiltersContainer.classList.add('browse-filters-full-container');
    selectionContainer.classList.add('browse-filters-input-selected');
    if (!containsSelection && window.headlessBaseSolutionQuery) {
      coveoQueryConfig.query = window.headlessBaseSolutionQuery;
      coveoQueryConfig.fireSelection = false;
      dispatchCoveoQuery = true;
    }
    hideSectionsWithinFilter(browseFiltersSection, true);
  } else {
    dispatchCoveoQuery = true;
    clearFilterBtn.disabled = true;
    hideSectionsBelowFilter(block, true);
    buildCardsShimmer.removeShimmer();
    browseFiltersContainer.classList.remove('browse-filters-full-container');
    selectionContainer.classList.remove('browse-filters-input-selected');
    hideSectionsWithinFilter(browseFiltersSection, false);
  }
  if (dispatchCoveoQuery) {
    dispatchCoveoAdvancedQuery(coveoQueryConfig);
  }
}

/**
 * Clears all selected tags from the tag container.
 *
 * @param {HTMLElement} block
 */
function clearAllSelectedTag(block) {
  tagsProxy.length = 0;
  const tagsEl = block.querySelector('.browse-tags-container');
  tagsEl.innerHTML = '';
}

/**
 * Unchecks all filters in the dropdown menus.
 *
 * @param {HTMLElement} block
 */
function uncheckAllFiltersFromDropdown(block) {
  const dropdownFilters = block.querySelectorAll('.filter-dropdown');
  dropdownFilters.forEach((dropdownEl) => {
    const { filterType } = dropdownEl.dataset;
    const dropdownObj = getObjectById(dropdownOptions, filterType);

    dropdownObj.selected = 0;
    dropdownEl.querySelector(':scope > button').firstChild.textContent = dropdownObj.name;

    const dOptions = dropdownEl.querySelectorAll('.filter-dropdown-content > .custom-checkbox');
    dOptions.forEach((option) => {
      option.querySelector('input').checked = false;
    });
  });
}

/**
 * Handles the parsing and updating of filters, search terms, and pagination from the URL hash.
 */
function handleUriHash(onload) {
  const browseFiltersSection = document.querySelector('.browse-filters-form');
  if (!browseFiltersSection) {
    return;
  }
  const userSelectionExists = isFilterSelectionActive(browseFiltersSection.parentElement);
  if (userSelectionExists && onload === true) {
    return;
  }
  const filterInputSection = browseFiltersSection.querySelector('.filter-input-search');
  const searchInput = filterInputSection.querySelector('input');
  uncheckAllFiltersFromDropdown(browseFiltersSection);
  const hash = fragment();
  if (!hash) {
    clearAllSelectedTag(browseFiltersSection);
    updateClearFilterStatus(browseFiltersSection);
    searchInput.value = '';
    return;
  }
  const decodedHash = decodeURIComponent(hash);

  clearAllSelectedTag(browseFiltersSection);
  let containsSearchQuery = false;
  const filtersInfo = decodedHash.split('&').filter((s) => !!s);
  let pageNumber = 1;

  filtersInfo.forEach((filterInfo) => {
    const [facetKeys, facetValueInfo] = filterInfo.split('=');
    const facetValues = facetValueInfo.split(',');
    const keyName = facetKeys.replace('f-', '');

    if (Object.keys(coveoFacetMap).includes(keyName)) {
      const filterOptionEl = browseFiltersSection.querySelector(`.filter-dropdown[data-filter-type="${keyName}"]`);
      if (filterOptionEl) {
        const ddObject = getObjectById(dropdownOptions, keyName);
        const { name } = ddObject;
        facetValues.forEach((facetValueString) => {
          const [facetValue] = decodeURIComponent(facetValueString).split('|');
          const inputEl = filterOptionEl.querySelector(`input[value="${facetValue}"]`);
          if (!inputEl.checked) {
            const label = inputEl?.dataset.label || '';
            inputEl.checked = true;
            appendTag(
              browseFiltersSection,
              {
                id: keyName,
                name,
                label,
                value: facetValue,
              },
              'handleUriHash',
            );
          }
        });
        const btnEl = filterOptionEl.querySelector(':scope > button');
        const selectedCount = facetValues.reduce((acc, curr) => {
          const [key] = curr.split('|');
          if (!acc.includes(key)) {
            acc.push(key);
          }
          return acc;
        }, []).length;
        ddObject.selected = selectedCount;
        if (selectedCount === 0) {
          btnEl.firstChild.textContent = name;
        } else {
          btnEl.firstChild.textContent = `${name} (${selectedCount})`;
        }
      }
    } else if (keyName === 'q') {
      containsSearchQuery = true;
      const [searchValue] = facetValues;
      if (searchValue) {
        searchInput.value = searchValue.trim();
        const clearIcon = filterInputSection.querySelector('.search-clear-icon');
        clearIcon.classList.add('search-icon-show');
      } else {
        searchInput.value = '';
      }
    } else if (keyName === 'aq' && filterInfo) {
      const selectedTopics = getSelectedTopics(filterInfo);
      const contentDiv = document.querySelector('.browse-topics');
      const buttons = contentDiv?.querySelectorAll('button') ?? [];
      Array.from(buttons).forEach((button) => {
        const matchFound = selectedTopics.find((topic) => button.dataset.topicname?.includes(topic));
        if (matchFound) {
          button.classList.add('browse-topics-item-active');
        } else {
          button.classList.remove('browse-topics-item-active');
        }
      });
    } else if (keyName === 'firstResult' && window.headlessPager) {
      const firstResult = parseInt(facetValueInfo, 10);
      const resultsPerPage = getBrowseFiltersResultCount();
      const targetPageNumber = Math.floor(firstResult / resultsPerPage) + 1;
      pageNumber = window.headlessPager.state.maxPage
        ? Math.min(targetPageNumber, window.headlessPager.state.maxPage)
        : targetPageNumber;

      if (pageNumber > 1) {
        window.headlessPager.selectPage(pageNumber);
      }
    }
  });
  if (!containsSearchQuery) {
    searchInput.value = '';
  }
  if (filtersInfo.length && window.headlessBaseSolutionQuery) {
    const resetPageIndex = pageNumber === 1;
    const fireSelection = true;
    handleTopicSelection(browseFiltersSection, fireSelection, resetPageIndex);
  }
  updateClearFilterStatus(browseFiltersSection);
  window.headlessSearchEngine.executeFirstSearch();
}

/**
 * Constructs the pagination UI for the filter section, including previous/next page buttons,
 * page number input, and handles user interactions for page navigation.
 *
 * @param {HTMLElement} block
 */
function constructFilterPagination(block) {
  const browseFiltersSection = block.querySelector('.browse-filters-form');
  if (!browseFiltersSection) {
    return;
  }
  const currentPageNumber = window.headlessPager?.state?.currentPage || 1;
  const pgCount = window.headlessPager?.state?.maxPage || 1;
  const filtersPaginationEl = htmlToElement(`
    <div class="browse-filters-pagination">
      <button class="nav-arrow" aria-label="previous page"></button>
      <input type="text" class="browse-filters-pg-search-input" aria-label="Enter page number" value=${currentPageNumber}>
      <span class="browse-filters-pagination-text">${getFiltersPaginationText(pgCount)}</span>
      <button class="nav-arrow right-nav-arrow" aria-label="next page"></button>
    </div>`);

  const navButtons = Array.from(filtersPaginationEl.querySelectorAll('button.nav-arrow'));
  navButtons.forEach((navButton) => {
    navButton.addEventListener('click', (e) => {
      const jumpToPreviousPg = !e.currentTarget.classList.contains('right-nav-arrow');
      if (window.headlessPager) {
        const newPageNumber = window.headlessPager.state.currentPage + (jumpToPreviousPg ? -1 : 1);
        if (newPageNumber < 1 || newPageNumber > window.headlessPager.state.maxPage) {
          return;
        }
        window.headlessPager.selectPage(newPageNumber);
        const fireSelection = true;
        const resetPageIndex = false;
        handleTopicSelection(browseFiltersSection, fireSelection, resetPageIndex);
      }
    });
  });
  const filterInputEl = filtersPaginationEl.querySelector('input');
  if (filterInputEl) {
    filterInputEl.addEventListener('change', (e) => {
      let newPageNum = +e.target.value;
      if (newPageNum < 1) {
        newPageNum = 1;
        e.target.value = newPageNum;
      } else if (window.headlessPager?.state?.maxPage && newPageNum > window.headlessPager.state.maxPage) {
        newPageNum = window.headlessPager.state.maxPage;
        e.target.value = newPageNum;
      }
      if (window.headlessPager) {
        if (Number.isNaN(newPageNum)) {
          e.target.value = window.headlessPager?.state?.currentPage || 1;
        } else {
          window.headlessPager.selectPage(newPageNum);
        }
      }
    });
    filterInputEl.addEventListener('keyup', (e) => {
      const pgNumber = +e.target.value;
      if (window.headlessPager?.state) {
        if (Number.isNaN(pgNumber)) {
          e.target.value = window.headlessPager.state.currentPage || 1;
        } else if (pgNumber > window.headlessPager.state.maxPage) {
          e.target.value = window.headlessPager.state.maxPage;
        }
      }
      if (e.key === 'Enter') {
        window.headlessPager.selectPage(+e.target.value);
      }
    });
  }
  browseFiltersSection.appendChild(filtersPaginationEl);
}

/**
 * Handles the Coveo Headless search interactions, including event listeners, UI updates,
 * and pagination setup. It manages the search input, icon behavior, and processes the search
 * results with shimmer effects and pagination.
 */
function handleCoveoHeadlessSearch(
  block,
  {
    submitSearchHandler,
    searchInputKeyupHandler,
    searchInputKeydownHandler,
    searchInputEventHandler,
    clearSearchHandler,
  },
) {
  const filterResultsEl = createTag('div', { class: 'browse-filters-results' });

  const browseFiltersSection = block.querySelector('.browse-filters-form');
  if (!browseFiltersSection) {
    return;
  }
  const filterInputSection = browseFiltersSection.querySelector('.filter-input-search');
  const searchIcon = filterInputSection.querySelector('.icon-search');
  const clearIcon = filterInputSection.querySelector('.icon-clear');
  const searchInput = filterInputSection.querySelector('input');
  browseFiltersSection.appendChild(filterResultsEl);
  constructFilterPagination(block);
  searchIcon.addEventListener('click', submitSearchHandler);
  clearIcon.addEventListener('click', () => {
    searchInput.value = '';
    clearIcon.classList.remove('search-icon-show');
    clearSearchHandler();
  });
  searchInput.addEventListener('keyup', (e) => {
    const containsText = e.target.value !== '';
    const classOp = containsText ? 'add' : 'remove';
    clearIcon.classList[classOp]('search-icon-show');
    searchInputKeyupHandler(e);
  });
  searchInput.addEventListener('keydown', searchInputKeydownHandler);
  searchInput.addEventListener('input', searchInputEventHandler);
  window.addEventListener('hashchange', handleUriHash);
  if (window.headlessResultsPerPage) {
    window.addEventListener('resize', () => {
      debounce(50, () => {
        const newResultsPerPage = getBrowseFiltersResultCount();
        if (window.headlessResultsPerPage.state.numberOfResults !== newResultsPerPage) {
          buildCardsShimmer.updateCount(newResultsPerPage);
          window.headlessResultsPerPage.set(newResultsPerPage);
        }
      });
    });
  }
  const filtersPaginationEl = browseFiltersSection.querySelector('.browse-filters-pagination');
  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PREPROCESS, (e) => {
    const { method = '' } = e.detail ?? {};
    if (method === 'search') {
      const clearFilterBtn = browseFiltersSection.querySelector('.browse-filters-clear');
      if (clearFilterBtn?.disabled) {
        return;
      }
      buildCardsShimmer.addShimmer(browseFiltersSection);
      filterResultsEl.style.display = 'none';
      filtersPaginationEl.style.display = 'none';
      browseFiltersSection.insertBefore(
        document.querySelector('.browse-filters-form .browse-card-shimmer'),
        browseFiltersSection.childNodes[document.querySelector('.browse-topics') ? 4 : 3],
      );
    }
  });
  document.addEventListener(COVEO_SEARCH_CUSTOM_EVENTS.PROCESS_SEARCH_RESPONSE, () => {
    filterResultsEl.style.display = '';
    filtersPaginationEl.style.display = '';
    buildCardsShimmer.removeShimmer();
  });

  handleUriHash(true);
  renderPageNumbers();
}

/**
 * Handles the subscription for the search box, including managing suggestions and interactions.
 *
 */
function handleSearchBoxSubscription() {
  const browseFilterSearchSection = document.querySelector('.browse-filters-search');
  const searchInputEl = browseFilterSearchSection?.querySelector('input.search-input');
  if (!searchInputEl || !window.headlessSearchBox?.state || window.headlessSearchBox.state.isLoading) {
    return;
  }

  const { suggestions = [], value: searchInputStateValue } = window.headlessSearchBox.state;
  if (searchInputStateValue !== searchInputEl.value) {
    return;
  }
  const searchSuggestionsPopoverEl = browseFilterSearchSection.querySelector('.search-suggestions-popover');

  const missingSuggestions =
    searchInputEl.value === '' ||
    suggestions.length === 0 ||
    searchSuggestionsPopoverEl.classList.contains('search-suggestions-popover-hide');
  const hideSuggestions = missingSuggestions || !searchInputEl.classList.contains('suggestion-interactive');

  toggleSearchSuggestionsVisibility(!hideSuggestions);
  if (missingSuggestions) {
    searchInputEl.removeEventListener('click', showSearchSuggestionsOnInputClick);
  } else {
    searchInputEl.addEventListener('click', showSearchSuggestionsOnInputClick);
  }
  const suggestionsElement = htmlToElement(`<ul>
    ${suggestions
      .map((suggestion) => {
        const { rawValue } = suggestion;
        return `<li role="option" tabindex="0" class="search-picker-label">${rawValue}</li>`;
      })
      .join('')}
  </ul>`);

  const selectSearchSuggestion = (searchText) => {
    searchInputEl.value = searchText;
    handleCoverSearchSubmit(searchText);
    setTimeout(() => {
      // setimeout of zero to avoid reopening of popover.
      toggleSearchSuggestionsVisibility(false);
    }, 0);
  };

  suggestionsElement.addEventListener('click', (e) => {
    const searchText = e.target?.textContent ?? '';
    searchInputEl.classList.remove('suggestion-interactive');
    selectSearchSuggestion(searchText);
  });

  suggestionsElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const searchText = e.target?.textContent ?? '';
      searchInputEl.classList.remove('suggestion-interactive');
      selectSearchSuggestion(searchText);
    } else {
      const isArrowUp = e.key === 'ArrowUp';
      const isArrowDown = e.key === 'ArrowDown';
      if (!isArrowDown && !isArrowUp) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const targetElement = isArrowDown
        ? e.target.nextElementSibling || e.target.parentElement.firstElementChild
        : e.target.previousElementSibling || e.target.parentElement.lastElementChild;
      if (targetElement) {
        targetElement.focus();
        searchInputEl.value = targetElement.textContent;
      }
    }
  });

  const wrapper = searchSuggestionsPopoverEl.firstElementChild;
  wrapper.replaceWith(suggestionsElement);
}

/**
 * Renders the search query summary showing the total results count.
 *
 * This function updates the `.browse-filters-results-count` element with a message
 * based on the total number of results from the `headlessQuerySummary` state.
 */
function renderSearchQuerySummary() {
  const queryEl = document.querySelector('.browse-filters-results-count');
  if (!window.headlessQuerySummary || !queryEl) {
    return;
  }
  const numberFormat = new Intl.NumberFormat('en-US');
  const resultsCount = window.headlessQuerySummary.state.total;
  let assetString;
  if (!resultsCount) {
    assetString = '';
  } else if (resultsCount === 1) {
    assetString = placeholders.showAsset || 'Showing 1 asset';
  } else {
    const formattedCount = numberFormat.format(resultsCount);
    assetString = placeholders.showAssets?.replace('{x}', formattedCount) || `Showing ${formattedCount} assets`;
  }
  queryEl.textContent = assetString;
}

/**
 * Retrieves selected dropdown labels based on the field type.
 * @param {HTMLElement} block - The parent element containing the dropdowns.
 * @param {string} field - The type of field to retrieve labels for.
 * @returns {string} - The selected labels separated by '|', or an empty string if no selection.
 */
function getSelectedDropdownLabels(block, field) {
  const fieldSelectors = {
    el_role: '.filter-dropdown[data-filter-type="el_role"] .custom-checkbox input[type="checkbox"]:checked',
    el_contenttype:
      '.filter-dropdown[data-filter-type="el_contenttype"] .custom-checkbox input[type="checkbox"]:checked',
    el_level: '.filter-dropdown[data-filter-type="el_level"] .custom-checkbox input[type="checkbox"]:checked',
    search: '.filter-input-search .search-input',
    topics: '.browse-topics .browse-topics-item-active',
  };

  // Select appropriate elements based on the field type
  const fieldSelector = fieldSelectors[field];

  if (fieldSelector) {
    if (field === 'search') {
      const element = block.querySelector(fieldSelector);
      return element.value;
    }
    const elements = block.querySelectorAll(fieldSelector);
    return [...elements].map((el) => el.dataset.label).join('|');
  }
  return null;
}

/**
 * Generates analytics filters based on selected dropdown values.
 * @param {HTMLElement} block - The parent element containing the dropdowns.
 * @param {String} totalCount - The total count.
 * @returns {Object|null} - The analytics filters object or null if no non-empty values.
 */
function generateAnalyticsFilters(block, totalCount) {
  const filterFields = {
    el_role: 'Role',
    el_contenttype: 'ContentType',
    el_level: 'ExperienceLevel',
    search: 'KeywordSearch',
    topics: 'BrowseByTopic',
  };
  const filterKeys = Object.keys(filterFields);
  const filters = {};
  let hasNonEmptyValue = false;
  for (let i = 0; i < filterKeys.length; i += 1) {
    const field = filterKeys[i];
    const selectedValue = getSelectedDropdownLabels(block, field);
    if (selectedValue !== '') {
      filters[filterFields[field]] = selectedValue;
      hasNonEmptyValue = true;
    }
  }

  if (hasNonEmptyValue) {
    filters.BrowseResults = totalCount;
    return filters;
  }

  return null;
}

/**
 * Handles the search engine subscription and updates the browse filter results.
 *
 * @param {HTMLElement} block - The container block element for managing the browse filters.
 */
async function handleSearchEngineSubscription(block) {
  const browseFilterForm = document.querySelector(CLASS_BROWSE_FILTER_FORM);
  const filterResultsEl = browseFilterForm?.querySelector('.browse-filters-results');
  if (!filterResultsEl || window.headlessStatusControllers?.state?.isLoading) {
    return;
  }
  // eslint-disable-next-line
  const search = window.headlessSearchEngine.state.search;
  const { results, searchResponseId, response } = search;
  if (results.length > 0) {
    try {
      const cardsData = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
      const renderCards =
        !filterResultsEl.dataset.searchresponseid ||
        (filterResultsEl.dataset.searchresponseid && filterResultsEl.dataset.searchresponseid !== searchResponseId) ||
        !filterResultsEl.querySelector('.browse-filter-card-item');
      filterResultsEl.dataset.searchresponseid = searchResponseId;
      if (!renderCards) {
        return;
      }

      /* Analytics */
      filterResultsEl.classList.remove('analytics-interaction');
      if (!filterResultsEl.classList.contains('browse-hide-section')) {
        const analyticsFilters = generateAnalyticsFilters(block, response.totalCount);
        if (analyticsFilters) {
          assetInteractionModel(null, 'Browse Filters', analyticsFilters);
        }
      }

      filterResultsEl.innerHTML = '';
      cardsData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('browse-filter-card-item');
        buildCard(filterResultsEl, cardDiv, cardData);
        filterResultsEl.appendChild(cardDiv);
      });
      browseFilterForm.classList.add('is-result');
      filterResultsEl.classList.remove('no-results');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('*** failed to create card because of the error:', err);
    }
  } else {
    /* Analytics */
    if (
      !filterResultsEl.classList.contains('no-results') &&
      !filterResultsEl.classList.contains('browse-hide-section') &&
      !filterResultsEl.classList.contains('analytics-interaction')
    ) {
      const analyticsFilters = generateAnalyticsFilters(block, response.totalCount);
      if (analyticsFilters) {
        assetInteractionModel(null, 'Browse Filters', analyticsFilters);
        filterResultsEl.classList.add('analytics-interaction');
      }
    }
    const communityOptionIsSelected = browseFilterForm.querySelector(`input[value="Community"]`)?.checked === true;
    let noResultsText = placeholders.noResultsTextBrowse || 'No Results';
    if (
      communityOptionIsSelected &&
      !!dropdownOptions.find((opt) => (opt.id === 'el_role' || opt.id === 'el_level') && opt.selected > 0)
    ) {
      const containsExperienceLevel = !!dropdownOptions.find((opt) => opt.id === 'el_level');
      const textKey = containsExperienceLevel
        ? 'rolesAndExpWithCommunitySelectionWarning'
        : 'rolesWithCommunitySelectionWarning';
      noResultsText = placeholders[textKey] ?? 'To view Community posts, please remove all Role selections';
    }
    filterResultsEl.innerHTML = noResultsText;
    browseFilterForm.classList.remove('is-result');
    filterResultsEl.classList.add('no-results');
  }
}

async function loadCoveoHeadlessScript(block) {
  const { default: initiateCoveoHeadlessSearch } = await import('../../scripts/coveo-headless/index.js');
  if (initiateCoveoHeadlessSearch) {
    isCoveoHeadlessLoaded = true;
    initiateCoveoHeadlessSearch({
      handleSearchEngineSubscription: () => handleSearchEngineSubscription(block),
      renderPageNumbers,
      numberOfResults: getBrowseFiltersResultCount(),
      renderSearchQuerySummary,
      handleSearchBoxSubscription,
    })
      .then(
        (data) => {
          handleCoveoHeadlessSearch(block, data);
          const tagsContainerEl = block.querySelector('.browse-tags-container');
          if (tagsContainerEl && !tagsContainerEl.querySelector(`[data-icon-name="close"]`)) {
            decorateIcons(tagsContainerEl);
          }
        },
        (err) => {
          throw new Error(err);
        },
      )
      .finally(() => {
        // enable/disable the clear filter btn based on latest data
        updateClearFilterStatus(block);
      });
  }
}

/**
 * Dynamically loads and initializes the Coveo Headless module.
 *
 * @param {HTMLElement} block - The container block element to initialize the Coveo Headless instance.
 * @returns {Promise<void>} - A promise that resolves when the Coveo Headless initialization is complete.
 *
 */
async function loadCoveoHeadless(block) {
  if (coveoHeadlessPromise) {
    return coveoHeadlessPromise;
  }
  coveoHeadlessPromise = loadCoveoHeadlessScript(block);
  return coveoHeadlessPromise;
}

/**
 * Fetches the featured card solutions and returns the solution values.
 *
 * @async
 * @function
 * @returns {Promise<Array<string>>} List of solution values.
 */
async function getFeaturedCardSolutions() {
  const { default: ffetch } = await import('../../scripts/ffetch.js');
  // Load the Featured Card Solution list
  const solutionList = await ffetch(`/featured-card-products.json`).all();
  // Gets Values from Column Solution in Featured Card Solution list
  const solutionValues = solutionList.map((solution) => solution.Solution);
  return solutionValues;
}

const handleSolutionsService = async () => {
  const solutions = await getFeaturedCardSolutions();
  if (!solutions) {
    throw new Error('An error occurred');
  }
  if (solutions?.length) {
    return solutions;
  }
  return [];
};

const solutions = await handleSolutionsService();

const solutionsList = [];
solutions.forEach((solution) => {
  solutionsList.push({
    id: solution,
    value: solution,
    title: solution,
    description: '',
  });
});

const productOptions = {
  id: 'el_product',
  name: placeholders.featuredCardProductLabel || 'Product',
  items: solutionsList,
  selected: 0,
};

function enableTagsAsProxy(block) {
  tagsProxy = new Proxy(tags, {
    set(target, property, value) {
      // Intercepting array updates
      target[property] = value;
      // eslint-disable-next-line no-use-before-define
      tagsUpdateHandler(block);
      return true;
    },
  });
}

// Function to run when the tags array is updated
function tagsUpdateHandler(block) {
  updateClearFilterStatus(block);
}

const theme = getMetadata('theme').trim();
if (theme === 'browse-all') dropdownOptions.push(productOptions);
if (theme === 'browse-product') dropdownOptions.push(expTypeOptions);

if (isArticleLandingPage()) {
  const perspectiveIndex = await fetchPerspectiveIndex();
  const coveoSolutions = perspectiveIndex.reduce((acc, curr) => {
    if (curr?.coveoSolution) {
      // eslint-disable-next-line no-param-reassign
      acc += `,${curr.coveoSolution}`;
    }
    return acc;
  }, '');

  const coveoSolutionArr = coveoSolutions.split(/[,;]/).filter((solution) => solution && !solution.includes('|'));
  const coveoSolutionOptionsList = Array.from(new Set(coveoSolutionArr)).sort();
  const coveoSolutionOptions = coveoSolutionOptionsList.map((solution) => ({
    description: '',
    id: solution.toLowerCase(),
    title: solution,
    value: solution,
  }));
  productTypeOptions.items = coveoSolutionOptions;
  dropdownOptions.length = 0;
  if (productTypeOptions.items.length > 0) {
    dropdownOptions.push(productTypeOptions);
  }
  dropdownOptions.push(roleOptions);
  dropdownOptions.push(authorOptions);
}

/**
 * Generate HTML for a single checkbox item.
 *
 * @param {Object} item - Item with title and description.
 * @param {number} index - Index of the item in the array.
 * @return {string} - HTML string for the checkbox item.
 */
function generateCheckboxItem(item, index, id) {
  return `
      <div class="custom-checkbox">
          <input type="checkbox" id="option${id}${index + 1}" value="${item.value}" data-label="${item.title}">
          <label for="option${id}${index + 1}">
              <span class="title">${item.title}</span>
              <span class="description">${item.description}</span>
              <span class="icon icon-checked"></span>
          </label>
      </div>
  `;
}

const constructDropdownEl = (options, id) => {
  const optionClassName = `browse-${options.name.split(' ').join('-').toLowerCase()}-dropdown`;
  return htmlToElement(`
    <div class="filter-dropdown ${optionClassName} filter-input" data-filter-type="${options.id}">
      <button>
        ${options.name}
        <span class="icon icon-chevron"></span>
      </button>
      <div class="filter-dropdown-content">
        ${options.items.map((item, index) => generateCheckboxItem(item, index, id)).join('')}
      </div>
    </div>
  `);
};

function appendToForm(block, target) {
  const formEl = block.querySelector('.browse-filters-form');
  formEl.append(target);
}

function renderFilterResultsHeader() {
  return htmlToElement(`<div class="browse-filters-results-header">
  <span class="browse-filters-results-count"></span>
  </div>`);
}

function renderTags() {
  let tagEl = '';

  function renderTag(tag) {
    tagEl += `
      <button class="browse-tags" value="${tag.value}">
        <span>${tag.name}</span>
        <span>: </span>
        <span>${tag.label}</span>
        <span class="icon icon-close"></span>
      </button>
    `;
  }

  tagsProxy.forEach(renderTag);
  tagEl = `<div class="browse-tags-container">${tagEl}</div>`;
  return htmlToElement(tagEl);
}

function removeFromTags(block, value) {
  const tagsContainer = block.querySelector('.browse-tags-container');
  [...tagsContainer.children].forEach((tag) => {
    if (tag.value === value) {
      tag.remove();
      const itemToRemove = tagsProxy.findIndex((obj) => obj.value === value);
      if (itemToRemove !== -1) {
        tagsProxy.splice(itemToRemove, 1);
      }
    }
  });
}

function updateCountAndCheckedState(block, name, value) {
  const ddObject = getObjectByName(dropdownOptions, name);
  const tagRole = block.querySelector(`.filter-dropdown[data-filter-type="${ddObject.id}"]`);
  const btnEl = tagRole.querySelector(':scope > button');
  const ddOptions = [...tagRole.querySelector('.filter-dropdown-content').children];

  ddObject.selected = 0;

  function syncCheckedState(option) {
    const selected = option.querySelector(`input[type="checkbox"][value="${value}"]`);
    if (selected) selected.checked = false;
    if (option.querySelector('input[type="checkbox"]').checked) {
      ddObject.selected += 1;
    }
  }

  ddOptions.forEach((option) => {
    syncCheckedState(option);
  });

  if (ddObject.selected !== 0) btnEl.firstChild.textContent = `${name} (${ddObject.selected})`;
  if (ddObject.selected === 0) btnEl.firstChild.textContent = `${name}`;
}

function handleTagsClick(block) {
  block.addEventListener('click', (event) => {
    const isTag = event.target.closest('.browse-tags');
    if (isTag) {
      const name = isTag.querySelector('span:nth-child(1)').textContent.trim();
      const dropDownObj = getObjectByName(dropdownOptions, name);
      const { value } = isTag;
      const coveoFacetKey = coveoFacetMap[dropDownObj.id];
      const coveoFacet = window[coveoFacetKey];
      if (coveoFacet) {
        const facets = getCoveoFacets(value, false);
        facets.forEach(({ state, value: facetValue }) => {
          coveoFacet.toggleSelect({
            state,
            value: facetValue,
          });
        });
      }
      removeFromTags(block, value);
      // TODO: Update checked state and numbers
      updateCountAndCheckedState(block, name, value);
    }
  });
}

function handleCheckboxClick(block, el, options) {
  const checkboxes = el.querySelectorAll('.custom-checkbox input[type="checkbox"]');
  const btnEl = el.querySelector(':scope > button');

  // Function to handle checkbox state changes
  function handleCheckboxChange(event) {
    const checkbox = event.target;
    const { filterType } = checkbox.closest('.filter-dropdown').dataset;
    const label = checkbox?.dataset.label || '';
    const { checked: isChecked, value } = checkbox;
    const dropDownObj = getObjectById(dropdownOptions, filterType);
    const { name } = dropDownObj;
    const coveoFacetKey = coveoFacetMap[dropDownObj.id];
    const coveoFacet = window[coveoFacetKey];
    if (isChecked) {
      options.selected += 1;
      appendTag(block, {
        id: filterType,
        name,
        label,
        value,
      });

      if (coveoFacet) {
        const facets = getCoveoFacets(value, true);
        facets.forEach(({ state, value: facetValue }) => {
          coveoFacet.toggleSelect({
            state,
            value: facetValue,
          });
        });
      }
    } else {
      options.selected -= 1;
      removeFromTags(block, value);

      if (coveoFacet) {
        const facets = getCoveoFacets(value, false);
        facets.forEach(({ state, value: facetValue }) => {
          coveoFacet.toggleSelect({
            state,
            value: facetValue,
          });
        });
      }
    }
    const optionsAreSelected = !!dropdownOptions.find((opt) => opt.selected > 0);
    if (optionsAreSelected) {
      handleTopicSelection();
    }
    if (options.selected !== 0) btnEl.firstChild.textContent = `${options.name} (${options.selected})`;
    if (options.selected === 0) btnEl.firstChild.textContent = `${options.name}`;
  }

  // Attach event listener to each checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });
}

function appendToFormInputContainer(block, target) {
  const divEl = block.querySelector('.browse-filters-input-container');
  divEl.append(target);
}

function constructMultiSelectDropdown(block, options, index) {
  const dropdownEl = constructDropdownEl(options, index);

  appendToFormInputContainer(block, dropdownEl);
  handleCheckboxClick(block, dropdownEl, options);
  return dropdownEl;
}

function constructFilterInputContainer(block) {
  const divEl = createTag('div', { class: 'browse-filters-input-container' });
  appendToForm(block, divEl);
}

function appendFormEl(block) {
  const formEl = createTag('form', { class: 'browse-filters-form' });
  block.append(formEl);

  formEl.addEventListener('submit', (event) => event.preventDefault());
}

function addLabel(block) {
  const labelEl = createTag('label', { class: 'browse-filters-label' }, placeholders.filterLabel);
  appendToFormInputContainer(block, labelEl);
}

function constructKeywordSearchEl(block) {
  const searchEl = htmlToElement(`
    <div class="browse-filters-search search-container">
      <div class="filter-input filter-input-search">
        <span class="icon icon-search"></span>
        <input class="search-input" type="text" placeholder="${placeholders.filterKeywordSearch}">
        <span title="Clear" class="icon icon-clear search-clear-icon"></span>
      </div>
      <div class="search-suggestions-popover">
            <ul role="listbox">
            </ul>
          </div>
    </div>
  `);
  appendToFormInputContainer(block, searchEl);
}

function onInputSearch(block) {
  const searchEl = block.querySelector('.filter-input-search .search-input');
  if (!searchEl) return;

  const handleFocus = () => {
    if (!isCoveoHeadlessLoaded) {
      loadCoveoHeadless(block);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  searchEl.addEventListener('focus', handleFocus);
  searchEl.addEventListener('keypress', handleKeyPress);
}

function removeTopicSelections(block) {
  block
    .querySelectorAll('.browse-topics-item-active')
    .forEach((element) => element.classList.remove('browse-topics-item-active'));
}

function clearSearchQuery(block) {
  const searchEl = block.querySelector('.filter-input-search input');
  searchEl.value = '';
}

function clearSelectedFilters(block) {
  removeTopicSelections(block);
  uncheckAllFiltersFromDropdown(block);
  clearAllSelectedTag(block);
  clearSearchQuery(block);
  updateClearFilterStatus(block);

  const hash = window.location.hash.substr(1); // Remove the '#' character
  let params = new URLSearchParams(hash);

  // Get the value of 'aq'
  const aqValue = params.get('aq');

  // Clear all parameters
  params = new URLSearchParams();

  // Set only 'aq' with its value if it was present
  if (aqValue !== null) {
    params.set('aq', aqValue);
  }

  // Set the modified hash back to the URL
  window.location.hash = params.toString();
  // window.location.hash = '';
}

function handleClearFilter(block) {
  // show the hidden sections again
  const clearFilterEl = block.querySelector('.browse-filters-clear');
  if (!clearFilterEl) {
    return;
  }
  clearFilterEl.addEventListener('click', () => {
    clearSelectedFilters(block);
  });
}

function constructClearFilterBtn(block) {
  const clearBtn = htmlToElement(`
    <button class="browse-filters-clear" disabled>${placeholders.filterClearLabel}</button>
  `);
  appendToFormInputContainer(block, clearBtn);
}

function closeOpenDropdowns() {
  document.querySelectorAll('.filter-dropdown.open')?.forEach((dropdown) => {
    dropdown.classList.remove('open');
    dropdown.querySelector('.filter-dropdown-content').style.display = 'none';
  });
}

/**
 * Handles the toggle behavior for filter dropdowns.
 * Closes open dropdowns if a click occurs outside of the current dropdown.
 * Toggles the display of the clicked dropdown and updates its state.
 *
 * @param {Event} event - The click event.
 */
function handleDropdownToggle(block) {
  document.addEventListener('click', (event) => {
    const openDropdowns = document.querySelectorAll('.filter-dropdown.open');
    const dropdownEl = event.target.closest('.filter-dropdown');
    const isCurrentDropDownOpen = event.target.closest('.filter-dropdown.open');

    if (openDropdowns && !isCurrentDropDownOpen) closeOpenDropdowns();

    if (dropdownEl && !isCurrentDropDownOpen) {
      if (document.activeElement?.className?.includes('search-input')) {
        return;
      }
      dropdownEl.querySelector('.filter-dropdown-content').style.display = 'block';
      dropdownEl.classList.add('open');
      if (!isCoveoHeadlessLoaded) {
        loadCoveoHeadless(block);
      }
    } else {
      closeOpenDropdowns();
    }
  });
}

/**
 * Renders the sort container for the filter results header, including a dropdown button to toggle sorting options.
 *
 * @function
 * @param {Element} block - The parent element to which the sort container will be appended.
 */
function renderSortContainer(block) {
  const wrapper = block.querySelector('.browse-filters-form .browse-filters-results-header');
  if (!wrapper) {
    return;
  }
  const sortContainer = document.createElement('div');
  sortContainer.classList.add('sort-container');
  sortContainer.innerHTML = `<span>${placeholders.filterSortLabel}</span>
                  <button class="sort-drop-btn">${placeholders.filterSortRelevanceLabel}</button>`;

  wrapper.appendChild(sortContainer);

  const dropDownBtn = document.querySelector('.sort-drop-btn');

  if (dropDownBtn) {
    dropDownBtn.addEventListener('click', () => {
      dropDownBtn.classList.toggle('active');
      dropDownBtn.nextSibling.classList.toggle('show');
      setTimeout(() => {
        // Close the dropdown menu if the user clicks outside of it
        document.addEventListener(
          'click',
          (event) => {
            let hideDropdown = !event.target || !dropDownBtn.nextSibling.contains(event.target);
            if (event.target === dropDownBtn && dropDownBtn.classList.contains('active')) {
              hideDropdown = false;
            }
            if (hideDropdown) {
              dropDownBtn.nextSibling.classList.remove('show');
            }
          },
          {
            once: true,
          },
        );
      });
    });
  }
}

/**
 * Decorates the browse topics section by parsing content from the provided block and updating the UI with the topics, solutions, and content type filters.
 * It handles adding topics buttons, updating the query, and syncing selected topics from the URL hash.
 *
 * @function
 * @param {Element} block - The parent element containing the content to decorate.
 */
function decorateBrowseTopics(block) {
  const { lang } = getPathDetails();
  const [...configs] = [...block.children].map((row) => row.firstElementChild);

  const [solutionsElement, headingElement, topicsElement, contentTypeElement] = configs.map((cell) => cell);
  const [solutionsContent, headingContent, topicsContent, contentTypeContent] = configs.map(
    (cell) => cell?.textContent?.trim() ?? '',
  );

  // eslint-disable-next-line no-unused-vars
  const allSolutionsTags = solutionsContent !== '' ? formattedTags(solutionsContent) : [];
  const allTopicsTags = topicsContent !== '' ? formattedTags(topicsContent) : [];
  const supportedProducts = [];
  if (allSolutionsTags.length) {
    const { query: additionalQuery, products, productKey } = getParsedSolutionsQuery(allSolutionsTags);
    products.forEach((p) => supportedProducts.push(p));
    window.headlessSolutionProductKey = productKey;
    window.headlessBaseSolutionQuery = `(${window.headlessBaseSolutionQuery} AND ${additionalQuery})`;
  }

  if (contentTypeContent.length) {
    const contentTypes = contentTypeContent.split(',').map((type) => type.trim());
    const contentTypesQuery = contentTypes.map((type) => `@el_contenttype="${type}"`).join('OR');
    window.headlessBaseSolutionQuery = `(${window.headlessBaseSolutionQuery} AND (${contentTypesQuery}))`;
  }

  const div = document.createElement('div');
  div.classList.add('browse-topics');
  // default style to h2 so existing published pages are not rendered unstyled if not re-authored
  const styledHeader =
    headingElement.firstElementChild === null ? `<h2>${headingContent}</h2>` : headingElement.innerHTML;

  const headerDiv = htmlToElement(`
    <div class="browse-topics-block-header">
      <div class="browse-topics-block-title">
          ${styledHeader}
      </div>
    </div>
  `);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-topics-block-content');
  const browseFiltersSection = document.querySelector('.browse-filters-form');

  if (allTopicsTags.length > 0 && lang === 'en') {
    allTopicsTags
      .filter((value) => value !== undefined)
      .forEach((topicsButtonTitle) => {
        const parts = topicsButtonTitle.split('/');
        const topicName = parts[parts.length - 1];
        const topicsButtonDiv = createTag('button', { class: 'browse-topics browse-topics-item' });
        topicsButtonDiv.dataset.topicname = topicsButtonTitle;
        topicsButtonDiv.dataset.label = topicName;
        topicsButtonDiv.innerHTML = topicName;
        contentDiv.appendChild(topicsButtonDiv);
      });

    contentDiv.addEventListener('click', (e) => {
      if (e.target?.classList?.contains('browse-topics-item')) {
        if (e.target.classList.contains('browse-topics-item-active')) {
          e.target.classList.remove('browse-topics-item-active');
        } else {
          e.target.classList.add('browse-topics-item-active');
        }
        if (!isCoveoHeadlessLoaded) {
          loadCoveoHeadless(block);
        }
        handleTopicSelection(contentDiv);
        updateClearFilterStatus(browseFiltersSection);
      }
    });
    const decodedHash = decodeURIComponent(window.location.hash);
    const filtersInfo = decodedHash.split('&').find((s) => s.includes('@el_features'));

    if (filtersInfo) {
      const selectedTopics = getSelectedTopics(filtersInfo);
      if (selectedTopics && selectedTopics.length > 0) {
        selectedTopics.forEach((topic) => {
          const element = contentDiv.querySelector(`.browse-topics-item[data-topicname*="${topic}"]`);
          if (element) {
            element.classList.add('browse-topics-item-active');
          }
        });
        if (!isCoveoHeadlessLoaded) {
          loadCoveoHeadless(block);
        }
        handleTopicSelection(contentDiv);
      }
    }
    div.append(headerDiv);
    div.append(contentDiv);
    /* Append browse topics right above the filters section */
    const filtersFormEl = block.querySelector('.browse-filters-form');
    filtersFormEl.insertBefore(div, filtersFormEl.children[4]);
  }
  (solutionsElement.parentNode || solutionsElement).remove();
  (headingElement.parentNode || headingElement).remove();
  (topicsElement.parentNode || topicsElement).remove();
  (contentTypeElement.parentNode || contentTypeElement).remove();
}

export default async function decorate(block) {
  window.headlessBaseSolutionQuery = BASE_COVEO_ADVANCED_QUERY;
  enableTagsAsProxy(block);
  appendFormEl(block);
  constructFilterInputContainer(block);
  addLabel(block);
  dropdownOptions.forEach((options, index) => {
    constructMultiSelectDropdown(block, options, index + 1);
  });
  constructKeywordSearchEl(block);
  constructClearFilterBtn(block);
  appendToForm(block, renderTags());
  appendToForm(block, renderFilterResultsHeader());
  decorateBrowseTopics(block);

  handleDropdownToggle(block);
  onInputSearch(block);
  handleClearFilter(block);
  handleTagsClick(block);
  updateClearFilterStatus(block);
  renderSortContainer(block);
  const hash = fragment();
  if (hash && !isCoveoHeadlessLoaded) {
    loadCoveoHeadless(block);
  }
  decorateIcons(block);
}
