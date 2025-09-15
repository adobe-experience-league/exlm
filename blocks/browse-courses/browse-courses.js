import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, xssSanitizeQueryParamValue } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';

// Module-level placeholders variable
let placeholders = {};

// Constants
const SELECTORS = {
  DROPDOWN: '.browse-card-dropdown',
  CONTENT: '.browse-cards-block-content',
  CHECKBOX_INPUT: '.browse-card-dropdown .custom-checkbox input',
};

const CSS_CLASSES = {
  HEADER: 'browse-cards-block-header',
  TITLE: 'browse-cards-block-title',
  DROPDOWN: 'browse-card-dropdown',
  CLEAR_FILTER: 'browse-card-clear-filter',
  TAGS: 'browse-card-tags',
  CONTENT: 'browse-cards-block-content',
};

const URL_PARAMS = {
  FILTERS: 'filters',
};

const DROPDOWN_TYPE = 'multi-select';

/**
 * Fetches and caches the course index for a given language prefix
 * Uses window-level caching to avoid multiple requests for the same data
 * @param {string} prefix - Language prefix for the course index (default: 'en')
 * @returns {Promise<Array>} Array of course index data
 */
async function fetchCourseIndex(prefix = 'en') {
  window.courseIndex = window.courseIndex || {};
  const loaded = window.courseIndex[`${prefix}-loaded`];
  if (!loaded) {
    window.courseIndex[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      const url = `/${prefix}/course-index.json`;
      fetch(url)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          window.courseIndex[prefix] = [];
          return {};
        })
        .then((json) => {
          window.courseIndex[prefix] = json?.data ?? [];
          resolve(json?.data ?? []);
        })
        .catch((error) => {
          window.courseIndex[prefix] = [];
          reject(error);
        });
    });
  }
  await window.courseIndex[`${prefix}-loaded`];
  return window.courseIndex[prefix];
}


/**
 * Fetches the list of products from the course index JSON
 * @returns {Promise<string[]>} Array of product solution names
 */
async function getProductList() {
  try {
    const courseIndex = await fetchCourseIndex();

    const products = courseIndex.reduce((acc, curr) => {
      if (curr?.coveoSolution) {
        // Split by ";" and trim spaces
        const items = curr.coveoSolution.split(";").map(s => s.trim());
        acc.push(...items);
      }
      return acc;
    }, []);

    // Remove duplicates
    const uniqueProducts = [...new Set(products)];

    return uniqueProducts;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching product list:", error);
    return [];
  }
}

/**
 * Creates the header section with title, dropdown filter, and clear filter button
 * Uses module-level placeholders for internationalization
 * @param {HTMLElement} headingElement - The heading element from block children
 * @param {HTMLElement} filterLabelElement - The filter label element from block children
 * @returns {HTMLElement} The constructed header div element
 */
function createHeader(headingElement, filterLabelElement) {
  const clearFilterText = placeholders?.filterClearLabel || 'Clear filters';

  const headerDiv = htmlToElement(`
    <div class="${CSS_CLASSES.HEADER}">
      <div class="${CSS_CLASSES.TITLE}">
        ${headingElement?.innerHTML || ''}
      </div>
      <div class="browse-filter-controls">
        <form class="${CSS_CLASSES.DROPDOWN}">
          <label>${filterLabelElement?.innerHTML || ''}</label>
        </form>
         <a href="#" class="${CSS_CLASSES.CLEAR_FILTER}" aria-label="${clearFilterText}">
            ${clearFilterText}
          </a>
      </div>
      <div class="${CSS_CLASSES.TAGS}"></div>
    </div>
  `);

  return headerDiv;
}

/**
 * Extracts and sanitizes filters from URL parameters
 * @returns {string[]} Array of sanitized filter values
 */
function getFiltersFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const filtersParam =  urlParams.get('filters')
      ? urlParams.get('filters').split(',').map(xssSanitizeQueryParamValue)
      : [];

  return filtersParam;
}

/**
 * Updates URL parameters and triggers card filtering
 * @param {string[]} selectedFilters - Array of selected filter values
 */
function updateFilters(selectedFilters) {
  const url = new URL(window.location);

  if (selectedFilters.length > 0) {
    url.searchParams.set(URL_PARAMS.FILTERS, selectedFilters.join(','));
  } else {
    url.searchParams.delete(URL_PARAMS.FILTERS);
  }

  window.history.pushState({}, '', url.toString());
}

