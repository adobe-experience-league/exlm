/**
 * Browse Courses Block
 * Displays a filterable grid of courses with product and status filters
 * Enriches course data with user progress when signed in
 * 
 * Features:
 * - Product filtering (triggers API fetch)
 * - Status filtering (client-side, no API call)
 * - URL parameter support for shareable filtered views
 * - Course progress tracking (Not Started, In Progress, Completed)
 * - Responsive shimmer loading states
 */

import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, xssSanitizeQueryParamValue } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { getCurrentCourses, COURSE_STATUS } from '../../scripts/courses/course-profile.js';

/**
 * Module-level placeholders for internationalization
 * Loaded from language-specific placeholder files
 */
let placeholders = {};

/**
 * DOM selectors used throughout the module
 */
const SELECTORS = {
  DROPDOWN: '.browse-card-dropdown',
  CONTENT: '.browse-cards-block-content',
  CHECKBOX_INPUT: '.browse-card-dropdown .custom-checkbox input',
};

/**
 * CSS class names for block elements
 */
const CSS_CLASSES = {
  HEADER: 'browse-cards-block-header',
  TITLE: 'browse-cards-block-title',
  DROPDOWN: 'browse-card-dropdown',
  CLEAR_FILTER: 'browse-card-clear-filter',
  TAGS: 'browse-card-tags',
  CONTENT: 'browse-cards-block-content',
};

/**
 * URL query parameter names
 */
const URL_PARAMS = {
  FILTERS: 'product',
};

/**
 * Dropdown configuration
 */
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
        const items = curr.coveoSolution.split(';').map((s) => s.trim());
        acc.push(...items);
      }
      return acc;
    }, []);

    // Remove duplicates
    const uniqueProducts = [...new Set(products)];

    return uniqueProducts;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching product list:', error);
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
  const filtersParam = urlParams.get(URL_PARAMS.FILTERS)
    ? urlParams.get(URL_PARAMS.FILTERS).split(',').map(xssSanitizeQueryParamValue)
    : [];

  return filtersParam;
}

/**
 * Updates URL parameters with selected product filters
 * @param {string[]} selectedFilters - Array of selected product filter values
 * @example
 * updateUrlParams(['Analytics', 'Commerce'])
 * // URL becomes: ?product=Analytics,Commerce
 * 
 * updateUrlParams([])
 * // URL parameter is removed
 */
function updateUrlParams(selectedFilters) {
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
 * Extracts the course path from a URL, removing the language parameter
 * @param {string} url - The full URL
 * @returns {string} The path without language (e.g., "courses/course-name")
 */
function extractCoursePathFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    // Always remove the first segment (language code like "en", "fr", "pt-BR", etc.)
    if (pathSegments.length > 0) {
      pathSegments.shift();
    }
    
    return pathSegments.join('/');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', url, error);
    return '';
  }
}

/**
 * Enriches browse cards data with user's course progress information
 * Matches courses by path and determines status based on progress
 * @param {Array} data - Array of browse card course data
 * @param {Object} courses - User's course progress data (keyed by course path)
 * @returns {Array} Array of enriched courses with courseInfo property
 */
function matchCoursesWithProfile(data, courses) {
  if (!data) {
    return [];
  }
  
  const enrichedCourses = [];

  data.forEach((card) => {
    let courseStatus = COURSE_STATUS.NOT_STARTED;
    
    if (card.viewLink && courses) {
      // Extract path without language parameter for matching
      const cardPath = extractCoursePathFromUrl(card.viewLink);

      // Check if this course exists in user's progress data
      if (courses[cardPath]) {
        const courseProgress = courses[cardPath];
        const hasModules = courseProgress.modules && Object.keys(courseProgress.modules).length > 0;
        
        // Determine course status based on progress
        if (courseProgress.awardGranted) {
          courseStatus = COURSE_STATUS.COMPLETED;
        } else if (hasModules) {
          courseStatus = COURSE_STATUS.IN_PROGRESS;
        }
      }
    }
    
    // Add courseInfo to each card
    enrichedCourses.push({
      ...card,
      courseInfo: {
        courseStatus,
      },
    });
  });

  return enrichedCourses;
}

