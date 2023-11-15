import { decorateIcons } from '../../scripts/lib-franklin.js';
import { registerResizeHandler } from './header-utils.js';

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

/**
 * https://www.codemzy.com/blog/random-unique-id-javascript
 * @param {number} length
 */
const randomId = (length = 6) =>
  Math.random()
    .toString(36)
    .substring(2, length + 2);

/**
 * @param {HTMLElement} block
 * @param {number} row
 * @param {number} cell
 * @returns
 */
const getCell = (block, row, cell) =>
  block.querySelector(
    `:scope > div:nth-child(${row}) > div:nth-child(${cell})`,
  );

/**
 * creates an element from html string
 * @param {string} html
 * @returns {HTMLElement}
 */
function htmlToElement(html) {
  const template = document.createElement('template');
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstElementChild;
}
// fetch fragment html
const fetchFragment = async (rePath, lang = 'en') => {
  const response = await fetch(`/fragments/${lang}/${rePath}.plain.html`);
  return response.text();
};
// Mobile Only (Until 1024px)
const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

const decoratorState = {};

/**
 * Decorates the brand block
 * @param {HTMLElement} brandBlock
 * */
const brandDecorator = (brandBlock) => {
  simplifySingleCellBlock(brandBlock);
  const brandLink = brandBlock.querySelector('a'); // we expect one.
  brandBlock.replaceChildren(brandLink);
  return brandBlock;
};

/**
 * adds hambuger button to nav wrapper
 * @param {HTMLElement} navWrapper
 * @returns {HTMLButtonElement}
 */
const hamburgerButton = (navWrapper) => {
  const navWrapperId = 'nav-wrapper';
  const button = htmlToElement(`
    <button 
      class="nav-hamburger"
      aria-label="Navigation menu"
      aria-expanded="false"
      aria-haspopup="true"
      aria-controls="${navWrapperId}"></button>`);
  navWrapper.id = navWrapperId;
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    navWrapper.classList.toggle('nav-wrapper-expanded');
  });
  return button;
};

/**
 * Builds nav items from the provided basic list
 * @param {HTMLUListElement} ul
 */
const buildNavItems = (ul, level = 0) => {
  if (level === 0) {
    ul.appendChild(
      htmlToElement(
        `<li class="nav-item-mobile">${decoratorState.searchLinkHtml}</li>`,
      ),
    );

    ul.appendChild(
      htmlToElement(
        `<li class="nav-item-mobile">
          <p>${decoratorState.languageTitle}</p>
          <ul>
            ${decoratorState.languages
              .map((l) => `<li><a href="${l.lang}">${l.title}</a></li>`)
              .join('')}
          </ul>
        </li>`,
      ),
    );
  }
  [...ul.children].forEach((navItem) => {
    const navItemClasses = ['nav-item'];
    if (level === 0) navItemClasses.push('nav-item-root');
    navItem.classList.add(...navItemClasses);
    const controlName = `content-${level}-${randomId()}`; // unique id
    const content = navItem.querySelector(':scope > ul');
    if (content) {
      const firstEl = navItem.firstElementChild;
      const toggleClass =
        level === 0
          ? 'nav-item-toggle nav-item-toggle-root'
          : 'nav-item-toggle';
      const toggler = htmlToElement(
        `<button class="${toggleClass}" aria-controls="${controlName}" aria-expanded="false">${firstEl.textContent}</button>`,
      );
      firstEl.replaceWith(toggler);
      content.setAttribute('id', controlName);
      content.classList.add('nav-item-content');

      /** @param {Event} e */
      const toggleExpandContent = (e) => {
        const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
        toggler.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('nav-item-content-expanded');
        content.parentElement.classList.toggle('nav-item-expanded');
        if (e.type === 'mouseenter') {
          const childContents = e.target.querySelectorAll('.nav-item-content');
          childContents.forEach((childContent) => {
            childContent.classList.add('nav-item-content-expanded');
          });
        }
      };
      // listen for page resize, update events accordingly
      registerResizeHandler(() => {
        if (isMobile()) {
          // if mobile, add click event, remove mouseenter/mouseleave
          toggler.addEventListener('click', toggleExpandContent);
          toggler.parentElement.removeEventListener(
            'mouseenter',
            toggleExpandContent,
          );
          toggler.parentElement.removeEventListener(
            'mouseleave',
            toggleExpandContent,
          );
        } else {
          // if desktop, add mouseenter/mouseleave, remove click event
          toggler.removeEventListener('click', toggleExpandContent);
          if (level === 0) {
            toggler.parentElement.addEventListener(
              'mouseenter',
              toggleExpandContent,
            );
            toggler.parentElement.addEventListener(
              'mouseleave',
              toggleExpandContent,
            );
          }
        }
      });
      buildNavItems(content, level + 1);
    } else {
      navItem.classList.add('nav-item-leaf');
      // if nav item is a leaf, remove the <p> wrapper
      const firstEl = navItem.firstElementChild;
      if (firstEl?.tagName === 'P') {
        if (firstEl.firstElementChild?.tagName === 'A') {
          firstEl.replaceWith(firstEl.firstElementChild);
        }
      }
      // if nav item has a second element, it's a subtitle
      const secondEl = navItem.children[1];
      if (secondEl?.tagName === 'P') {
        const subtitle = htmlToElement(
          `<span class="nav-item-subtitle">${secondEl.innerHTML}</span>`,
        );
        navItem.firstElementChild.appendChild(subtitle);
        secondEl.remove();
      }
    }
  });
};

