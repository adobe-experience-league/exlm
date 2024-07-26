import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/signup-flow/signup-flow-shimmer.css`); // load placeholder css dynamically

export default class SignUpFlowShimmer {
  constructor() {
    this.shimmer = document.createElement('div');
    this.shimmer.className = 'signup-flow-shimmer';
    const loader = document.createElement('span');
    loader.classList.add('signup-flow-loader');
    this.shimmer.append(loader);
  }

  add(container) {
    this.container = container;
    this.container.classList.add('signup-flow-shimmer-container');
    this.container.append(this.shimmer);
  }

  remove() {
    this.container.classList.remove('signup-flow-shimmer-container');
    this.shimmer.remove();
  }
}
