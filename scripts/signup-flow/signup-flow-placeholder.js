import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/signup-flow/signup-flow-placeholder.css`); // load placeholder css dynamically

export default class Shimmer {
  constructor() {
    this.shimmer = document.createElement('div');
    this.shimmer.className = 'shimmer';
    const loader = document.createElement('span');
    loader.classList.add('loader');
    this.shimmer.append(loader);
  }

  add(container) {
    this.container = container;
    this.container.classList.add('shimmer-container');
    this.container.append(this.shimmer);
  }

  remove() {
    this.container.classList.remove('shimmer-container');
    this.shimmer.remove();
  }
}
