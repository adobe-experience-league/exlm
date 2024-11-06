import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-shimmer.css`); // load placeholder css dynamically

const DEFAULT_SHIMMER_COUNT = 4;

export default class BrowseCardShimmer {
  static renderShimmer(count = DEFAULT_SHIMMER_COUNT, element = null) {
    const shimmer = element || document.createElement('div');
    shimmer.className = 'shimmer-placeholder';
    if (element) {
      shimmer.innerHTML = ``;
    }
    for (let i = 0; i < count; i += 1) {
      shimmer.innerHTML += `<div class="shimmer-placeholder-isloading">
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
