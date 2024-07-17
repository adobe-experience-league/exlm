import createHeading from './heading/heading.js';
import decorateTabs from './tabs/tabs.js';
import { populateFilteredResults } from './filtered-results.js';
import { initPagination } from './pagination/pagination.js';

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  // Create heading and append it to the block
  block.appendChild(
    createHeading({
      title: 'Topics',
      heading: 'Artificial Intelligence',
      resultCount: 10,
      resultTotal: 100,
      viewMoreResultsLabel: 'View all results',
      viewMoreResultsUrl: '#',
    }),
  );

  // Initialize tabs and append them to the block
  decorateTabs(block, (contentType) => {
    populateFilteredResults(block, contentType);
  });

  // Initialize pagination
  // assuming that we have 100 items in total and want to display 10 items max per page
  initPagination(100, 10, (_currentPage) => {
    // placeholder for logic to fetch and display the items for the current page
    // use _currentPage minimally to avoid linter error
    if (_currentPage >= 0) {
      // placeholder for logic to fetch and display the items for the current page
    }
  });
}
