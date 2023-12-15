import { htmlToElement } from '../scripts.js'
import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

let defaultNumberOfCards = 4;
let shimmerContent = '';
let shimmerParent = document.createElement('div');
shimmerParent.classList.add('shimmer-curated-cards-content');

const loader = (() => {
  for (let i= 0; i < defaultNumberOfCards; i++){
    shimmerContent =  htmlToElement(
      `<div><div class="card-isloading">
        <div class="loading-image"></div>
        <div class="loading-content">
        <div class="loading-text-container">
          <div class="loading-main-text"></div>
          <div class="loading-sub-text"></div>
        </div>
        <div class="loading-btn"></div>
      </div><div>`,
    );
    shimmerParent.append(shimmerContent)
  }
    return shimmerParent.outerHTML
})();

export default loader;