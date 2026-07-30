import { decorateIcons } from '../../scripts/lib-franklin.js';
import { extractChampionDetail } from '../../scripts/utils/champion-utils.js';

export default function decorate(block) {
  const detail = extractChampionDetail(block);

  block.innerHTML = `
    <div class="champion-detail-image">
      <picture><img src="${detail.image}" alt="${detail.imageAlt}" loading="eager"></picture>
    </div>
    <div class="champion-detail-info">
      ${detail.quoteBio ? `<p class="champion-detail-quote">${detail.quoteBio}</p>` : ''}
      <a class="champion-detail-name" href="${detail.communityProfileUrl}">${detail.name}</a>
      <span class="champion-detail-title"> – ${detail.jobTitle}</span>
      ${detail.productDesignation ? `<div class="champion-detail-designation">${detail.productDesignation}</div>` : ''}
    </div>
  `;

  decorateIcons(block);
}
