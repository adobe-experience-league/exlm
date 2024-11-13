import { loadCSS as loadCSSFiles } from '../lib-franklin.js';

const DEFAULT_SHIMMER_COUNT = 4;

export default class BrowseCardShimmer {
  constructor(count = DEFAULT_SHIMMER_COUNT) {
    this.count = count;
    this.shimmerContainer = document.createElement('div');
    this.shimmerContainer.className = 'browse-card-shimmer';
    BrowseCardShimmer.loadCSS();
  }

  static loadCSS() {
    loadCSSFiles(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-shimmer.css`);
  }

  static renderAnimationStrip(width, height) {
    return `<p class="loading-shimmer" style="--placeholder-width: ${width}; max-width:${width}; ${
      height ? `--placeholder-height: ${height}` : ''
    }"></p>`;
  }

  render() {
    this.shimmerContainer.innerHTML = '';
    for (let i = 0; i < this.count; i += 1) {
      this.shimmerContainer.innerHTML += `
     <div class="browse-card-shimmer-wrapper">
      ${BrowseCardShimmer.renderAnimationStrip('100%', '198px')}
      <div class="browse-card-shimmer-text-wrapper">
        ${BrowseCardShimmer.renderAnimationStrip('100px', '14px')}
        ${BrowseCardShimmer.renderAnimationStrip('100%', '24px')}
        ${BrowseCardShimmer.renderAnimationStrip('100%', '36px')}
      </div>
      <div class="browse-card-shimmer-cta-wrapper" >
        ${BrowseCardShimmer.renderAnimationStrip('44px', '20px')}
        ${BrowseCardShimmer.renderAnimationStrip('64px', '20px')}
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