/**
 * Renders course cards to the DOM
 * Uses module-level placeholders for error and no-results messages
 * @param {HTMLElement} block - The main block element
 * @param {Array} enrichedCourses - Array of enriched course data to render
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 */
async function renderCards(block, enrichedCourses, contentDiv, shimmer) {
  try {
    const browseCardsContent = enrichedCourses;
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
      const noResultsMessage = placeholders?.courseNoResultsText || 'No courses found for the selected filters.';
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
    const errorMessage = placeholders?.courseLoadError || 'Failed to load courses. Please try again.';
    contentDiv.innerHTML = `<div class="course-no-results">${errorMessage}</div>`;
    if (!block.contains(contentDiv)) {
      block.appendChild(contentDiv);
    }
  }
}

/**
 * Fetches browse cards data and enriches with user course progress
 * @param {string[]} selectedFilters - Array of selected product filter values (optional)
 * @param {Object} userCourses - User's course progress data (optional, if already fetched)
 * @returns {Promise<Array>} Enriched courses data with courseInfo.courseStatus
 * @description
 * 1. Fetches course cards from API based on filters
 * 2. If userCourses provided, matches courses with progress and adds courseStatus
 * 3. Returns all courses (matched courses get status, others get NOT_STARTED)
 */
async function fetchAndEnrichCourses(selectedFilters = [], userCourses = null) {
  // Build API parameters
  const param = {
    contentType: CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase().split(','),
    ...(selectedFilters.length > 0 && { product: selectedFilters }),
  };
  
  // Fetch browse cards data
  let data = await BrowseCardsDelegate.fetchCardData(param);

  // Enrich with user progress if available
  if (userCourses) {
    data = matchCoursesWithProfile(data, userCourses);
  }

  return data;
}

/**
 * Analyzes enriched course data and determines which statuses are present
 * @param {Array} enrichedData - Array of enriched course data with courseInfo
 * @returns {Object} Object containing boolean flags for each status
 */
function analyzeEnrichedDataStatuses(enrichedData) {
  const statuses = {
    hasNotStarted: false,
    hasInProgress: false,
    hasCompleted: false,
  };

  if (!enrichedData || enrichedData.length === 0) {
    return statuses;
  }

  enrichedData.forEach((course) => {
    if (course.courseInfo?.courseStatus) {
      const status = course.courseInfo.courseStatus;
      
      if (status === COURSE_STATUS.NOT_STARTED) {
        statuses.hasNotStarted = true;
      } else if (status === COURSE_STATUS.IN_PROGRESS) {
        statuses.hasInProgress = true;
      } else if (status === COURSE_STATUS.COMPLETED) {
        statuses.hasCompleted = true;
      }
    }
  });

  return statuses;
}

/**
 * Creates status filter dropdown options based on enriched course data
 * @param {Array} enrichedData - Array of enriched course data with courseInfo
 * @returns {Array<Object>} Array of status options with title and value properties
 * @description
 * Includes status options present in the dataset.
 * Special rule: If ALL courses are "Not Started", returns empty array (no filtering needed)
 */
function createStatusFilterOptionsFromData(enrichedData) {
  const statuses = analyzeEnrichedDataStatuses(enrichedData);
  
  // If ALL courses are "Not Started" (no other statuses), don't show dropdown
  const onlyNotStarted = statuses.hasNotStarted && !statuses.hasInProgress && !statuses.hasCompleted;
  if (onlyNotStarted) {
    return []; // No dropdown needed when all courses have same status
  }
  
  const options = [];

  // Include "Not Started" if it exists (and we have other statuses too, checked above)
  if (statuses.hasNotStarted) {
    options.push({
      title: 'Not Started',
      value: COURSE_STATUS.NOT_STARTED,
    });
  }

  if (statuses.hasInProgress) {
    options.push({
      title: 'In Progress',
      value: COURSE_STATUS.IN_PROGRESS,
    });
  }

  if (statuses.hasCompleted) {
    options.push({
      title: 'Completed',
      value: COURSE_STATUS.COMPLETED,
    });
  }

  return options;
}

