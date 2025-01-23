import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { htmlToElement, getConfig } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';

/**
 * Retrieves a list of unique product focus items from live events data.
 */
async function getListofProducts() {
  try {
    let data;
    const { liveEventsUrl } = getConfig();
    const response = await fetch(liveEventsUrl, {
      method: 'GET',
    });

    if (response.ok) {
      data = await response.json();
    }

    const events = data?.eventList?.events || [];

    // Extract unique productFocus items and sort alphabetically
    const products = Array.from(new Set(events.flatMap((event) => event.productFocus || []))).sort();

    return products;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data', error);
    return [];
  }
}

export default async function decorate(block) {
  const [headingElement, descriptionElement, filterLabelElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  block.innerHTML = '';
  block.classList.add('upcoming-events-block');

  const headerDiv = htmlToElement(`
    <div class="upcoming-events-block-header">
      <div class="upcoming-events-block-heading">
        <div class="upcoming-events-block-title">
          ${headingElement?.innerHTML || ''}
        </div>
        <div class="upcoming-events-block-description">
          ${descriptionElement?.innerHTML || ''}
        </div>
      </div>
      <div class="upcoming-events-block-filter">
      <form class="upcoming-events-products-dropdown"></form>
      </div>
    </div>
  `);

  block.appendChild(headerDiv);

  const products = await getListofProducts();
  const productsList = [];
  products.forEach((product) => {
    productsList.push({
      title: product,
      name: product,
    });
  });

  // Initialize the dropdown with product options
  const productDropdown = new Dropdown(
    block.querySelector('.upcoming-events-products-dropdown'),
    `${filterLabelElement?.innerHTML}`,
    productsList,
    'multi-select',
  );

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  const parameters = {
    contentType: CONTENT_TYPES.LIVE_EVENT.MAPPING_KEY,
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  try {
    const browseCardsContent = await BrowseCardsDelegate.fetchCardData(parameters);
    // eslint-disable-next-line no-use-before-define
    const filteredLiveEventsData = fetchFilteredCardData(browseCardsContent, []);

    buildCardsShimmer.removeShimmer();

    if (filteredLiveEventsData?.length) {
      filteredLiveEventsData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
      block.appendChild(contentDiv);
    }

    productDropdown.handleOnChange((selectedValues) => {
      const selectedFilters = Array.isArray(selectedValues)
        ? selectedValues
        : selectedValues.split(',').map((item) => item.trim());
      // eslint-disable-next-line no-use-before-define
      const updatedData = fetchFilteredCardData(browseCardsContent, selectedFilters);

      contentDiv.innerHTML = ''; // Clear previous cards
      updatedData.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
    });
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error loading upcoming event cards:', err);
  }

  /**
   * Fetches filtered card data based on selected parameters.
   * @param {Array} data - List of card data objects.
   * @param {Array} params - Selected filter parameters.
   * @returns {Array} - Filtered and sorted card data.
   */
  function fetchFilteredCardData(data, params) {
    if (!data) return [];
    const solutionsList = Array.isArray(params) ? params : [params];

    // If no filters are selected, return all data sorted by event time
    if (solutionsList.length === 0) {
      return data.filter((card) => card.event?.time).sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
    }

    // Filter events that match any of the selected filters
    return data
      .filter((event) => {
        const productArray = Array.isArray(event.product) ? event.product : [event.product];
        return solutionsList.some((filter) => productArray.includes(filter));
      })
      .filter((card) => card.event?.time) // Ensure valid event time
      .sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
  }
}
