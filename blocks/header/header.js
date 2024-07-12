import { defaultProfileClient, isSignedInUser, signOut } from '../../scripts/auth/profile.js';
import { decorateIcons, loadCSS, getMetadata } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  getPathDetails,
  fetchLanguagePlaceholders,
  decorateLinks,
  getConfig,
  getLink,
  fetchFragment,
  isFeatureEnabled,
} from '../../scripts/scripts.js';
import getProducts from '../../scripts/utils/product-utils.js';
import initializeSignupFlow from '../../scripts/signup-flow/signup-flow.js';

/* Temp Code to display the sign-up flow dialog on page load */
initializeSignupFlow();

const languageModule = import('../../scripts/language.js');
const { khorosProfileUrl } = getConfig();

let searchElementPromise = null;

export async function loadSearchElement() {
  searchElementPromise =
    searchElementPromise ??
    new Promise((resolve, reject) => {
      // eslint-disable-next-line
      Promise.all([
        import('../../scripts/search/search.js'),
        loadCSS(`${window.hlx.codeBasePath}/scripts/search/search.css`),
      ])
        .then((results) => {
          const [mod] = results;
          resolve(mod.default ?? mod);
        })
        .catch((e) => {
          reject(e);
        });
    });
  return searchElementPromise;
}

class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

/**
 * debounce fn execution
 * @param {number} ms
 * @param {Function} fn
 * @returns {Function} debounced function
 */
export const debounce = (ms, fn) => {
  let timer;
  // eslint-disable-next-line func-names
  return function (...args) {
    clearTimeout(timer);
    args.unshift(this);
    timer = setTimeout(fn(args), ms);
  };
};

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * Register page resize handler
 * @param {ResizeObserverCallback} handler
 * @returns {void} nothing
 */
