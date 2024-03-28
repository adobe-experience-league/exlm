import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

const DEFAULT_SHIMMER_COUNT = 4;

export default class BuildPlaceholder {
  constructor(count = DEFAULT_SHIMMER_COUNT) {
    this.count = count;
    this.shimmer = document.createElement('div');
    this.shimmer.className = 'shimmer-placeholder';
    this.initialise();
  }

  initialise() {
    for (let i = 0; i < this.count; i += 1) {
      this.shimmer.innerHTML += `<div class="shimmer-placeholder-isloading">
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
  }

  updateCount(count = null) {
    if (count !== null && !Number.isNaN(count) && count !== this.count) {
      this.count = count;
      this.initialise();
    }
  }

  add(block) {
    block.append(this.shimmer);
  }

  remove() {
    this.shimmer.remove();
  }
}