/**
 * Creates filter tags based on selected filters
 * Uses module-level placeholders for internationalization
 * @param {HTMLElement} block - The main block element
 * @param {string[]} selectedFilters - Array of selected filter values
 */
function updateTags(block, selectedFilters) {
  const tagsContainer = block.querySelector(`.${CSS_CLASSES.TAGS}`);

  if (!tagsContainer) {
    return;
  }

  // Clear existing tags
  tagsContainer.textContent = '';

  // Early return if no filters
  if (!selectedFilters.length) {
    return;
  }

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  const productLabel = placeholders?.filterProductLabel || 'Product';

  // Create new tags for each selected filter
  selectedFilters.forEach((filter) => {
    const tagElement = htmlToElement(`
      <button class="browse-tags" value="${filter}" type="button" aria-label="Remove ${filter} filter">
        <span>${productLabel}: ${filter}</span>
        <span class="icon icon-close" aria-hidden="true"></span>
      </button>
    `);

    // Decorate icons in the tag element
    decorateIcons(tagElement);

    // Add click handler to remove tag and uncheck corresponding checkbox
    tagElement.addEventListener('click', (event) => {
      event.preventDefault();
      tagElement.remove();

      // Find and uncheck the corresponding checkbox more efficiently
      const checkbox = block.querySelector(`${SELECTORS.CHECKBOX_INPUT}[value="${filter}"]`);
      if (checkbox?.checked) {
        checkbox.click();
      }
    });

    fragment.appendChild(tagElement);
  });

  tagsContainer.appendChild(fragment);
}

/**
 * Pre-selects checkboxes based on URL filters
 * @param {HTMLElement} block - The main block element
 * @param {string[]} urlFilters - Array of filters from URL
 */
function preselectFiltersFromUrl(block, urlFilters) {
  const checkboxInputs = [...block.querySelectorAll(SELECTORS.CHECKBOX_INPUT)];

  checkboxInputs
    .filter((input) => urlFilters.includes(input.value) && !input.checked)
    .forEach((input) => input.click());
}

/**
 * Transforms products array into dropdown-compatible format
 * @param {string[]} products - Array of product names
 * @returns {Object[]} Array of objects with title property
 */
function transformProductsForDropdown(products) {
  return products.map((product) => ({ title: product }));
}

/**
 * Calculates the appropriate shimmer count based on viewport width
 * @returns {number} Number of shimmers to display
 */
function getResponsiveShimmerCount() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth >= 1400) {
    return 4;
  }
  if (viewportWidth >= 900) {
    return 3;
  }
  if (viewportWidth >= 600) {
    return 2;
  }
  return 1;
}

/**
 * Adds shimmer wrapper inside content container and applies shimmer
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer instance
 */
function addShimmerWrapper(contentDiv, shimmer) {
  // Clear existing content
  contentDiv.innerHTML = '';

  // Create wrapper div for shimmer
  const shimmerWrapper = document.createElement('div');
  shimmerWrapper.className = 'shimmer-grid-wrapper';
  contentDiv.appendChild(shimmerWrapper);

  // Add shimmer to wrapper
  shimmer.addShimmer(shimmerWrapper);
}

/**
 * Fetches and renders browse cards content
 * Uses module-level placeholders for error and no-results messages
 * @param {HTMLElement} block - The main block element
 * @param {string[]} selectedFilters - Array of selected filter values
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 */
async function fetchAndRenderCards(block, selectedFilters, contentDiv, shimmer) {
  const param = {
    contentType: CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase().split(','),
    ...(selectedFilters.length > 0 && { product: selectedFilters }),
  };

  try {
    const browseCardsContent = await BrowseCardsDelegate.fetchCardData(param);
    shimmer.removeShimmer();

    // Clear existing content
    contentDiv.innerHTML = '';

    if (browseCardsContent?.length > 0) {
      // Use document fragment for better performance
      const fragment = document.createDocumentFragment();

      browseCardsContent.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        fragment.appendChild(cardDiv);
      });

      contentDiv.appendChild(fragment);

      // Only append contentDiv if it's not already in the block
      if (!block.contains(contentDiv)) {
        block.appendChild(contentDiv);
      }
    } else {
      // Show no results message using placeholder
      const noResultsMessage = placeholders?.noCoursesFoundText || 'No courses found for the selected filters.';
      contentDiv.innerHTML = `<div class="course-no-results">${noResultsMessage}</div>`;
      if (!block.contains(contentDiv)) {
        block.appendChild(contentDiv);
      }
    }
  } catch (error) {
    shimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error fetching browse cards content:', error);

    // Show error message using placeholder
    const errorMessage = placeholders?.coursesLoadError || 'Failed to load courses. Please try again.';
    contentDiv.innerHTML = `<div class="course-no-results">${errorMessage}</div>`;
    if (!block.contains(contentDiv)) {
      block.appendChild(contentDiv);
    }
  }
}

