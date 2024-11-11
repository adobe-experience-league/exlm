import { loadCSS } from '../lib-franklin.js';

const DEFAULT_SHIMMER_COUNT = 4;

export default class BrowseCardShimmer {
  constructor(count = DEFAULT_SHIMMER_COUNT) {
    this.count = count;
    this.shimmerContainer = document.createElement('div');
    this.shimmerContainer.className = 'browse-card-shimmer';
    this.loadCSS();
  }

  loadCSS() {
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-shimmer.css`);
  }

  renderAnimationStrip(width, height) {
    return `<p class="loading-shimmer" style="--placeholder-width: ${width}; max-width:${width}; ${height ? `--placeholder-height: ${height}` : ''}"></p>`
  }

  render() {
    this.shimmerContainer.innerHTML = '';
    for (let i = 0; i < this.count; i++) {
      this.shimmerContainer.innerHTML += `
     <div class="browse-card-shimmer-wrapper">
      ${this.renderAnimationStrip('100%', '198px')}
      <div class="browse-card-shimmer-text-wrapper">
        ${this.renderAnimationStrip('100px', '14px')}
        ${this.renderAnimationStrip('100%', '24px')}
        ${this.renderAnimationStrip('100%', '36px')}
      </div>
      <div class="browse-card-shimmer-cta-wrapper" >
        ${this.renderAnimationStrip('44px', '20px')}
        ${this.renderAnimationStrip('64px', '20px')}
      </div>
     </div>`;
    }
  }

  addShimmer(targetElement) {
    this.render();
    if (targetElement) {
      targetElement.appendChild(this.shimmerContainer);
    }
  }

  removeShimmer() {
    if (this.shimmerContainer.parentNode) {
      this.shimmerContainer.parentNode.removeChild(this.shimmerContainer);
    }
  }

  updateCount(newCount) {
    this.count = newCount;
    this.render();
  }
}