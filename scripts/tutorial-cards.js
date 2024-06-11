import { buildCard } from './browse-card/browse-card.js';
import { loadCSS } from './lib-franklin.js';
import BrowseCardsDelegate from './browse-card/browse-cards-delegate.js';
import BuildPlaceholder from './browse-card/browse-card-placeholder.js';
import { COVEO_SORT_OPTIONS } from './browse-card/browse-cards-constants.js'


loadCSS(`${window.hlx.codeBasePath}/scripts/tutorial-cards.css`);

// Decorate the page with tutorial cards
export default function decorate() {
  // Select the main content section of the page
  const mainDoc = document.querySelector('main > div.content-section-last');

  // Create a new div element to contain the tutorial cards
  const container = document.createElement('div');
  container.classList.add('tutorial-cards');

  const sortBy = 'RELEVANCY';

  // Define the parameters for fetching card data
  const param = {
    contentType:['tutorial'],
    sortCriteria: COVEO_SORT_OPTIONS[sortBy.toUpperCase()],
    noOfResults: 3,
  }

  // Create a placeholder for the cards while they are loading
  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(container); 

  // Fetch the card data
  const tutorialCardsContent = BrowseCardsDelegate.fetchCardData(param);
  tutorialCardsContent
    .then((data) => {
      buildCardsShimmer.remove();

      // If data is present, build and append the cards
      if (data?.length) {
        for (let i = 0; i < Math.min(param.noOfResults, data.length); i += 1) {
          const cardData = data[i];

          // Create an anchor element to append the card
          const cardDiv = document.createElement('div');
          cardDiv.href = '#';
          container.appendChild(cardDiv);
          
          // Build the card and append it to the contentDiv
          buildCard(container, cardDiv, cardData);
        }
        mainDoc.appendChild(container);
      }
    })
    .catch((err) => {
      buildCardsShimmer.remove();
      /* eslint-disable-next-line no-console */
      console.error(err);
    });
}