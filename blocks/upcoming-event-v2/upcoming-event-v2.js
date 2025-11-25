import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement, createTag } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { COVEO_SORT_OPTIONS } from '../../scripts/browse-card/browse-cards-constants.js';

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

  if (!eventInfo || !footer || cardFigure?.querySelector('.card-figure-date')) return;

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
function addLocationTypeInfo(card) {
  const footer = card.querySelector('.browse-card-footer');
  const locationType = card.querySelector('.location-type');

  if (!footer || !locationType || footer.querySelector('.location-type')) return;

  const locationTypeClone = locationType.cloneNode(true);
  const locationText = locationTypeClone.textContent.trim();
  const iconName = locationText.toUpperCase() !== 'VIRTUAL' ? 'user' : 'desktop';

  locationTypeClone.innerHTML = '';
  const iconSpan = createTag('span', { class: `icon icon-${iconName}` });
  locationTypeClone.appendChild(iconSpan);

  const textSpan = createTag('span', {}, locationText);
  locationTypeClone.appendChild(textSpan);

  footer.appendChild(locationTypeClone);
  decorateIcons(locationTypeClone);
}

function addSpeakersToFooter(card, placeholders) {
  const cardFigure = card.querySelector('.browse-card-figure');
  const footer = card.querySelector('.browse-card-footer');

  if (!cardFigure || !footer) return;

  const speakersContainer = cardFigure.querySelector('.event-speakers-container');
  if (!speakersContainer) return;

  if (footer.querySelector('.footer-speakers-section')) return;

  const speakersSection = createTag('div', { class: 'footer-speakers-section' });
  const speakersHeading = createTag('p', { class: 'speakers-heading' }, placeholders?.speakersLabel || 'Speakers');
  speakersSection.appendChild(speakersHeading);

  const speakerImages = speakersContainer.querySelectorAll('.speaker-profile-container');
  const speakersList = createTag('div', { class: 'speakers-list' });

  speakerImages.forEach((speakerContainer) => {
    const speakerImgElement = speakerContainer.querySelector('img');
    if (!speakerImgElement) return;

    const speakerNameText = speakerImgElement.alt.trim();

    const speakerImgContainer = createTag('div', { class: 'speaker-img-container' });
    const speakerImg = createTag('img', {
      src: speakerImgElement.src,
      alt: speakerNameText,
      class: speakerImgElement.className,
    });
    speakerImgContainer.appendChild(speakerImg);

    const speakerName = createTag('div', { class: 'speaker-name' }, speakerNameText);
    const speakerInfo = createTag('div', { class: 'speaker-info' });
    speakerInfo.appendChild(speakerName);

    const speakerItem = createTag('div', { class: 'speaker-item' });
    speakerItem.appendChild(speakerImgContainer);
    speakerItem.appendChild(speakerInfo);

    speakersList.appendChild(speakerItem);
  });

  speakersSection.appendChild(speakersList);
  footer.appendChild(speakersSection);
}

function applyListViewEnhancements(card, placeholders) {
  if (!card) return;

  addCardDateInfo(card);
  setupExpandableDescription(card, placeholders);
  addLocationTypeInfo(card);
  addSpeakersToFooter(card, placeholders);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const filterConfig = {
    numberOfResults: 16,
    contentTypes: [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY],
    products: [],
    sort: COVEO_SORT_OPTIONS.MOST_RECENT,
    eventSeries: [],
    firstResult: 0,
  };

  const buildCardsShimmer = new BrowseCardShimmer(filterConfig.numberOfResults);

  // Clear the block content
  block.innerHTML = '';
  block.classList.add('upcoming-event-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
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
  `);

  decorateIcons(headerDiv.querySelector('.view-switcher'));
  block.appendChild(headerDiv);

  // Create content div for cards
  const contentDiv = createTag('div', { class: 'browse-cards-block-content' });
  block.appendChild(contentDiv);

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
    const data = await BrowseCardsDelegate.fetchCardData(param);
    return { cards: data };
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
        applyListViewEnhancements(card, placeholders);
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
    try {
      buildCardsShimmer.addShimmer(block);
      contentDiv.innerHTML = '';
      const existingError = block.querySelector('.event-no-results');
      if (existingError) existingError.remove(); // Prevent duplicate error message
      const { cards: cardModels } = await fetchCardsData({
        products,
        contentTypes,
        numberOfResults,
        sort,
        eventSeries,
        firstResult,
      });
      if (cardModels?.length > 0) {
        contentDiv.style.display = '';
        cardModels.forEach((cardData) => {
          const cardDiv = document.createElement('div');
          buildCard(contentDiv, cardDiv, cardData).then(() => {
            if (block.classList.contains('list')) {
              const card = cardDiv.querySelector('.browse-card');
              applyListViewEnhancements(card, placeholders);
            }
          });
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
      buildCardsShimmer.removeShimmer();
      return { cards: cardModels };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('failed to fetch and render upcoming events card data:', err);
      buildCardsShimmer.removeShimmer();
      return { cards: [], totalPages: 0 };
    }
  }

  // fetch initial cards data
  fetchAndRenderCards(filterConfig);
}
