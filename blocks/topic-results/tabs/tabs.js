import { COVEO_SORT_OPTIONS, CONTENT_TYPES } from '../../../scripts/browse-card/browse-cards-constants.js';
import { populateFilteredResults } from '../filtered-results.js';
import BrowseCardsDelegate from '../../../scripts/browse-card/browse-cards-delegate.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';

// Adjusted CONTENT_TYPES to include only the specified tabs
const CUSTOM_CONTENT_TYPES = {
  DOCUMENTATION: { ...CONTENT_TYPES.DOCUMENTATION, LABEL: 'Documentation' },
  TUTORIALS: { ...CONTENT_TYPES.TUTORIAL, LABEL: 'Tutorials' },
  COMMUNITY: { ...CONTENT_TYPES.COMMUNITY, LABEL: 'Community' },
  EVENTS: { ...CONTENT_TYPES.EVENT, LABEL: 'Events' },
};

async function fetchCardData(sortOption, contentType = [], feature = null) {
  // Construct parameters for the fetch operation
  const params = {
    sortOption,
    contentType: contentType ? [contentType] : [],
    feature: feature ? [feature] : [],
  };

  return BrowseCardsDelegate.fetchCardData(params);
}

/**
 * Displays content for the specified tab.
 * @param {string} contentType - The content type to display in the block.
 * @param {HTMLElement} block - The block element to update with content.
 */
async function displayTabContent(block, contentType = [], sortOption = COVEO_SORT_OPTIONS.RELEVANCE, feature = null) {
  try {
    const data = await fetchCardData(sortOption, contentType, feature);
    if (data && data.length > 0) {
      populateFilteredResults(block, data);
    }
  } catch (error) {
    // Error intentionally ignored to ensure uninterrupted user experience
  }
}

function setActiveTab(index, block, feature = null) {
  const tabs = block.querySelectorAll('.tab-button');
  tabs.forEach((tab, tabIndex) => {
    if (tabIndex === index) {
      tab.classList.add('active');
      const contentType = index === 0 ? [] : Object.values(CUSTOM_CONTENT_TYPES)[index - 1].MAPPING_KEY;
      const sortOption = COVEO_SORT_OPTIONS.RELEVANCE;
      displayTabContent(block, contentType, sortOption, feature);
    } else {
      tab.classList.remove('active');
    }
  });
}

/**
 * Initializes tabs within the provided block element.
 * @param {HTMLElement} block - The block element where tabs will be initialized.
 */
function initializeTabs(block) {
  // Check if block is a DOM element
  if (!(block instanceof HTMLElement)) {
    return;
  }

  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';

  // Manually add the "Most relevant" tab
  const mostRelevantTab = document.createElement('button');
  mostRelevantTab.className = 'tab-button';
  mostRelevantTab.textContent = 'Most relevant';
  mostRelevantTab.addEventListener('click', () => setActiveTab(0, block));
  tabContainer.appendChild(mostRelevantTab);

  // Add tabs for other content types
  // Convert CONTENT_TYPES from an object to an array of its values
  Object.values(CUSTOM_CONTENT_TYPES).forEach((type, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.textContent = type.LABEL;
    tabButton.addEventListener('click', () => setActiveTab(index + 1, block));

    tabContainer.appendChild(tabButton);
  });

  block.appendChild(tabContainer);
  setActiveTab(0, block); // set the first tab as active by default
}

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorateTabs(block) {
  // Load the CSS for the tabs component
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/tabs/tabs.css`);
  initializeTabs(block);
}
