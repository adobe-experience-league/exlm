import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { extractChampionContent } from '../../scripts/utils/champion-utils.js';

function getChampionName() {
  const decoratedName = document.querySelector('.champion-detail .champion-detail-name');
  if (decoratedName) return decoratedName.textContent.trim();
  // champion-detail not decorated yet: read the raw authored row (fileReference, name, jobTitle, ...)
  const nameRow = document.querySelector('.champion-detail')?.children[1];
  return nameRow?.firstElementChild?.textContent.trim() || '';
}

/**
 * Build the inner markup for one Associated Content card.
 * Shared with featured-advocates.js so both contexts render identically.
 * @param {object} content - as returned by extractChampionContent()
 * @param {string} championName
 * @param {object} [placeholders]
 */
export function renderChampionContentHTML(content, championName, placeholders = {}) {
  const bylineLabel = (placeholders.championContentBylineLabel || 'By {}').replace('{}', championName);
  return `
    <div class="champion-content-eyebrow">
      ${
        content.eyebrowIcon
          ? `<img class="champion-content-icon" src="${content.eyebrowIcon}" alt="${content.eyebrowIconAlt}" loading="lazy">`
          : ''
      }
      <span>${content.contentType}</span>
    </div>
    <div class="champion-content-title">${content.title}</div>
    ${content.description ? `<div class="champion-content-description">${content.description}</div>` : ''}
    ${content.showByline && championName ? `<div class="champion-content-byline">${bylineLabel}</div>` : ''}
    <div class="champion-content-footer">
      <div class="champion-content-footer-info">
        ${
          content.footerIcon
            ? `<img class="champion-content-icon" src="${content.footerIcon}" alt="${content.footerIconAlt}" loading="lazy">`
            : ''
        }
        <div class="champion-content-footer-text">${content.footerText}</div>
      </div>
      ${
        content.ctaHref
          ? `<a class="champion-content-cta" href="${content.ctaHref}"><span class="visually-hidden">${content.title}: </span>${content.ctaLabel}</a>`
          : ''
      }
    </div>
  `;
}

/**
 * Decorate a champion-content block/item in place.
 * Used both standalone (generic block loader) and when nested inside champion-detail.
 * @param {HTMLElement} block
 * @param {object} [placeholders]
 */
export function decorateChampionContent(block, placeholders = {}) {
  const content = extractChampionContent(block);
  const championName = getChampionName();
  block.innerHTML = renderChampionContentHTML(content, championName, placeholders);
}

export default async function decorate(block) {
  const placeholders = await fetchLanguagePlaceholders();
  decorateChampionContent(block, placeholders);
}
