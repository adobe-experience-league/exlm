import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createTag, htmlToElement, debounce } from '../../scripts/scripts.js';
import {
  roleOptions,
  contentTypeOptions,
  expTypeOptions,
  getObjectByName,
  getFiltersPaginationText,
  getBrowseFiltersResultCount,
} from './browse-filter-utils.js';
import initiateCoveoHeadlessSearch, { fragment } from '../../scripts/coveo-headless/index.js';
import BrowseCardsCoveoDataAdaptor from '../../scripts/browse-card/browse-cards-coveo-data-adaptor.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import buildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';

const coveoFacetMap = {
  Role: 'headlessRoleFacet',
  'Content Type': 'headlessTypeFacet',
  'Experience Level': 'headlessExperienceFacet',
};

const coveoFacetFilterNameMap = {
  el_type: 'Content Type',
  el_role: 'Role',
  el_level: 'Experience Level',
};

const theme = getMetadata('theme').trim();
const isBrowseProdPage = theme === 'browse-product';
const dropdownOptions = [roleOptions, contentTypeOptions];
const tags = [];
let tagsProxy;
const shimmerCardParent = document.createElement('div');

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
      siblings[i].style.display = show ? 'block' : 'none';
    }
  }
}

function updateClearFilterStatus(block) {
  const searchEl = block.querySelector('.filter-input-search > input[type="search"]');
  const clearFilterBtn = block.querySelector('.browse-filters-clear');
  if (tagsProxy.length !== 0 || searchEl.value) {
    clearFilterBtn.disabled = false;
    hideSectionsBelowFilter(block, false);
  } else {
    clearFilterBtn.disabled = true;
    hideSectionsBelowFilter(block, true);
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
          <input type="checkbox" id="option${id}${index + 1}" value="${item.title}">
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
    <div class="filter-dropdown filter-input" data-filter-type="${options.name}">
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
      <button class="browse-tags">
        <span>${tag.name}</span>
        <span>: </span>
        <span>${tag.value}</span>
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
    <button class="browse-tags">
      <span>${tag.name}</span>
      <span>: </span>
      <span>${tag.value}</span>
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
    if (tag.textContent.includes(value)) {
      tag.remove();
      const itemToRemove = tagsProxy.findIndex((obj) => obj.value === value);
      if (itemToRemove !== -1) {
        tagsProxy.splice(itemToRemove, 1);
      }
    }
  });
}

