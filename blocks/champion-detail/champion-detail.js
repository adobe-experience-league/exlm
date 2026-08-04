import { decorateIcons } from '../../scripts/lib-franklin.js';
import {
  CHAMPION_DETAIL_FIELD_COUNT,
  DESIGNATION_COLORS,
  extractChampionDetail,
  getDesignationColor,
} from '../../scripts/utils/champion-utils.js';
import { decorateChampionContent } from '../champion-content/champion-content.js';

/**
 * Apply (or swap) the gradient background theme on a champion's parent section.
 * Shared by champion-detail.js (one section, set once) and featured-advocates.js (one section,
 * re-applied as the carousel advances, since only one panel is ever visible at a time).
 * @param {HTMLElement} section
 * @param {string} colorClass - '', 'yellow', 'purple', or 'blue'
 */
export function applyChampionSectionTheme(section, colorClass) {
  if (!section) return;
  section.classList.add('champion-detail-container');
  DESIGNATION_COLORS.forEach((color) => section.classList.remove(`champion-detail-${color}`));
  if (colorClass) section.classList.add(`champion-detail-${colorClass}`);
}

/**
 * Build the inner markup for a champion's profile (image, quote, name, title, designation).
 * Shared by champion-detail.js (individual page) and featured-advocates.js (carousel),
 * so both contexts render identically and share champion-detail.css.
 * @param {object} detail - as returned by extractChampionDetail()
 * @param {string} colorClass - '', 'yellow', 'purple', or 'blue'
 * @param {object} [options]
 * @param {string} [options.paginationHTML] - markup for the pagination row; only the carousel has one
 * @param {string} [options.loading] - image loading strategy ('eager' on the individual page, 'lazy' in the carousel)
 */
export function renderChampionDetailProfileHTML(detail, colorClass, { paginationHTML = '', loading = 'eager' } = {}) {
  return `
    <div class="champion-detail-profile">
      <div class="champion-detail-image${colorClass ? ` champion-detail-image-${colorClass}` : ''}">
        <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="${loading}"></picture>
      </div>
      <div class="champion-detail-info">
        ${
          detail.quoteBio
            ? `<div class="champion-detail-quote">
                 <img class="champion-detail-quote-icon" src="/blocks/champion-detail/quote-icon-${
                   colorClass || 'yellow'
                 }.svg" alt="" loading="${loading}">
                 <p>${detail.quoteBio}</p>
               </div>`
            : ''
        }
        <a class="champion-detail-name" href="${detail.communityProfileUrl}">${detail.name}</a>
        <span class="champion-detail-title"> – ${detail.jobTitle}</span>
        ${
          detail.productDesignation ? `<div class="champion-detail-designation">${detail.productDesignation}</div>` : ''
        }
        ${paginationHTML}
      </div>
    </div>
  `;
}

/**
 * Build the "< count >" pagination row markup.
 * Only used by featured-advocates.js — the standalone champion page has nothing to paginate.
 * @param {string} countText - e.g. '1/3'
 * @param {string} [label] - noun used in the aria-labels, e.g. 'champion' or 'advocate'
 */
export function renderPaginationHTML(countText, label = 'champion') {
  return `
    <div class="champion-detail-pagination">
      <button type="button" class="champion-detail-nav champion-detail-prev" aria-label="Previous ${label}">
        <span class="icon icon-back-arrow"></span>
      </button>
      <span class="champion-detail-pagination-count">${countText}</span>
      <button type="button" class="champion-detail-nav champion-detail-next" aria-label="Next ${label}">
        <span class="icon icon-front-arrow"></span>
      </button>
    </div>
  `;
}

/**
 * Append the "More from X" heading + items grid to a champion-detail(-shaped) container.
 * Shared by champion-detail.js (real DOM item elements, decorated in place) and
 * featured-advocates.js (freshly-built card elements) — both just need the same wrapper.
 * @param {HTMLElement} container
 * @param {string} championName
 * @param {HTMLElement[]} itemElements
 */
export function appendMoreFromSection(container, championName, itemElements) {
  if (!itemElements.length) return;

  const moreFrom = document.createElement('div');
  moreFrom.classList.add('champion-detail-more-from');
  moreFrom.textContent = `More from ${championName}`;
  container.append(moreFrom);

  const itemsContainer = document.createElement('div');
  itemsContainer.classList.add('champion-detail-items');
  itemElements.forEach((item) => itemsContainer.append(item));
  container.append(itemsContainer);
}

export default function decorate(block) {
  const detail = extractChampionDetail(block);
  const colorClass = getDesignationColor(detail.colorSelection);

  // anything beyond champion-detail's own fields are nested champion-content items
  const items = [...block.children].slice(CHAMPION_DETAIL_FIELD_COUNT, CHAMPION_DETAIL_FIELD_COUNT + 3);

  // the gradient background belongs to the whole section, not just this block
  applyChampionSectionTheme(block.closest('.section'), colorClass);

  block.innerHTML = renderChampionDetailProfileHTML(detail, colorClass, { loading: 'eager' });

  decorateIcons(block);

  items.forEach((item) => {
    item.classList.add('champion-content', 'block');
    if (colorClass) item.classList.add(`champion-content-${colorClass}`);
    decorateChampionContent(item);
  });
  appendMoreFromSection(block, detail.name, items);
}
