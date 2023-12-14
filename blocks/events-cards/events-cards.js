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
  const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
  const noOfResults = 4;
  // eslint-disable-next-line no-use-before-define
  const solutionsTags = solutions !== '' ? formattedSolutionTags(solutions) : '';
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

  let adobeIMS = {
    isSignedInUser: () => false,
  };
  try {
    const ims = await loadIms();
    adobeIMS = ims.adobeIMS;
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Adobe IMS not available.');
  }
  const isSignedIn = adobeIMS?.isSignedInUser();
  // eslint-disable-next-line no-console
  console.warn(isSignedIn);

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

  // Function to filter events based on productFocus key in JSON
  const fetchFilteredCardData = (data, params) => {
    const eventData = { data };
    if (eventData.data) {
      // Convert each filter parameter to lowercase for case-insensitive comparison
      const lowercaseParams = params.map((parameter) => parameter.toLowerCase());
      return eventData.data.filter((event) => {
        // Check if the product property is an array
        const productArray = Array.isArray(event.product) ? event.product : [event.product];

        // Convert each product value to lowercase for case-insensitive comparison
        const lowercaseProduct = productArray.map((item) => item.toLowerCase().replaceAll(' ', '-'));
        // Check if any of the lowercaseParams is included in lowercaseProduct in JSON response
        return lowercaseParams.some((parameter) => lowercaseProduct.includes(parameter.trim()));
      });
    }
    return [];
  };

  function formattedSolutionTags(inputString) {
    return inputString
      .replace(/exl:solution\//g, '')
      .split(',')
      .map((part) => part.trim());
  }
}
