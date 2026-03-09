import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import {
  fetchLanguagePlaceholders,
  htmlToElement,
  getConfig,
  xssSanitizeQueryParamValue,
} from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Retrieves a list of unique product focus items from live events data.
 */
function getListofProducts() {
  const { upcomingEventsUrl } = getConfig();
  return fetch(upcomingEventsUrl, { method: 'GET' })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const events = data?.eventList?.events || [];
      const currentDate = new Date();

      const filteredEvents = events.filter((event) => {
        if (!event.startTime || !event.endTime || !event.time) {
          // eslint-disable-next-line no-console
          console.error(`Event ${event.eventTitle} has invalid format. Missing startTime, endTime or time attribute.`);
          return false;
        }
        const eventStartTime = new Date(event.startTime);
        const eventEndTime = new Date(event.endTime);
        return currentDate >= eventStartTime && currentDate <= eventEndTime;
      });

      return Array.from(new Set(filteredEvents.flatMap((event) => event.productFocus || []))).sort();
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error fetching data', error);
      return [];
    });
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

  if (solutionsList.length === 0) {
    return data.filter((card) => card.event?.time).sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
  }

  return data
    .filter((event) => {
      const productArray = Array.isArray(event.product) ? event.product : [event.product];
      return solutionsList.some((filter) => productArray.includes(filter));
    })
    .filter((card) => card.event?.time)
    .sort((a, b) => new Date(a.event.time) - new Date(b.event.time));
}

export default function decorate(block) {
  const [headingElement, descriptionElement, filterLabelElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  block.innerHTML = '';
  block.classList.add('upcoming-event-block');
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
        <div class="browse-cards-block-title">
          ${headingElement?.innerHTML || ''}
        </div>
        <div class="browse-card-description-text">
          ${descriptionElement?.innerHTML || ''}
        </div>
      <form class="browse-card-dropdown">
      <label>${filterLabelElement?.innerHTML}</label>
      </form>
    </div>
  `);

  const tagsContainer = document.createElement('div');
  tagsContainer.classList.add('browse-card-tags');
  headerDiv.appendChild(tagsContainer);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  block.appendChild(headerDiv);

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);

  // State
  let browseCardsContent = [];
  let placeholders = {};
  let productDropdown = null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlFilters = urlParams.get('filters')
    ? urlParams.get('filters').split(',').map(xssSanitizeQueryParamValue)
    : [];

  const updateFiltersAndCards = async (selectedFilters) => {
    const url = new URL(window.location);
    if (selectedFilters.length) {
      url.searchParams.set('filters', selectedFilters.join(','));
    } else {
      url.searchParams.delete('filters');
    }
    window.history.pushState({}, '', url.toString());

    tagsContainer.innerHTML = '';
    selectedFilters.forEach((filter) => {
      const tagElement = htmlToElement(`
        <button class="browse-tags" value="${filter}">
          <span>${placeholders?.filterProductLabel || 'Product'}: ${filter}</span>
          <span class="icon icon-close"></span>
        </button>
      `);
      tagsContainer.appendChild(tagElement);
      decorateIcons(tagElement);
      tagElement.addEventListener('click', () => {
        tagElement.remove();
        [...block.querySelectorAll('.browse-card-dropdown .custom-checkbox input')].forEach((checkbox) => {
          if (checkbox.value === filter) checkbox.click();
        });
      });
    });

    const updatedData = fetchFilteredCardData(browseCardsContent, selectedFilters);

    contentDiv.innerHTML = ''; // Clear previous cards
    const existingError = block.querySelector('.event-no-results');
    if (existingError) existingError.remove(); // Prevent duplicate error message

    // Show error message if selected product has no events
    if (updatedData.length === 0) {
      const noResultsText =
        placeholders.noResultsTextBrowse ||
        'We are sorry, no results found matching the criteria. Try adjusting your search to view more content.';
      const errorMsg = htmlToElement(`
    <div class="event-no-results">${noResultsText}</div>
  `);

      contentDiv.style.display = 'none';
      block.appendChild(errorMsg);
      return;
    }

    contentDiv.style.display = '';
    await Promise.all(
      updatedData.map(async (cardData) => {
        const cardDiv = document.createElement('div');
        await buildCard(cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      }),
    );
  };

  // Non-blocking data fetch
  Promise.all([
    fetchLanguagePlaceholders().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
      return {};
    }),
    getListofProducts(),
    BrowseCardsDelegate.fetchCardData({ contentType: CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error loading upcoming event cards:', err);
      return [];
    }),
  ]).then(async ([fetchedPlaceholders, products, cardsData]) => {
    placeholders = fetchedPlaceholders;
    browseCardsContent = cardsData;

    buildCardsShimmer.removeShimmer();

    // Initialize dropdown
    const productsList = products.map((product) => ({ title: product }));
    productDropdown = new Dropdown(
      block.querySelector('.browse-card-dropdown'),
      `${placeholders?.filterProductLabel || 'Product'}`,
      productsList,
      'multi-select',
    );

    // Render initial cards
    const filteredData = fetchFilteredCardData(browseCardsContent, []);
    if (filteredData?.length) {
      await Promise.all(
        filteredData.map(async (cardData) => {
          const cardDiv = document.createElement('div');
          await buildCard(cardDiv, cardData);
          contentDiv.appendChild(cardDiv);
        }),
      );
      block.appendChild(contentDiv);
    }

    // Pre-select checkboxes from URL filters
    [...block.querySelectorAll('.browse-card-dropdown .custom-checkbox input')]
      .filter((input) => urlFilters.includes(input.value) && !input.checked)
      .forEach((input) => input.click());

    if (urlFilters.length) {
      await updateFiltersAndCards(urlFilters);
    }

    // Dropdown change handler
    productDropdown.handleOnChange(async (selectedValues) => {
      const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
        .map((item) => item.trim())
        .filter(Boolean);
      await updateFiltersAndCards(selectedFilters);
    });
  });
}
