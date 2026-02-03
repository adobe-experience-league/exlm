/* eslint-disable camelcase, no-unused-vars */
import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import ALM_CONTENT_TYPES from '../data-service/alm/alm-constants.js';
import { sendCoveoClickEvent } from '../coveo-analytics.js';
import { pushBrowseCardClickEvent } from '../analytics/lib-analytics.js';
import UserActions from '../user-actions/user-actions.js';

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Lowercases the url if it is the same origin, handles relative urls as well
 * @param {string} url - The url to lowercase
 * @returns {string} The lowercase url
 */
function lowerCaseSameOriginUrls(url) {
  if (url) {
    let urlObj;
    try {
      urlObj = new URL(url, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error parsing url:', e);
      return url; // gracefully handle malformed urls
    }
    if (urlObj.origin === window.location.origin) {
      return urlObj.toString().toLowerCase();
    }
  }
  return url;
}

// Function to calculate cardHeader and cardPosition
const getCardHeaderAndPosition = (card, element) => {
  let cardHeader = '';
  const currentBlock = card.closest('.block');
  const headerEl = currentBlock?.querySelector(
    '.browse-cards-block-title, .rec-block-header, .inprogress-courses-header-wrapper',
  );
  if (headerEl) {
    const cloned = headerEl.cloneNode(true);
    // Remove any PII or masked spans
    cloned.querySelectorAll('[data-cs-mask]').forEach((el) => el.remove());
    // Get cleaned text
    cardHeader = cloned.innerText.trim();
  }

  cardHeader = cardHeader || currentBlock?.getAttribute('data-block-name')?.trim() || '';

  let cardPosition = '';
  if (element?.parentElement?.children) {
    const siblings = Array.from(element.parentElement.children);
    cardPosition = String(siblings.indexOf(element) + 1);
  }

  return { cardHeader, cardPosition };
};

/**
 * Builds the thumbnail container with user actions (bookmark & copy) inside
 * @param {Object} params - Parameters for building thumbnail
 * @returns {HTMLElement} The card figure element
 */
const buildALMThumbnail = ({ thumbnail, title, badgeTitle, contentType, id, viewLink, copyLink, card, element, model }) => {
  const cardFigure = createTag('div', { class: 'alm-card-figure' });

  // Add thumbnail image
  if (thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.loading = 'lazy';
    img.alt = title;
    img.width = 254;
    img.height = 153;
    cardFigure.appendChild(img);

    img.addEventListener('error', () => {
      card.classList.add('alm-thumbnail-not-loaded');
      img.style.display = 'none';
    });

    if (img.complete) {
      img.classList.add('img-loaded');
    }

    img.addEventListener('load', () => {
      img.classList.add('img-loaded');
    });
  } else {
    card.classList.add('alm-thumbnail-not-loaded');
  }

  // Add user actions (bookmark & copy) overlay inside thumbnail
  const cardActions = createTag('div', { class: 'alm-card-actions' });
  
  const getBookmarkId = () => {
    if (id) {
      return id;
    }
    return viewLink ? new URL(viewLink).pathname : '';
  };

  const getBookmarkPath = () => viewLink ? new URL(viewLink).pathname : '';

  const cardAction = UserActions({
    container: cardActions,
    id: getBookmarkId(),
    bookmarkPath: getBookmarkPath(),
    link: copyLink,
    bookmarkConfig: {
      icons: ['bookmark-white-fill'],
    },
    copyConfig: {
      icons: ['copy-white-fill'],
    },
    bookmarkCallback: (linkType, position) => {
      const { cardHeader, cardPosition } = getCardHeaderAndPosition(card, element);
      const finalLinkType = linkType || cardHeader || '';
      const finalPosition = position || cardPosition || '';
      pushBrowseCardClickEvent('bookmarkLinkBrowseCard', model, finalLinkType, finalPosition);
    },
    copyCallback: (linkType, position) => {
      const { cardHeader, cardPosition } = getCardHeaderAndPosition(card, element);
      const finalLinkType = linkType || cardHeader || '';
      const finalPosition = position || cardPosition || '';
      pushBrowseCardClickEvent('copyLinkBrowseCard', model, finalLinkType, finalPosition);
    },
  });

  cardAction.decorate();
  cardFigure.appendChild(cardActions);

  return cardFigure;
};

/**
 * Builds the ALM-specific meta information section
 * @param {Object} params - Parameters for building meta info
 * @returns {HTMLElement} The meta info element
 */
const buildALMMetaInfo = ({ meta, contentType }) => {
  const metaContainer = createTag('div', { class: 'alm-card-meta' });
  const metaParts = [];

  // Duration
  if (meta?.duration) {
    metaParts.push(meta.duration);
  }

  // Level (from meta)
  if (meta?.level) {
    metaParts.push(meta.level);
  }

  // Rating with star icon
  if (meta?.rating?.average > 0) {
    const ratingText = meta.rating.average.toFixed(1);
    metaParts.push(`${ratingText} ★`);
  }

  if (metaParts.length > 0) {
    const metaText = metaParts.join(' • ');
    const metaElement = createTag('p', { class: 'alm-card-meta-text' });
    metaElement.textContent = metaText;
    metaContainer.appendChild(metaElement);
  }

  return metaContainer;
};

/**
 * Builds an ALM browse card with ALM-specific DOM structure
 * @param {HTMLElement} element - The element where the card will be appended
 * @param {Object} model - The data model containing information about the card
 * @returns {Promise<void>}
 */
export async function buildALMCard(element, model) {
  // eslint-disable-next-line no-console
  // console.log('model', model);
  const {
    id,
    thumbnail,
    title,
    description,
    contentType,
    badgeTitle,
    viewLink,
    viewLinkText,
    copyLink,
    meta,
    failedToLoad = false,
  } = model;

  element.setAttribute('data-analytics-content-type', contentType);
  
  // Lowercase all URLs
  model.viewLink = lowerCaseSameOriginUrls(model.viewLink);
  model.copyLink = lowerCaseSameOriginUrls(model.copyLink);

  const type = contentType?.toLowerCase();

  // Create main card container
  const card = createTag(
    'div',
    { class: `browse-card alm-browse-card ${type}-card ${failedToLoad ? 'browse-card-frozen' : ''}` },
    '',
  );

  // Build thumbnail with user actions inside
  const cardFigure = buildALMThumbnail({
    thumbnail,
    title,
    badgeTitle,
    contentType,
    id,
    viewLink,
    copyLink,
    card,
    element,
    model,
  });
  card.appendChild(cardFigure);

  // Build content section
  const cardContent = createTag('div', { class: 'alm-card-content' });

  // Add title
  if (title) {
    const titleElement = createTag('h3', { class: 'alm-card-title' });
    titleElement.innerHTML = title;
    cardContent.appendChild(titleElement);
  }

  // Add meta information (duration, level, rating)
  const metaInfo = buildALMMetaInfo({ meta, contentType });
  if (metaInfo.children.length > 0) {
    cardContent.appendChild(metaInfo);
  }

  card.appendChild(cardContent);

  // Build footer with CTA
  const cardFooter = createTag('div', { class: 'alm-card-footer' });
  card.appendChild(cardFooter);

  // Load ALM-specific CSS
  await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`);
  await loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-alm.css`);

  // Wrap card in anchor tag
  if (model.viewLink) {
    const cardContainer = document.createElement('a');
    cardContainer.setAttribute('href', model.viewLink);
    
    cardContainer.addEventListener('click', (e) => {
      // Prevent default link behavior for user actions
      const preventLinkRedirection = !!(e.target && e.target.closest('.user-actions'));
      if (preventLinkRedirection) {
        e.preventDefault();
      }
    });

    cardContainer.appendChild(card);
    element.appendChild(cardContainer);
  } else {
    element.appendChild(card);
  }

  // Browse card click event handler
  element.querySelector('a')?.addEventListener('click', (e) => {
    const { cardHeader, cardPosition } = getCardHeaderAndPosition(card, element);

    if (e.target.closest('.user-actions')) {
      return;
    }

    // CTA element click
    if (e.target.closest('.alm-card-cta-button')) {
      pushBrowseCardClickEvent('browseCardCTAClick', model, cardHeader, cardPosition);
      return;
    }

    // Card click (excluding options and CTA)
    if (e.target.closest('a:not(.user-actions):not(.alm-card-cta-button)')) {
      pushBrowseCardClickEvent('browseCardClicked', model, cardHeader, cardPosition);
    }
  });

  element.querySelector('a')?.addEventListener(
    'click',
    () => {
      sendCoveoClickEvent('browse-card', model);
    },
    { once: true },
  );
}

export default { buildALMCard };
