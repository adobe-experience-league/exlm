import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { extractAdvocateInfo, getContentTypeIcon, getTimeIcon } from '../../scripts/utils/advocate-utils.js';

/**
 * Builds the DOM for a single associated-content card.
 * Shared with the featured-advocates carousel.
 * @param {object} card
 */
export function buildAssociatedContentCard(card) {
  const cardEl = htmlToElement(`
    <div class="advocate-content-card">
      <div class="advocate-content-eyebrow">
        <span class="icon icon-${getContentTypeIcon(card.contentType)}"></span>
        <span>${card.contentType}</span>
      </div>
      <div class="advocate-content-title">${card.title}</div>
      ${card.description ? `<div class="advocate-content-description">${card.description}</div>` : ''}
      ${
        card.timeText
          ? `<div class="advocate-content-time"><span class="icon icon-${getTimeIcon(card.timeType)}"></span><span>${
              card.timeText
            }</span></div>`
          : ''
      }
      ${
        card.ctaLink && card.ctaText ? `<a class="advocate-content-cta" href="${card.ctaLink}">${card.ctaText}</a>` : ''
      }
    </div>
  `);
  decorateIcons(cardEl);
  return cardEl;
}

/**
 * Builds the DOM for the Champion panel (image, identity, quote, associated content).
 * Shared with the featured-advocates carousel.
 * @param {object} info result of extractAdvocateInfo
 */
export function buildAdvocatePanel(info) {
  const picture = info.image ? createOptimizedPicture(info.image, info.name, false).outerHTML : '';
  const panel = htmlToElement(`
    <div class="advocate-panel">
      <div class="advocate-media">
        <div class="advocate-image">${picture}</div>
        ${info.productDesignation ? `<div class="advocate-designation">${info.productDesignation}</div>` : ''}
      </div>
      <div class="advocate-info">
        ${info.quote ? `<blockquote class="advocate-quote">${info.quote}</blockquote>` : ''}
        <a class="advocate-name" href="${info.profileLink || '#'}">${info.name}</a>
        ${info.title ? `<div class="advocate-title">${info.title}</div>` : ''}
        <div class="advocate-associated-content"></div>
      </div>
    </div>
  `);

  const cardsContainer = panel.querySelector('.advocate-associated-content');
  info.associatedContent
    .filter((card) => card.title && card.contentType)
    .slice(0, 3)
    .forEach((card) => cardsContainer.append(buildAssociatedContentCard(card)));

  decorateIcons(panel);
  return panel;
}

export default function decorate(block) {
  const info = extractAdvocateInfo(block);
  const panel = buildAdvocatePanel(info);
  block.textContent = '';
  block.append(panel);
}
