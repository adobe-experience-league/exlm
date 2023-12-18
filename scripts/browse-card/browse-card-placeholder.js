import { htmlToElement } from '../scripts.js';
import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

const defaultNumberOfCards = 4;
let shimmerContent = '';
const shimmerParent = document.createElement('div');
shimmerParent.classList.add('shimmer-placeholder');

const buildPlaceholder = (() => {
  for (let i = 0; i < defaultNumberOfCards; i += 1) {
    shimmerContent = htmlToElement(
      `<div class="shimmer-placeholder-isloading">
        <div class="shimmer-placeholder-image"></div>
        <div class="shimmer-placeholder-content">
          <div class="shimmer-placeholder-description"></div>
          <div class="shimmer-placeholder-description"></div>
          <div class="shimmer-placeholder-description"></div>
          <div class="shimmer-placeholder-text-container">
            <div class="shimmer-placeholder-main-text"></div>
            <div class="shimmer-placeholder-sub-text"></div>
          </div>
        <div class="shimmer-placeholder-btn"></div>
      </div>`,
    );
    shimmerParent.append(shimmerContent);
  }
  return shimmerParent.outerHTML;
})();

export default buildPlaceholder;
