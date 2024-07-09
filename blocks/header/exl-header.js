import { htmlToElement } from '../../scripts/scripts.js';

const HEADER_CSS = `${window.hlx.codeBasePath}/blocks/header/header-old.css`;

const headerHtml = fetch(`${window.hlx.codeBasePath}/blocks/header/header.html`);

class CustomHeader extends HTMLElement {
  constructor() {
    super(); // Always call super first in constructor
    // Attach a shadow root to the element.
    this.attachShadow({ mode: 'open' });
    this.loadStyles();
    this.render();
  }

  loadStyles() {
    const cssLink = htmlToElement(`<link rel="stylesheet" href="${HEADER_CSS}">`);
    this.shadowRoot.appendChild(cssLink);
  }

  render() {
    // DO NOT DO THIS.
    // or you could, just besure to parameterize links, labels, sign-in behaviour ...etc
    headerHtml.then((response) => {
      response.text().then((html) => {
        this.shadowRoot.appendChild(htmlToElement(html));
      });
    });
  }
}
// Define the new element
customElements.define('exl-header', CustomHeader);
