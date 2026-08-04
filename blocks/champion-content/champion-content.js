import { extractChampionContent } from '../../scripts/utils/champion-utils.js';

function getChampionName() {
  const decoratedName = document.querySelector('.champion-detail .champion-detail-name');
  if (decoratedName) return decoratedName.textContent.trim();
  // champion-detail not decorated yet: read the raw authored row (image, name, jobTitle, ...)
  const nameRow = document.querySelector('.champion-detail')?.children[1];
  return nameRow?.firstElementChild?.textContent.trim() || '';
}

/**
 * Build the inner markup for one Associated Content card.
 * Shared by champion-content.js (nested/standalone block) and featured-advocates.js (carousel),
 * so both contexts render identically and share champion-content.css.
 * @param {object} content - as returned by extractChampionContent()
 * @param {string} championName
 */
export function renderChampionContentHTML(content, championName) {
  return `
    <div class="champion-content-eyebrow">
      ${
        content.eyebrowIcon
          ? `<img class="champion-content-icon" src="${content.eyebrowIcon}" alt="" loading="lazy">`
          : ''
      }
      <span>${content.contentType}</span>
    </div>
    <div class="champion-content-title">${content.title}</div>
    ${content.description ? `<div class="champion-content-description">${content.description}</div>` : ''}
    ${content.showByline && championName ? `<div class="champion-content-byline">By ${championName}</div>` : ''}
    <div class="champion-content-footer">
      <div class="champion-content-footer-info">
        ${
          content.footerIcon
            ? `<img class="champion-content-icon" src="${content.footerIcon}" alt="" loading="lazy">`
            : ''
        }
        <div class="champion-content-footer-text">${content.footerText}</div>
      </div>
      ${content.ctaHref ? `<a class="champion-content-cta" href="${content.ctaHref}">${content.ctaLabel}</a>` : ''}
    </div>
  `;
}

/**
 * Decorate a champion-content block/item in place.
 * Used both standalone (generic block loader) and when nested inside champion-detail.
 * @param {HTMLElement} block
 */
export function decorateChampionContent(block) {
  const content = extractChampionContent(block);
  const championName = getChampionName();
  block.innerHTML = renderChampionContentHTML(content, championName);
}

export default function decorate(block) {
  decorateChampionContent(block);
}
