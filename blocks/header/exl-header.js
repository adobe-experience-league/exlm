import { htmlToElement } from './importedFunctions.js';

const HEADER_CSS = `${window.hlx.codeBasePath}/blocks/header/header.css`;
const SEARCH_CSS = `${window.hlx.codeBasePath}/scripts/search/search.css`;

// /**
//  * Main header decorator, calls all the other decorators
//  * @param {HTMLHeadElement} headerBlock
//  */

// export default async function decorate(headerBlock) {
//   const newComponent = document.createElement('ex-header');

//   headerBlock.appendChild(newHeader);
//   const exlHeader = document.createElement('div');
//   newHeader.appendChild(exlHeader);

//   exlHeader.style.display = 'none';
//   console.log("here")
//   loadSearchElement();
//   const [solutionTag] = getMetadata('solution').trim().split(',');
//   if (solutionTag) {
//     window.headlessSolutionProductKey = solutionTag;
//   }

//   // eslint-disable-next-line no-unused-vars
//   exlHeader.innerHTML = headerFragment

//   const exlHeaderFirstRow = getBlockFirstRow(exlHeader);
//   exlHeaderFirstRow.outerHTML = `<nav>${exlHeaderFirstRow.innerHTML}</nav>`;
//   const nav = exlHeader.querySelector('nav');
//   nav.role = 'navigation';
//   nav.ariaLabel = 'Main navigation';
//   nav.style.display = 'flex';

//   const navOverlay = document.createElement('div');
//   navOverlay.classList.add('nav-overlay', 'hidden');
//   document.body.appendChild(navOverlay);

//   const decorateHeaderBlock = async (className, decorator) => {
//     const block = nav.querySelector(`:scope > .${className}`);
//     await decorator(block);
//   };

//   // Do this first to ensure all links are decorated correctly before they are used.
//   decorateLinks(exlHeader);

//   decorateHeaderBlock('brand', brandDecorator);
//   decorateHeaderBlock('search', searchDecorator);
//   decorateHeaderBlock('language-selector', languageDecorator);
//   decorateHeaderBlock('product-grid', productGridDecorator);
//   decorateHeaderBlock('sign-in', signInDecorator);
//   decorateHeaderBlock('profile-menu', profileMenuDecorator);
//   decorateHeaderBlock('adobe-logo', adobeLogoDecorator);
//   await decorateHeaderBlock('nav', navDecorator);

//   decorateNewTabLinks(exlHeader);

//   // do this at the end, always.
//   decorateIcons(exlHeader);
//   exlHeader.style.display = '';
// }

/**
 *
 * @param {HTMLElement} headerBlock
 */

class CustomHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  loadStyles() {
    const cssLink = htmlToElement(`<link rel="stylesheet" href="${HEADER_CSS}">`);
    const searchLink = htmlToElement(`<link rel="stylesheet" href="${SEARCH_CSS}">`);
    this.shadowRoot.append(cssLink);
    this.shadowRoot.append(searchLink);
  }

  connectedCallback() {
    this.loadStyles();
  }
}

// Define the new element
customElements.define('exl-header', CustomHeader);
