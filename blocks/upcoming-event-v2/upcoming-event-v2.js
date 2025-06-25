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

function toggleClassState(element, className) {
  if (!element || !className) return;
  element.classList.toggle(className);
}

function setActiveToggle(activeEl, inactiveEl, className) {
  if (!activeEl || !inactiveEl) return;
  activeEl.classList.add(className);
  inactiveEl.classList.remove(className);
}

function setupExpandableDescription(card, placeholders) {
  const cardContent = card.querySelector('.browse-card-content');
  const description = card.querySelector('.browse-card-description-text');

  if (!description || !cardContent) return;

  if (cardContent.querySelector('.show-more')) return;

  const showMoreBtn = document.createElement('span');
  showMoreBtn.classList.add('show-more');
  showMoreBtn.innerHTML = placeholders?.showMore || 'Show more';

  const showLessBtn = document.createElement('span');
  showLessBtn.classList.add('show-less');
  showLessBtn.innerHTML = placeholders?.showLess || 'Show Less';

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
    toggleClassState(card, 'expanded');
  });

  showLessBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleClassState(card, 'expanded');
  });
}

function addCardDateInfo(card) {
  const cardFigure = card.querySelector('.browse-card-figure');
  const eventInfo = card.querySelector('.browse-card-event-info');
  const footer = card.querySelector('.browse-card-footer');

  if (!eventInfo || !footer || cardFigure.querySelector('.card-figure-date')) return;

  const eventTimeText = eventInfo.querySelector('.browse-card-event-time h6')?.textContent;
  if (!eventTimeText || !eventTimeText.includes('|')) return;

  const [rawDate, rawTime] = eventTimeText.split('|');
  const dateParts = rawDate.trim();
  const timeAndZone = rawTime.trim();

  const dateDisplay = htmlToElement(`
    <div class="card-figure-date">
    <div class="calendar-icon">
      <span class="icon icon-calendar-white"></span>
    </div>
    <div class="date-display">
      ${dateParts}
    </div>
    <div class="time-display">
      ${timeAndZone}
    </div>
  `);

  cardFigure.appendChild(dateDisplay);
  decorateIcons(dateDisplay);

  if (!footer.contains(eventInfo)) {
    const clonedEventInfo = eventInfo.cloneNode(true);
    footer.appendChild(clonedEventInfo);
  }
}

function reDecorateListView(block, cardDivContainer, placeholders) {
  const card = cardDivContainer.querySelector('.browse-card');
  if (card && block.classList.contains('list')) {
    addCardDateInfo(card);
    setupExpandableDescription(card, placeholders);
  }
}

function buildUpdatedCards(block, contentDivContainer, data, placeholders) {
  data.forEach((cardData) => {
    const cardDiv = document.createElement('div');
    buildCard(contentDivContainer, cardDiv, cardData).then(() => {
      reDecorateListView(block, cardDiv, placeholders);
    });
    contentDivContainer.appendChild(cardDiv);
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
      <div class="browse-upcoming-event-filter">
      <form class="browse-card-dropdown">
      <label>${filterLabelElement?.innerHTML}</label>
      </form>
      <div class="view-switcher">
      <button type="button" class="view-btn grid-view active" aria-label="Grid view">
        ${placeholders?.gridViewLabel || 'Grid'}
        <span class="icon icon-grid-white"></span>
        <span class="icon icon-grid-black"></span>
      </button>
      <button type="button" class="view-btn list-view" aria-label="List view">
        ${placeholders?.listViewLabel || 'List'}
        <span class="icon icon-list-view-black"></span>
        <span class="icon icon-list-view-white"></span>
      </button>
      </div>
      </div>
      <div class="browse-sort-container"></div>
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
      setActiveToggle(gridViewBtn, listViewBtn, 'active');
    });

    listViewBtn.addEventListener('click', () => {
      block.classList.add('list');
      setActiveToggle(listViewBtn, gridViewBtn, 'active');

      const cards = block.querySelectorAll('.browse-card');
      cards.forEach((card) => {
        addCardDateInfo(card);
        setupExpandableDescription(card, placeholders);
      });
    });

    // eslint-disable-next-line no-use-before-define
    const updatedData = fetchFilteredCardData(browseCardsContent, selectedFilters);

    contentDiv.innerHTML = '';

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
    buildUpdatedCards(block, contentDiv, updatedData, placeholders);
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
  function fetchFilteredCardData(data, params = [], sortOrder = 'descending') {
    if (!data) return [];
    const solutionsList = Array.isArray(params) ? params : [params];

    // If no filters are selected, return all data sorted by event time
    const filtered = solutionsList.length
      ? data.filter((event) => {
          const productArray = Array.isArray(event.product) ? event.product : [event.product];
          return solutionsList.some((filter) => productArray.includes(filter));
        })
      : data;

    return filtered
      .filter((card) => card.event?.time)
      .sort((a, b) => {
        const dateA = new Date(a.event.time);
        const dateB = new Date(b.event.time);
        return sortOrder === 'descending' ? dateB - dateA : dateA - dateB;
      });
  }

  function renderSortContainerForUpcomingEvents(data) {
    const wrapper = block.querySelector('.browse-sort-container');
    if (!wrapper) return;

    const sortContainer = htmlToElement(`
      <div class="sort-container">
      <span>${placeholders?.filterSortLabel || 'Sort by'}:</span>
    <button class="sort-drop-btn">${placeholders?.filterSortNewestLabel || 'Newest'}</button>
    <div class="sort-dropdown-content">
      <a href="/" data-sort-criteria="descending" data-sort-caption="${
        placeholders?.filterSortNewestLabel || 'Newest'
      }">${placeholders?.filterSortNewestLabel || 'Newest'}</a>
      <a href="/" data-sort-criteria="ascending" data-sort-caption="${
        placeholders?.filterSortOldestLabel || 'Oldest'
      }">${placeholders?.filterSortOldestLabel || 'Oldest'}</a>
    </div>
    </div>
  `);
    wrapper.appendChild(sortContainer);

    const dropDownBtn = sortContainer.querySelector('.sort-drop-btn');
    const sortDropdown = sortContainer.querySelector('.sort-dropdown-content');
    const sortLinks = sortDropdown.querySelectorAll('a');

    sortLinks[0].classList.add('selected');

    dropDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropDownBtn.classList.toggle('active');
      sortDropdown.classList.toggle('show');

      setTimeout(() => {
        document.addEventListener(
          'click',
          (event) => {
            if (!sortDropdown.contains(event.target) && event.target !== dropDownBtn) {
              sortDropdown.classList.remove('show');
              dropDownBtn.classList.remove('active');
            }
          },
          { once: true },
        );
      });
    });

    sortLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const sortCriteria = link.getAttribute('data-sort-criteria');
        const sortCaption = link.getAttribute('data-sort-caption');

        dropDownBtn.textContent = sortCaption;
        sortDropdown.classList.remove('show');
        dropDownBtn.classList.remove('active');

        sortLinks.forEach((a) => a.classList.remove('selected'));
        link.classList.add('selected');

        const selectedFilters = [...block.querySelectorAll('.browse-tags')].map((tag) => tag.getAttribute('value'));

        const sortedData = fetchFilteredCardData(data, selectedFilters, sortCriteria);
        contentDiv.innerHTML = '';
        buildUpdatedCards(block, contentDiv, sortedData, placeholders);
      });
    });
  }

  renderSortContainerForUpcomingEvents(browseCardsContent);
}
