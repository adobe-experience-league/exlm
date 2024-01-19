import { loadCSS, fetchPlaceholders } from '../lib-franklin.js';
import { createTag, htmlToElement } from '../scripts.js';
import { CONTENT_TYPES } from './browse-cards-constants.js';

/* User Info for Community Section - Will accomodate once we have KHOROS integration */
// const generateContributorsMarkup = (contributor) => {
//   const { name, thumbnail, level, date } = contributor;
//   return htmlToElement(`
//         <div class="browse-card-contributor-info">
//             <img src="${thumbnail}">
//             <div class="browse-card-name-plate">
//             <span class="browse-card-contributor-name">${name}</span>
//             <div class="browse-card-contributor-level">
//                 <span>L</span>
//                 <span>Level ${level}</span>
//             </div>
//             <span>${date}</span>
//             </div>
//         </div>`);
// };

const buildTagsContent = (cardMeta, tags = []) => {
  tags.forEach((tag) => {
    const { icon: iconName, text } = tag;
    if (text) {
      const anchor = createTag('a', { class: 'browse-card-meta-anchor', title: 'user', href: '#' });
      const span = createTag('span', { class: `icon icon-${iconName}` });
      anchor.textContent = text;
      anchor.appendChild(span);
      cardMeta.appendChild(anchor);
    }
  });
};

let placeholders = {};
try {
  placeholders = await fetchPlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Default No Results Content from Placeholder
export const buildNoResultsContent = (block) => {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const noResultsInfo = htmlToElement(`
    <div class="browse-card-no-results">${placeholders.noResultsText}</div>
  `);
  block.appendChild(noResultsInfo);
};

const buildEventContent = ({ event, cardContent, card }) => {
  const { time } = event;
  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${time}</h6>
        </div>
    </div>
  `);
  const title = card.querySelector('.browse-card-title-text');
  cardContent.insertBefore(eventInfo, title.nextElementSibling);
};

const buildCardCtaContent = ({ cardFooter, contentType, viewLink, viewLinkText }) => {
  let icon = null;
  let isLeftPlacement = false;
  if (contentType === 'tutorial') {
    icon = 'play-outline';
    isLeftPlacement = false;
  } else if (
    contentType === CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY ||
    contentType === CONTENT_TYPES.EVENT.MAPPING_KEY ||
    contentType === CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY
  ) {
    icon = 'new-tab';
  }
  const iconMarkup = icon ? `<span class="icon icon-${icon}"></span>` : '';
  const ctaText = viewLinkText || '';
  const anchorLink = htmlToElement(`
        <a class="browse-card-cta-element" target="_blank" href="${viewLink}">
            ${isLeftPlacement ? `${iconMarkup} ${ctaText}` : `${ctaText} ${iconMarkup}`}
        </a>
    `);
  cardFooter.appendChild(anchorLink);
};

const stripScriptTags = (input) => input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

const buildCardContent = (card, model) => {
  const { description, contentType: type, viewLinkText, viewLink, copyLink, tags, event = {} } = model;
  const contentType = type.toLowerCase();
  const cardContent = card.querySelector('.browse-card-content');
  const cardFooter = card.querySelector('.browse-card-footer');

  if (description) {
    const stringContent = description.length > 100 ? `${description.substring(0, 100).trim()}...` : description;
    const descriptionElement = document.createElement('div');
    descriptionElement.classList.add('browse-card-description-text');
    descriptionElement.innerHTML = stripScriptTags(stringContent);
    cardContent.appendChild(descriptionElement);
  }

  const cardMeta = document.createElement('div');
  cardMeta.classList.add('browse-card-meta-info');

  if (contentType === CONTENT_TYPES.COURSE.MAPPING_KEY || contentType === CONTENT_TYPES.COMMUNITY.MAPPING_KEY) {
    buildTagsContent(cardMeta, tags);
  }

  cardContent.appendChild(cardMeta);

  /* User Info for Community Section - Will accomodate once we have KHOROS integration */
  // if (contentType === CONTENT_TYPES.COMMUNITY.MAPPING_KEY) {
  //   const contributorInfo = document.createElement('div');
  //   contributorInfo.classList.add('browse-card-contributor-info');
  //   const contributorElement = generateContributorsMarkup(contributor);
  //   contributorInfo.appendChild(contributorElement);
  //   buildTagsContent(cardMeta, tags);
  //   cardContent.insertBefore(contributorInfo, cardMeta);
  // }

  if (contentType === CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY) {
    buildEventContent({ event, cardContent, card });
  }
  const cardOptions = document.createElement('div');
  cardOptions.classList.add('browse-card-options');
  if (
    contentType !== CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY &&
    contentType !== CONTENT_TYPES.INSTRUCTOR_LED_TRANING.MAPPING_KEY
  ) {
    const bookmarkAnchor = createTag('a', { href: '#', title: 'copy' }, `<span class="icon icon-bookmark"></span>`);
    cardOptions.appendChild(bookmarkAnchor);
  }
  if (copyLink) {
    const copyLinkAnchor = createTag('a', { href: copyLink, title: 'copy' }, `<span class="icon icon-copy"></span>`);
    cardOptions.appendChild(copyLinkAnchor);
  }
  cardFooter.appendChild(cardOptions);
  buildCardCtaContent({ cardFooter, contentType, viewLink, viewLinkText });
};

const setupCopyAction = (wrapper) => {
  Array.from(wrapper.querySelectorAll('.icon.icon-copy')).forEach((svg) => {
    const anchor = svg.parentElement;
    if (anchor?.href) {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard
          .writeText(anchor.href)
          .then(() => {})
          .catch(() => {
            // noop
          });
      });
    }
  });
};

export async function buildCard(element, model) {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const { thumbnail, product, title, contentType, badgeTitle } = model;
  const type = contentType?.toLowerCase();
  const courseMappingKey = CONTENT_TYPES.COURSE.MAPPING_KEY.toLowerCase();
  const tutorialMappingKey = CONTENT_TYPES.TUTORIAL.MAPPING_KEY.toLowerCase();
  const card = createTag(
    'div',
    { class: `browse-card ${type}-card` },
    `<div class="browse-card-figure"></div><div class="browse-card-content"></div><div class="browse-card-footer"></div>`,
  );
  const cardFigure = card.querySelector('.browse-card-figure');
  const cardContent = card.querySelector('.browse-card-content');

  if ((type === courseMappingKey || type === tutorialMappingKey) && thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.loading = 'lazy';
    img.alt = title;
    img.width = 254;
    img.height = 153;
    cardFigure.classList.add('img-custom-height');
    cardFigure.appendChild(img);
  }

  const bannerElement = createTag('p', { class: 'browse-card-banner' });
  bannerElement.innerText = badgeTitle;
  cardFigure.appendChild(bannerElement);

  if (product) {
    const tagElement = createTag('p', { class: 'browse-card-tag-text' });
    tagElement.textContent = product;
    cardContent.appendChild(tagElement);
  }

  if (title) {
    const titleElement = createTag('p', { class: 'browse-card-title-text' });
    titleElement.textContent = title;
    cardContent.appendChild(titleElement);
  }
  buildCardContent(card, model);
  setupCopyAction(card);
  element.appendChild(card);
}