function updateCountAndCheckedState(block, name, value) {
  const tagRole = block.querySelector(`.filter-dropdown[data-filter-type="${name}"]`);
  const btnEl = tagRole.querySelector(':scope > button');
  const ddOptions = [...tagRole.querySelector('.filter-dropdown-content').children];
  const ddObject = getObjectByName(dropdownOptions, name);
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
      const value = isTag.querySelector('span:nth-child(3)').textContent.trim();
      const coveoFacetKey = coveoFacetMap[name];
      const coveoFacet = window[coveoFacetKey];
      if (coveoFacet) {
        coveoFacet.toggleSelect({
          state: 'idle',
          value,
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
    const label = checkbox.closest('.custom-checkbox').querySelector('label');
    const name = checkbox.closest('.filter-dropdown').dataset.filterType;
    const isChecked = checkbox.checked;
    const coveoFacetKey = coveoFacetMap[name];
    const coveoFacet = window[coveoFacetKey];
    if (isChecked) {
      options.selected += 1;
      appendTag(block, {
        name,
        value: checkbox.value,
      });

      if (coveoFacet) {
        const value = label.querySelector('.title')?.textContent;
        // eslint-disable-next-line no-console
        console.log(`Checkbox is checked:`, value);
        coveoFacet.toggleSelect({
          state: 'selected',
          value,
        });
      }
    } else {
      options.selected -= 1;
      removeFromTags(block, checkbox.value);

      if (coveoFacet) {
        const value = label.querySelector('.title')?.textContent;
        // eslint-disable-next-line no-console
        console.log(`Checkbox is unchecked:`, value);
        coveoFacet.toggleSelect({
          state: 'idle',
          value,
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
  const labelEl = createTag('label', { class: 'browse-filters-label' }, 'Filters');
  appendToFormInputContainer(block, labelEl);
}

function constructKeywordSearchEl(block) {
  const searchEl = htmlToElement(`
    <div class="filter-input filter-input-search">
      <span class="icon icon-search"></span>
      <input type="search" placeholder="Keyword search">
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

  searchEl.addEventListener('input', () => {
    updateClearFilterStatus(block);
  });
}

function uncheckAllFiltersFromDropdown(block) {
  const dropdownFilters = block.querySelectorAll('.filter-dropdown');
  dropdownFilters.forEach((dropdownEl) => {
    const { filterType } = dropdownEl.dataset;
    const dropdownObj = getObjectByName(dropdownOptions, filterType);

    dropdownObj.selected = 0;
    dropdownEl.querySelector(':scope > button').firstChild.textContent = filterType;

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
  window.location.hash = '';
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
    <button class="browse-filters-clear" disabled>Clear filters</button>
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
      dropdownEl.querySelector('.filter-dropdown-content').style.display = 'block';
      dropdownEl.classList.add('open');
    } else {
      closeOpenDropdowns();
    }
  });
}

function decorateBlockTitle(block) {
  const firstChild = block.querySelector('div:first-child');
  const firstChildText = firstChild.querySelector('div > div').textContent;
  const headingEl = createTag('h1', { class: 'browse-filters-title' }, firstChildText);

  const secondChild = block.querySelector('div:nth-child(2)');
  const secondChildText = secondChild.querySelector('div > div').textContent;
  const pEl = createTag('p', { class: 'browse-filters-description' }, secondChildText);

  firstChild.parentNode.replaceChild(headingEl, firstChild);
  secondChild.parentNode.replaceChild(pEl, secondChild);
}

function handleUriHash() {
  const hash = fragment();
  const browseFiltersSection = document.querySelector('.browse-filters-form');
  const filterInputSection = browseFiltersSection.querySelector('.filter-input-search');
  const searchInput = filterInputSection.querySelector('input');
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
    const facetKey = facetKeys.replace('f-', '');
    const facetValues = facetValueInfo.split(',');
    // console.log('facetKey', facetKey);
    // console.log('facetValues', facetValues);
    const keyName = coveoFacetFilterNameMap[facetKey];
    if (keyName) {
      const filterOptionEl = browseFiltersSection.querySelector(`.filter-dropdown[data-filter-type="${keyName}"]`);
      if (filterOptionEl) {
        facetValues.forEach((facetValue) => {
          const inputEl = filterOptionEl.querySelector(`input[value="${facetValue}"]`);
          inputEl.checked = true;
          appendTag(browseFiltersSection, {
            name: keyName,
            value: facetValue,
          });
        });
        const ddObject = getObjectByName(dropdownOptions, keyName);
        const btnEl = filterOptionEl.querySelector(':scope > button');
        const selectedCount = facetValues.length;
        ddObject.selected = selectedCount;
        if (selectedCount === 0) {
          btnEl.firstChild.textContent = keyName;
        } else {
          btnEl.firstChild.textContent = `${keyName} (${selectedCount})`;
        }
      }
    } else if (facetKey === 'q') {
      containsSearchQuery = true;
      const [searchValue] = facetValues;
      if (searchValue) {
        searchInput.value = searchValue.trim();
      } else {
        searchInput.value = '';
      }
    }
  });
  if (!containsSearchQuery) {
    searchInput.value = '';
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
      <input type="text" aria-label="Enter page number" value=${currentPageNumber}>
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
  const filtersPaginationEl = document.querySelector('.browse-filters-pagination');
  if (!filtersPaginationEl || !window.headlessPager) {
    return;
  }

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
  } else {
    filtersPaginationEl.classList.remove('browse-filters-pagination-hidden');
  }
}

function renderSearchQuerySummary() {
  const queryEl = document.querySelector('.browse-filters-results-count');
  if (!window.headlessQuerySummary || !queryEl) {
    return;
  }
  const numberFormat = new Intl.NumberFormat('en-US');
  const resultsCount = window.headlessQuerySummary.state.total;
  queryEl.textContent = !resultsCount ? '' : `Showing ${numberFormat.format(resultsCount)} assets`;
}

function handleCoveoHeadlessSearch(
  block,
  { submitSearchHandler, searchInputKeyupHandler, searchInputKeydownHandler, searchInputEventHandler },
) {
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
  const filterResultsEl = document.querySelector('.browse-filters-results');
  if (!filterResultsEl || window.headlessStatusControllers?.state?.isLoading) {
    return;
  }
  // eslint-disable-next-line
  const search = window.headlessSearchEngine.state.search;
  const { results } = search;
  if (results.length > 0) {
    filterResultsEl.parentElement.querySelectorAll('.shimmer-placeholder').forEach((el) => {
      el.classList.add('hide-shimmer');
    });
    const cardsData = await BrowseCardsCoveoDataAdaptor.mapResultsToCardsData(results);
    filterResultsEl.innerHTML = '';
    cardsData.forEach((cardData) => {
      const cardDiv = document.createElement('div');
      buildCard(cardDiv, cardData);
      filterResultsEl.appendChild(cardDiv);
      shimmerCardParent.appendChild(filterResultsEl);
      document.querySelector('.browse-filters-form').classList.add('is-result');
    });
  } else {
    filterResultsEl.parentElement.querySelectorAll('.shimmer-placeholder').forEach((el) => {
      el.classList.add('hide-shimmer');
    });
    filterResultsEl.innerHTML = 'No Results';
    document.querySelector('.browse-filters-form').classList.remove('is-result');
  }
}

function renderSortContainer(block) {
  const wrapper = block.querySelector('.browse-filters-form .browse-filters-results-header');
  const sortContainer = document.createElement('div');
  sortContainer.classList.add('sort-container');
  sortContainer.innerHTML = `<span>Sort</span>
                  <button class="sort-drop-btn">Relevance</button>`;

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

function addShimmer(block) {
  shimmerCardParent.classList.add('browse-card-shimmer');
  block.querySelector('.browse-filters-form').appendChild(shimmerCardParent);
  shimmerCardParent.appendChild(buildPlaceholder(10));
}

export default function decorate(block) {
  enableTagsAsProxy(block);
  decorateBlockTitle(block);
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
  addShimmer(block);
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
