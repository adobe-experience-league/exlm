import createHeading from './heading/heading.js';
import decorateTabs from './tabs/tabs.js';
import { populateFilteredResults } from './filtered-results.js';


/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  // Create heading and append it to the block
  block.appendChild(
    createHeading({
      title: 'TOPIC',
      heading: 'Artificial Intelligence',
      resultCount: 10,
      resultTotal: 50,
      viewMoreResultsLabel: 'View more results in search',
      viewMoreResultsUrl: '#',
    }),
  );

  // Initialize tabs and append them to the block
  decorateTabs(block, (contentType) => {
    populateFilteredResults(block, contentType);
  });

}