/**
 * Decorates the nav block
 * @param {HTMLElement} navBlock
 */
const navDecorator = (navBlock) => {
  simplifySingleCellBlock(navBlock);
  const navWrapper = htmlToElement('<div class="nav-wrapper"></div>');
  const hamburger = hamburgerButton(navWrapper);
  navWrapper.replaceChildren(hamburger, ...navBlock.children);
  navBlock.replaceChildren(navWrapper);

  // build navItems
  const ul = navWrapper.querySelector(':scope > ul');
  buildNavItems(ul);

  navBlock.firstChild.id = hamburger.getAttribute('aria-controls');

  navBlock.prepend(hamburger);
  return navBlock;
};

/**
 * Decorates the search block
 * @param {HTMLElement} searchBlock
 */
const searchDecorator = (searchBlock) => {
  // save this for later use in mobile nav.
  const searchLink = getCell(searchBlock, 1, 1)?.firstChild;
  decoratorState.searchLinkHtml = searchLink.outerHTML;

  // get search placeholder
  const searchPlaceholder = getCell(searchBlock, 1, 2)?.firstChild;
  // build search options
  const searchOptions =
    getCell(searchBlock, 1, 3)?.firstElementChild?.children || [];

  const options = [...searchOptions]
    .map(
      (option) =>
        `<span class="search-picker-label">${option.textContent}</span>`,
    )
    .join('');

  searchBlock.innerHTML = `<div class="search-wrapper">
    <div class="search-short">
      <a href="https://experienceleague.adobe.com/search.html">
        <span class="icon icon-search"></span>
      </a>
    </div>
    <div class="search-full">
      <span class="icon icon-search"></span>
      <input autocomplete="off" class="search-input" type="text" role="combobox" placeholder="${searchPlaceholder.textContent}">
      <button type="button" class="search-picker-button" aria-haspopup="true" aria-controls="search-picker-popover">
        <span class="search-picker-label">All</span>
      </button>
      <div class="search-picker-popover" id="search-picker-popover">
        ${options}
      </div>
    <div>
  </div>`;
  decorateIcons(searchBlock);
  return searchBlock;
};

/**
 * Decorates the sign-up block
 * @param {HTMLElement} signUpBlock
 */
const signUpDecorator = (signUpBlock) => {
  simplifySingleCellBlock(signUpBlock);
  return signUpBlock;
};

/**
 * Decorates the language-selector block
 * @param {HTMLElement} languageBlock
 */
