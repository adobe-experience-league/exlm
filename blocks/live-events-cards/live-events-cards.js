import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, loadIms } from '../../scripts/scripts.js';
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

  const solutionsParam = allSolutions === 'true' ? '' : solutions;
  const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
  const noOfResults = 4;

  // Clearing the block's content
  block.innerHTML = '';

  const headerDiv = htmlToElement(`
    <div class="live-events-cards-header">
      <div class="live-events-cards-title">
          <h4>${headingElement?.textContent.trim()}</h4>
          <div class="tooltip">
            <span class="icon icon-info"></span><span class="tooltip-text">${toolTipElement?.textContent.trim()}</span>
          </div>
      </div>
      <div class="live-events-cards-view">${linkTextElement?.outerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  try {
    await loadIms();
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }

  const param = {
    solutionsParam,
    noOfResults,
    contentType,
  };

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(param);
  browseCardsContent.then((data) => {
    // eslint-disable-next-line no-use-before-define
    const filteredLiveEventsData = fetchFilteredCardData(data, solutionsParam);
    if (filteredLiveEventsData?.length) {
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('live-events-cards-content');

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

  const fetchFilteredCardData = (data, params) => {
    const eventData = { data };
    // Function to filter events based on product focus
    function filterEventsByProduct(product) {
      const paramArray = product.split(',');
      // Check if data is not null
      if (eventData.data) {
        return eventData.data.filter((event) =>
          // eslint-disable-next-line no-shadow
          paramArray.some((param) => event.product.includes(param.trim())),
        );
      }
      return []; // Return an empty array if the structure is not as expected
    }
    const filteredLiveEvents = filterEventsByProduct(params);
    return filteredLiveEvents;
  };
}
