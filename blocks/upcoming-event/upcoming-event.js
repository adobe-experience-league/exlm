import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, getConfig } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Retrieves a list of unique product focus items from live events data.
 */
async function getListofProducts() {
  try {
    let data;
    const { upcomingEventsUrl } = getConfig();
    const response = await fetch(upcomingEventsUrl, {
      method: 'GET',
    });

    if (response.ok) {
      data = await response.json();
    }

    const events = data?.eventList?.events || [];

    const currentDate = new Date();

    // Filter events within their own show window
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

    // Extract unique productFocus items and sort alphabetically
    const products = Array.from(new Set(filteredEvents.flatMap((event) => event.productFocus || []))).sort();

    return products;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching data', error);
    return [];
  }
}

function setupExpandableDescription(card) {
  const cardContent = card.querySelector('.browse-card-content');
  const description = card.querySelector('.browse-card-description-text');

  if (!description || !cardContent) return;

  if (cardContent.querySelector('.show-more')) return;

  const showMoreBtn = document.createElement('span');
  showMoreBtn.classList.add('show-more');
  showMoreBtn.innerHTML = 'Show more';

  const showLessBtn = document.createElement('span');
  showLessBtn.classList.add('show-less');
  showLessBtn.innerHTML = 'Show Less';

  cardContent.appendChild(showMoreBtn);
  cardContent.appendChild(showLessBtn);

  const computedStyle = window.getComputedStyle(description);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const height = description.offsetHeight;
  const lines = Math.round(height / lineHeight);

  if (lines > 2) {
    description.classList.add('text-expanded');
  } else {
    showMoreBtn.style.display = 'none';
    showLessBtn.style.display = 'none';
  }

  showMoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    card.classList.add('expanded');
  });

  showLessBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    card.classList.remove('expanded');
  });
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const [headingElement, descriptionElement, filterLabelElement] = [...block.children].map(
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
      <div class="view-switcher">
      <button type="button" class="view-btn grid-view active" aria-label="Grid view">
        Grid
        <span class="icon icon-grid"></span>
      </button>
      <button type="button" class="view-btn list-view" aria-label="List view">
        List
        <span class="icon icon-list-view"></span>
      </button>
    </div>
    </div>
  `);

  decorateIcons(headerDiv.querySelector('.view-switcher'));

  const tagsContainer = document.createElement('div');
  tagsContainer.classList.add('browse-card-tags');
  headerDiv.appendChild(tagsContainer);

  block.appendChild(headerDiv);
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
    contentType: CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY,
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

    const gridViewBtn = block.querySelector('.view-btn.grid-view');
    const listViewBtn = block.querySelector('.view-btn.list-view');

    gridViewBtn.addEventListener('click', () => {
      block.classList.remove('list');
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    });

    listViewBtn.addEventListener('click', () => {
      block.classList.add('list');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      const cards = block.querySelectorAll('.browse-card');
      cards.forEach((card) => {
        const cardFigure = card.querySelector('.browse-card-figure');
        const eventInfo = card.querySelector('.browse-card-event-info');
        const footer = card.querySelector('.browse-card-footer');
        setupExpandableDescription(card);

        if (eventInfo && !cardFigure.querySelector('.card-figure-date') && footer) {
          const eventTime = eventInfo.querySelector('.browse-card-event-time h6').textContent.split('|');
          const dateParts = eventTime[0].trim();
          const timeAndZone = eventTime[1].trim();

          const dateDisplay = document.createElement('div');
          dateDisplay.classList.add('card-figure-date');
          dateDisplay.innerHTML = `
            <div class="calendar-icon">
              <span class="icon icon-calendar"></span>
            </div>
            <div class="date-display">
              ${dateParts}
            </div>
             <div class="time-display">
              ${timeAndZone}
            </div>
          `;

          cardFigure.appendChild(dateDisplay);
          decorateIcons(dateDisplay);
          if (!footer.contains(eventInfo)) {
            const clonedEventInfo = eventInfo.cloneNode(true);
            footer.appendChild(clonedEventInfo);
          }
        }
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
