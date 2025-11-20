import BrowseCardsDelegate from '../../scripts/browse-card/browse-cards-delegate.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
import { buildCard, processUpcomingEventsData } from '../../scripts/browse-card/browse-card.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

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

function addSpeakersToFooter(card) {
  const cardFigure = card.querySelector('.browse-card-figure');
  const footer = card.querySelector('.browse-card-footer');

  if (!cardFigure || !footer) return;

  const speakersContainer = cardFigure.querySelector('.event-speakers-container');
  if (!speakersContainer) return;

  if (footer.querySelector('.footer-speakers-section')) return;

  const speakersSection = document.createElement('div');
  speakersSection.className = 'footer-speakers-section';

  const speakersHeading = document.createElement('p');
  speakersHeading.className = 'speakers-heading';
  speakersHeading.textContent = 'Speakers';
  speakersSection.appendChild(speakersHeading);

  const speakerImages = speakersContainer.querySelectorAll('.speaker-profile-container');

  const speakersList = document.createElement('div');
  speakersList.className = 'speakers-list';

  speakerImages.forEach((speakerContainer) => {
    const speakerImg = speakerContainer.querySelector('img');
    if (!speakerImg) return;

    const speakerItem = document.createElement('div');
    speakerItem.className = 'speaker-item';

    const speakerImgContainer = document.createElement('div');
    speakerImgContainer.className = 'speaker-img-container';

    const imgClone = speakerImg.cloneNode(true);
    speakerImgContainer.appendChild(imgClone);

    const speakerInfo = document.createElement('div');
    speakerInfo.className = 'speaker-info';

    const speakerName = document.createElement('div');
    speakerName.className = 'speaker-name';
    const altParts = speakerImg.alt.split(',');
    speakerName.textContent = altParts[0].trim();

    speakerInfo.appendChild(speakerName);

    speakerItem.appendChild(speakerImgContainer);
    speakerItem.appendChild(speakerInfo);

    speakersList.appendChild(speakerItem);
  });

  speakersSection.appendChild(speakersList);

  footer.appendChild(speakersSection);
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

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
    </div>
  `);

  decorateIcons(headerDiv.querySelector('.view-switcher'));
  block.appendChild(headerDiv);

  // Create content div for cards
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-cards-block-content');

  // Fetch upcoming events data from Coveo
  const parameters = {
    contentType: [CONTENT_TYPES.UPCOMING_EVENT.MAPPING_KEY], // Must be an array for Coveo facets
    sortCriteria: 'date ascending', // Sort by date ascending (oldest first)
  };

  const buildCardsShimmer = new BrowseCardShimmer();
  buildCardsShimmer.addShimmer(block);
  let browseCardsContent;

  try {
    // Fetch upcoming events data from Coveo
    browseCardsContent = await BrowseCardsDelegate.fetchCardData(parameters);

    // Process the data using the shared function from browse-card.js
    browseCardsContent = processUpcomingEventsData(browseCardsContent);

    buildCardsShimmer.removeShimmer();

    if (browseCardsContent?.length) {
      browseCardsContent.forEach((cardData) => {
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
    return; // Exit early if there's an error
  }

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
      addSpeakersToFooter(card); // Add speakers to footer in list view
    });
  });
}
