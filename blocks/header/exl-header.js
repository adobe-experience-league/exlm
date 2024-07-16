import { htmlToElement } from './importedFunctions.js';

const HEADER_CSS = `${window.hlx.codeBasePath}/blocks/header/header-old.css`;

/**
 *
 * @param {HTMLElement} headerBlock
 */

class CustomHeader extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({ mode: 'open' });
    this.loadStyles();
  }

  loadStyles() {
    const cssLink = htmlToElement(`<link rel="stylesheet" href="${HEADER_CSS}">`);
    this.shadowRoot.appendChild(cssLink);
  }
}

// Define the new element
customElements.define('exl-header', CustomHeader);
