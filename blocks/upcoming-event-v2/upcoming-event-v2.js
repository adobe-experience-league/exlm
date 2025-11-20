import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import Dropdown from '../../scripts/dropdown/dropdown.js';
import Pagination from '../../scripts/pagination/pagination.js';
import {
  fetchLanguagePlaceholders,
  htmlToElement,
  createTag,
  xssSanitizeQueryParamValue,
} from '../../scripts/scripts.js';
import { buildCard, processUpcomingEventsData } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';

const contentTypeDropdownOptions = [
  { value: CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY, title: CONTENT_TYPES.UPCOMING_EVENT.LABEL },
  { value: CONTENT_TYPES.EVENT.MAPPING_KEY, title: CONTENT_TYPES.EVENT.LABEL },
];

const SORT_KEY_MAP = {
  descending: COVEO_SORT_OPTIONS.MOST_RECENT,
  ascending: COVEO_SORT_OPTIONS.OLDEST,
};

const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

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

// Function to add location type with icon in list view
function addLocationTypeWithIcon(card) {
  const footer = card.querySelector('.browse-card-footer');
  const locationType = card.querySelector('.location-type');

  if (!footer || !locationType || footer.querySelector('.location-type')) return;

  const locationTypeClone = locationType.cloneNode(true);
  const locationText = locationTypeClone.textContent.trim();
  const iconName = locationText.toUpperCase() !== 'VIRTUAL' ? 'user' : 'desktop';

  locationTypeClone.innerHTML = '';
  const iconSpan = document.createElement('span');
  iconSpan.className = `icon icon-${iconName}`;
  iconSpan.style.marginRight = '5px';

  locationTypeClone.appendChild(iconSpan);

  // Wrap the text in a span element
  const textSpan = document.createElement('span');
  textSpan.textContent = locationText;
  locationTypeClone.appendChild(textSpan);

  footer.appendChild(locationTypeClone);
  decorateIcons(locationTypeClone);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const [, , filterLabelElement] = [...block.children].map((row) => row.firstElementChild);

  const urlParams = new URLSearchParams(window.location.search);
  const productsFromUrl = urlParams.get('products')
    ? urlParams.get('products').split(',').map(xssSanitizeQueryParamValue)
    : [];
  const contentTypesFromUrl = urlParams.get('contentTypes')
    ? urlParams
        .get('contentTypes')
        .split(',')
        .map(xssSanitizeQueryParamValue)
        ?.map(
          (key) =>
            Object.values(CONTENT_TYPES).find(
              (contentTypeConfig) => xssSanitizeQueryParamValue(contentTypeConfig.MAPPING_KEY) === key,
            )?.MAPPING_KEY || key,
        )
    : [];
  const sortFromUrl = urlParams.get('sort') ? SORT_KEY_MAP[urlParams.get('sort')] : undefined;
  const eventSeriesFromUrl = urlParams.get('eventSeries')
    ? urlParams.get('eventSeries').split(',').map(xssSanitizeQueryParamValue)
    : [];
  const firstResultFromUrl = urlParams.get('firstResult');

  const mobileVIew = isMobile();

  const filterConfig = {
    numberOfResults: mobileVIew ? 6 : 12,
    contentTypes: contentTypesFromUrl,
    products: productsFromUrl,
    sort: sortFromUrl,
    eventSeries: eventSeriesFromUrl,
    firstResult: firstResultFromUrl && !Number.isNaN(Number(firstResultFromUrl)) ? +firstResultFromUrl : 0,
  };

  const buildCardsShimmer = new BrowseCardShimmer(filterConfig.numberOfResults);

  // Clear the block content
  block.innerHTML = '';
  block.classList.add('upcoming-event-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
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
    </div>
  `);

  const tagsContainer = createTag('div', { class: 'browse-card-tags' });
  headerDiv.appendChild(tagsContainer);

  decorateIcons(headerDiv.querySelector('.view-switcher'));
  block.appendChild(headerDiv);

  // Create content div for cards
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  block.appendChild(contentDiv);

  const pgNum = Math.floor(filterConfig.firstResult / filterConfig.numberOfResults);
  const renderItems = ({ pgNum: targetPgNum }) => {
    const firstResult = targetPgNum * filterConfig.numberOfResults;
    filterConfig.firstResult = firstResult;
    // eslint-disable-next-line no-use-before-define
    fetchAndRenderCards({ firstResult });
  };

  const pagination = new Pagination({
    wrapper: block,
    identifier: 'upcoming-event-v2',
    renderItems,
    pgNumber: pgNum,
    totalPages: 1,
  });

  function resetPaginationStatus() {
    filterConfig.firstResult = 0;
    pagination.setCurrentPaginationStatus({ currentPageNumber: 0 });
    pagination.updatePageNumberStyles();
  }

  function updateUrlParams() {
    const url = new URL(window.location);
    const { products, contentTypes, sort, eventSeries, firstResult } = filterConfig;
    if (products.length > 0) {
      url.searchParams.set('products', products.join(','));
    } else {
      url.searchParams.delete('products');
    }
    if (contentTypes.length > 0) {
      url.searchParams.set('contentTypes', contentTypes.map(xssSanitizeQueryParamValue).join(','));
    } else {
      url.searchParams.delete('contentTypes');
    }
    if (eventSeries.length > 0) {
      url.searchParams.set('eventSeries', eventSeries.join(','));
    } else {
      url.searchParams.delete('eventSeries');
    }
    if (firstResult > 0) {
      url.searchParams.set('firstResult', firstResult);
    } else {
      url.searchParams.delete('firstResult');
    }
    const sortKey = sort ? Object.keys(SORT_KEY_MAP).find((key) => SORT_KEY_MAP[key] === sort) : null;
    if (sort) {
      url.searchParams.set('sort', sortKey);
    } else {
      url.searchParams.delete('sort');
    }
    window.history.pushState({}, '', url.toString());
  }

  async function fetchCardsData({
    products = [],
    contentTypes = [],
    sort,
    eventSeries,
    firstResult,
    numberOfResults = filterConfig.numberOfResults,
  }) {
    const param = {
      contentType: contentTypes.length > 0 ? contentTypes : [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY],
      ...(products.length > 0 && { product: products }),
      noOfResults: numberOfResults,
      sortCriteria: sort,
      eventSeries,
      firstResult,
    };
    updateUrlParams();
    const data = await BrowseCardsDelegate.fetchCardData(param);
    const cards = processUpcomingEventsData(data);
    const total = BrowseCardsDelegate.getTotalResultsCount(param);
    const totalPages = Math.ceil(total / filterConfig.numberOfResults) || 1;
    return { cards, totalCount: total, totalPages };
  }

  function renderTags(tags = [], filterType = '') {
    tags.forEach(({ value: filter, title }) => {
      const tagElement = htmlToElement(`
        <button class="browse-tags" value="${filter}">
          <span>${filterType}: ${title}</span>
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
  }

  function updateTags() {
    tagsContainer.innerHTML = '';
    const { products, contentTypes, eventSeries } = filterConfig;
    const productTags = products.map((p) => ({ title: p, value: p }));
    const contentTags = contentTypes.map((c) => {
      const title = contentTypeDropdownOptions.find(({ value }) => c === value)?.title;
      return { title: title || c, value: c };
    });
    const eventTags = eventSeries.map((e) => ({ title: e, value: e }));
    renderTags(productTags, placeholders?.filterProductLabel || 'Product');
    renderTags(contentTags, placeholders?.filterEventTypeLabel || 'Event type');
    renderTags(eventTags, placeholders?.filterEventSeriesLabel || 'Event series');
  }

  function handleGridViewButtons() {
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
        addLocationTypeWithIcon(card); // Add desktop icon for location type
      });
    });
  }

  async function fetchAndRenderCards({
    products = filterConfig.products,
    contentTypes = filterConfig.contentTypes,
    numberOfResults,
    sort = filterConfig.sort,
    eventSeries = filterConfig.eventSeries,
    firstResult = filterConfig.firstResult,
  }) {
    buildCardsShimmer.addShimmer(block);
    contentDiv.innerHTML = '';
    const existingError = block.querySelector('.event-no-results');
    if (existingError) existingError.remove(); // Prevent duplicate error message
    const { cards: cardModels, totalPages } = await fetchCardsData({
      products,
      contentTypes,
      numberOfResults,
      sort,
      eventSeries,
      firstResult,
    });
    updateTags();
    if (cardModels?.length > 0) {
      contentDiv.style.display = '';
      cardModels.forEach((cardData) => {
        const cardDiv = document.createElement('div');
        buildCard(contentDiv, cardDiv, cardData);
        contentDiv.appendChild(cardDiv);
      });
      block.appendChild(contentDiv);
      handleGridViewButtons();
    } else {
      const noResultsText =
        placeholders.noResultsTextBrowse ||
        'We are sorry, no results found matching the criteria. Try adjusting your search to view more content.';
      const errorMsg = htmlToElement(`
        <div class="event-no-results">${noResultsText}</div>
      `);
      contentDiv.style.display = 'none';
      block.appendChild(errorMsg);
    }
    pagination.setCurrentPaginationStatus({ totalPageNumbers: totalPages });
    pagination.updatePageNumberStyles();
    buildCardsShimmer.removeShimmer();
    return { cards: cardModels, totalPages };
  }

  Promise.all([fetchAndRenderCards(filterConfig), BrowseCardsDelegate.fetchCoveoFacetFields('el_event_series')])
    .then(([, eventSeriesList]) => {
      const eventSeriesDropdown = new Dropdown(
        block.querySelector('.browse-card-dropdown'),
        `${placeholders?.filterEventSeriesLabel || 'Event series'}`,
        eventSeriesList.map((value) => ({
          title: value,
          value,
        })),
        'multi-select',
      );

      eventSeriesDropdown.handleOnChange((selectedValues) => {
        const selectedFilters = (Array.isArray(selectedValues) ? selectedValues : selectedValues.split(','))
          .map((item) => item.trim())
          .filter(Boolean);
        filterConfig.eventSeries = selectedFilters;
        resetPaginationStatus();
        fetchAndRenderCards({
          eventSeries: selectedFilters,
        });
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('failed to fetch and render upcoming events card data:', err);
    });
}