/**
 * Creates a dedicated container for the status dropdown
 * @param {HTMLElement} dropdownForm - The dropdown form element
 * @returns {HTMLElement} The status dropdown container
 */
function createStatusDropdownContainer(dropdownForm) {
  // Check if container already exists
  let container = dropdownForm.querySelector('.status-dropdown-container');
  if (container) {
    container.innerHTML = ''; // Clear existing content
    return container;
  }
  
  // Create new container
  container = document.createElement('div');
  container.className = 'status-dropdown-container';
  dropdownForm.appendChild(container);
  return container;
}

/**
 * Updates the clear filter button state (enabled/disabled) based on active filters
 * @param {HTMLElement} block - The main block element
 * @param {Object} state - Mutable state object containing currentStatusFilters
 */
function updateClearFilterButtonState(block, state) {
  const clearFilterButton = block.querySelector(`.${CSS_CLASSES.CLEAR_FILTER}`);
  if (!clearFilterButton) return;

  // Check if any product filters are selected
  const checkedProductInputs = [...block.querySelectorAll(`${SELECTORS.CHECKBOX_INPUT}:checked`)];
  const hasProductFilters = checkedProductInputs.length > 0;
  
  // Check if any status filters are selected
  const hasStatusFilters = state.currentStatusFilters && state.currentStatusFilters.length > 0;
  
  // Disable button if no filters are active
  const hasActiveFilters = hasProductFilters || hasStatusFilters;
  
  if (hasActiveFilters) {
    clearFilterButton.removeAttribute('disabled');
    clearFilterButton.classList.remove('disabled');
  } else {
    clearFilterButton.setAttribute('disabled', 'true');
    clearFilterButton.classList.add('disabled');
  }
}

/**
 * Sets up status dropdown change handler
 * Filters existing data client-side (no API call)
 * Uses the 'value' field from status options (COURSE_STATUS constants)
 * @param {Dropdown} dropdown - The status dropdown instance
 * @param {HTMLElement} block - The main block element
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing enrichedData and currentStatusFilters
 */
function setupStatusDropdownHandler(dropdown, block, contentDiv, shimmer, state) {
  dropdown.handleOnChange(async (selectedValues) => {
    // Parse selected values (contains COURSE_STATUS constant values)
    state.currentStatusFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    // Show loading state
    shimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(contentDiv, shimmer);

    // Filter existing enriched data by status (client-side, no API call)
    const filteredData = state.currentStatusFilters.length > 0
      ? state.enrichedData.filter((course) => state.currentStatusFilters.includes(course.courseInfo.courseStatus))
      : state.enrichedData;
    await renderCards(block, filteredData, contentDiv, shimmer);
    
    // Update clear button state after filter change
    updateClearFilterButtonState(block, state);
  });
}

/**
 * Updates the status dropdown with new options based on current data
 * Recreates the dropdown and sets up its handler
 * @param {HTMLElement} block - The main block element
 * @param {Array} enrichedData - Current enriched course data
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object
 * @returns {Dropdown|null} The new status dropdown instance or null if no options
 */
function updateStatusDropdown(block, enrichedData, contentDiv, shimmer, state) {
  // Analyze current data for available statuses
  const statusList = createStatusFilterOptionsFromData(enrichedData);
  
  const dropdownForm = block.querySelector(SELECTORS.DROPDOWN);
  if (!dropdownForm) return null;
  
  // Get or create dedicated container for status dropdown
  const statusContainer = createStatusDropdownContainer(dropdownForm);
  
  // If no status options, clear container and return null
  if (statusList.length === 0) {
    statusContainer.innerHTML = '';
    return null;
  }

  // Clear container before creating new dropdown
  statusContainer.innerHTML = '';

  // Create new status dropdown with updated options
  const statusDropdown = new Dropdown(
    statusContainer,
    placeholders?.filterCourseStatusLabel || 'Progress',
    statusList,
    DROPDOWN_TYPE,
  );

  // Setup handler for new dropdown
  setupStatusDropdownHandler(statusDropdown, block, contentDiv, shimmer, state);

  return statusDropdown;
}

