import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, getConfig, loadFragment } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';

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

    const currentDate = new Date();

    // Filter events within their own show window
    const filteredEvents = events.filter((event) => {
      const eventStartTime = new Date(event.startTime);
      const eventEndTime = new Date(event.endTime);
      return currentDate >= eventStartTime && currentDate <= eventEndTime;
    });

    // Extract unique productFocus items and sort alphabetically
    const products = Array.from(new Set(filteredEvents.flatMap((event) => event.productFocus || []))).sort();

    return products;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data', error);
    return [];
  }
}

export default async function decorate(block) {
  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const [headingElement, descriptionElement, filterLabelElement, linkElement] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  block.innerHTML = '';
  block.classList.add('upcoming-event-block');

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

  block.appendChild(headerDiv);

  const isSignedIn = await isSignedInUser();
  if (UEAuthorMode || (isSignedIn && (await defaultProfileClient.getMergedProfile())?.email?.includes('@adobe.com'))) {
    const fragmentLink = linkElement?.textContent?.trim();
    await loadFragment(block, fragmentLink);
    block.querySelector('.fragment-container')?.classList.remove('section');
  }

  const products = await getListofProducts();
  const productsList = [];
  products.forEach((product) => {
    productsList.push({
      title: product,
    });
  });

  // Initialize the dropdown with product options
  const productDropdown = new Dropdown(
    block.querySelector('.browse-card-dropdown'),
    `${placeholders?.filterProductLabel || 'Product'}`,
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
  let browseCardsContent;
  try {
    browseCardsContent = await BrowseCardsDelegate.fetchCardData(parameters);
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
  } catch (err) {
    buildCardsShimmer.removeShimmer();
    // eslint-disable-next-line no-console
    console.error('Error loading upcoming event cards:', err);
  }

  // Extract filters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilters = urlParams.get('filters')?.split(',') || [];

  const updateFiltersAndCards = (selectedFilters) => {
    // Update URL params
    const url = new URL(window.location);
    if (selectedFilters.length) {
      url.searchParams.set('filters', selectedFilters.join(','));
    } else {
      url.searchParams.delete('filters');
    }
    window.history.pushState({}, '', url.toString());

    // Update tags
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

    // eslint-disable-next-line no-use-before-define
    const updatedData = fetchFilteredCardData(browseCardsContent, selectedFilters);

    contentDiv.innerHTML = ''; // Clear previous cards
    updatedData.forEach((cardData) => {
      const cardDiv = document.createElement('div');
      buildCard(contentDiv, cardDiv, cardData);
      contentDiv.appendChild(cardDiv);
    });
  };

  // Pre-select checkboxes from URL filters
  [...block.querySelectorAll('.browse-card-dropdown .custom-checkbox input')]
    .filter((input) => urlFilters.includes(input.value) && !input.checked)
    .forEach((input) => input.click());

  updateFiltersAndCards(urlFilters);

  // Dropdown selection change handler
  productDropdown.handleOnChange((selectedValues) => {
    const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
      .map((item) => item.trim())
      .filter(Boolean);

    updateFiltersAndCards(selectedFilters);
  });

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
