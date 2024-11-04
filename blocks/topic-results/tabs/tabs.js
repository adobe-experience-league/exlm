import { exlPipelineCoveoDataAdaptor } from '../../../scripts/data-service/coveo/coveo-exl-pipeline-helpers.js';
import { COVEO_SORT_OPTIONS } from '../../../scripts/browse-card/browse-cards-constants.js';
import { CONTENT_TYPES } from '../../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { populateFilteredResults } from '../filtered-results/filtered-results.js';
import { initPagination } from '../pagination/pagination.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';
import { htmlToElement, decoratePlaceholders } from '../../../scripts/scripts.js';
import { updateHeading } from '../heading/heading.js';
import ExlClient from '../exl-client.js';

let tabBlock = {};
let isPaginationInitialized = false;

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
    window.history.pushState(null, '', url);
  }
}

/**
 * Displays content for the specified tab.
 * @param {HTMLElement} block - The block element to update with content.
 * @param {Array} contentType - The content type to display in the block.
 * @param {string} sortOption - The sort option to use for fetching data.
 */
async function displayTabContent(block, contentType = [], sortOption = COVEO_SORT_OPTIONS.RELEVANCE, currentPage = 0) {
  let data = [];
  const itemsPerPage = 10;
  const firstResult = currentPage * itemsPerPage;
  let totalCount = 0;

  if (currentPage === 0) {
    isPaginationInitialized = false; // Reset the flag to false when the page is 0
  }

  const activeTopic = getQueryParam('topic');

  try {
    const params = {
      feature: [activeTopic],
      sortCriteria: sortOption,
      contentType: contentType.length > 0 ? contentType : [],
      firstResult,
      noOfResults: itemsPerPage,
    };

    data = await exlPipelineCoveoDataAdaptor(params);

    if (data.length > 0) {
      totalCount = data[0].totalCount;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data:', error);
  }

  // After fetching data and updating the UI, call updateHeading
  const resultCount = itemsPerPage * (currentPage + 1);
  updateHeading(totalCount, resultCount);

  // Append new content
  if (Number.isInteger(data?.length)) {
    populateFilteredResults(block, data);

    if (!isPaginationInitialized) {
      // Initialize pagination only if it hasn't been done before
      initPagination(totalCount, itemsPerPage, (newPage) => {
        const url = new URL(window.location.href);
        const uriComponent = decodeURIComponent(url.searchParams.get('contenttype'));
        const contentTypeFromPagination = JSON.parse(uriComponent);
        displayTabContent(block, contentTypeFromPagination, sortOption, newPage);
      });
      isPaginationInitialized = true; // Set the flag to true after initializing
    }
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
  const client = new ExlClient();
  const combinedData = await client.getCombinedTopicsAndFeatures();
  const firstTopic = Object.values(combinedData)[488];

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
      // eslint-disable-next-line no-console
      console.error('Error parsing contentType:', error);
      contentType = [];
    }
  } else if (Array.isArray(dataset.contenttype)) {
    contentType = dataset.contenttype;
  } else {
    contentType = [];
  }

  await displayTabContent(tabBlock, contentType, sortBy, 0);
  setQueryParam('topic', firstTopic.Name);
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

  // Options for dropdown
  const options = {
    'Most relevant': {
      value: 'Most relevant',
      'data-contenttype': '[]',
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    Documentation: {
      value: 'Documentation',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    Tutorials: {
      value: 'Tutorials',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.TUTORIAL.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    Community: {
      value: 'Community',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.COMMUNITY.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    Events: {
      value: 'Events',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.EVENT.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
  };

  let selectValue = options['Most relevant'];

  document.addEventListener('click', (e) => {
    if (e.target.closest('.tab-select-container')) {
      const dropdown = document.querySelector('.tab-options');
      const tabSelectArrow = document.querySelector('.tab-select-arrow');
      if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        tabSelectArrow?.classList.add?.('downArrow');
      } else {
        dropdown.classList.add('open');
        tabSelectArrow?.classList.remove?.('downArrow');
      }
    }
  });

  const tabs = [
    {
      value: 'Most relevant',
      'data-contenttype': [],
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    {
      value: 'Documentation',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    {
      value: 'Tutorials',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.TUTORIAL.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    {
      value: 'Community',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.COMMUNITY.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
    {
      value: 'Events',
      'data-contenttype': JSON.stringify([CONTENT_TYPES.EVENT.MAPPING_KEY]),
      'data-sortby': COVEO_SORT_OPTIONS.RELEVANCE,
    },
  ];

  const tabHtml = htmlToElement(`
<div class="topic-results-filters">
    <div class="topic-results-dropdown">
        <div class="custom-select-wrapper">
            <div class="tab-select-container" data-contenttype="${selectValue['data-contenttype']}" data-sortby="${
              selectValue['data-sortby']
            }">
                <button class="topic-results-dropdown-value" type="button"> 
                    <div class="tab-select-value">${selectValue.value}</div> 
                    <div class="tab-select-arrow"></div>
                </button>
                <ul class="tab-options">
                    ${Object.values(options)
                      .map(
                        (option) => `
                        <li class="tab-option" value="${option.value}">
                            <div class="tab-option-button">${option.value}</div>
                        </li>
                    `,
                      )
                      .join('')}
                </ul>
            </div> 
        </div>
    </div>
    <div class="topic-results-tabs">
        <ul>
        ${tabs
          .map(
            (tab) => `
            <li class="tab-wrapper">
                <input type="button" value="${tab.value}" data-contenttype=${tab['data-contenttype']} data-sortby="${tab['data-sortby']}" />
            </li>
        `,
          )
          .join('')}
        </ul>
    </div>
</div>
`);

  // Show shimmer loading state for placeholders
  decoratePlaceholders(tabHtml);

  tabHtml.querySelectorAll('input').forEach((button) => {
    button.addEventListener('click', async (e) => {
      await toggleTab(e.target.value, e.target.dataset, tabHtml);
    });
  });

  block.appendChild(tabHtml);

  // After appending tabHtml to block
  const dropdown = tabHtml.querySelector('.tab-select-container');

  dropdown.addEventListener('click', async (e) => {
    if (e.target.closest('.tab-option-button')) {
      const optionSelection = e.target;
      selectValue = options[optionSelection.innerHTML];
      const dataset = {
        contenttype: selectValue['data-contenttype'],
        sortby: selectValue['data-sortby'],
      };

      // Update the displayed value of the dropdown
      const dropdownDisplayElement = tabHtml.querySelector('.tab-select-value');
      if (dropdownDisplayElement) {
        dropdownDisplayElement.textContent = selectValue.value; // Update the displayed text
      }

      // Directly use the selected value to find the dataset for the tab
      if (selectValue) {
        await toggleTab(selectValue.value, dataset, tabHtml);
      }
    }
  });

  // TODO: We need to grab the translated name of the topic from the topics API
  toggleTab(
    'Most relevant',
    {
      sortBy: getQueryParam('sortBy') || COVEO_SORT_OPTIONS.RELEVANCE,
      contenttype: getQueryParam('contenttype') || [],
    },
    tabHtml,
  );
}
