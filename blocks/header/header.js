import { decorateIcons } from '../../scripts/lib-franklin.js';
import { loadIms } from '../../scripts/scripts.js';
import { signOut } from '../../scripts/auth/auth-operations.js';
import Search from '../../scripts/search/search.js';
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
const getCell = (block, row, cell) => block.querySelector(`:scope > div:nth-child(${row}) > div:nth-child(${cell})`);

/**
 * creates an element from html string
 * @param {string} html
 * @returns {HTMLElement}
 */
function htmlToElement(html) {
  const template = document.createElement('template');
  // Never return a text node of whitespace as the result
  const trimmedHtml = html.trim();
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

const headerFragment = fetchFragment('header/header');
const languageFragment = fetchFragment('languages/languages');
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

let adobeIMS = {
  isSignedInUser: () => false,
};
try {
  const ims = await loadIms();
  adobeIMS = ims.adobeIMS;
} catch {
  // eslint-disable-next-line no-console
  console.warn('Adobe IMS not available.');
}
const isSignedIn = adobeIMS?.isSignedInUser();

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
    // add search link (visible on mobile only)
    ul.appendChild(htmlToElement(`<li class="nav-item-mobile">${decoratorState.searchLinkHtml}</li>`));
    // add language select (visible on mobile only)
    ul.appendChild(
      htmlToElement(
        `<li class="nav-item-mobile">
          <p>${decoratorState.languageTitle}</p>
          <ul>
            ${decoratorState.languages.map((l) => `<li><a href="${l.lang}">${l.title}</a></li>`).join('')}
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
    const [content, secondaryContent] = navItem.querySelectorAll(':scope > ul');
    if (content) {
      const firstEl = navItem.firstElementChild;
      const toggleClass = level === 0 ? 'nav-item-toggle nav-item-toggle-root' : 'nav-item-toggle';
      const toggler = htmlToElement(
        `<button class="${toggleClass}" aria-controls="${controlName}" aria-expanded="false">${firstEl.textContent}</button>`,
      );
      const navItemContent = document.createElement('div');
      navItemContent.append(content);
      navItemContent.setAttribute('id', controlName);
      navItemContent.classList.add('nav-item-content');
      if (secondaryContent) {
        secondaryContent.classList.add('nav-items-secondary');
        navItemContent.append(secondaryContent);
      }
      const children = [toggler, navItemContent];

      navItem.replaceChildren(...children);
      const currentActiveClass = 'nav-item-expanded-active';
      const itemContentExpanded = 'nav-item-content-expanded';
      const itemExpanded = 'nav-item-expanded';

      const isNotAncestorOfToggler = (parent) =>
        parent && !parent.contains(toggler) && !parent.parentElement.contains(toggler);
      const getAllByClass = (className) => [...document.querySelectorAll(`.${className}`)];
      const removeClassFromAll = (className) =>
        getAllByClass(className).forEach((el) => el.classList.remove(className));
      const removeClassFromNonAncestorAll = (className) => {
        getAllByClass(className)
          .filter(isNotAncestorOfToggler)
          .forEach((el) => el.classList.remove(className));
      };

      const resetExpandedAttribute = () => {
        const els = document.querySelectorAll(`header [aria-expanded="true"]`);
        if (els && els.length)
          [...els].filter(isNotAncestorOfToggler).forEach((el) => el.setAttribute('aria-expanded', false));
      };

      const setExpandedState = (toggleElement, containerElement, expanded) => {
        // reset state

        // set new state
        resetExpandedAttribute();
        toggleElement.setAttribute('aria-expanded', expanded);
        // remove active class from all other expanded nav items
        removeClassFromNonAncestorAll(itemExpanded);
        removeClassFromNonAncestorAll(itemContentExpanded);
        removeClassFromAll(currentActiveClass);
        if (expanded) {
          containerElement.classList.add(itemContentExpanded);
          containerElement.parentElement.classList.add(itemExpanded);
          containerElement.parentElement.classList.add(currentActiveClass);
        } else {
          containerElement.classList.remove(itemContentExpanded);
          containerElement.parentElement.classList.remove(itemExpanded);
          containerElement.parentElement.classList.remove(currentActiveClass);
        }
      };

      /** @param {Event} e */
      const toggleExpandContent = (e) => {
        const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
        setExpandedState(toggler, navItemContent, !isExpanded);
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
          toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
          toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
        } else {
          // if desktop, add mouseenter/mouseleave, remove click event
          toggler.removeEventListener('click', toggleExpandContent);
          if (level === 0) {
            toggler.parentElement.addEventListener('mouseenter', toggleExpandContent);
            toggler.parentElement.addEventListener('mouseleave', toggleExpandContent);
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
        const subtitle = htmlToElement(`<span class="nav-item-subtitle">${secondEl.innerHTML}</span>`);
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

  if (isSignedIn) {
    // New Link under Learn Menu - Authenticated
    const recCourses = document.createElement('li');
    recCourses.classList.add('nav-item', 'nav-item-leaf');
    recCourses.innerHTML = `<a href="https://experienceleague.adobe.com/#dashboard/learning">Recommended courses<span class="nav-item-subtitle">Your expertly curated courses</span></a></li>`;
    document.querySelectorAll('.nav-item-toggle').forEach((el) => {
      const elContent = el.innerHTML.toLowerCase();
      if (elContent === 'content types') {
        el.nextSibling.querySelector('ul').prepend(recCourses);
      }
    });
  }
};

/**
 * Decorates the search block
 * @param {HTMLElement} searchBlock
 */
const searchDecorator = async (searchBlock) => {
  // save this for later use in mobile nav.
  const searchLink = getCell(searchBlock, 1, 1)?.firstChild;
  decoratorState.searchLinkHtml = searchLink.outerHTML;

  // get search placeholder
  const searchPlaceholder = getCell(searchBlock, 1, 2)?.firstChild;
  // build search options
  const searchOptions = getCell(searchBlock, 1, 3)?.firstElementChild?.children || [];
  const options = [...searchOptions].map((option) => option.textContent);

  searchBlock.innerHTML = '';
  const searchWrapper = htmlToElement(
    `<div class="search-wrapper">
      <div class="search-short">
        <a href="https://experienceleague.adobe.com/search.html">
          <span class="icon icon-search search-icon"></span>
        </a>
      </div>
      <div class="search-full">
        <div class="search-container">
          <span title="Search" class="icon icon-search"></span>
          <input autocomplete="off" class="search-input" type="text" title="Insert a query. Press enter to send" role="combobox" placeholder="${
            searchPlaceholder.textContent
          }">
          <span title="Clear" class="icon icon-clear search-clear-icon"></span>
          <div class="search-suggestions-popover">
            <ul role="listbox">
            </ul>
          </div>
        </div>
        <button type="button" class="search-picker-button" aria-haspopup="true" aria-controls="search-picker-popover">
          <span class="search-picker-label" data-filter-value="${options[0].split(':')[1]}">${
            options[0].split(':')[0] || ''
          }</span>
        </button>
        <div class="search-picker-popover" id="search-picker-popover">
          <ul role="listbox">
            ${options
              .map(
                (option, index) =>
                  `<li tabindex="0" role="option" class="search-picker-label" data-filter-value="${
                    option.split(':')[1]
                  }">${
                    index === 0
                      ? `<span class="icon icon-checkmark"></span> <span data-filter-value="${option.split(':')[1]}">${
                          option.split(':')[0]
                        }</span>`
                      : `<span data-filter-value="${option.split(':')[1]}">${option.split(':')[0]}</span>`
                  }</li>`,
              )
              .join('')}
          </ul>
        </div>
      <div>
    </div>
  `,
  );
  searchBlock.append(searchWrapper);
  await decorateIcons(searchBlock);

  const searchItem = new Search({ searchBlock });
  searchItem.configureAutoComplete({
    searchOptions: options,
  });
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
    let languagesEl = htmlToElement(await languageFragment);
    languagesEl = languagesEl.querySelector('ul');

    const languageOptions = languagesEl?.children || [];
    const languages = [...languageOptions].map((option) => ({
      title: option.textContent,
      lang: option?.firstElementChild?.href,
    }));

    decoratorState.languages = languages;

    const options = languages
      .map((option) => `<span class="language-selector-label" data-value="${option.lang}">${option.title}</span>`)
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

const signInDecorator = async (signInBlock) => {
  simplifySingleCellBlock(signInBlock);
  if (isSignedIn) {
    signInBlock.classList.add('signed-in');
    signInBlock.replaceChildren(
      htmlToElement(
        `<div class="profile">
          <button class="profile-toggle" aria-controls="profile-menu">
            <span class="icon icon-profile"></span>
          </button>
          <div class="profile-menu" id="profile-menu">
            <a href="#dashboard/profile">Profile</a>
            <a href="#dashboard/awards">Achievements</a>
            <a href="#dashboard/bookmarks">Bookmarks</a>
            <a data-id="sign-out">Sign Out</a>
          </div>
        </div>`,
      ),
    );
    const toggler = signInBlock.querySelector('.profile-toggle');
    signInBlock.querySelector('[data-id="sign-out"]').addEventListener('click', async () => {
      signOut();
    });
    const toggleExpandContent = () => {
      const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
      toggler.setAttribute('aria-expanded', !isExpanded);
      const profileMenu = toggler.nextElementSibling;
      const expandedClass = 'profile-menu-expanded';
      if (!isExpanded) {
        profileMenu.classList.add(expandedClass);
      } else {
        profileMenu.classList.remove(expandedClass);
      }
    };
    registerResizeHandler(() => {
      if (isMobile()) {
        // if mobile, add click event, remove mouseenter/mouseleave
        toggler.addEventListener('click', toggleExpandContent);
        toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
      } else {
        // if desktop, add mouseenter/mouseleave, remove click event
        toggler.removeEventListener('click', toggleExpandContent);
        toggler.parentElement.addEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.addEventListener('mouseleave', toggleExpandContent);
      }
    });

    // Hide Signup - Authenticated
    document.querySelector('.sign-up').style.display = 'none';
  } else {
    signInBlock.classList.remove('signed-in');
    signInBlock.firstChild.addEventListener('click', async () => {
      adobeIMS.signIn();
    });
  }
  return signInBlock;
};

/**
 * Decorates the product-grid block
 * @param {HTMLElement} productGrid
 */

const productGridDecorator = async (productGridBlock) => {
  simplifySingleCellBlock(productGridBlock);
  if (isSignedIn) {
    productGridBlock.classList.add('signed-in');
    const productDropdown = document.createElement('div');
    productDropdown.classList.add('product-dropdown');
    const pTags = productGridBlock.querySelectorAll('p');
    if (pTags.length > 0) {
      pTags.forEach((p) => {
        const anchor = p.querySelector('a');
        anchor.setAttribute('target', '_blank');
        const href = anchor.getAttribute('href').split('#');
        anchor.setAttribute('href', href[0]);
        productDropdown.innerHTML += p.innerHTML;
      });
    }
    const productToggle = document.createElement('button');
    productToggle.classList.add('product-toggle');
    productToggle.setAttribute('aria-controls', 'product-dropdown');
    productToggle.innerHTML = `<span class="icon-grid"></span>`;
    productGridBlock.innerHTML = `${productToggle.outerHTML}${productDropdown.outerHTML}`;
    const gridToggler = document.querySelector('.product-toggle');
    const toggleExpandGridContent = () => {
      const isExpanded = gridToggler.getAttribute('aria-expanded') === 'true';
      gridToggler.setAttribute('aria-expanded', !isExpanded);
      const productGridMenu = gridToggler.nextElementSibling;
      const expandedClass = 'product-dropdown-expanded';
      if (!isExpanded) {
        productGridMenu.classList.add(expandedClass);
      } else {
        productGridMenu.classList.remove(expandedClass);
      }
    };

    registerResizeHandler(() => {
      if (isMobile()) {
        // if mobile, hide product grid block
        gridToggler.style.display = 'none';
      } else {
        // if desktop, add mouseenter/mouseleave, remove click event
        gridToggler.parentElement.addEventListener('mouseenter', toggleExpandGridContent);
        gridToggler.parentElement.addEventListener('mouseleave', toggleExpandGridContent);
      }
    });
  } else {
    const isProductGrid = document.querySelector('.product-grid');
    if (isProductGrid) {
      document.querySelector('nav').removeChild(isProductGrid);
    }
  }
  return productGridBlock;
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
      const options = decodedHref.substring(firstCurlyIndex, lastCurlyIndex + 1);
      Object.entries(JSON.parse(options)).forEach(([key, value]) => {
        link.setAttribute(key.trim(), value);
      });
      const endIndex = decodedHref.charAt(firstCurlyIndex - 1) === '#' ? firstCurlyIndex - 1 : firstCurlyIndex;
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
  headerBlock.innerHTML = await headerFragment;

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
    { className: 'product-grid', decorator: productGridDecorator },
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
