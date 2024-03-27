import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

const DEFAULT_SHIMMER_COUNT = 4;

export default class BuildPlaceholder {
  constructor(config = {}) {
    const { count = DEFAULT_SHIMMER_COUNT, variant = '' } = config;
    this.count = count;
    this.variant = variant;
    this.shimmer = document.createElement('div');
    this.setVariant();
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

  setVariant() {
    this.shimmer.className = `shimmer-placeholder ${this.variant}`;
  }

  updateConfig({ count = null, variant = null }) {
    if (count !== null && !Number.isNaN(count) && count !== this.count) {
      this.count = count;
      this.initialise();
    }
    if (variant !== null && variant !== this.variant) {
      this.variant = variant;
      this.setVariant();
    }
  }

  add(block) {
    block.append(this.shimmer);
  }

  remove() {
    this.shimmer.remove();
  }
}
