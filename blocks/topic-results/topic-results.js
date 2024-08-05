import createHeading from './heading/heading.js';
import decorateTabs from './tabs/tabs.js';
import { populateFilteredResults } from './filtered-results/filtered-results.js';

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  // Create heading and append it to the block
  block.appendChild(
    createHeading({
      title: 'TOPIC',
      heading: 'Artificial Intelligence',
      viewMoreResultsLabel: 'View more results in search',
      viewMoreResultsUrl: 'https://experienceleague-dev.adobe.com/search.html#sort=relevancy',
    }),
  );

  // Initialize tabs and append them to the block
  decorateTabs(block, (contentType) => {
    populateFilteredResults(block, contentType);
  });
}