/**
 * Sets up product dropdown change handler
 * Fetches new data from API when product filters change
 * Updates status dropdown options based on new data
 * @param {Dropdown} dropdown - The product dropdown instance
 * @param {HTMLElement} block - The main block element
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing enrichedData, currentStatusFilters, userCourses, and statusDropdown
 */
function setupProductDropdownHandler(dropdown, block, contentDiv, shimmer, state) {
  dropdown.handleOnChange(async (selectedValues) => {
    const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    // Update URL and tag display
    updateUrlParams(selectedFilters);
    updateTags(block, selectedFilters);

    // Show loading state
    shimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(contentDiv, shimmer);

    // Fetch new data from API with selected product filters
    state.enrichedData = await fetchAndEnrichCourses(selectedFilters, state.userCourses);
    
    // Update status dropdown to reflect available statuses in filtered data
    if (state.userCourses && Object.keys(state.userCourses).length > 0) {
      // Reset current status filters if they don't exist in new data
      const availableStatuses = analyzeEnrichedDataStatuses(state.enrichedData);
      state.currentStatusFilters = state.currentStatusFilters.filter((status) => {
        if (status === COURSE_STATUS.NOT_STARTED) return availableStatuses.hasNotStarted;
        if (status === COURSE_STATUS.IN_PROGRESS) return availableStatuses.hasInProgress;
        if (status === COURSE_STATUS.COMPLETED) return availableStatuses.hasCompleted;
        return false;
      });
      
      // Update the status dropdown with new options
      state.statusDropdown = updateStatusDropdown(block, state.enrichedData, contentDiv, shimmer, state);
    }
    
    // Re-apply current status filters to new data (if any)
    const dataToRender = state.currentStatusFilters.length > 0
      ? state.enrichedData.filter((course) => state.currentStatusFilters.includes(course.courseInfo.courseStatus))
      : state.enrichedData;
    
    await renderCards(block, dataToRender, contentDiv, shimmer);
    
    // Update clear button state after filter change
    updateClearFilterButtonState(block, state);
  });
}

/**
 * Sets up clear filter button click handler
 * Resets all filters (product and status) and shows all courses
 * @param {HTMLElement} block - The main block element
 * @param {HTMLElement} contentDiv - The content container element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing enrichedData, currentStatusFilters, userCourses, and statusDropdown
 */
function setupClearFilterHandler(block, contentDiv, shimmer, state) {
  const clearFilterButton = block.querySelector(`.${CSS_CLASSES.CLEAR_FILTER}`);
  
  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', async (event) => {
      event.preventDefault();
      
      // Don't proceed if button is disabled
      if (clearFilterButton.hasAttribute('disabled')) {
        return;
      }
      
      // Uncheck all dropdown checkboxes
      const checkedInputs = [...block.querySelectorAll(`${SELECTORS.CHECKBOX_INPUT}:checked`)];
      checkedInputs.forEach((input) => input.click());

      // Reset status filters state
      state.currentStatusFilters = [];
      
      // Clear URL parameters
      updateUrlParams([]);

      // Clear filter tags display
      updateTags(block, []);

      // Show loading state
      shimmer.updateCount(getResponsiveShimmerCount());
      addShimmerWrapper(contentDiv, shimmer);

      // Fetch and render all courses without any filters
      state.enrichedData = await fetchAndEnrichCourses([], state.userCourses);
      
      // Update status dropdown to reflect all available statuses
      if (state.userCourses && Object.keys(state.userCourses).length > 0) {
        state.statusDropdown = updateStatusDropdown(block, state.enrichedData, contentDiv, shimmer, state);
      }
      
      await renderCards(block, state.enrichedData, contentDiv, shimmer);
      
      // Update clear button state
      updateClearFilterButtonState(block, state);
    });
  }
}

