import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

export default class BuildPlaceholder {
  constructor(records, block) {
    this.records = records;
    this.shimmer = document.createElement('div');
    this.shimmer.classList.add('browse-card-shimmer');
    block.appendChild(this.shimmer);
    this.shimmer.appendChild(this.content());
  }

  content() {
    const defaultNumberOfCards = this.records || 4;
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

  show() {
    this.shimmer.querySelector('.shimmer-placeholder').classList.remove('hide-shimmer');
  }

  hide() {
    this.shimmer.querySelector('.shimmer-placeholder').classList.add('hide-shimmer');
  }

  setParent(contentDiv) {
    this.shimmer.appendChild(contentDiv);
  }
}
