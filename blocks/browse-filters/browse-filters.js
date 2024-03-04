import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import {
  createTag,
  htmlToElement,
  debounce,
  getPathDetails,
  fetchLanguagePlaceholders,
} from '../../scripts/scripts.js';
import {
  roleOptions,
  contentTypeOptions,
  expTypeOptions,
  getObjectByName,
  getFiltersPaginationText,
  getBrowseFiltersResultCount,
  getSelectedTopics,
  getParsedSolutionsQuery,
  getCoveoFacets,
  getObjectById,
} from './browse-filter-utils.js';
import initiateCoveoHeadlessSearch, { fragment } from '../../scripts/coveo-headless/index.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { formattedTags, handleTopicSelection, dispatchCoveoAdvancedQuery } from './browse-topics.js';
import { BASE_COVEO_ADVANCED_QUERY } from '../../scripts/browse-card/browse-cards-constants.js';

const coveoFacetMap = {
  el_role: 'headlessRoleFacet',
  el_contenttype: 'headlessTypeFacet',
  el_level: 'headlessExperienceFacet',
};

const CLASS_BROWSE_FILTER_FORM = '.browse-filters-form';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const theme = getMetadata('theme').trim();
const isBrowseProdPage = theme === 'browse-product';
const dropdownOptions = [roleOptions, contentTypeOptions];
const tags = [];
let tagsProxy;
const buildCardsShimmer = new BuildPlaceholder();

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
    // eslint-disable-next-line no-plusplus
    for (let i = clickedIndex + 1; i < siblings.length; i++) {
      if (!siblings[i].classList.contains('browse-rail')) {
        const classOp = show ? 'remove' : 'add';
        siblings[i].classList?.[classOp]('browse-hide-section');
      }
    }
  }
}

function hildeSectionsWithinFilter(block, show) {
  const siblings = Array.from(block.children);

  // eslint-disable-next-line no-plusplus
  for (let i = 1; i < siblings.length; i++) {
    if (!siblings[i].classList.contains('browse-topics')) {
      const classOp = show ? 'remove' : 'add';
      siblings[i].classList?.[classOp]('browse-hide-section');
    }
  }
}

function updateClearFilterStatus(block) {
  const searchEl = block.querySelector('.filter-input-search > input[type="search"]');
  const clearFilterBtn = block.querySelector('.browse-filters-clear');
  const selectedTopics = Array.from(block.querySelectorAll('.browse-topics-item-active')).reduce((acc, curr) => {
    const id = curr.dataset.topicname;
    acc.push(id);
    return acc;
  }, []);
  const hasActiveTopics = block.querySelector('.browse-topics') !== null && selectedTopics.length > 0;
  const browseFiltersContainer = document.querySelector('.browse-filters-container');
  const browseFiltersSection = browseFiltersContainer.querySelector('.browse-filters-form');
  const selectionContainer = browseFiltersSection.querySelector('.browse-filters-input-container');
  const containsSelection = selectionContainer.classList.contains('browse-filters-input-selected');
  if (hasActiveTopics || tagsProxy.length !== 0 || searchEl.value) {
    clearFilterBtn.disabled = false;
    hideSectionsBelowFilter(block, false);
    browseFiltersContainer.classList.add('browse-filters-full-container');
    selectionContainer.classList.add('browse-filters-input-selected');
    if (!containsSelection && window.headlessBaseSolutionQuery) {
      dispatchCoveoAdvancedQuery(window.headlessBaseSolutionQuery, false);
    }
    hildeSectionsWithinFilter(browseFiltersSection, true);
  } else {
    clearFilterBtn.disabled = true;
    hideSectionsBelowFilter(block, true);
    browseFiltersContainer.classList.remove('browse-filters-full-container');
    selectionContainer.classList.remove('browse-filters-input-selected');
    dispatchCoveoAdvancedQuery('', true);
    hildeSectionsWithinFilter(browseFiltersSection, false);
  }
}

// Function to run when the tags array is updated
function tagsUpdateHandler(block) {
  updateClearFilterStatus(block);
}

if (isBrowseProdPage) dropdownOptions.push(expTypeOptions);

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

