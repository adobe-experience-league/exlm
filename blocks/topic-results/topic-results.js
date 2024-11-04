import createHeading from './heading/heading.js';
import decorateTabs from './tabs/tabs.js';
import { populateFilteredResults } from './filtered-results/filtered-results.js';
import ExlClient from './exl-client.js';

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const client = new ExlClient();
  const combinedData = await client.getCombinedTopicsAndFeatures();
  const firstTopic = Object.values(combinedData)[488]; // Assuming you want to use the first topic for the heading

  block.appendChild(
    createHeading({
      title: 'TOPIC',
      heading: firstTopic.Name,
      viewMoreResultsLabel: 'View more results in search',
      viewMoreResultsUrl: 'https://experienceleague-dev.adobe.com/search.html#sort=relevancy',
    }),
  );

  // Initialize tabs and append them to the block
  decorateTabs(block, async (contentType) => {
    populateFilteredResults(block, contentType);
  });
}
