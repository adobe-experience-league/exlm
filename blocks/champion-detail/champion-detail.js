import { decorateIcons } from '../../scripts/lib-franklin.js';
import { extractChampionDetail, getDesignationColor } from '../../scripts/utils/champion-utils.js';
import { decorateChampionContent } from '../champion-content/champion-content.js';

const OWN_FIELD_COUNT = 7; // image, name, jobTitle, quoteBio, communityProfileUrl, productDesignation, colorSelection

export default function decorate(block) {
  const detail = extractChampionDetail(block);
  const colorClass = getDesignationColor(detail.colorSelection);

  // anything beyond champion-detail's own fields are nested champion-content items
  const items = [...block.children].slice(OWN_FIELD_COUNT, OWN_FIELD_COUNT + 3);

  // the gradient background belongs to the whole section, not just this block
  const section = block.closest('.section');
  if (section) {
    section.classList.add('champion-detail-container');
    if (colorClass) section.classList.add(`champion-detail-${colorClass}`);
  }

  block.innerHTML = `
    <div class="champion-detail-profile">
      <div class="champion-detail-image${colorClass ? ` champion-detail-image-${colorClass}` : ''}">
        <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="eager"></picture>
      </div>
      <div class="champion-detail-info">
        ${
          detail.quoteBio
            ? `<div class="champion-detail-quote">
                 <img class="champion-detail-quote-icon" src="/blocks/champion-detail/quote-icon-${
                   colorClass || 'yellow'
                 }.svg" alt="" loading="eager">
                 <p>${detail.quoteBio}</p>
               </div>`
            : ''
        }
        <a class="champion-detail-name" href="${detail.communityProfileUrl}">${detail.name}</a>
        <span class="champion-detail-title"> – ${detail.jobTitle}</span>
        ${
          detail.productDesignation ? `<div class="champion-detail-designation">${detail.productDesignation}</div>` : ''
        }
        <div class="champion-detail-pagination">
          <button type="button" class="champion-detail-nav champion-detail-prev" aria-label="Previous champion">
            <span class="icon icon-back-arrow"></span>
          </button>
          <span class="champion-detail-pagination-count">1/3</span>
          <button type="button" class="champion-detail-nav champion-detail-next" aria-label="Next champion">
            <span class="icon icon-front-arrow"></span>
          </button>
        </div>
      </div>
    </div>
  `;

  decorateIcons(block);

  if (items.length) {
    const moreFrom = document.createElement('div');
    moreFrom.classList.add('champion-detail-more-from');
    moreFrom.textContent = `More from ${detail.name}`;
    block.append(moreFrom);

    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('champion-detail-items');
    items.forEach((item) => {
      item.classList.add('champion-content', 'block');
      if (colorClass) item.classList.add(`champion-content-${colorClass}`);
      decorateChampionContent(item);
      itemsContainer.append(item);
    });
    block.append(itemsContainer);
  }
}
