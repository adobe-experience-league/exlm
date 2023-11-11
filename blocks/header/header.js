import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * @param {HTMLElement} block
 * @returns {HTMLElement}
 */
const getBlockFirstCell = (block) => block.querySelector(':scope > div > div');

/**
 * @param {HTMLElement} block
 * @returns {HTMLElement}
 */
const getBlockFirstRow = (block) => block.querySelector(':scope > div');

/**
 * simplified single cell block to one wrapper div.
 * @param {HTMLElement} el
 * @param {string} selector
 * @returns {HTMLElement}
 */
const simplifySingleCellBlock = (block) => {
  const firstRowFirstCell = getBlockFirstCell(block);
  block.innerHTML = firstRowFirstCell.innerHTML;
  return block;
};

// fetch fragment html
const fetchFragment = async (rePath, lang = 'en') => {
  const response = await fetch(`/fragments/${lang}/${rePath}.plain.html`);
  return response.text();
};
// // Desktop Only (1025px onwards)
// const isDesktop = window.matchMedia('(min-width: 1025px)');
// // Mobile Only (Until 1024px)
// const isMobile = window.matchMedia('(max-width: 1024px)');

/** @param {HTMLElement} brandBlock */
const brandDecorator = (brandBlock) => {
  simplifySingleCellBlock(brandBlock);

  const brandLink = brandBlock.querySelector('a'); // we expect one.
  const logoIcon = brandLink.querySelector('.icon').cloneNode(true);
  const brandText = brandLink.childNodes[0].textContent; // first text node is the brand text

  // desktop brand is a text link
  const desktopLink = brandLink.cloneNode(true);
  desktopLink.classList.add('brand-desktop');
  desktopLink.innerHTML = brandText;

  // mobile brand is an icon link
  const mobileLink = brandLink.cloneNode(true);
  mobileLink.innerHTML = '';
  mobileLink.ariaLabel = brandText;
  mobileLink.classList.add('brand-mobile');
  mobileLink.appendChild(logoIcon);

  // replace the brand block with the two links
  brandBlock.replaceChildren(desktopLink, mobileLink);
};

const hamburgerButton = (navWrapper) => {
  const button = document.createElement('button');
  button.classList.add('nav-hamburger');
  button.ariaLabel = 'Navigation menu';
  button.ariaExpanded = 'false';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-controls', 'nav-wrapper');
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    navWrapper.classList.toggle('nav-wrapper-expanded');
  });
  return button;
};

/** @param {string} html */
function htmlToElement(html) {
  const template = document.createElement('template');
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstChild;
}

/**
 * @param {HTMLUListElement} ul
 */
const buildNavItems = (ul) => {
  [...ul.children].forEach((navItem, index) => {
    navItem.classList.add('nav-item');
    const controlName = `content-${index}`;
    const content = navItem.querySelector(':scope > ul');
    if (content) {
      const firstEl = navItem.firstElementChild;
      const toggler = htmlToElement(
        `<button class="nav-item-toggle" aria-controls="${controlName}" aria-expanded="false">${firstEl.textContent}</button>`,
      );
      firstEl.replaceWith(toggler);
      content.setAttribute('id', controlName);
      content.classList.add('nav-item-content');

      toggler.addEventListener('click', () => {
        const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
        toggler.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('nav-item-content-expanded');
      });
      buildNavItems(content);
    } else {
      navItem.classList.add('nav-item-leaf');
    }
  });
};

/** @param {HTMLElement} navBlock  */
const navDecorator = (navBlock) => {
  simplifySingleCellBlock(navBlock);

  const navWrapper = document.createElement('div');
  navWrapper.classList.add('nav-wrapper');
  const hamburger = hamburgerButton(navWrapper);
  navWrapper.replaceChildren(hamburger, ...navBlock.children);
  navBlock.replaceChildren(navWrapper);

  // build navItems
  const ul = navWrapper.querySelector(':scope > ul');
  buildNavItems(ul);

  navBlock.firstChild.id = hamburger.getAttribute('aria-controls');

  navBlock.prepend(hamburger);
};

const searchDecorator = (searchBlock) => {
  simplifySingleCellBlock(searchBlock);
};

const signUpDecorator = (signUpBlock) => {
  simplifySingleCellBlock(signUpBlock);
};

const languageDecorator = (languageBlock) => {
  simplifySingleCellBlock(languageBlock);
};

const signInDecorator = (signInBlock) => {
  simplifySingleCellBlock(signInBlock);
};

const adobeLogoDecorator = (adobeLogoBlock) => {
  simplifySingleCellBlock(adobeLogoBlock);
};

const headerDecorators = {
  brand: brandDecorator,
  nav: navDecorator,
  search: searchDecorator,
  'sign-up': signUpDecorator,
  'language-selector': languageDecorator,
  'sign-in': signInDecorator,
  'adobe-logo': adobeLogoDecorator,
};

/**
 *
 * @param {HTMLElement} headerBlock
 */
export default async function decorate(headerBlock) {
  // eslint-disable-next-line no-unused-vars
  const [headerFragment, languagesFragment] = await Promise.all([
    fetchFragment('header/header'),
    fetchFragment('languages/languages'),
  ]);
  headerBlock.innerHTML = headerFragment;

  const headerBlockFirstRow = getBlockFirstRow(headerBlock);
  headerBlockFirstRow.outerHTML = `<nav>${headerBlockFirstRow.innerHTML}</nav>`;
  const nav = headerBlock.querySelector('nav');
  nav.role = 'navigation';
  nav.ariaLabel = 'Main navigation';

  // decorate each header block sequentially
  [...nav.children].forEach((block) => {
    const blockName = block.className;
    const decorator = headerDecorators[blockName];
    if (decorator) {
      decorator(block);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`No decorator found for header block: ${blockName}`);
    }
  });

  decorateIcons(headerBlock);
}
