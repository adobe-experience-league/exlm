import { loadCSS } from '../lib-franklin.js';
import { createTag, htmlToElement } from '../scripts.js';
import CONTENT_TYPES from './browse-cards-constants.js';

const generateContributorsMarkup = (contributor) => {
  const { name, thumbnail, level, date } = contributor;
  return htmlToElement(`
        <div class="browse-card-contributor-info">
            <img src="${thumbnail}">
            <div class="browse-card-name-plate">
            <span class="browse-card-contributor-name">${name}</span>
            <div class="browse-card-contributor-level">
                <span>L</span>
                <span>Level ${level}</span>
            </div>
            <span>${date}</span>
            </div>
        </div>`);
};

const getTimeString = (date) => {
  const hrs = date.getHours();
  const timePeriod = hrs < 12 ? 'AM' : 'PM';
  const hours = hrs === 0 ? 12 : hrs % 12;
  return `${hours}:${date.getMinutes().toString().padStart(2, '0')} ${timePeriod}`;
};

const generateDateWithTZ = (time) => {
  const date = new Date(time);
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })); // TODO: apply localization once region selection is in place
};

const buildTagsContent = (cardMeta, tags = []) => {
  tags.forEach((tag) => {
    const { icon: iconName, text } = tag;
    if (text) {
      const anchor = createTag('a', { class: 'browse-card-meta-anchor' });
      const span = createTag('span', { class: `icon icon-${iconName}` });
      anchor.textContent = text;
      anchor.appendChild(span);
      cardMeta.appendChild(anchor);
    }
  });
};

const buildEventContent = ({ event, cardContent, card }) => {
  const { startTime, endTime } = event;
  const dateInfo = generateDateWithTZ(startTime);
  const endDateInfo = generateDateWithTZ(endTime);

  const weekday = dateInfo.toLocaleDateString('en-US', { weekday: 'long' });
  const month = dateInfo.toLocaleDateString('en-US', { month: 'long' });

  const eventInfo = htmlToElement(`
    <div class="browse-card-event-info">
        <span class="icon icon-time"></span>
        <div class="browse-card-event-time">
            <h6>${weekday}, ${month} ${dateInfo.getDate()}</h6>
            <h6>${getTimeString(dateInfo)} - ${getTimeString(endDateInfo)} PDT</h6>
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
    isLeftPlacement = true;
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
  const { description, contentType: type, viewLinkText, viewLink, copyLink, tags, contributor, event = {} } = model;
  const contentType = type.toLowerCase();
  const cardContent = card.querySelector('.browse-card-content');
  const cardFooter = card.querySelector('.browse-card-footer');
  const { matches: isDesktopResolution } = window.matchMedia('(min-width: 900px)');

  if (description) {
    const stringContent = description.length > 100 ? `${description.substring(0, 100).trim()}...` : description;
    const descriptionElement = document.createElement('p');
    descriptionElement.classList.add('browse-card-description-text');
    descriptionElement.innerHTML = stripScriptTags(stringContent);
    cardContent.appendChild(descriptionElement);
  }

  const cardMeta = document.createElement('div');
  cardMeta.classList.add('browse-card-meta-info');

  if (contentType === CONTENT_TYPES.COURSE.MAPPING_KEY) {
    buildTagsContent(cardMeta, tags);
  }
  if (isDesktopResolution) {
    cardContent.appendChild(cardMeta);
  } else {
    const titleEl = card.querySelector('.browse-card-title-text');
    cardContent.insertBefore(cardMeta, titleEl);
  }

  if (contentType === CONTENT_TYPES.COMMUNITY.MAPPING_KEY) {
    const contributorInfo = document.createElement('div');
    contributorInfo.classList.add('browse-card-contributor-info');
    const contributorElement = generateContributorsMarkup(contributor);
    contributorInfo.appendChild(contributorElement);
    buildTagsContent(cardMeta, tags);
    cardContent.insertBefore(contributorInfo, cardMeta);
  }

  if (contentType === CONTENT_TYPES.LIVE_EVENTS.MAPPING_KEY) {
    buildEventContent({ event, cardContent, card });
  }
  const cardOptions = document.createElement('div');
  cardOptions.classList.add('browse-card-options');
  if (copyLink) {
    const copyLinkAnchor = createTag('a', { href: copyLink }, `<span class="icon icon-copy"></span>`);
    cardOptions.appendChild(copyLinkAnchor);
  }
  const bookmarkAnchor = createTag('a', {}, `<span class="icon icon-bookmark"></span>`);
  cardOptions.appendChild(bookmarkAnchor);
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

export default async function buildCard(element, model) {
  loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card.css`); // load css dynamically
  const { thumbnail, product, title, contentType, badgeTitle } = model;
  const type = contentType?.toLowerCase();
  const card = createTag(
    'div',
    { class: `browse-card ${type}-card` },
    `<div class="browse-card-figure"></div><div class="browse-card-content"></div><div class="browse-card-footer"></div>`,
  );
  const cardFigure = card.querySelector('.browse-card-figure');
  const cardContent = card.querySelector('.browse-card-content');

  if (thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
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