const languageDecorator = async (languageBlock) => {
  const title = getCell(languageBlock, 1, 1)?.firstChild.textContent;
  decoratorState.languageTitle = title;

  const popoverId = 'language-picker-popover';
  const prependLanguagePopover = async (parent) => {
    const languagesHtml = await fetchFragment('languages/languages');
    let languagesEl = htmlToElement(languagesHtml);
    languagesEl = languagesEl.querySelector('ul');

    const languageOptions = languagesEl?.children || [];
    const languages = [...languageOptions].map((option) => ({
      title: option.textContent,
      lang: option?.firstElementChild?.href,
    }));

    decoratorState.languages = languages;

    const options = languages
      .map(
        (option) =>
          `<span class="language-selector-label" data-value="${option.lang}">${option.title}</span>`,
      )
      .join('');
    const popover = htmlToElement(`
      <div class="language-selector-popover" id="${popoverId}">
        ${options}
      </div>`);
    parent.append(popover);
  };

  const languageHtml = `
      <button type="button" class="language-selector-button" aria-haspopup="true" aria-controls="language-picker-popover" aria-label="${title}">
        <span class="icon icon-globegrid"></span>
      </button>
    `;
  languageBlock.innerHTML = languageHtml;
  decorateIcons(languageBlock);
  await prependLanguagePopover(languageBlock);
  return languageBlock;
};

/**
 * Decorates the sign-in block
 * @param {HTMLElement} signInBlock
 */
const signInDecorator = (signInBlock) => {
  simplifySingleCellBlock(signInBlock);
  return signInBlock;
};

/**
 * Decorates the adobe-logo block
 * @param {HTMLElement} adobeLogoBlock
 */
const adobeLogoDecorator = (adobeLogoBlock) => {
  simplifySingleCellBlock(adobeLogoBlock);
  return adobeLogoBlock;
};

/** @param {HTMLElement} block  */
const decorateNewTabLinks = (block) => {
  const links = block.querySelectorAll('a[target="_blank"]');
  links.forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
    // insert before first text child node
    const icon = htmlToElement('<span class="icon icon-link-out"></span>');
    link.firstChild.after(icon);
  });
};

/** @param {HTMLElement} block  */
const decorateLinks = (block) => {
  const links = block.querySelectorAll('a');
  links.forEach((link) => {
    const decodedHref = decodeURIComponent(link.getAttribute('href'));
    const firstCurlyIndex = decodedHref.indexOf('{');
    const lastCurlyIndex = decodedHref.lastIndexOf('}');
    if (firstCurlyIndex > -1 && lastCurlyIndex > -1) {
      // get string between curly braces including curly braces
      const options = decodedHref.substring(
        firstCurlyIndex,
        lastCurlyIndex + 1,
      );
      Object.entries(JSON.parse(options)).forEach(([key, value]) => {
        link.setAttribute(key.trim(), value);
      });
      const endIndex =
        decodedHref.charAt(firstCurlyIndex - 1) === '#'
          ? firstCurlyIndex - 1
          : firstCurlyIndex;
      link.href = decodedHref.substring(0, endIndex);
    }
  });
};
/**
 * Main header decorator, calls all the other decorators
 * @param {HTMLElement} headerBlock
 */
export default async function decorate(headerBlock) {
  headerBlock.style.display = 'none';
  // eslint-disable-next-line no-unused-vars
  const headerFragment = await fetchFragment('header/header');
  headerBlock.innerHTML = headerFragment;

  const headerBlockFirstRow = getBlockFirstRow(headerBlock);
  headerBlockFirstRow.outerHTML = `<nav>${headerBlockFirstRow.innerHTML}</nav>`;
  const nav = headerBlock.querySelector('nav');
  nav.role = 'navigation';
  nav.ariaLabel = 'Main navigation';

  // order matters.
  const decorators = [
    { className: 'brand', decorator: brandDecorator },
    { className: 'search', decorator: searchDecorator },
    { className: 'sign-up', decorator: signUpDecorator },
    { className: 'language-selector', decorator: languageDecorator },
    { className: 'sign-in', decorator: signInDecorator },
    { className: 'adobe-logo', decorator: adobeLogoDecorator },
    { className: 'nav', decorator: navDecorator },
  ];

  for (let i = 0; i < decorators.length; i += 1) {
    const { className, decorator } = decorators[i];
    const block = nav.querySelector(`:scope > .${className}`);
    if (block) {
      // eslint-disable-next-line no-await-in-loop
      await decorator(block);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`No header block found for class: ${className}`);
    }
  }

  decorateLinks(headerBlock);
  decorateNewTabLinks(headerBlock);

  // do this at the end, always.
  decorateIcons(headerBlock);
  headerBlock.style.display = '';
}
