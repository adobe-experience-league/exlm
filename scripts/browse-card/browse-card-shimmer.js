import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-shimmer.css`); // load placeholder css dynamically

const DEFAULT_SHIMMER_COUNT = 4;

export default class BrowseCardShimmer {
  static renderShimmer(count = DEFAULT_SHIMMER_COUNT, element = null) {
    const shimmer = element || document.createElement('div');
    shimmer.className = 'browse-card-shimmer';
    if (element) {
      shimmer.innerHTML = ``;
    }
    for (let i = 0; i < count; i += 1) {
      shimmer.innerHTML += `<div class="browse-card-shimmer-isloading">
          <div class="browse-card-shimmer-image"></div>
          <div class="browse-card-shimmer-content">
            <div class="browse-card-shimmer-description"></div>
            <div class="browse-card-shimmer-text-container">
              <div class="browse-card-shimmer-main-text"></div>
              <div class="browse-card-shimmer-sub-text"></div>
            </div>
            <div class="browse-card-shimmer-btn"></div>
          </div>
        </div>`;
    }
    return shimmer;
  }

  static create(count, block) {
    const shimmer = this.renderShimmer(count);
    if (block) {
      block.append(shimmer);
    }
    return shimmer;
  }

  static updateCount(shimmerEl, count = DEFAULT_SHIMMER_COUNT) {
    const shimmer = this.renderShimmer(count, shimmerEl);
    return shimmer;
  }
}
