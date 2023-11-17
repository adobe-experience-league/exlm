import { decorateIcons } from '../../scripts/lib-franklin.js';
import CardsAbstraction from "../../scripts/cards/cardsAbstraction.js";
import API_COVEO from "../../scripts/constants.js";

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const toolTipElement = block.querySelector('div:nth-child(2) > div');
  const linkTextElement = block.querySelector('div:nth-child(3) > div > a');

  // Creating header div
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('curated-cards-header');

  // Creating title div
  const titleDiv = document.createElement('div');
  titleDiv.classList.add('curated-cards-title');

  // Creating and setting the title element
  const title = document.createElement('h4');
  title.textContent = headingElement?.textContent.trim();
  titleDiv.appendChild(title);

  // Creating tooltip div
  const tooltipDiv = document.createElement('div');
  tooltipDiv.classList.add('tooltip');

  // Creating tooltip icon
  const tooltipIcon = document.createElement('span');
  tooltipIcon.classList.add('icon');
  tooltipIcon.classList.add('icon-info');
  tooltipDiv.appendChild(tooltipIcon);

  // Creating span element for the tooltip text
  const tooltipSpan = document.createElement('span');
  tooltipSpan.classList.add('tooltip-text');
  tooltipSpan.textContent = toolTipElement?.textContent.trim();
  tooltipDiv.appendChild(tooltipSpan);

  // Appending tooltip div to title div
  titleDiv.appendChild(tooltipDiv);

  // Creating view div
  const viewDiv = document.createElement('div');
  viewDiv.classList.add('curated-cards-view');
  viewDiv.appendChild(linkTextElement);

  // Appending title and view divs to header div
  headerDiv.appendChild(titleDiv);
  headerDiv.appendChild(viewDiv);

  // Creating content div
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('curated-cards-content');

  // Clearing the block's content
  block.innerHTML = '';

  // Appending header and content divs to the block
  block.appendChild(headerDiv);
  block.appendChild(contentDiv);

  decorateIcons(block);

  // Defining data sources for CardsAbstraction
  const dataSources = [{
    name: API_COVEO.NAME,
    url: API_COVEO.URL,
    param: {
      contentType: "course",
      sort: "relevancy",
    },
  }];

  // Creating CardsAbstraction instance
  const curatedCards = new CardsAbstraction(dataSources);

  // Getting card data asynchronously
  const data = await curatedCards.getCardData();
  console.log(data);
}