function registerHeaderResizeHandler(callback) {
  window.customResizeHandlers = window.customResizeHandlers || [];
  const header = document.querySelector('header');
  // register resize observer only once.
  if (!window.pageResizeObserver) {
    const pageResizeObserver = new ResizeObserver(
      debounce(100, () => {
        window.customResizeHandlers.forEach((handler) => {
          try {
            handler();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });
      }),
    );
    // observe immediately
    pageResizeObserver.observe(header, {
      box: 'border-box',
    });
    window.pageResizeObserver = pageResizeObserver;
  }
  // push handler
  window.customResizeHandlers.push(callback);
  // ensure handler runs at-least once
  callback();
}

const communityLocalesMap = new Map([
  ['de', 'de'],
  ['en', 'en'],
  ['ja', 'ja'],
  ['fr', 'fr'],
  ['es', 'es'],
  ['pt-br', 'pt'],
  ['ko', 'ko'],
  ['sv', 'en'],
  ['nl', 'en'],
  ['it', 'en'],
  ['zh-hans', 'en'],
  ['zh-hant', 'en'],
]);

// eslint-disable-next-line
async function fetchCommunityProfileData() {
  const locale = communityLocalesMap.get(document.querySelector('html').lang) || communityLocalesMap.get('en');
  try {
    const response = await fetch(`${khorosProfileUrl}?lang=${locale}`, {
      method: 'GET',
      headers: {
        'x-ims-token': await window.adobeIMS?.getAccessToken().token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    // eslint-disable-next-line
    console.log('Error fetching data!!', err);
  }
}

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

// Mobile Only (Until 1024px)
const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

const { lang } = getPathDetails();
const headerFragment = await fetchFragment('header/header', lang);
const decoratorState = {
  languages: new Deferred(),
};

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
 * Function to toggle the navigation menu.
 *
 * @param {Element} button - The button element used to toggle the navigation menu
 * @param {Element} navWrapper - The wrapper element for the navigation menu
 * @param {Element} navOverlay - The overlay element for the navigation menu
 */
function toggleNav(button, navWrapper, navOverlay) {
  const profileButton = document.querySelector('.profile-toggle');
  if (profileButton && profileButton.getAttribute('aria-expanded') === 'true') {
    profileButton.click();
  }
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !isExpanded);
  navWrapper.classList.toggle('nav-wrapper-expanded');
  if (!isExpanded) {
    navOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    navOverlay.classList.add('hidden');
    document.body.removeAttribute('style');
  }
}

/**
 * adds hambuger button to nav wrapper
 * @param {HTMLElement} navWrapper
 * @returns {HTMLButtonElement}
 */
const hamburgerButton = (navWrapper, navOverlay) => {
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
    toggleNav(button, navWrapper, navOverlay);
  });

  registerHeaderResizeHandler(() => {
    if (!isMobile() && button.getAttribute('aria-expanded') === 'true') {
      toggleNav(button, navWrapper, navOverlay);
    }
  });

  return button;
};

/**
 * Builds nav items from the provided basic list
 * @param {HTMLUListElement} ul
 */
const buildNavItems = async (ul, level = 0) => {
  const decorateNavItem = async (navItem) => {
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
      registerHeaderResizeHandler(() => {
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
  };

  if (level === 0) {
    // add search link (visible on mobile only)
    ul.appendChild(htmlToElement(`<li class="nav-item-mobile">${decoratorState.searchLinkHtml}</li>`));

    const addMobileLangSelector = async () => {
      const { getLanguagePath } = await languageModule;
      const languages = await decoratorState.languages.promise;
      // add language select (visible on mobile only)
      const navItem = ul.appendChild(
        htmlToElement(
          `<li class="nav-item-mobile">
            <p>${decoratorState.languageTitle}</p>
            <ul>
              ${languages.map((l) => `<li><a href="${getLanguagePath(l.lang)}">${l.title}</a></li>`).join('')}
            </ul>
          </li>`,
        ),
      );
      decorateNavItem(navItem);
    };
    await addMobileLangSelector();
  }

  [...ul.children].forEach(decorateNavItem);
};

/**
 * Decorates the nav block
 * @param {HTMLElement} navBlock
 */
const navDecorator = async (navBlock) => {
  simplifySingleCellBlock(navBlock);

  const navOverlay = document.querySelector('.nav-overlay');

  const navWrapper = htmlToElement('<div class="nav-wrapper"></div>');
  const hamburger = hamburgerButton(navWrapper, navOverlay);

  navWrapper.replaceChildren(hamburger, ...navBlock.children);
  navBlock.replaceChildren(navWrapper);

  // build navItems
  const ul = navWrapper.querySelector(':scope > ul');
  await buildNavItems(ul);

  navBlock.firstChild.id = hamburger.getAttribute('aria-controls');
  navBlock.prepend(hamburger);

  /**
   * Fetches a list of products to render in main nav.
   * @async
   * @function getProducts
   * @param {string} mode - The mode for fetching products ('browse' or 'articles').
   * @returns {Promise<Array>} A promise that resolves to an array of products.
   */
  const productList = await getProducts('browse');

  [...navBlock.querySelectorAll('.nav-item')].forEach((navItemEl) => {
    if (navItemEl.querySelector(':scope > a[featured-products]')) {
      const featuredProductLi = navBlock.querySelector('li.nav-item a[featured-products]');
      // Remove the <li> element from the DOM
      featuredProductLi.remove();
      productList.forEach((item) => {
        if (item.featured) {
          const newLi = document.createElement('li');
          newLi.className = 'nav-item nav-item-leaf';
          newLi.innerHTML = `<a href="${getLink(item.path)}">${item.title}</a>`;
          navItemEl.parentNode.appendChild(newLi);
        }
      });
    }
  });

  const isSignedIn = await isSignedInUser();
  if (!isSignedIn) {
    // hide auth-only nav items - see decorateLinks method for details
    [...navBlock.querySelectorAll('.nav-item')].forEach((navItemEl) => {
      if (navItemEl.querySelector(':scope > a[auth-only]')) {
        navItemEl.style.display = 'none';
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

  const parsedOptions = options
    .map((option) => {
      const [label, value] = option.split(':');
      return { label, value };
    })
    // TODO - remove dependecy on feature flag once perspectives are perminantely live
    .filter((option) => option?.value?.toLowerCase() !== 'perspective' || isFeatureEnabled('perspectives'));

  searchBlock.innerHTML = '';
  const searchWrapper = htmlToElement(
    `<div class="search-wrapper">
      <div class="search-short">
        <a href="https://experienceleague.adobe.com/search.html" aria-label="Search">
          <span class="icon icon-search search-icon"></span>
        </a>
      </div>
      <div class="search-full">
        <div class="search-container">
          <span title="Search" class="icon icon-search"></span>
          <input autocomplete="off" class="search-input" type="text" aria-label="top-nav-combo-search" aria-expanded="false" title="Insert a query. Press enter to send" role="combobox" placeholder="${
            searchPlaceholder.textContent
          }">
          <span title="Clear" class="icon icon-clear search-clear-icon"></span>
          <div class="search-suggestions-popover">
            <ul role="listbox">
            </ul>
          </div>
        </div>
        <button type="button" class="search-picker-button" aria-haspopup="true" aria-controls="search-picker-popover">
          <span class="search-picker-label" data-filter-value="${parsedOptions[0]?.value}">${
            parsedOptions[0]?.label || ''
          }</span>
        </button>
        <div class="search-picker-popover" id="search-picker-popover">
          <ul role="listbox">
            ${parsedOptions
              .map(
                ({ label, value }, index) =>
                  `<li tabindex="0" role="option" class="search-picker-label" data-filter-value="${value}">${
                    index === 0
                      ? `<span class="icon icon-checkmark"></span> <span data-filter-value="${value}">${label}</span>`
                      : `<span data-filter-value="${value}">${label}</span>`
                  }</li>`,
              )
              .join('')}
          </ul>
        </div>
      <div>
    </div>
  `,
  );

  const Search = await loadSearchElement();
  searchBlock.append(searchWrapper);

  const searchItem = new Search({ searchBlock });
  searchItem.configureAutoComplete({
    searchOptions: options,
    showSearchSuggestions: true,
  });

  await decorateIcons(searchBlock);

  return searchBlock;
};

/**
 * Decorates the language-selector block
 * @param {HTMLElement} languageBlock
 */
const languageDecorator = async (languageBlock) => {
  const title = getCell(languageBlock, 1, 1)?.firstChild.textContent;
  decoratorState.languageTitle = title;
  decoratorState.languages = new Deferred();

  const prependLanguagePopover = async (parent) => {
    await languageModule.then(({ buildLanguagePopover }) => {
      buildLanguagePopover(null, 'language-picker-popover-header').then(({ popover, languages }) => {
        decoratorState.languages.resolve(languages);
        parent.append(popover);
      });
    });
  };

  const languageHtml = `
      <button type="button" class="language-selector-button" aria-haspopup="true" aria-controls="language-picker-popover-header" aria-label="${title}">
        <span class="icon icon-globegrid"></span>
      </button>
    `;
  languageBlock.innerHTML = languageHtml;
  decorateIcons(languageBlock);
  prependLanguagePopover(languageBlock);
  return languageBlock;
};

/**
 * Decorates the sign-in block
 * @param {HTMLElement} signInBlock
 */

const signInDecorator = async (signInBlock) => {
  simplifySingleCellBlock(signInBlock);
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    signInBlock.classList.add('signed-in');
    const profile = htmlToElement(
      `<div class="profile">
        <button class="profile-toggle" aria-controls="profile-menu">
          <span class="icon icon-profile"></span>
        </button>
        <div class="profile-menu" id="profile-menu">
        </div>
      </div>`,
    );

    signInBlock.replaceChildren(profile);
    defaultProfileClient
      .getPPSProfile()
      .then((ppsProfile) => {
        const profilePicture = ppsProfile?.images['50'];
        if (profilePicture) {
          const profileToggle = profile.querySelector('.profile-toggle');
          profileToggle.replaceChildren(
            htmlToElement(`<img class="profile-picture" src="${profilePicture}" alt="profile picture" />`),
          );
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });

    const toggler = signInBlock.querySelector('.profile-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const toggleExpandContentMobile = () => {
      const navButton = document.querySelector('.nav-hamburger');
      if (navButton.getAttribute('aria-expanded') === 'true') {
        navButton.click();
      }
      const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
      toggler.setAttribute('aria-expanded', !isExpanded);
      const profileMenu = toggler.nextElementSibling;
      const expandedClass = 'profile-menu-expanded';
      if (!isExpanded) {
        profileMenu.classList.add(expandedClass);
        navOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      } else {
        profileMenu.classList.remove(expandedClass);
        navOverlay.classList.add('hidden');
        document.body.removeAttribute('style');
      }
    };

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

    registerHeaderResizeHandler(() => {
      if (isMobile()) {
        // if mobile, add click event, remove mouseenter/mouseleave
        toggler.addEventListener('click', toggleExpandContentMobile);
        toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
      } else {
        navOverlay.classList.add('hidden');
        document.body.removeAttribute('style');
        // if desktop, add mouseenter/mouseleave, remove click event
        toggler.removeEventListener('click', toggleExpandContentMobile);
        toggler.parentElement.addEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.addEventListener('mouseleave', toggleExpandContent);
      }
    });
  } else {
    signInBlock.classList.remove('signed-in');
    signInBlock.firstChild.addEventListener('click', async () => {
      window.adobeIMS.signIn();
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
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    productGridBlock.classList.add('signed-in');
    const productDropdown = document.createElement('div');
    productDropdown.classList.add('product-dropdown');
    const aTags = productGridBlock.querySelectorAll('a');
    if (aTags.length > 0) {
      aTags.forEach((a) => {
        a.setAttribute('target', '_blank');
        productDropdown.append(a);
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

    registerHeaderResizeHandler(() => {
      if (!isMobile()) {
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
 * Decorates the profile-menu block
 * @param {HTMLElement} profileMenu
 */

const profileMenuDecorator = async (profileMenuBlock) => {
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    simplifySingleCellBlock(profileMenuBlock);
    profileMenuBlock.querySelectorAll('p').forEach((ptag) => {
      if (ptag) {
        ptag.outerHTML = ptag.querySelector('a').outerHTML;
      }
    });
    const profileMenuWrapper = document.querySelector('.profile-menu');
    const communityHeading = document.createElement('h2');
    communityHeading.textContent = placeholders?.headerCommunityLabel || 'Community';
    if (profileMenuWrapper) {
      profileMenuWrapper.innerHTML = `<h2>${placeholders?.headerLearningLabel || 'Learning'}</h2>${
        profileMenuBlock.innerHTML
      }`;
      profileMenuWrapper.lastElementChild.setAttribute('data-id', 'sign-out');
      profileMenuWrapper.insertBefore(communityHeading, profileMenuWrapper.lastElementChild);
    }
    fetchCommunityProfileData()
      .then((res) => {
        if (res) {
          res.data.menu.forEach((item) => {
            if (item.title && item.url) {
              const communityProfile = document.createElement('a');
              communityProfile.href = item.url;
              communityProfile.textContent = item.title;
              profileMenuWrapper.insertBefore(communityProfile, profileMenuWrapper.lastElementChild);
            }
          });
        }
      })
      .catch((err) => {
        /* eslint-disable-next-line no-console */
        console.error(err);
      });

    if (profileMenuWrapper.querySelector('[data-id="sign-out"]')) {
      profileMenuWrapper.querySelector('[data-id="sign-out"]').addEventListener('click', async () => {
        signOut();
      });
    }
  } else {
    const isProfileMenu = document.querySelector('.profile-menu');
    if (isProfileMenu) {
      document.querySelector('nav').removeChild(isProfileMenu);
    }
  }
};

/**
 * Decorates the adobe-logo block
 * @param {HTMLElement} adobeLogoBlock
 */
const adobeLogoDecorator = (adobeLogoBlock) => {
  simplifySingleCellBlock(adobeLogoBlock);
  adobeLogoBlock.querySelector('a').setAttribute('title', 'logo');
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

/**
 * Main header decorator, calls all the other decorators
 * @param {HTMLElement} headerBlock
 */
export default async function decorate(headerBlock) {
  headerBlock.style.display = 'none';
  loadSearchElement();
  const [solutionTag] = getMetadata('solution').trim().split(',');
  if (solutionTag) {
    window.headlessSolutionProductKey = solutionTag;
  }

  // eslint-disable-next-line no-unused-vars
  headerBlock.innerHTML = await headerFragment;

  const headerBlockFirstRow = getBlockFirstRow(headerBlock);
  headerBlockFirstRow.outerHTML = `<nav>${headerBlockFirstRow.innerHTML}</nav>`;
  const nav = headerBlock.querySelector('nav');
  nav.role = 'navigation';
  nav.ariaLabel = 'Main navigation';

  const navOverlay = document.createElement('div');
  navOverlay.classList.add('nav-overlay', 'hidden');
  document.body.appendChild(navOverlay);

  const decorateHeaderBlock = async (className, decorator) => {
    const block = nav.querySelector(`:scope > .${className}`);
    await decorator(block);
  };

  // Do this first to ensure all links are decorated correctly before they are used.
  decorateLinks(headerBlock);

  decorateHeaderBlock('brand', brandDecorator);
  decorateHeaderBlock('search', searchDecorator);
  decorateHeaderBlock('language-selector', languageDecorator);
  decorateHeaderBlock('product-grid', productGridDecorator);
  decorateHeaderBlock('sign-in', signInDecorator);
  decorateHeaderBlock('profile-menu', profileMenuDecorator);
  decorateHeaderBlock('adobe-logo', adobeLogoDecorator);
  await decorateHeaderBlock('nav', navDecorator);

  decorateNewTabLinks(headerBlock);

  // do this at the end, always.
  decorateIcons(headerBlock);
  headerBlock.style.display = '';
}