/**
 * Main decoration function for the browse-courses block
 * Initializes the course browsing interface with product and status filters
 * @param {HTMLElement} block - The block element to decorate
 * @description
 * Flow:
 * 1. Loads placeholders for i18n
 * 2. Creates header with filters and clear button
 * 3. Fetches user courses if signed in
 * 4. Initializes product dropdown (always shown)
 * 5. Conditionally initializes status dropdown:
 *    - Only if user has courses
 *    - Only shows statuses that exist in user's courses
 * 6. Fetches and renders initial course data with user progress
 * 7. Sets up filter change handlers:
 *    - Product filter: fetches new data from API
 *    - Status filter: filters existing data client-side (if available)
 * 8. Sets up clear filters handler
 */
export default async function decorate(block) {
  // Fetch placeholders for internationalization
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', error);
  }

  // Extract heading and filter label elements
  const [headingElement, filterLabelElement] = [...block.children].map((row) => row.firstElementChild);

  // Create and append header with filters
  block.textContent = '';
  const headerDiv = createHeader(headingElement, filterLabelElement);
  block.appendChild(headerDiv);

  // Create content container for course cards
  const contentDiv = document.createElement('div');
  contentDiv.classList.add(CSS_CLASSES.CONTENT);

  // Fetch user courses if signed in (needed for status dropdown options)
  let userCourses = null;
  if (isSignedInUser()) {
    try {
      userCourses = await getCurrentCourses();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user courses:', error);
    }
  }

  // Fetch products and create product dropdown
  const products = await getProductList();
  const productsList = transformProductsForDropdown(products);

  // Initialize product filter dropdown
  const productDropdown = new Dropdown(
    block.querySelector(SELECTORS.DROPDOWN),
    placeholders?.filterProductLabel || 'Product',
    productsList,
    DROPDOWN_TYPE,
  );

  // Append content container to block first
  block.appendChild(contentDiv);

  // Initialize and show shimmer loading state
  const buildCardsShimmer = new BrowseCardShimmer(getResponsiveShimmerCount());
  addShimmerWrapper(contentDiv, buildCardsShimmer);

  // Fetch and render initial course data based on URL filters
  const urlFilters = getFiltersFromUrl();
  const enrichedData = await fetchAndEnrichCourses(urlFilters, userCourses);
  
  // Initialize status filter dropdown (only if user has courses)
  // Create dropdown AFTER fetching enriched data to analyze actual displayed courses
  let statusDropdown = null;
  if (userCourses && Object.keys(userCourses).length > 0) {
    const statusList = createStatusFilterOptionsFromData(enrichedData);
    
    // Only create dropdown if there are status options
    if (statusList.length > 0) {
      const dropdownForm = block.querySelector(SELECTORS.DROPDOWN);
      const statusContainer = createStatusDropdownContainer(dropdownForm);
      
      statusDropdown = new Dropdown(
        statusContainer,
        placeholders?.filterCourseStatusLabel || 'Progress',
        statusList,
        DROPDOWN_TYPE,
      );
    }
  }
  
  // Create mutable state object to share between handlers
  const state = {
    enrichedData,
    currentStatusFilters: [],
    userCourses,
    statusDropdown, // Store reference to allow updates
  };
  
  await renderCards(block, state.enrichedData, contentDiv, buildCardsShimmer);

  // Restore URL filter state to UI
  preselectFiltersFromUrl(block, urlFilters);
  updateUrlParams(urlFilters);
  updateTags(block, urlFilters);

  // Setup event handlers
  setupProductDropdownHandler(productDropdown, block, contentDiv, buildCardsShimmer, state);
  
  // Only setup status dropdown handler if dropdown was created
  if (statusDropdown) {
    setupStatusDropdownHandler(statusDropdown, block, contentDiv, buildCardsShimmer, state);
  }
  
  setupClearFilterHandler(block, contentDiv, buildCardsShimmer, state);
  
  // Initialize clear button state based on current filters
  updateClearFilterButtonState(block, state);
}
