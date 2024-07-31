import { exlPipelineCoveoDataAdaptor } from '../../../scripts/data-service/coveo/coveo-exl-pipeline-helpers.js';
import { COVEO_SORT_OPTIONS } from '../../../scripts/browse-card/browse-cards-constants.js';
import { CONTENT_TYPES} from '../../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { populateFilteredResults } from '../filtered-results.js';
import{initPagination} from '../pagination/pagination.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../../scripts/scripts.js';


// TODO: We need to grab the translated name of the topic from the topics API
let activeTopic = {
  label: 'Analytics Basics',
  value: [''],
};
let tabBlock = {};


/**
 * Gets a query parameter value by name.
 * @param {string} param - The name of the query parameter.
 * @returns {string} The value of the query parameter.
 */
function getQueryParam(param) {
  let value = '';
  const searchParams = new URLSearchParams(window.location.search);
  const queryParam = searchParams.get(param);

  if (queryParam) {
    try {
      const decoded = decodeURIComponent(queryParam);
      if (decoded) {
        value = JSON.parse(decoded);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to decode query parameter ${param}`);
    }
  }

  return value;
}

/**
 * Sets a query parameter value.
 * @param {string} param - The name of the query parameter.
 * @param {string} value - The value to set for the query parameter.
 */
function setQueryParam(param, value) {
  if (value) {
    let encoded = '';

    try {
      const str = JSON.stringify(value);
      encoded = encodeURIComponent(str);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to encode query parameter ${param}`);
    }
    const url = new URL(window.location);
    url.searchParams.set(param, encoded);
    history.pushState(null, '', url);
  }
}

/**
 * Displays content for the specified tab.
 * @param {HTMLElement} block - The block element to update with content.
 * @param {Array} contentType - The content type to display in the block.
 * @param {string} sortOption - The sort option to use for fetching data.
 */
async function displayTabContent(block, contentType = [], sortOption = COVEO_SORT_OPTIONS.RELEVANCE, currentPage=0) {
  let data = [];
  const itemsPerPage = 10;
  const firstResult = (currentPage) * itemsPerPage;
  let totalCount = 0;

  try {
    const params = {
      sortCriteria: sortOption,
      contentType: contentType.length > 0 ? contentType : [],
      firstResult,
      noOfResults: itemsPerPage,
    };

    data = await exlPipelineCoveoDataAdaptor(params);
    if (data.length > 0) {
      totalCount = data[0].totalCount; 
    }

    console.log('firstResult:', firstResult);
    console.log('itemsPerPage:', itemsPerPage);
    console.log('No of results:', data.length); 
    console.log('Total count:', totalCount); 
    console.log('Data:', data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  // Append new content
  if (data?.length) {
    populateFilteredResults(block, data);

    // Remove existing pagination container
    const existingPagination = document.querySelector('.pagination-container');
    if (existingPagination) {
      existingPagination.remove();
    }

    initPagination(totalCount, itemsPerPage, (newPage) => {
      displayTabContent(block, contentType, sortOption, newPage);
    });
  } else {
    const contentElement = block.querySelector('.tab-content');
    if (contentElement) contentElement.innerHTML = '<p>No results found.</p>';
  }
}

/**
 * Toggles the active tab and displays its content.
 * @param {string} value - The value of the tab to activate.
 * @param {Object} dataset - The dataset of the tab element.
 * @param {HTMLElement} tabHtml - The HTML element containing the tabs.
 */
async function toggleTab(value, dataset, tabHtml) {
  tabHtml.querySelectorAll('.tab-wrapper.active').forEach((el) => {
    el.classList.remove('active');
  });

  tabHtml.querySelectorAll(`input[value="${value}"]`).forEach((el) => {
    el.closest('.tab-wrapper').classList.add('active');
  });

  (tabHtml.querySelector('.topic-results-dropdown-value span') || {}).textContent = value;

  const sortBy = dataset.sortby || '';

  let contentType;
  if (typeof dataset.contenttype === 'string') {
    try {
      contentType = dataset.contenttype.trim() !== '' ? JSON.parse(dataset.contenttype) : [];
    } catch (error) {
      console.error('Error parsing contentType:', error);
      contentType = []; // Default to an empty array if parsing fails
    }
  } else if (Array.isArray(dataset.contenttype)) {
    contentType = dataset.contenttype; // Assume it's already the correct format
  } else {
    contentType = []; // Default to an empty array if it's neither a string nor an array
  }

  await displayTabContent(tabBlock, contentType, sortBy, 1);
  setQueryParam('sortBy', sortBy);
  setQueryParam('contenttype', contentType);
}

/**
 * Main function to decorate tabs.
 * @param {HTMLElement} block - The block element to apply decorations to.
 */
export default async function decorateTabs(block) {
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/tabs/tabs.css`);
  tabBlock = block;
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const tabHtml = htmlToElement(`
    <div class="topic-results-filters">
      <div class="topic-results-tabs">
        <ul>
          <li class="tab-wrapper"><input type="button" value="${placeholders?.mostRelevant || 'Most relevant'}" data-contenttype='[]' data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/></li>
          <li class="tab-wrapper"><input type="button" value="${placeholders?.documentation || 'Documentation'}" data-contenttype='${JSON.stringify([CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY])}' data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/></li>
          <li class="tab-wrapper"><input type="button" value="${placeholders?.tutorials || 'Tutorials'}" data-contenttype='${JSON.stringify([CONTENT_TYPES.TUTORIAL.MAPPING_KEY])}' data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}" /></li>
          <li class="tab-wrapper"><input type="button" value="${placeholders?.community || 'Community'}" data-contenttype='${JSON.stringify([CONTENT_TYPES.COMMUNITY.MAPPING_KEY])}' data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/></li>
          <li class="tab-wrapper"><input type="button" value="${placeholders?.events || 'Events'}" data-contenttype='${JSON.stringify([CONTENT_TYPES.EVENT.MAPPING_KEY])}' data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/></li>
        </ul>
      </div>
    </div>
`);

  tabHtml.querySelectorAll('input').forEach((button) => {
    button.addEventListener('click', async (e) => {
      await toggleTab(e.target.value, e.target.dataset, tabHtml);
    });
  });

  block.appendChild(tabHtml);

  activeTopic = getQueryParam('topic') || activeTopic;
  // TODO: We need to grab the translated name of the topic from the topics API
  toggleTab(
    placeholders?.mostRelevant || 'Most relevant',
    {
      sortBy: getQueryParam('sortBy') || COVEO_SORT_OPTIONS.RELEVANCE,
      contenttype: getQueryParam('contenttype') || [],
    },
    tabHtml,
  );
}