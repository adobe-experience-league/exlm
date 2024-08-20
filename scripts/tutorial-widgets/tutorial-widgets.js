import { buildCard } from '../browse-card/browse-card.js';
import { loadCSS } from '../lib-franklin.js';
import BrowseCardsDelegate from '../browse-card/browse-cards-delegate.js';
import BuildPlaceholder from '../browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from '../browse-card/browse-cards-constants.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/tutorial-widgets/tutorial-widgets.css`);

// Decorate the page with tutorial widgets
export default function decorate() {
  // Select the main content section of the page
  const mainDoc = document.querySelector('main div.content-section-last');

  // Create a new div element to contain the tutorial widgets and the header
  const wrapper = document.createElement('div');
  wrapper.classList.add('tutorial-widgets-wrapper');

  // Create a header for the tutorial widgets
  const header = document.createElement('h2');
  header.textContent = 'Watch related tutorials';
  header.classList.add('tutorial-header');
  wrapper.appendChild(header);

  // Create a new div element to contain the tutorial widgets
  const container = document.createElement('div');
  container.classList.add('tutorial-widgets');
  wrapper.appendChild(container);

  const sortBy = 'RELEVANCY';

  // Define the parameters for fetching card data
  const param = {
    contentType: ['tutorial'],
    sortCriteria: COVEO_SORT_OPTIONS[sortBy.toUpperCase()],
    noOfResults: 3,
  };

  // Create a placeholder for the widgets while they are loading
  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(container);

  // Fetch the card/widget data
  const tutorialWidgetsContent = BrowseCardsDelegate.fetchCardData(param);
  tutorialWidgetsContent
    .then((data) => {
      buildCardsShimmer.remove();

      // If data is present, build and append the widgets
      if (data?.length) {
        for (let i = 0; i < Math.min(param.noOfResults, data.length); i += 1) {
          const widgetData = data[i];

          // Create an anchor element to append the widget
          const widgetDiv = document.createElement('div');
          widgetDiv.href = '#';
          container.appendChild(widgetDiv);

          // Build the widget and append it to the contentDiv
          buildCard(container, widgetDiv, widgetData);
        }
        mainDoc.appendChild(wrapper);
      }
    })
    .catch((err) => {
      buildCardsShimmer.remove();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}
