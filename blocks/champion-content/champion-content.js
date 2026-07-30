import { decorateIcons } from '../../scripts/lib-franklin.js';
import {
  extractChampionContent,
  getContentTypeIcon,
  getTimeCommitmentIcon,
} from '../../scripts/utils/champion-utils.js';

function getChampionName() {
  const decoratedName = document.querySelector('.champion-detail .champion-detail-name');
  if (decoratedName) return decoratedName.textContent.trim();
  // champion-detail not decorated yet: read the raw authored row (image, imageAlt, name, ...)
  const nameRow = document.querySelector('.champion-detail')?.children[2];
  return nameRow?.firstElementChild?.textContent.trim() || '';
}

export default function decorate(block) {
  const content = extractChampionContent(block);
  const contentTypeIcon = getContentTypeIcon(content.contentType);
  const timeIcon = getTimeCommitmentIcon(content.timeIcon);
  const championName = getChampionName();

  block.innerHTML = `
    <div class="champion-content-eyebrow">
      ${contentTypeIcon ? `<span class="icon icon-${contentTypeIcon}"></span>` : ''}
      <span>${content.contentType}</span>
    </div>
    <div class="champion-content-title">${content.title}</div>
    ${content.description ? `<p class="champion-content-description">${content.description}</p>` : ''}
    ${championName ? `<div class="champion-content-byline">By ${championName}</div>` : ''}
    <div class="champion-content-time">
      ${timeIcon ? `<span class="icon icon-${timeIcon}"></span>` : ''}
      <span>${content.timeText}</span>
    </div>
    ${content.ctaHref ? `<a class="champion-content-cta" href="${content.ctaHref}">${content.ctaLabel}</a>` : ''}
  `;

  decorateIcons(block);
}
