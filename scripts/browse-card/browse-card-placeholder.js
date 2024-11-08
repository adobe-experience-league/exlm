import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-placeholder.css`); // load placeholder css dynamically

const DEFAULT_SHIMMER_COUNT = 4;

export default class BuildPlaceholder {
  constructor(count = DEFAULT_SHIMMER_COUNT) {
    this.count = count;
    this.shimmer = document.createElement('div');
    this.shimmer.className = 'shimmer-placeholder';
    // this.initialise();

    this.count = count;
    this.shimmerContainer = document.createElement('div');
    this.shimmerContainer.className = 'shimmer-placeholder';
    this.loadCSS(); // Load the CSS when an instance is created
  }



  // Method to load the CSS for shimmer effect
  loadCSS() {
    loadCSS(`${window.hlx.codeBasePath}/scripts/browse-card/browse-card-shimmer.css`);
  }

  renderAnimationStrip(width, height) {
    return `<p class="loading-shimmer" style="--placeholder-width: ${width}; max-width:${width}; ${height ? `--placeholder-height: ${height}` : ''}"></p>`
  }


  // Method to render shimmer elements
  render() {
    this.shimmerContainer.innerHTML = '';
    for (let i = 0; i < this.count; i++) {
      this.shimmerContainer.innerHTML += `
     <div class="shimmer-placeholder-isloading">
      ${this.renderAnimationStrip('100%', '198px')}
      <div style="display: flex; flex-direction: column; justify-content: flex-start; margin: 0 16px">
        ${this.renderAnimationStrip('100px', '14px')}
        ${this.renderAnimationStrip('100%', '24px')}
        ${this.renderAnimationStrip('100%', '36px')}
      </div>
      <div style="display: flex; justify-content: space-around" >
        ${this.renderAnimationStrip('44px', '20px')}
        ${this.renderAnimationStrip('64px', '20px')}
      </div>
     </div>`;
    }
  }



  // Method to add shimmer to a specific element
  addShimmer(targetElement) {
    this.render();
    if (targetElement) {
      targetElement.appendChild(this.shimmerContainer);
    }
  }



  // Method to remove shimmer
  removeShimmer() {
    if (this.shimmerContainer.parentNode) {
      this.shimmerContainer.parentNode.removeChild(this.shimmerContainer);
    }
  }



  // Method to update shimmer count and re-render
  updateCount(newCount) {
    this.count = newCount;
    this.render();
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
