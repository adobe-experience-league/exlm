import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { createTooltip, hideTooltipOnScroll } from '../../scripts/browse-card/browse-card-tooltip.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { CONTENT_TYPES } from '../../scripts/browse-card/browse-cards-constants.js';

const { prodAssetsCdnOrigin } = getConfig();

/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

function createThumbnailURL(doc, contentType) {
  if (contentType === 'Course') {
    const courseThumbnail = getMetadata('course-thumbnail', doc);
    return courseThumbnail ? `${prodAssetsCdnOrigin}/thumb/${courseThumbnail.split('thumb/')[1]}` : '';
  }

  if (contentType === 'Tutorial') {
    let urlString = doc?.querySelector('iframe')?.getAttribute('src');
    if (!urlString) {
      urlString = doc.querySelector('[href*="tv.adobe.com"]')?.getAttribute('href');
    }
    const videoUrl = urlString ? new URL(urlString) : null;
    const videoId = videoUrl?.pathname?.split('/v/')[1]?.split('/')[0];
    return videoId ? `https://video.tv.adobe.com/v/${videoId}?format=jpeg` : '';
  }
  return '';
}

/**
 * Converts a string to title case.
 * @param {string} str - The input string.
 * @returns {string} The string in title case.
 */
const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

const domParser = new DOMParser();

/**
 * Create article card data for the given article path.
 * @param {string} articlePath
 * @param {Object} placeholders
 * @returns
 */
const getCardData = async (articlePath, placeholders) => {
  let response = '';
  try {
    response = await fetch(articlePath.toString());
    if (!response.ok) {
      return undefined;
    }
  } catch (err) {
    return undefined;
  }
  const html = await response.text();
  const doc = domParser.parseFromString(html, 'text/html');
  const fullURL = new URL(articlePath, window.location.origin).href;

  let type = getMetadata('coveo-content-type', doc);
  if (!type) {
    type = getMetadata('type', doc);
  }

  let solutions = getMetadata('solutions', doc)
    .split(',')
    .map((s) => s.trim());

  if (solutions.length < 2) {
    solutions = getMetadata('coveo-solution', doc)
      .split(';')
      .map((s) => s.trim());
  }

  return {
    id: getMetadata('id', doc),
    title: doc.querySelector('title').textContent.split('|')[0].trim(),
    description: getMetadata('description', doc),
    type,
    contentType: type,
    badgeTitle: type ? CONTENT_TYPES[type.toUpperCase()]?.LABEL : '',
    thumbnail: createThumbnailURL(doc, type) || '',
    product: solutions,
    authorInfo: {
      name: getMetadata('author-name', doc)
        .split(',')
        .map((name) => name.trim()),
      type: [getMetadata('author-type', doc)],
    },
    tags: [],
    copyLink: fullURL,
    bookmarkLink: '',
    viewLink: fullURL,
    viewLinkText: placeholders[`browseCard${convertToTitleCase(type)}ViewLabel`]
      ? placeholders[`browseCard${convertToTitleCase(type)}ViewLabel`]
      : `View ${type}`,
  };
};

/**
 * Decorate function to process and log the mapped data.
 * @param {HTMLElement} block - The block of data to process.
 */
export default async function decorate(block) {
  // Extracting elements from the block
  const [headingElement, toolTipElement, linkTextElement, ...linksContainer] = [...block.children].map(
    (row) => row.firstElementChild,
  );

  headingElement.firstElementChild?.classList.add('h2');
  block.classList.add('browse-cards-block');

  const headerDiv = htmlToElement(`
    <div class="browse-cards-block-header">
      <div class="browse-cards-block-title">
        ${headingElement.innerHTML}
      </div>
      ${linkTextElement?.outerHTML}
    </div>
  `);

  if (toolTipElement?.textContent?.trim()) {
    headerDiv
      .querySelector('h1,h2,h3,h4,h5,h6')
      ?.insertAdjacentHTML('afterend', '<div class="tooltip-placeholder"></div>');
    const tooltipElem = headerDiv.querySelector('.tooltip-placeholder');
    const tooltipConfig = {
      content: toolTipElement.textContent.trim(),
    };
    createTooltip(block, tooltipElem, tooltipConfig);
  }

  block.replaceChildren(headerDiv);

  const buildCardsShimmer = new BuildPlaceholder();
  buildCardsShimmer.add(block);
  const contentDiv = document.createElement('div');
  contentDiv.className = 'browse-cards-block-content';

  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const cardLoading$ = Promise.all(
    linksContainer.map(async (linkContainer) => {
      let link = linkContainer.textContent?.trim();
      link = link.startsWith('/') ? `${window.hlx.codeBasePath}${link}` : link;
      // use the link containers parent as container for the card as it is instruented for authoring
      // eslint-disable-next-line no-param-reassign
      linkContainer = linkContainer.parentElement;
      linkContainer.innerHTML = '';
      if (link) {
        try {
          const cardData = await getCardData(link, placeholders);
          await buildCard(contentDiv, linkContainer, cardData);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      }
      return linkContainer;
    }),
  );

  cardLoading$.then((cards) => {
    buildCardsShimmer.remove();
    contentDiv.append(...cards);
    block.appendChild(contentDiv);
  });

  /* Hide Tooltip while scrolling the cards layout */
  hideTooltipOnScroll(contentDiv);
  decorateIcons(block);
}
