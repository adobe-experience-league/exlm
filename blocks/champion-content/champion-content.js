import { extractChampionContent } from '../../scripts/utils/champion-utils.js';

function getChampionName() {
  const decoratedName = document.querySelector('.champion-detail .champion-detail-name');
  if (decoratedName) return decoratedName.textContent.trim();
  // champion-detail not decorated yet: read the raw authored row (image, name, jobTitle, ...)
  const nameRow = document.querySelector('.champion-detail')?.children[1];
  return nameRow?.firstElementChild?.textContent.trim() || '';
}

export default function decorate(block) {
  const content = extractChampionContent(block);
  const championName = getChampionName();

  block.innerHTML = `
    <div class="champion-content-eyebrow">
      ${content.eyebrowIcon ? `<img class="champion-content-icon" src="${content.eyebrowIcon}" alt="" loading="lazy">` : ''}
      <span>${content.contentType}</span>
    </div>
    <div class="champion-content-title">${content.title}</div>
    ${content.description ? `<div class="champion-content-description">${content.description}</div>` : ''}
    ${championName ? `<div class="champion-content-byline">By ${championName}</div>` : ''}
    <div class="champion-content-footer">
      ${content.footerIcon ? `<img class="champion-content-icon" src="${content.footerIcon}" alt="" loading="lazy">` : ''}
      <div class="champion-content-footer-text">${content.footerText}</div>
    </div>
    ${content.ctaHref ? `<a class="champion-content-cta" href="${content.ctaHref}">${content.ctaLabel}</a>` : ''}
  `;
}
