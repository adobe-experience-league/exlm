import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

export default function buildPlaceholder(records) {
  const defaultNumberOfCards = records || 4;
  let shimmerContent = '';
  for (let i = 0; i < defaultNumberOfCards; i += 1) {
    shimmerContent += `<div class="shimmer-placeholder-isloading">
        <div class="shimmer-placeholder-image"></div>
        <div class="shimmer-placeholder-content">
          <div class="shimmer-placeholder-description"></div>
          <div class="shimmer-placeholder-text-container">
            <div class="shimmer-placeholder-main-text"></div>
            <div class="shimmer-placeholder-sub-text"></div>
          </div>
          <div class="shimmer-placeholder-btn"></div>
        </div>
      </div>`;
  }
  const shimmerParent = document.createElement('div');
  shimmerParent.classList.add('shimmer-placeholder');
  shimmerParent.innerHTML = shimmerContent;
  return shimmerParent;
}
