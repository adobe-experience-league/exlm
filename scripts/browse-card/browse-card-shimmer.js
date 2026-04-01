import { loadCSS as loadCSSFiles } from '../lib-franklin.js';

const DEFAULT_SHIMMER_COUNT = 4;

export const BROWSE_CARD_SHIMMER_VARIANTS = {
  DEFAULT: 'default',
  MEDIUM_CARD: 'medium-card',
  LONG_CARD: 'long-card',
};

export default class BrowseCardShimmer {
  constructor(count = DEFAULT_SHIMMER_COUNT, contentType = BROWSE_CARD_SHIMMER_VARIANTS.DEFAULT) {
    this.count = count;
    const type = (Array.isArray(contentType) ? contentType[0] : contentType)?.toLowerCase?.() ?? '';
    this.variant =
      type.includes('cohort') || type.includes('course')
        ? BROWSE_CARD_SHIMMER_VARIANTS.MEDIUM_CARD
        : BROWSE_CARD_SHIMMER_VARIANTS.DEFAULT;
    this.shimmerContainer = document.createElement('div');
    this.shimmerContainer.className = `browse-card-shimmer browse-card-shimmer-${this.variant}`;
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

  static renderMediumCardWrapper() {
    const figureHeight = '197px';
    return `
     <div class="browse-card-shimmer-wrapper browse-card-shimmer-wrapper-medium-card">
      <div class="browse-card-shimmer-figure">${BrowseCardShimmer.renderAnimationStrip('100%', figureHeight)}</div>
      <div class="browse-card-shimmer-text-wrapper">
        ${BrowseCardShimmer.renderAnimationStrip('100%', '20px')}
        ${BrowseCardShimmer.renderAnimationStrip('80%', '16px')}
      </div>
     </div>`;
  }

  static renderLongCardWrapper() {
    const figureHeight = '312px';
    return `
     <div class="browse-card-shimmer-wrapper browse-card-shimmer-wrapper-long-card">
      <div class="browse-card-shimmer-figure">${BrowseCardShimmer.renderAnimationStrip('100%', figureHeight)}</div>
      <div class="browse-card-shimmer-text-wrapper">
        ${BrowseCardShimmer.renderAnimationStrip('100%', '20px')}
        ${BrowseCardShimmer.renderAnimationStrip('90%', '14px')}
        ${BrowseCardShimmer.renderAnimationStrip('70%', '14px')}
      </div>
      <div class="browse-card-shimmer-footer">
        ${BrowseCardShimmer.renderAnimationStrip('72px', '24px')}
        ${BrowseCardShimmer.renderAnimationStrip('88px', '24px')}
        ${BrowseCardShimmer.renderAnimationStrip('64px', '24px')}
      </div>
     </div>`;
  }

  static renderDefaultWrapper() {
    return `
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

  render() {
    this.shimmerContainer.innerHTML = '';
    let wrapperHtml;
    if (this.variant === BROWSE_CARD_SHIMMER_VARIANTS.MEDIUM_CARD) {
      wrapperHtml = BrowseCardShimmer.renderMediumCardWrapper();
    } else if (this.variant === BROWSE_CARD_SHIMMER_VARIANTS.LONG_CARD) {
      wrapperHtml = BrowseCardShimmer.renderLongCardWrapper();
    } else {
      wrapperHtml = BrowseCardShimmer.renderDefaultWrapper();
    }
    for (let i = 0; i < this.count; i += 1) {
      this.shimmerContainer.innerHTML += wrapperHtml;
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

  updateVariant(newVariant) {
    if (newVariant in BROWSE_CARD_SHIMMER_VARIANTS) {
      this.variant = newVariant;
      this.shimmerContainer.className = `browse-card-shimmer browse-card-shimmer-${this.variant}`;
      this.render();
    }
  }
}
