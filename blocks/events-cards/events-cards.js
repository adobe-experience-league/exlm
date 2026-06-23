import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, getv2TagLabels, isV2TagFormat } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * formattedSolutionTags returns the solution type by stripping off the exl:solution/ string and decoding base64
 * Handles sub-solutions like exl:solution/campaign/standard where each part is base64 encoded
 * @param {string} inputString - The solution tag. E.g. exl:solution/QWNyb2JhdA== or exl:solution/Y2FtcGFpZ24=/c3RhbmRhcmQ=
 * @returns the solution tag decoded. E.g. Acrobat or campaign standard
 */
function formattedSolutionTags(inputString) {
  return inputString
    .replace(/exl:solution\//g, '')
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      // Handle sub-solutions: split by /, decode each part, join with space
      const parts = trimmed.split('/');
      const decodedParts = parts.map((p) => {
        try {
          return atob(p);
        } catch (e) {
          return p;
        }
      });
      return decodedParts.join(' ');
    });
}

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, linkTextElement, ...configs] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  const configValues = configs.map((cell) => cell.textContent.trim());

  // Check if block has v1 tags by finding any element that starts with "exl:"
  const hasExlTag = configValues.some((el) => el?.startsWith('exl:'));

  // blocks with v1 have 2 config values (solutions v1, solutionsv2)
  const hasV1Tags = hasExlTag || configValues.length >= 2;

  // Extract the solution values
  const [firstConfig, secondConfig] = configValues;

  let solutions;
  let solutionsv2;

  if (hasV1Tags) {
    solutions = firstConfig;
    solutionsv2 = secondConfig || '';
  } else {
    // only v2 tag exists
    solutions = '';
    solutionsv2 = firstConfig || '';
  }

  const contentType = CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY;
  const noOfResults = 4;
  let solutionsParam = '';

  // If new format (no v1 tags), always use v2 tags
  if (!hasV1Tags || isV2TagFormat(solutionsv2)) {
    solutionsParam = isV2TagFormat(solutionsv2)
      ? getv2TagLabels(solutionsv2)
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : '';
  } else {
    // Legacy tags (only used in old format when FF is disabled)
    solutionsParam = solutions && solutions !== '' ? formattedSolutionTags(solutions) : '';
  }
  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
          ${headingElement.innerHTML}
      </div>
      <div class="browse-cards-block-view">${linkTextElement.innerHTML}</div>
    </div>
  `);

  if (toolTipElement?.textContent?.trim()) {
    const tooltip = htmlToElement(`
    <div class="tooltip-placeholder">
    <div class="tooltip tooltip-right">
      <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement.textContent.trim()}</span>
    </div>
    </div>
  `);
    decorateIcons(tooltip);
    headerDiv.querySelector('h1,h2,h3,h4,h5,h6')?.insertAdjacentElement('afterend', tooltip);
  }

  // Appending header div to the block
  block.appendChild(headerDiv);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const parameters = {
    contentType,
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(parameters);
  browseCardsContent
    .then((data) => {
      // eslint-disable-next-line no-use-before-define
      const filteredLiveEventsData = fetchFilteredCardData(data, solutionsParam);
      buildCardsShimmer.removeShimmer();
      if (filteredLiveEventsData?.length) {
        for (let i = 0; i < Math.min(noOfResults, filteredLiveEventsData.length); i += 1) {
          const cardData = filteredLiveEventsData[i];
          const cardDiv = document.createElement('div');
          buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
      }
    })
    .catch((err) => {
      buildCardsShimmer.removeShimmer();
      // eslint-disable-next-line no-console
      console.error('Events Cards:', err);
    });

  /**
   * fetchFilteredCardData filters the events data based on productFocus key in events JSON
   * @param {string} data - The events json data.
   * @param {string} params - The solutions tag parameter(s) from AEM UE.
   * @returns The data for event cards associated with the specified solution tag in startTime ascending order.
   */
  const fetchFilteredCardData = (data, params) => {
    const eventData = { data };
    if (eventData.data) {
      const solutionsList = Array.isArray(params) ? params : [params];
      // If solutions param is empty or contains an empty value, return all the results in startTime ascending order
      if (solutionsList.length === 0 || solutionsList.some((param) => param === '')) {
        return eventData.data
          .filter((card) => card.event.time)
          .sort((card1, card2) => new Date(card1.event.time) - new Date(card2.event.time));
      }

      const filteredData = eventData.data.filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        const productKey = productArray.map((item) => item.toLowerCase());
        return solutionsList.some((parameter) => productKey.includes(parameter.toLowerCase().trim()));
      });

      // Sort events by startTime in ascending order
      return filteredData
        .filter((card) => card.event.time)
        .sort((card1, card2) => new Date(card1.event.time) - new Date(card2.event.time));
    }
    // In case of invalid solution param, return empty results.
    return [];
  };
}