/**
 * Clears all selected filters and resets the dropdown
 * @param {HTMLElement} block - The main block element
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} buildCardsShimmer - The shimmer loading instance
 */
async function clearAllFilters(block, contentDiv, buildCardsShimmer) {
  // Uncheck all selected checkboxes
  const checkedInputs = [...block.querySelectorAll(`${SELECTORS.CHECKBOX_INPUT}:checked`)];
  checkedInputs.forEach((input) => input.click());

  // Clear URL parameters
  updateFilters([]);

  // Clear tags
  updateTags(block, []);

  // Show shimmer and fetch all cards
  buildCardsShimmer.updateCount(getResponsiveShimmerCount());
  addShimmerWrapper(contentDiv, buildCardsShimmer);

  // Fetch and render all cards without filters
  await fetchAndRenderCards(block, [], contentDiv, buildCardsShimmer);
}

/**
 * Sets up dropdown change handler
 * @param {HTMLElement} block - The main block element
 * @param {Dropdown} dropdown - The dropdown instance
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} buildCardsShimmer - The shimmer loading instance
 */
function setupDropdownHandler(block, dropdown, contentDiv, buildCardsShimmer) {
  dropdown.handleOnChange(async (selectedValues) => {
    const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    updateFilters(selectedFilters);
    updateTags(block, selectedFilters);

    // Clear existing content and show shimmer with responsive count
    buildCardsShimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(contentDiv, buildCardsShimmer);

    // Fetch and render cards with selected filters
    await fetchAndRenderCards(block, selectedFilters, contentDiv, buildCardsShimmer);
  });
}

/**
 * Sets up clear filter button event handler
 * @param {HTMLElement} block - The main block element
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} buildCardsShimmer - The shimmer loading instance
 */
function setupClearFilterHandler(block, contentDiv, buildCardsShimmer) {
  const clearFilterButton = block.querySelector(`.${CSS_CLASSES.CLEAR_FILTER}`);

  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', async (event) => {
      event.preventDefault();
      await clearAllFilters(block, contentDiv, buildCardsShimmer);
    });
  }
}

/**
 * Main decoration function for the browse-courses block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  // Fetch placeholders with error handling and assign to module-level variable
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', error);
  }

  // Extract elements from block children
  const [headingElement, filterLabelElement] = [...block.children].map((row) => row.firstElementChild);

  // Clear block content and create header
  block.textContent = '';
  const headerDiv = createHeader(headingElement, filterLabelElement);
  block.appendChild(headerDiv);

  // Create content container
  const contentDiv = document.createElement('div');
  contentDiv.classList.add(CSS_CLASSES.CONTENT);

  // Fetch products and setup dropdown
  const products = await getProductList();
  const productsList = transformProductsForDropdown(products);

  const productDropdown = new Dropdown(
    block.querySelector(SELECTORS.DROPDOWN),
    placeholders?.filterProductLabel || 'Product',
    productsList,
    DROPDOWN_TYPE,
  );

  // Append content container to block first
  block.appendChild(contentDiv);

  // Initialize shimmer with responsive count
  const buildCardsShimmer = new BrowseCardShimmer(getResponsiveShimmerCount());
  addShimmerWrapper(contentDiv, buildCardsShimmer);

  // Handle URL filters
  const urlFilters = getFiltersFromUrl();

  await fetchAndRenderCards(block, urlFilters, contentDiv, buildCardsShimmer);
  preselectFiltersFromUrl(block, urlFilters);
  updateFilters(urlFilters);
  updateTags(block, urlFilters);

  // Setup dropdown change handler
  setupDropdownHandler(block, productDropdown, contentDiv, buildCardsShimmer);

  // Setup clear filter button handler
  setupClearFilterHandler(block, contentDiv, buildCardsShimmer);
}
