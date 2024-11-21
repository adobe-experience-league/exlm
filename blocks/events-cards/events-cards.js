import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';

/**
 * formattedSolutionTags returns the solution type by stripping off the exl:solution/ string
 * @param {string} inputString - The solution tag. E.g. exl:solution/experience-cloud
 * @returns the solution tag. E.g. experience-cloud
 */
function formattedSolutionTags(inputString) {
  return inputString
    .replace(/exl:solution\//g, '')
    .split(',')
    .map((part) => part.trim());
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

  const [solutions] = configs.map((cell) => cell.textContent.trim());

  const contentType = CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY;
  const noOfResults = 4;
  const solutionsParam = solutions !== '' ? formattedSolutionTags(solutions) : '';

  headingElement.firstElementChild?.classList.add('h2');

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
    headerDiv
      .querySelector('h1,h2,h3,h4,h5,h6')
      ?.insertAdjacentHTML('afterend', '<div class="tooltip-placeholder"></div>');
    const tooltipElem = headerDiv.querySelector('.tooltip-placeholder');
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
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
          buildCard(contentDiv, cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }
        block.appendChild(contentDiv);
        /* Hide Tooltip while scrolling the cards layout */
        hideTooltipOnScroll(contentDiv);
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

      const solutionParam = solutionsList.map((parameter) => {
        // In case of sub-solutions. E.g. exl:solution/campaign/standard
        const parts = parameter.split('/');
        const decodedParts = parts.map((part) => atob(part));
        return decodedParts.join(' ');
      });

      const filteredData = eventData.data.filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        const productKey = productArray.map((item) => item);
        return solutionParam.some((parameter) => productKey.includes(parameter.trim()));
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
