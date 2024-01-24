import { decorateIcons } from '../../scripts/lib-franklin.js';
import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { CONTENT_TYPES } from '../../scripts/browse-card/browse-cards-constants.js';

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
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div');
  const solutions = block.querySelector('div:nth-child(4) > div').textContent.trim();
  const contentType = CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY;
  const noOfResults = 4;
  const solutionsParam = solutions !== '' ? formattedSolutionTags(solutions) : '';

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
    ${
      headingElement?.textContent?.trim()
        ? `<div class="browse-cards-block-title">
          <h2>
            ${headingElement.textContent.trim()}${
              toolTipElement?.textContent?.trim() ? `<div class="tooltip-placeholder"></div>` : ''
            }
          </h2>
      </div>`
        : ''
    }
      <div class="browse-cards-block-view">${linkTextElement?.innerHTML}</div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);

  const tooltipElem = block.querySelector('.tooltip-placeholder');
  if (tooltipElem) {
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  await decorateIcons(headerDiv);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const parameters = {
    contentType,
  };

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);

  const browseCardsContent = BrowseCardsDelegate.fetchCardData(parameters);
  browseCardsContent
    .then((data) => {
      // eslint-disable-next-line no-use-before-define
      const filteredLiveEventsData = fetchFilteredCardData(data, solutionsParam);
      buildCardsShimmer.remove();
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
        decorateIcons(contentDiv);
      }
    })
    .catch((err) => {
      buildCardsShimmer.remove();
      // eslint-disable-next-line no-console
      console.error('Events Cards:', err);
    });

  /**
   * convertTimeString convert the "time" string from events JSON to a comparable format
   * @param {string} timeString - The "time" key in events json data.
   * @returns The converted time compatible for comparsion between two "time" values.
   */
  const convertTimeString = (timeString) => {
    const [, month, day, time] = timeString.match(/([A-Z]{3}) (\d{1,2}) \| (.+?) ([A-Z]{2})/);
    const monthMap = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };

    const currentMonth = new Date().getMonth();
    const currentDay = new Date().getDate();
    const currentYear = new Date().getFullYear();

    // Calculate the event date
    const eventDate = new Date(currentYear, monthMap[month], parseInt(day, 10), ...time.split(':').map(Number));

    // Check if the event month is in the past, if so, add 1 to the year
    if (
      (currentYear === eventDate.getFullYear() && currentMonth > monthMap[month]) ||
      (currentYear === eventDate.getFullYear() && currentMonth === monthMap[month] && currentDay > parseInt(day, 10))
    ) {
      eventDate.setFullYear(currentYear + 1);
    }
    return eventDate.getTime();
  };

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
          .sort((card1, card2) => convertTimeString(card1.event.time) - convertTimeString(card2.event.time));
      }
      const solutionParam = solutionsList.map((parameter) => atob(parameter));
      const filteredData = eventData.data.filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        const productKey = productArray.map((item) => item);
        return solutionParam.some((parameter) => productKey.includes(parameter.trim()));
      });

      // Sort events by startTime in ascending order
      return filteredData
        .filter((card) => card.event.time)
        .sort((card1, card2) => convertTimeString(card1.event.time) - convertTimeString(card2.event.time));
    }
    // In case of invalid solution param, return empty results.
    return [];
  };
}
