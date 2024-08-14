import getProducts from '../../scripts/utils/product-utils.js';
import {
  htmlToElement,
  decorateLinks,
  getConfig,
  getLink,
  fetchFragment,
  isFeatureEnabled,
  fetchLanguagePlaceholders,
  getPathDetails,
} from '../../scripts/scripts.js';
import { Deferred, decorateIcons, getMetadata } from './header-util.js';
import { LanguageBlock } from '../../scripts/language.js';

const { lang } = getPathDetails();

/**
 * @typedef {Object} DecoratorOptions
 * @property {() => Promise<boolean>} isUserSignedIn
 * @property {() => {}} onSignOut
 * @property {() => Promise<string>} getProfilePicture
 * @property {string} khorosProfileUrl
 * @property {boolean} isCommunity
 * @property {boolean} lang
 */

const HEADER_CSS = `/blocks/header/exl-header.css`;
const SEARCH_CSS = `/scripts/search/search.css`;

// const languageModule = import('../../scripts/language.js');
const { khorosProfileUrl } = getConfig();

let searchElementPromise = null;
const FEATURE_FLAG = 'perspectives';

async function loadSearchElement() {
  const [solutionTag] = getMetadata('solution').trim().split(',');
  if (solutionTag) {
    window.headlessSolutionProductKey = solutionTag;
  }
  searchElementPromise =
    searchElementPromise ??
    new Promise((resolve, reject) => {
      // eslint-disable-next-line
      Promise.all([import('../../scripts/search/search.js')])
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

let cachedPlaceholders;

const getPlaceholders = async (langCode) => {
  if (cachedPlaceholders) {
    return Promise.resolve(cachedPlaceholders);
  }
  const result = await fetchLanguagePlaceholders(langCode);
  cachedPlaceholders = result;
  return result;
};

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
async function fetchCommunityProfileData(url = khorosProfileUrl) {
  const locale = communityLocalesMap.get(document.querySelector('html').lang) || communityLocalesMap.get('en');
  try {
    const response = await fetch(`${url}?lang=${locale}`, {
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

const decoratorState = {
  languages: new Deferred(),
};

/**
 * Decorates the brand block
 * @param {HTMLElement} brandBlock
 * */
const brandDecorator = (brandBlock) => {
  simplifySingleCellBlock(brandBlock);
  const brandLink = brandBlock.querySelector('a');
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
      const languages = await decoratorState.languages.promise;
      // add language select (visible on mobile only)
      const navItem = ul.appendChild(
        htmlToElement(
          `<li class="nav-item-mobile">
            <p>${decoratorState.languageTitle}</p>
            <ul>
              ${languages.map((l) => `<li><a href="${l.lang}">${l.title}</a></li>`).join('')}
            </ul>
          </li>`,
        ),
      );
      decorateNavItem(navItem);
    };
    await addMobileLangSelector();
  }

  [...ul.children].forEach((option) => {
    const link = option.querySelector('a');
    const featureFlagValue = link?.getAttribute('feature-flags');

    if (featureFlagValue === FEATURE_FLAG && !isFeatureEnabled(FEATURE_FLAG)) {
      option.remove(); // Remove the element if 'perspectives' and feature is not enabled
    } else {
      decorateNavItem(option); // Decorate the element otherwise
    }
  });
};

/**
 * Decorates the nav block
 * @param {HTMLElement} navBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const navDecorator = async (navBlock, decoratorOptions) => {
  navBlock.style.display = 'none';
  simplifySingleCellBlock(navBlock);
  const navOverlay = document.querySelector('.nav-overlay');
  const navWrapper = htmlToElement('<div class="nav-wrapper"></div>');
  const hamburger = hamburgerButton(navWrapper, navOverlay);

  navWrapper.replaceChildren(...navBlock.children);
  navBlock.appendChild(hamburger);
  navBlock.appendChild(navWrapper);

  // build navItems
  const ul = navWrapper.querySelector(':scope > ul');
  await buildNavItems(ul);

  const productList = await getProducts(decoratorOptions.lang, 'browse');

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

  const isSignedIn = await decoratorOptions.isUserSignedIn();

  if (!isSignedIn) {
    // hide auth-only nav items - see decorateLinks method for details
    [...navBlock.querySelectorAll('.nav-item')].forEach((navItemEl) => {
      if (navItemEl.querySelector(':scope > a[auth-only]')) {
        navItemEl.style.display = 'none';
      }
    });
  }
  decorateIcons(navBlock);
  navBlock.style.display = '';
};

/**
 * Decorates the search block
 * @param {HTMLElement} searchBlock
 * @param {DecoratorOptions} decoratorOptions
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
    .filter((option) => option?.value?.toLowerCase() !== 'perspective' || isFeatureEnabled(FEATURE_FLAG));

  searchBlock.innerHTML = '';
  const searchWrapper = htmlToElement(
    `<div class="search-wrapper">
      <div class="search-short">
        <a href="https://experienceleague.adobe.com/search.html" aria-label="Search">
          <span title="Search" class="icon search-icon"></span>
        </a>
      </div>
      <div class="search-full">
        <div class="search-container">
          <span title="Search" class="icon search-icon"></span>
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
  return searchBlock;
};

/**
 *
 * @param {HTMLHRElement} header
 * @param {DecoratorOptions} decoratorOptions
 */
async function decorateCommunityBlock(header, decoratorOptions) {
  const communityBlock = header.querySelector('nav');
  const notificationWrapper = document.createElement('div');
  notificationWrapper.classList.add('notification');
  notificationWrapper.style.display = 'none';
  notificationWrapper.innerHTML = `  
    <div class="notification-icon">
        <a href="/t5/notificationfeed/page" data-id="notifications" title="notifications">
          <span class="icon icon-bell"></span>
        </a>
    </div>
    <div class="notification-icon">   
        <a href="/t5/notes/privatenotespage" data-id="messages" title="messages">
          <span class ="icon icon-email"></span>
        </a> 
    <div>  
`;
  communityBlock.appendChild(notificationWrapper);
  const isSignedIn = await decoratorOptions.isUserSignedIn();
  if (decoratorOptions.isCommunity) {
    if (isSignedIn && !isMobile()) {
      notificationWrapper.style.display = 'flex';
    }
  }
}

/**
 * Decorates the language-selector block
 * @param {HTMLElement} languageBlock
 */
const languageDecorator = async (languageBlock, decoratorOptions) => {
  const title = getCell(languageBlock, 1, 1)?.firstChild.textContent;
  decoratorState.languageTitle = title;
  decoratorState.languages = new Deferred();

  const prependLanguagePopover = async (parent) => {
    const language = new LanguageBlock({
      position: null,
      popoverId: 'language-picker-popover-header',
      decoratorOptions,
    });
    const { popover, languages } = await language.languagePopover;
    decoratorState.languages.resolve(languages);
    parent.append(popover);
  };

  // const prependLanguagePopover = async (parent) => {
  //   await languageModule.then(({ buildLanguagePopover }) => {
  //     buildLanguagePopover(null, 'language-picker-popover-header', decoratorOptions).then(({ popover, languages }) => {
  //       decoratorState.languages.resolve(languages);
  //       parent.append(popover);
  //     });
  //   });
  // };

  const languageHtml = `
      <button type="button" class="language-selector-button" aria-haspopup="true" aria-controls="language-picker-popover-header" aria-label="${title}">
        <span class="icon icon-globegrid"></span>
      </button>
    `;
  languageBlock.innerHTML = languageHtml;
  prependLanguagePopover(languageBlock);
  return languageBlock;
};

/**
 * Decorates the sign-in block
 * @param {HTMLElement} signInBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const signInDecorator = async (signInBlock, decoratorOptions) => {
  const shadowHost = document.querySelector('exl-header');
  simplifySingleCellBlock(signInBlock);
  const isSignedIn = await decoratorOptions.isUserSignedIn();
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

    decoratorOptions
      .getProfilePicture()
      .then((profilePicture) => {
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

    const toggler = shadowHost.shadowRoot.querySelector('.profile-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const toggleExpandContentMobile = () => {
      const navButton = shadowHost.shadowRoot.querySelector('.nav-hamburger');
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
 * @param {DecoratorOptions} decoratorOptions
 */
const productGridDecorator = async (productGridBlock, decoratorOptions) => {
  simplifySingleCellBlock(productGridBlock);
  productGridBlock.style.display = 'none';
  const isSignedIn = await decoratorOptions.isUserSignedIn();
  if (isSignedIn) {
    productGridBlock.style.display = 'block';
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
    const gridToggler = productGridBlock.querySelector('.product-toggle');
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
 * @param {DecoratorOptions} decoratorOptions
 */
const profileMenuDecorator = async (profileMenuBlock, decoratorOptions) => {
  const shadowHost = document.querySelector('exl-header');
  const isSignedIn = await decoratorOptions.isUserSignedIn();
  if (isSignedIn) {
    simplifySingleCellBlock(profileMenuBlock);
    profileMenuBlock.querySelectorAll('p').forEach((ptag) => {
      if (ptag) {
        ptag.outerHTML = ptag.querySelector('a').outerHTML;
      }
    });
    const profileMenuWrapper = shadowHost.shadowRoot.querySelector('.profile-menu');
    const communityHeading = document.createElement('h2');
    const placeholders = await getPlaceholders(decoratorOptions.lang);
    communityHeading.textContent = placeholders?.headerCommunityLabel || 'Community';
    if (profileMenuWrapper) {
      profileMenuWrapper.innerHTML = `<h2>${placeholders?.headerLearningLabel || 'Learning'}</h2>${
        profileMenuBlock.innerHTML
      }`;
      profileMenuWrapper.lastElementChild.setAttribute('data-id', 'sign-out');
      profileMenuWrapper.insertBefore(communityHeading, profileMenuWrapper.lastElementChild);
    }
    fetchCommunityProfileData(decoratorOptions.khorosProfileUrl)
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
        decoratorOptions.onSignOut();
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
const adobeLogoDecorator = async (adobeLogoBlock) => {
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

async function getPPSProfilePicture() {
  import('../../scripts/auth/profile.js').then(({ defaultProfileClient }) =>
    defaultProfileClient
      .getPPSProfile()
      .then((ppsProfile) => ppsProfile?.images['50'])
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      }),
  );
}

/**
 * Main header decorator, calls all the other decorators
 */
class ExlHeader extends HTMLElement {
  /**
   * @param {DecoratorOptions} options
   */
  constructor(options = {}) {
    super();

    const doIsSignedInUSer = async () => {
      const { isSignedInUser } = await import('../../scripts/auth/profile.js');
      return isSignedInUser();
    };

    const doSignOut = async () => {
      const { signOut } = await import('../../scripts/auth/profile.js');
      return signOut();
    };

    options.isUserSignedIn = options.isUserSignedIn || doIsSignedInUSer;
    options.onSignOut = options.onSignOut || doSignOut;
    options.getProfilePicture = options.getProfilePicture || getPPSProfilePicture;
    options.isCommunity = options.isCommunity ?? false;
    options.khorosProfileUrl = options.khorosProfileUrl || khorosProfileUrl;
    options.lang = options.lang || lang || 'en';
    this.decoratorOptions = options;

    // yes, even though this is extra, it ensures that these functions remain pure-esque.
    this.navDecorator = navDecorator.bind(this);
    this.adobeLogoDecorator = adobeLogoDecorator.bind(this);
    this.brandDecorator = brandDecorator.bind(this);
    this.searchDecorator = searchDecorator.bind(this);
    this.languageDecorator = languageDecorator.bind(this);
    this.productGridDecorator = productGridDecorator.bind(this);
    this.signInDecorator = signInDecorator.bind(this);
    this.profileMenuDecorator = profileMenuDecorator.bind(this);
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Loads a CSS file.
   * @param {string} href URL to the CSS file
   */
  loadCSS(href, media) {
    return new Promise((resolve, reject) => {
      if (!this.shadowRoot.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (media) link.media = media;
        link.onload = resolve;
        link.onerror = reject;
        this.shadowRoot.append(link);
      } else {
        resolve();
      }
    });
  }

  async loadStyles() {
    return Promise.allSettled([
      this.loadCSS(`${window.hlx.codeBasePath}${HEADER_CSS}`),
      this.loadCSS(`${window.hlx.codeBasePath}${SEARCH_CSS}`),
    ]);
  }

  async decorate() {
    const headerFragment = await fetchFragment('header/header', this.decoratorOptions.lang);
    if (headerFragment) {
      loadSearchElement();

      const headerWrapper = htmlToElement(
        '<div class="header-wrapper" id="header-wrapper"><div class="header block"></div></div>',
      );
      this.shadowRoot.appendChild(headerWrapper);
      const header = this.shadowRoot.querySelector('.header');

      const navOverlay = htmlToElement('<div class="nav-overlay hidden"></div>');
      document.body.appendChild(navOverlay);

      header.innerHTML = headerFragment;

      const exlHeaderFirstRow = getBlockFirstRow(header);
      exlHeaderFirstRow.outerHTML = `<nav>${exlHeaderFirstRow.innerHTML}</nav>`;
      const nav = header.querySelector('nav');
      nav.role = 'navigation';
      nav.ariaLabel = 'Main navigation';

      const decorateHeaderBlock = async (className, decorator, options) => {
        const block = nav.querySelector(`:scope > .${className}`);
        await decorator(block, options);
      };
      // Do this first to ensure all links are decorated correctly before they are used.
      decorateLinks(header);
      decorateHeaderBlock('adobe-logo', this.adobeLogoDecorator, this.decoratorOptions);
      decorateHeaderBlock('brand', this.brandDecorator, this.decoratorOptions);
      decorateHeaderBlock('search', this.searchDecorator, this.decoratorOptions);
      decorateHeaderBlock('language-selector', this.languageDecorator, this.decoratorOptions);
      decorateHeaderBlock('product-grid', this.productGridDecorator, this.decoratorOptions);
      decorateHeaderBlock('sign-in', this.signInDecorator, this.decoratorOptions);
      decorateHeaderBlock('profile-menu', this.profileMenuDecorator, this.decoratorOptions);
      decorateCommunityBlock(header, this.decoratorOptions);
      decorateNewTabLinks(header);
      decorateIcons(header);
      await decorateHeaderBlock('nav', this.navDecorator, this.decoratorOptions);
    }
  }

  async connectedCallback() {
    await this.loadStyles();
    await this.decorate();
  }
}

customElements.define('exl-header', ExlHeader);

/**
 * Create header web component and attach to the DOM
 * @param {HTMLHeadElement} headerBlock
 */
export default async function decorate(headerBlock, options = {}) {
  const exlHeader = new ExlHeader(options);
  headerBlock.replaceChildren(exlHeader);
}