const constructDropdownEl = (options, id) =>
  htmlToElement(`
    <div class="filter-dropdown filter-input" data-filter-type="${options.id}">
      <button>
        ${options.name}
        <span class="icon icon-chevron"></span>
      </button>
      <div class="filter-dropdown-content">
        ${options.items.map((item, index) => generateCheckboxItem(item, index, id)).join('')}
      </div>
    </div>
`);

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

function appendTag(block, tag) {
  const tagsContainer = block.querySelector('.browse-tags-container');
  const tagEl = htmlToElement(`
    <button class="browse-tags" value="${tag.value}">
      <span>${tag.name}</span>
      <span>: </span>
      <span>${tag.label}</span>
      <span class="icon icon-close"></span>
    </button>
  `);
  tagsContainer.append(tagEl);
  tagsProxy.push({
    name: tag.name,
    value: tag.value,
  });
  decorateIcons(tagEl);
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
    <div class="filter-input filter-input-search">
      <span class="icon icon-search"></span>
      <input type="search" placeholder="${placeholders.filterKeywordSearch}">
    </div>
  `);
  appendToFormInputContainer(block, searchEl);
}

function onInputSearch(block) {
  const searchEl = block.querySelector('.filter-input-search input[type="search"]');
  searchEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // eslint-disable-next-line no-console
      console.log('add search logic here');
    }
  });
}

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

function clearAllSelectedTag(block) {
  tagsProxy.length = 0;
  const tagsEl = block.querySelector('.browse-tags-container');
  tagsEl.innerHTML = '';
}

function clearSearchQuery(block) {
  const searchEl = block.querySelector('.filter-input-search input');
  searchEl.value = '';
}

function clearSelectedFilters(block) {
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
function handleDropdownToggle() {
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
    } else {
      closeOpenDropdowns();
    }
  });
}

function handleUriHash() {
  const browseFiltersSection = document.querySelector('.browse-filters-form');
  if (!browseFiltersSection) {
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
          const [facetValue] = facetValueString.split('|');
          const inputEl = filterOptionEl.querySelector(`input[value="${facetValue}"]`);
          if (!inputEl.checked) {
            const label = inputEl?.dataset.label || '';
            inputEl.checked = true;
            appendTag(browseFiltersSection, {
              name,
              label,
              value: facetValue,
            });
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
      } else {
        searchInput.value = '';
      }
    } else if (keyName === 'aq' && filterInfo) {
      const selectedTopics = getSelectedTopics(filterInfo);
      const contentDiv = document.querySelector('.browse-topics');
      const buttons = contentDiv.querySelectorAll('button');
      Array.from(buttons).forEach((button) => {
        const matchFound = selectedTopics.find((topic) => button.dataset.topicname?.includes(topic));
        if (matchFound) {
          button.classList.add('browse-topics-item-active');
        } else {
          button.classList.remove('browse-topics-item-active');
        }
      });
    }
  });
  if (!containsSearchQuery) {
    searchInput.value = '';
  }
  if (filtersInfo.length && window.headlessBaseSolutionQuery) {
    handleTopicSelection();
  }
  updateClearFilterStatus(browseFiltersSection);
  window.headlessSearchEngine.executeFirstSearch();
}

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

function handleCoveoHeadlessSearch(
  block,
  { submitSearchHandler, searchInputKeyupHandler, searchInputKeydownHandler, searchInputEventHandler },
) {
  buildCardsShimmer.remove();
  const filterResultsEl = createTag('div', { class: 'browse-filters-results' });

  const browseFiltersSection = block.querySelector('.browse-filters-form');
  const filterInputSection = browseFiltersSection.querySelector('.filter-input-search');
  const searchIcon = filterInputSection.querySelector('.icon-search');
  const searchInput = filterInputSection.querySelector('input');
  browseFiltersSection.appendChild(filterResultsEl);

  searchIcon.addEventListener('click', submitSearchHandler);
  searchInput.addEventListener('keyup', searchInputKeyupHandler);
  searchInput.addEventListener('keydown', searchInputKeydownHandler);
  searchInput.addEventListener('input', searchInputEventHandler);
  window.addEventListener('hashchange', handleUriHash);
  if (window.headlessResultsPerPage) {
    window.addEventListener('resize', () => {
      debounce(
        'win-resize-browse-filters',
        () => {
          const newResultsPerPage = getBrowseFiltersResultCount();
          if (window.headlessResultsPerPage.state.numberOfResults !== newResultsPerPage) {
            window.headlessResultsPerPage.set(newResultsPerPage);
          }
        },
        50,
      );
    });
  }
  constructFilterPagination(block);
  handleUriHash();
  renderPageNumbers();
}

async function handleSearchEngineSubscription() {
  const browseFilterForm = document.querySelector(CLASS_BROWSE_FILTER_FORM);
  const filterResultsEl = browseFilterForm?.querySelector('.browse-filters-results');
  buildCardsShimmer.add(browseFilterForm);
  browseFilterForm.insertBefore(
    document.querySelector('.shimmer-placeholder'),
    browseFilterForm.childNodes[document.querySelector('.browse-topics') ? 4 : 3],
  );
  if (!filterResultsEl || window.headlessStatusControllers?.state?.isLoading) {
    return;
  }
  // eslint-disable-next-line
  const search = window.headlessSearchEngine.state.search;
  const { results } = search;
  if (results.length > 0) {
    try {
      buildCardsShimmer.remove();
      const cardsData = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
      filterResultsEl.innerHTML = '';
      cardsData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
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
    buildCardsShimmer.remove();
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

function renderSortContainer(block) {
  const wrapper = block.querySelector('.browse-filters-form .browse-filters-results-header');
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
            if (!event.target || !dropDownBtn.nextSibling.contains(event.target)) {
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

function decorateBrowseTopics(block) {
  const { lang } = getPathDetails();
  const [...configs] = [...block.children].map((row) => row.firstElementChild);

  const [solutionsElement, headingElement, topicsElement] = configs.map((cell) => cell);
  const [solutionsContent, headingContent, topicsContent] = configs.map((cell) => cell?.textContent?.trim() ?? '');

  // eslint-disable-next-line no-unused-vars
  const allSolutionsTags = solutionsContent !== '' ? formattedTags(solutionsContent) : [];
  const allTopicsTags = topicsContent !== '' ? formattedTags(topicsContent) : [];
  const supportedProducts = [];
  if (allSolutionsTags.length) {
    const { query: additionalQuery, products } = getParsedSolutionsQuery(allSolutionsTags);
    products.forEach((p) => supportedProducts.push(p));
    window.headlessBaseSolutionQuery = `(${window.headlessBaseSolutionQuery} AND ${additionalQuery})`;
  }

  const div = document.createElement('div');
  div.classList.add('browse-topics');

  const headerDiv = htmlToElement(`
    <div class="browse-topics-block-header">
      <div class="browse-topics-block-title">
          <h2>${headingContent}</h2>
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
        handleTopicSelection(contentDiv);
      }
    }
    div.append(headerDiv);
    div.append(contentDiv);
    /* Append browse topics right above the filters section */
    const filtersFormEl = document.querySelector('.browse-filters-form');
    filtersFormEl.insertBefore(div, filtersFormEl.children[4]);
  }
  (solutionsElement.parentNode || solutionsElement).remove();
  (headingElement.parentNode || headingElement).remove();
  (topicsElement.parentNode || topicsElement).remove();
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
  initiateCoveoHeadlessSearch({
    handleSearchEngineSubscription,
    renderPageNumbers,
    numberOfResults: getBrowseFiltersResultCount(),
    renderSearchQuerySummary,
  })
    .then(
      (data) => {
        handleCoveoHeadlessSearch(block, data);
      },
      (err) => {
        throw new Error(err);
      },
    )
    .finally(() => {
      // enable/disable the clear filter btn based on latest data
      updateClearFilterStatus(block);
      decorateIcons(block);
    });
  handleDropdownToggle();
  onInputSearch(block);
  handleClearFilter(block);
  handleTagsClick(block);
  updateClearFilterStatus(block);
  renderSortContainer(block);
}
