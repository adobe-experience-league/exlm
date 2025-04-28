import { isMobile } from './atomic-search-utils.js';

export default function createAtomicSkeleton() {
  const skeleton = document.createElement('div');
  if (isMobile()) {
    skeleton.innerHTML = `
      <div part="atomic-skeleton atomic-mobile-view" class="atomic-skeleton atomic-mobile-view">
        <div part="atomic-skeleton-line atomic-skeleton-line-title" class="atomic-skeleton-line atomic-skeleton-line-title"></div>
        <div part="atomic-skeleton-line atomic-skeleton-line-subtitle" class="atomic-skeleton-line atomic-skeleton-line-subtitle"></div>
        <div part="atomic-skeleton-line atomic-skeleton-line-content" class="atomic-skeleton-line atomic-skeleton-line-content"></div>
      </div>
    `;
  } else {
    skeleton.innerHTML = `
      <div part="atomic-skeleton-grid-desktop" class="atomic-skeleton atomic-skeleton-grid-desktop">
        <div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-heading" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-heading"></div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-subheading" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-subheading"></div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-content" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-content"></div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-tag" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-tag"></div>
        </div>
        <div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-button" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-button"></div>
        </div>
        <div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-info" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-info"></div>
        </div>
        <div>
          <div part="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-status" class="atomic-skeleton-desktop-line atomic-skeleton-desktop-line-status"></div>
        </div>
      </div>
    `;
  }
  return skeleton;
}
