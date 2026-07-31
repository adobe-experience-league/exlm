import { extractChampionDetail, getDesignationColor } from '../../scripts/utils/champion-utils.js';
import { decorateChampionContent } from '../champion-content/champion-content.js';

const OWN_FIELD_COUNT = 7; // image, name, jobTitle, quoteBio, communityProfileUrl, productDesignation, colorSelection

export default function decorate(block) {
  const detail = extractChampionDetail(block);
  const colorClass = getDesignationColor(detail.colorSelection);

  // anything beyond champion-detail's own fields are nested champion-content items
  const items = [...block.children].slice(OWN_FIELD_COUNT, OWN_FIELD_COUNT + 3);

  if (colorClass) block.classList.add(`champion-detail-${colorClass}`);

  block.innerHTML = `
    <div class="champion-detail-profile">
      <div class="champion-detail-image${colorClass ? ` champion-detail-image-${colorClass}` : ''}">
        <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="eager"></picture>
      </div>
      <div class="champion-detail-info">
        ${detail.quoteBio ? `<div class="champion-detail-quote">${detail.quoteBio}</div>` : ''}
        <a class="champion-detail-name" href="${detail.communityProfileUrl}">${detail.name}</a>
        <span class="champion-detail-title"> – ${detail.jobTitle}</span>
        ${
          detail.productDesignation
            ? `<div class="champion-detail-designation${colorClass ? ` champion-detail-designation-${colorClass}` : ''}">${detail.productDesignation}</div>`
            : ''
        }
      </div>
    </div>
  `;

  if (items.length) {
    const moreFrom = document.createElement('div');
    moreFrom.classList.add('champion-detail-more-from');
    moreFrom.textContent = `More from ${detail.name}`;
    block.append(moreFrom);

    const itemsContainer = document.createElement('div');
    itemsContainer.classList.add('champion-detail-items');
    items.forEach((item) => {
      item.classList.add('champion-content', 'block');
      decorateChampionContent(item);
      itemsContainer.append(item);
    });
    block.append(itemsContainer);
  }
}
