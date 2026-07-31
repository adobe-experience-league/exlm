import { decorateIcons } from '../../scripts/lib-franklin.js';
import { extractChampionDetail, getDesignationColor } from '../../scripts/utils/champion-utils.js';

export default function decorate(block) {
  const detail = extractChampionDetail(block);
  const colorClass = getDesignationColor(detail.colorSelection);

  block.innerHTML = `
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
  `;

  decorateIcons(block);
}
