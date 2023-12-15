import { htmlToElement } from '../scripts.js';
import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

const defaultNumberOfCards = 4;
let shimmerContent = '';
const shimmerParent = document.createElement('div');
shimmerParent.classList.add('shimmer-block');

const loader = (() => {
  for (let i = 0; i < defaultNumberOfCards; i += 1) {
    shimmerContent = htmlToElement(
      `<div class="shimmer-block-isloading">
        <div class="shimmer-block-image"></div>
        <div class="shimmer-block-content">
        <div class="shimmer-block-text-container">
          <div class="shimmer-block-main-text"></div>
          <div class="shimmer-block-sub-text"></div>
        </div>
        <div class="shimmer-block-btn"></div>
      </div>`,
    );
    shimmerParent.append(shimmerContent);
  }
  return shimmerParent.outerHTML;
})();

export default loader;
