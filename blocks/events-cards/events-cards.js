import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import buildCard from '../../scripts/browse-card/browse-card.js';
import CONTENT_TYPES from '../../scripts/browse-card/browse-cards-constants.js';
/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');
  const allSolutions = block.querySelector('div:nth-child(4) > div').textContent.trim();
  const solutions = block.querySelector('div:nth-child(5) > div').textContent.trim();
  const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
  const noOfResults = 4;
  // eslint-disable-next-line no-use-before-define
  const solutionsTags = solutions !== '' ? formattedSolutionTags(solutions) : '';
  // If All Solutions toggle is on, solution param will be empty, else use solutions tag as param
  const solutionsParam = allSolutions === 'true' ? '' : solutionsTags;

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="events-cards-header">
      <div class="events-cards-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
          </div>
      </div>
      <div class="events-cards-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  const param = {
    contentType,
  };

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent.then((data) => {
    // eslint-disable-next-line no-use-before-define
    const filteredLiveEventsData = fetchFilteredCardData(data, solutionsParam);
    if (filteredLiveEventsData?.length) {
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('events-cards-content');

      for (let i = 0; i < Math.min(noOfResults, filteredLiveEventsData.length); i += 1) {
        const cardData = filteredLiveEventsData[i];
        const cardDiv = document.createElement('div');
        buildCard(cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      }

      block.appendChild(contentDiv);
      decorateIcons(block);
    }
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
      const paramsArray = Array.isArray(params) ? params : [params];
      if (paramsArray.length === 0 || paramsArray.some((p) => p === '')) {
        return eventData.data;
      }

      const lowercaseParams = paramsArray.map((parameter) => parameter.toLowerCase());

      const filteredData = eventData.data.filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        const lowercaseProduct = productArray.map((item) => item.toLowerCase().replaceAll(' ', '-'));
        return lowercaseParams.some((parameter) => lowercaseProduct.includes(parameter.trim()));
      });

      // Sort events by startTime in ascending order
      const sortedData = filteredData.sort(
        (card1, card2) => new Date(card1.event.startTime) - new Date(card2.event.startTime),
      );
      return sortedData;
    }
    return [];
  };
}

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
