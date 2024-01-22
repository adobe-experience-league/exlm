import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

export default class BuildPlaceholder {
  constructor() {
    this.shimmer = document.createElement('div');
    this.shimmer.className = 'shimmer-placeholder';
    this.initialise();
  }

  initialise() {
    for (let i = 0; i < 4; i += 1) {
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

  add(block) {
    block.append(this.shimmer);
  }

  remove() {
    this.shimmer.remove();
  }
}
