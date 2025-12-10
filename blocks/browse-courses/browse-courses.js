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
import {
  fetchLanguagePlaceholders,
  htmlToElement,
  xssSanitizeQueryParamValue,
  getPathDetails,
} from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { COURSE_STATUS } from '../../scripts/browse-card/browse-cards-constants.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { fetchCourseIndex } from '../../scripts/courses/course-utils.js';

/**
 * Module-level placeholders for internationalization
 * Loaded from language-specific placeholder files
 */
let placeholders = {};
const numberOfResults = 1000;

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
  LEVEL: 'level',
};

/**
 * Dropdown configuration
 */
const DROPDOWN_TYPE = 'multi-select';

/**
 * Fetches the list of products from the course index JSON
 * @returns {Promise<string[]>} Array of product solution names
 */
async function getProductList() {
  try {
    const { lang } = getPathDetails();
    const courseIndex = await fetchCourseIndex(lang);

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
 * Fetches the list of levels from the course index JSON
 * @returns {Promise<string[]>} Array of unique level names
 */
async function getLevelList() {
  try {
    const { lang } = getPathDetails();
    const courseIndex = await fetchCourseIndex(lang);

    const levels = courseIndex.reduce((acc, curr) => {
      if (curr?.coveoLevel) {
        // Split by "," and trim spaces
        const items = curr.coveoLevel.split(',').map((s) => s.trim());
        acc.push(...items);
      }
      return acc;
    }, []);

    // Remove duplicates
    const uniqueLevels = [...new Set(levels)];

    return uniqueLevels;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching level list:', error);
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
 * Extracts and sanitizes level filters from URL parameters
 * @returns {string[]} Array of sanitized level filter values
 */
function getLevelFiltersFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const levelParam = urlParams.get(URL_PARAMS.LEVEL)
    ? urlParams.get(URL_PARAMS.LEVEL).split(',').map(xssSanitizeQueryParamValue)
    : [];

  return levelParam;
}

/**
 * Updates a URL parameter and pushes to browser history
 * @param {string} paramName - The URL parameter name
 * @param {string[]} values - Array of values to set (empty array removes the param)
 */
function pushUrlParam(paramName, values) {
  const url = new URL(window.location);

  if (values.length > 0) {
    url.searchParams.set(paramName, values.join(','));
  } else {
    url.searchParams.delete(paramName);
  }

  window.history.pushState({}, '', url.toString());
}

/**
 * Updates URL parameters with selected product filters
 * @param {string[]} selectedFilters - Array of selected product filter values
 */
function updateUrlParams(selectedFilters) {
  pushUrlParam(URL_PARAMS.FILTERS, selectedFilters);
}

/**
 * Updates URL parameters with selected level filters
 * @param {string[]} selectedLevels - Array of selected level filter values
 */
function updateLevelUrlParams(selectedLevels) {
  pushUrlParam(URL_PARAMS.LEVEL, selectedLevels);
}

/**
 * Creates filter tags based on selected filters
 * Uses module-level placeholders for internationalization
 * @param {HTMLElement} block - The main block element
 * @param {string[]} selectedFilters - Array of selected product filter values
 * @param {string[]} selectedLevels - Array of selected level filter values (optional)
 */
function updateTags(block, selectedFilters, selectedLevels = []) {
  const tagsContainer = block.querySelector(`.${CSS_CLASSES.TAGS}`);

  if (!tagsContainer) {
    return;
  }

  // Clear existing tags
  tagsContainer.textContent = '';

  // Early return if no filters
  if (!selectedFilters.length && !selectedLevels.length) {
    return;
  }

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  const productLabel = placeholders?.filterProductLabel || 'Product';
  const levelLabel = placeholders?.filterLevelLabel || 'Level';

  // Create new tags for each selected product filter
  selectedFilters.forEach((filter) => {
    const tagElement = htmlToElement(`
      <button class="browse-tags" value="${filter}" data-type="product" type="button" aria-label="Remove ${filter} filter">
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

  // Create new tags for each selected level filter
  selectedLevels.forEach((level) => {
    const tagElement = htmlToElement(`
      <button class="browse-tags" value="${level}" data-type="level" type="button" aria-label="Remove ${level} filter">
        <span>${levelLabel}: ${level}</span>
        <span class="icon icon-close" aria-hidden="true"></span>
      </button>
    `);

    // Decorate icons in the tag element
    decorateIcons(tagElement);

    // Add click handler to remove tag and uncheck corresponding checkbox
    tagElement.addEventListener('click', (event) => {
      event.preventDefault();
      tagElement.remove();

      // Find and uncheck the corresponding checkbox in level dropdown
      const checkbox = block.querySelector(`.level-dropdown-container .custom-checkbox input[value="${level}"]`);
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
 * Transforms levels array into dropdown-compatible format
 * @param {string[]} levels - Array of level names
 * @returns {Object[]} Array of objects with title property
 */
function transformLevelsForDropdown(levels) {
  return levels.map((level) => ({ title: level }));
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
 * @param {HTMLElement} block - The main block element
 * @param {BrowseCardShimmer} shimmer - The shimmer instance
 */
function addShimmerWrapper(block, shimmer) {
  const contentDiv = block.querySelector(`.${CSS_CLASSES.CONTENT}`);
  if (!contentDiv) return;

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
 * Renders course cards to the DOM
 * Uses module-level placeholders for error and no-results messages
 * @param {HTMLElement} block - The main block element
 * @param {Array} courseData - Array of course data to render
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 */
async function renderCards(block, courseData, shimmer) {
  const contentDiv = block.querySelector(`.${CSS_CLASSES.CONTENT}`);
  if (!contentDiv) return;

  try {
    shimmer.removeShimmer();

    // Clear existing content
    contentDiv.innerHTML = '';

    if (courseData?.length > 0) {
      // Use document fragment for better performance
      const fragment = document.createDocumentFragment();

      courseData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        fragment.appendChild(cardDiv);
      });

      contentDiv.appendChild(fragment);
    } else {
      // Show no results message using placeholder
      const noResultsMessage = placeholders?.courseNoResultsText || 'No courses found for the selected filters.';
      contentDiv.innerHTML = `<div class="course-no-results">${noResultsMessage}</div>`;
    }
  } catch (error) {
    shimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error rendering browse cards:', error);

    // Show error message using placeholder
    const errorMessage = placeholders?.courseLoadError || 'Failed to load courses. Please try again.';
    contentDiv.innerHTML = `<div class="course-no-results">${errorMessage}</div>`;
  }
}

/**
 * Fetches course data from the API
 * @param {string[]} selectedFilters - Array of selected product filter values (optional)
 * @param {string[]} selectedLevels - Array of selected level filter values (optional)
 * @returns {Promise<Array>} Course data with meta.courseInfo.courseStatus (auto-enriched by delegate for signed-in users)
 * @description
 * Fetches course cards from API based on filters.
 * BrowseCardsDelegate automatically enriches with meta.courseInfo.courseStatus for signed-in users.
 */
async function fetchCourseData(selectedFilters = [], selectedLevels = []) {
  // Build API parameters
  const param = {
    contentType: CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase().split(','),
    ...(selectedFilters.length > 0 && { product: selectedFilters }),
    ...(selectedLevels.length > 0 && { level: selectedLevels }),
    noOfResults: numberOfResults,
  };

  // Fetch browse cards data (automatically enriched by BrowseCardsDelegate for signed-in users)
  const data = await BrowseCardsDelegate.fetchCardData(param);

  return data;
}

/**
 * Analyzes course data to determine which statuses are present
 * @param {Array} courseData - Array of course data with meta.courseInfo
 * @returns {Object} Object containing boolean flags for each status (hasNotStarted, hasInProgress, hasCompleted)
 */
function analyzeCourseStatuses(courseData) {
  const statuses = {
    hasNotStarted: false,
    hasInProgress: false,
    hasCompleted: false,
  };

  if (!courseData || courseData.length === 0) {
    return statuses;
  }

  courseData.forEach((course) => {
    if (course.meta?.courseInfo?.courseStatus) {
      const status = course.meta.courseInfo.courseStatus;

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
 * Creates status filter dropdown options based on course data
 * @param {Array} courseData - Array of course data with meta.courseInfo
 * @returns {Array<Object>} Array of status options with title and value properties
 * @description
 * Includes status options present in the dataset.
 * Always shows dropdown with available statuses, even if only one status is present.
 */
function createStatusFilterOptions(courseData) {
  const statuses = analyzeCourseStatuses(courseData);
  const options = [];

  // Include "Not Started" if it exists
  if (statuses.hasNotStarted) {
    options.push({
      title: placeholders?.courseStatusNotStarted || 'Not Started',
      value: COURSE_STATUS.NOT_STARTED,
    });
  }

  if (statuses.hasInProgress) {
    options.push({
      title: placeholders?.courseStatusInProgress || 'In Progress',
      value: COURSE_STATUS.IN_PROGRESS,
    });
  }

  if (statuses.hasCompleted) {
    options.push({
      title: placeholders?.courseStatusCompleted || 'Completed',
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
 * Creates a dedicated container for the level dropdown
 * @param {HTMLElement} dropdownForm - The dropdown form element
 * @returns {HTMLElement} The level dropdown container
 */
function createLevelDropdownContainer(dropdownForm) {
  // Check if container already exists
  let container = dropdownForm.querySelector('.level-dropdown-container');
  if (container) {
    container.innerHTML = ''; // Clear existing content
    return container;
  }

  // Create new container
  container = document.createElement('div');
  container.className = 'level-dropdown-container';
  dropdownForm.appendChild(container);
  return container;
}

/**
 * Updates the clear filter button state (enabled/disabled) based on active filters
 * @param {HTMLElement} block - The main block element
 * @param {Object} state - Mutable state object containing currentStatusFilters and currentLevelFilters
 */
function updateClearFilterButtonState(block, state) {
  const clearFilterButton = block.querySelector(`.${CSS_CLASSES.CLEAR_FILTER}`);
  if (!clearFilterButton) return;

  // Check if any product filters are selected (exclude level dropdown container)
  const productDropdownContainer = block.querySelector(SELECTORS.DROPDOWN);
  const levelContainer = block.querySelector('.level-dropdown-container');
  const statusContainer = block.querySelector('.status-dropdown-container');

  let hasProductFilters = false;
  if (productDropdownContainer) {
    const allCheckedInputs = [...productDropdownContainer.querySelectorAll(`${SELECTORS.CHECKBOX_INPUT}:checked`)];
    // Filter out level and status checkboxes
    hasProductFilters = allCheckedInputs.some((input) => {
      const isInLevelContainer = levelContainer?.contains(input);
      const isInStatusContainer = statusContainer?.contains(input);
      return !isInLevelContainer && !isInStatusContainer;
    });
  }

  // Check if any status filters are selected
  const hasStatusFilters = state.currentStatusFilters?.length > 0;

  // Check if any level filters are selected
  const hasLevelFilters = state.currentLevelFilters?.length > 0;

  // Disable button if no filters are active
  const hasActiveFilters = hasProductFilters || hasStatusFilters || hasLevelFilters;

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
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing courseData and currentStatusFilters
 */
function setupStatusDropdownHandler(dropdown, block, shimmer, state) {
  dropdown.handleOnChange((selectedValues) => {
    // Parse selected values (contains COURSE_STATUS constant values)
    state.currentStatusFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    // Show loading state
    shimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(block, shimmer);

    // Filter existing course data by status (client-side, no API call)
    const filteredData =
      state.currentStatusFilters.length > 0
        ? state.courseData.filter((course) =>
            state.currentStatusFilters.includes(course.meta?.courseInfo?.courseStatus),
          )
        : state.courseData;

    renderCards(block, filteredData, shimmer).then(() => {
      // Update clear button state after filter change
      updateClearFilterButtonState(block, state);
    });
  });
}

/**
 * Updates the status dropdown with new options based on current course data
 * Recreates the dropdown and sets up its handler
 * Preserves previously selected status filters if they still exist in new options
 * @param {HTMLElement} block - The main block element
 * @param {Array} courseData - Current course data
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object
 * @returns {Dropdown|null} The new status dropdown instance or null if no options
 */
function updateStatusDropdown(block, courseData, shimmer, state) {
  // Analyze current data for available statuses
  const statusList = createStatusFilterOptions(courseData);

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
    placeholders?.filterCourseStatusLabel || 'Status',
    statusList,
    DROPDOWN_TYPE,
  );

  // Setup handler for new dropdown
  setupStatusDropdownHandler(statusDropdown, block, shimmer, state);

  // Restore previously selected status filters if they still exist in new options
  if (state.currentStatusFilters?.length > 0) {
    const availableValues = statusList.map((option) => option.value);
    const validFilters = state.currentStatusFilters.filter((status) => availableValues.includes(status));

    if (validFilters.length > 0) {
      // Update checkbox states directly without triggering events
      validFilters.forEach((statusValue) => {
        const checkbox = statusContainer.querySelector(`input[type="checkbox"][value="${statusValue}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });

      // Update dropdown's data-selected attribute
      statusDropdown.dropdown.dataset.selected = validFilters.join(',');

      // Update button label to show count
      const buttonLabel = statusDropdown.dropdown.querySelector('button > span.custom-filter-dropdown-name');
      if (buttonLabel) {
        const statusLabel = placeholders?.filterCourseStatusLabel || 'Status';
        buttonLabel.textContent = `${statusLabel} (${validFilters.length})`;
      }
    }
  }

  return statusDropdown;
}

/**
 * Gets current product filters from state or checkboxes
 * @param {HTMLElement} block - The main block element
 * @returns {string[]} Array of selected product filter values
 */
function getCurrentProductFilters(block) {
  const productDropdownContainer = block.querySelector(SELECTORS.DROPDOWN);
  const levelContainer = block.querySelector('.level-dropdown-container');
  const statusContainer = block.querySelector('.status-dropdown-container');

  if (!productDropdownContainer) return [];

  const allCheckedInputs = [...productDropdownContainer.querySelectorAll(`${SELECTORS.CHECKBOX_INPUT}:checked`)];
  // Filter out level and status checkboxes
  return allCheckedInputs
    .filter((input) => {
      const isInLevelContainer = levelContainer?.contains(input);
      const isInStatusContainer = statusContainer?.contains(input);
      return !isInLevelContainer && !isInStatusContainer;
    })
    .map((input) => input.value);
}

/**
 * Sets up level dropdown change handler
 * Fetches new data from Coveo API when level filters change
 * @param {Dropdown} dropdown - The level dropdown instance
 * @param {HTMLElement} block - The main block element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing courseData and currentLevelFilters
 */
function setupLevelDropdownHandler(dropdown, block, shimmer, state) {
  dropdown.handleOnChange((selectedValues) => {
    // Parse selected values
    state.currentLevelFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    // Update URL and tags
    updateLevelUrlParams(state.currentLevelFilters);

    // Get current product filters
    const productFilters = getCurrentProductFilters(block);
    updateTags(block, productFilters, state.currentLevelFilters);

    // Show loading state
    shimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(block, shimmer);

    // Fetch new data from Coveo API with level filters
    fetchCourseData(productFilters, state.currentLevelFilters).then((courseData) => {
      state.courseData = courseData;

      // Update status dropdown to reflect available statuses in filtered data (only for signed-in users)
      if (state.isSignedIn) {
        state.statusDropdown = updateStatusDropdown(block, state.courseData, shimmer, state);
      }

      // Re-apply current status filters to new data (if any)
      const dataToRender =
        state.isSignedIn && state.currentStatusFilters.length > 0
          ? state.courseData.filter((course) =>
              state.currentStatusFilters.includes(course.meta?.courseInfo?.courseStatus),
            )
          : state.courseData;

      renderCards(block, dataToRender, shimmer).then(() => {
        // Update clear button state after filter change
        updateClearFilterButtonState(block, state);
      });
    });
  });
}

/**
 * Sets up product dropdown change handler
 * Fetches new data from API when product filters change
 * Updates status dropdown options based on new data (only for signed-in users)
 * @param {Dropdown} dropdown - The product dropdown instance
 * @param {HTMLElement} block - The main block element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing courseData, currentStatusFilters, currentLevelFilters, statusDropdown, and isSignedIn
 */
function setupProductDropdownHandler(dropdown, block, shimmer, state) {
  dropdown.handleOnChange((selectedValues) => {
    const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    // Update URL and tag display (include level filters in tags)
    updateUrlParams(selectedFilters);
    updateTags(block, selectedFilters, state.currentLevelFilters || []);

    // Show loading state
    shimmer.updateCount(getResponsiveShimmerCount());
    addShimmerWrapper(block, shimmer);

    // Fetch new data from API with selected product and level filters
    fetchCourseData(selectedFilters, state.currentLevelFilters || []).then((courseData) => {
      state.courseData = courseData;

      // Update status dropdown to reflect available statuses in filtered data (only for signed-in users)
      if (state.isSignedIn) {
        // Reset current status filters if they don't exist in new data
        const availableStatuses = analyzeCourseStatuses(state.courseData);
        state.currentStatusFilters = state.currentStatusFilters.filter((status) => {
          if (status === COURSE_STATUS.NOT_STARTED) return availableStatuses.hasNotStarted;
          if (status === COURSE_STATUS.IN_PROGRESS) return availableStatuses.hasInProgress;
          if (status === COURSE_STATUS.COMPLETED) return availableStatuses.hasCompleted;
          return false;
        });

        // Update the status dropdown with new options
        state.statusDropdown = updateStatusDropdown(block, state.courseData, shimmer, state);
      }

      // Re-apply current status filters to new data (if any) - only for signed-in users
      const dataToRender =
        state.isSignedIn && state.currentStatusFilters.length > 0
          ? state.courseData.filter((course) =>
              state.currentStatusFilters.includes(course.meta?.courseInfo?.courseStatus),
            )
          : state.courseData;

      renderCards(block, dataToRender, shimmer).then(() => {
        // Update clear button state after filter change
        updateClearFilterButtonState(block, state);
      });
    });
  });
}

/**
 * Sets up clear filter button click handler
 * Resets all filters (product, status, and level) and shows all courses
 * @param {HTMLElement} block - The main block element
 * @param {BrowseCardShimmer} shimmer - The shimmer loading instance
 * @param {Object} state - Mutable state object containing courseData, currentStatusFilters, currentLevelFilters, statusDropdown, levelDropdown, isSignedIn, and productDropdown
 */
function setupClearFilterHandler(block, shimmer, state) {
  const clearFilterButton = block.querySelector(`.${CSS_CLASSES.CLEAR_FILTER}`);

  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', (event) => {
      event.preventDefault();

      // Don't proceed if button is disabled
      if (clearFilterButton.hasAttribute('disabled')) {
        return;
      }

      // IMPORTANT: Reset ALL filter state FIRST before any other operations
      state.currentStatusFilters = [];
      state.currentLevelFilters = [];

      // Clear product dropdown using the reusable reset() method
      if (state.productDropdown) {
        state.productDropdown.reset();
      }

      // Clear status dropdown using the reusable reset() method (for signed-in users)
      if (state.isSignedIn && state.statusDropdown) {
        state.statusDropdown.reset();
      }

      // Clear level dropdown using the reusable reset() method
      if (state.levelDropdown) {
        state.levelDropdown.reset();
      }

      // Clear URL parameters
      updateUrlParams([]);
      updateLevelUrlParams([]);

      // Clear filter tags display
      updateTags(block, [], []);

      // Show loading state
      shimmer.updateCount(getResponsiveShimmerCount());
      addShimmerWrapper(block, shimmer);

      // Fetch all courses without any filters
      fetchCourseData([], []).then((courseData) => {
        state.courseData = courseData;

        // Update status dropdown to reflect all available statuses (only for signed-in users)
        if (state.isSignedIn) {
          state.statusDropdown = updateStatusDropdown(block, state.courseData, shimmer, state);
        }

        renderCards(block, state.courseData, shimmer).then(() => {
          // Update clear button state
          updateClearFilterButtonState(block, state);
        });
      });
    });
  }
}

/**
 * Pre-selects level checkboxes based on URL filters
 * @param {HTMLElement} block - The main block element
 * @param {string[]} urlLevelFilters - Array of level filters from URL
 */
function preselectLevelFiltersFromUrl(block, urlLevelFilters) {
  const levelContainer = block.querySelector('.level-dropdown-container');
  if (!levelContainer) return;

  const checkboxInputs = [...levelContainer.querySelectorAll('input[type="checkbox"]')];

  checkboxInputs
    .filter((input) => urlLevelFilters.includes(input.value) && !input.checked)
    .forEach((input) => input.click());
}

/**
 * Main decoration function for the browse-courses block
 * Initializes the course browsing interface with product, level, and status filters
 * @param {HTMLElement} block - The block element to decorate
 * @description
 * Status dropdown is only shown for signed-in users with course progress data.
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

  // Check if user is signed in (required for status dropdown)
  const isUserSignedIn = await isSignedInUser();

  // Fetch products and levels in parallel
  const [products, levels] = await Promise.all([getProductList(), getLevelList()]);
  const productsList = transformProductsForDropdown(products);
  const levelsList = transformLevelsForDropdown(levels);

  // Initialize product filter dropdown
  const productDropdown = new Dropdown(
    block.querySelector(SELECTORS.DROPDOWN),
    placeholders?.filterProductLabel || 'Product',
    productsList,
    DROPDOWN_TYPE,
  );

  // Initialize level filter dropdown
  const dropdownForm = block.querySelector(SELECTORS.DROPDOWN);
  const levelContainer = createLevelDropdownContainer(dropdownForm);

  const levelDropdown = new Dropdown(
    levelContainer,
    placeholders?.filterLevelLabel || 'Level',
    levelsList,
    DROPDOWN_TYPE,
  );

  // Append content container to block first
  block.appendChild(contentDiv);

  // Initialize and show shimmer loading state
  const buildCardsShimmer = new BrowseCardShimmer(getResponsiveShimmerCount());
  addShimmerWrapper(block, buildCardsShimmer);

  // Fetch and render initial course data based on URL filters
  // BrowseCardsDelegate automatically enriches with meta.courseInfo.courseStatus for signed-in users
  const urlFilters = getFiltersFromUrl();
  const urlLevelFilters = getLevelFiltersFromUrl();

  // Create mutable state object to share between handlers
  const state = {
    courseData: [],
    currentStatusFilters: [],
    currentLevelFilters: urlLevelFilters,
    statusDropdown: null,
    levelDropdown,
    productDropdown,
    isSignedIn: isUserSignedIn,
  };

  // Setup event handlers first (before data loads)
  setupProductDropdownHandler(productDropdown, block, buildCardsShimmer, state);
  setupLevelDropdownHandler(levelDropdown, block, buildCardsShimmer, state);
  setupClearFilterHandler(block, buildCardsShimmer, state);

  // Fetch data non-blocking (include level filters from URL)
  fetchCourseData(urlFilters, urlLevelFilters).then((courseData) => {
    state.courseData = courseData;

    // Initialize status filter dropdown - ONLY for signed-in users
    if (isUserSignedIn) {
      const statusList = createStatusFilterOptions(courseData);

      // Only create dropdown if there are status options
      if (statusList.length > 0) {
        const statusDropdownForm = block.querySelector(SELECTORS.DROPDOWN);
        const statusContainer = createStatusDropdownContainer(statusDropdownForm);

        state.statusDropdown = new Dropdown(
          statusContainer,
          placeholders?.filterCourseStatusLabel || 'Status',
          statusList,
          DROPDOWN_TYPE,
        );

        // Setup status dropdown handler after creation
        setupStatusDropdownHandler(state.statusDropdown, block, buildCardsShimmer, state);
      }
    }

    renderCards(block, courseData, buildCardsShimmer);

    // Restore URL filter state to UI
    preselectFiltersFromUrl(block, urlFilters);
    preselectLevelFiltersFromUrl(block, urlLevelFilters);
    updateUrlParams(urlFilters);
    updateLevelUrlParams(urlLevelFilters);
    updateTags(block, urlFilters, urlLevelFilters);

    // Initialize clear button state based on current filters
    updateClearFilterButtonState(block, state);
  });
}
