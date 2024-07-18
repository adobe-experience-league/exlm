import { COVEO_SORT_OPTIONS, CONTENT_TYPES } from '../../../scripts/browse-card/browse-cards-constants.js';
import { populateFilteredResults } from '../filtered-results.js';
import BrowseCardsDelegate from '../../../scripts/browse-card/browse-cards-delegate.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../../scripts/scripts.js';

//TODO: We need to grab the translated name of the topic from the topics API
let activeTopic = {
  label: 'Analytics Basics',
  value: [''],
};

let tabBlock = {};

function getQueryParam(param) {
  let value = '';
  const searchParams = new URLSearchParams(window.location.search);
  const queryParam = searchParams.get(param);

  if (queryParam) {
    try {
      const decoded = decodeURIComponent(queryParam);
      if (Boolean(decoded)) {
        value = JSON.parse(decoded);
      }
    } catch (err) {
      console.error(`Failed to decode query parameter ${param}`);
    }
  }

  return value;
}

function setQueryParam(param, value) {
  if (value) {
    let encoded = '';

    try {
      const str = JSON.stringify(value);
      encoded = encodeURIComponent(str);
    } catch (err) {
      console.error(`Failed to encode query parameter ${param}`);
    } 
    const url = new URL(window.location);
    url.searchParams.set(param, encoded);
    history.pushState(null, '', url);
  }
}

async function fetchCardData(sortOption, contentType = []) {
  // Construct parameters for the fetch operation
  const params = {
    sortOption: [sortOption],
    contentType: contentType ? [contentType] : [],
    feature: activeTopic.value,
  };

  return BrowseCardsDelegate.fetchCardData(params);
}

/**
 * Displays content for the specified tab.
 * @param {string} contentType - The content type to display in the block.
 * @param {HTMLElement} block - The block element to update with content.
 */
async function displayTabContent(block, contentType = [], sortOption = COVEO_SORT_OPTIONS.RELEVANCE) {
  try {
    const data = await fetchCardData(sortOption, contentType);
    if (data && data.length > 0) {
      populateFilteredResults(block, data);
    }
  } catch (error) {
    // TODO: Render "No results" view
  }
}

/**
 *
 */
async function toggleTab(value, dataset, tabHtml) {
  tabHtml.querySelectorAll('.active').forEach((el) => {
    el.classList.remove('active');
  });

  tabHtml.querySelectorAll(`input[value="${value}"]`).forEach((el) => {
    el.classList.add('active');
  });

  (tabHtml.querySelector('.topic-results-dropdown-value span') || {}).textContent = value;

  const sortBy = dataset.sortby || '';
  const contentType = dataset.contenttype || [];

  //Add block to insert content
  await displayTabContent(tabBlock, contentType, sortBy, activeTopic);
  setQueryParam('sortBy', sortBy);
  setQueryParam('contenttype', contentType);
}

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorateTabs(block) {
  // Load the CSS for the tabs component
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/tabs/tabs.css`);

  tabBlock = block;

  let placeholders = {};

  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    console.error('Error fetching placeholders:', err);
  }

  const tabHtml = htmlToElement(`
    <div class="topic-results-filters">
      <div class="topic-results-tabs">
        <ul>
        <li>
          <input type="button" value="${
            placeholders?.mostRelevant || 'Most relevant'
          }" data-contenttype="[]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
        </li>
        <li>
          <input type="button" value="${placeholders?.documentation || 'Documentation'}" data-contenttype="[${
            CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY
          }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
        </li>
        <li>
          <input type="button" value="${placeholders?.tutorials || 'Tutorials'}" data-contenttype="[${
            CONTENT_TYPES.TUTORIAL.MAPPING_KEY
          }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}" />
        </li>
        <li>
          <input type="button" value="${placeholders?.community || 'Community'}" data-contenttype="[${
            CONTENT_TYPES.COMMUNITY.MAPPING_KEY
          }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
        </li>
        <li>
          <input type="button" value="${placeholders?.events || 'Events'}" data-contenttype="[${
            CONTENT_TYPES.EVENT.MAPPING_KEY
          }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
        </li>
        </ul>
      </div>

      <div class="topic-results-dropdown">
        <div class="topic-results-dropdown-value">
          <span></span>
        </div>

        <div class="topic-results-dropdown-popover">
          <ul>
            <li>
              <input type="button" value="${
                placeholders?.mostRelevant || 'Most relevant'
              }" data-contenttype="[]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
            </li>
            <li>
              <input type="button" value="${placeholders?.documentation || 'Documentation'}" data-contenttype="[${
                CONTENT_TYPES.DOCUMENTATION.MAPPING_KEY
              }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
            </li>
            <li>
              <input type="button" value="${placeholders?.tutorials || 'Tutorials'}" data-contenttype="[${
                CONTENT_TYPES.TUTORIAL.MAPPING_KEY
              }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}" />
            </li>
            <li>
              <input type="button" value="${placeholders?.community || 'Community'}" data-contenttype="[${
                CONTENT_TYPES.COMMUNITY.MAPPING_KEY
              }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
            </li>
            <li>
              <input type="button" value="${placeholders?.events || 'Events'}" data-contenttype="[${
                CONTENT_TYPES.EVENT.MAPPING_KEY
              }]" data-sortby="${COVEO_SORT_OPTIONS.RELEVANCE}"/>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `);

  (tabHtml.querySelectorAll('input') || []).forEach((button) => {
    button.addEventListener('click', async (e) => {
      await toggleTab(e.target.value, e.target.dataset, tabHtml);
    });
  });

  block.appendChild(tabHtml);

  activeTopic = getQueryParam('topic') || activeTopic;
  toggleTab(
    placeholders?.mostRelevant || 'Most relevant',
    {
      sortBy: getQueryParam('sortBy') || COVEO_SORT_OPTIONS.RELEVANCE,
      contenttype: getQueryParam('contenttype') || [],
    },
    tabHtml,
  );
}
