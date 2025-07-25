/**
 * IMPORTANT:
 * This header will also be embeded in community and legacy pages so please make
 * sure to test it in those environments as well when you make changes to the header.
 */

import {
  htmlToElement,
  decorateLinks,
  getConfig,
  getLink,
  getPathDetails,
  fetchGlobalFragment,
} from '../../scripts/scripts.js';
import getProducts from '../../scripts/utils/product-utils.js';
import {
  decoratorState,
  isMobile,
  registerHeaderResizeHandler,
  getCell,
  getFirstChildTextNodes,
  updateLinks,
  getBlockFirstRow,
  simplifySingleCellBlock,
} from './header-utils.js';
import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import LanguageBlock from '../language/language.js';
import ProfileMenu from './profile-menu.js';

/**
 *  @typedef {Object} CommunityOptions
 *  @property {boolean | undefined} active
 *  @property {boolean} hasMessages
 *  @property {boolean} hasNotifications
 *  @property {string} notificationsUrl
 *  @property {string} messagesUrl
 */

/**
 * @typedef {Object} DecoratorOptions
 * @property {() => Promise<boolean>} isUserSignedIn - header uses this to check if the user is signed in or not
 * @property {() => {}} onSignOut - called when signout happens.
 * @property {() => {}} onSignIn - called when sign in happens.
 * @property {() => Promise<string>} getProfilePicture - url to profile picture to display in header
 * @property {string} khorosProfileUrl - url to fetch community profile data
 * @property {CommunityOptions} community - is this a community header
 * @property {boolean} lang - language code
 * @property {string} navLinkOrigin - origin to be added to relative links in the nav
 * @property {import('../language/language.js').Language[]} languages - array of languages to dispay in language selector
 * @property {(lang: string) => void} onLanguageChange - called when language is changed
 */

const HEADER_CSS = `/blocks/header/exl-header.css`;

let searchElementPromise = null;
const { khorosProfileUrl, communityHost } = getConfig();

/**
 *
 * @returns {Promise<string>}
 */
const getPPSProfilePicture = async () => {
  try {
    const { defaultProfileClient } = await import('../../scripts/auth/profile.js');
    const ppsProfile = await defaultProfileClient.getPPSProfile();
    const profilePicture = ppsProfile?.images['50'];
    if (profilePicture) {
      return profilePicture;
    }
    return null; // or any other default value
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return err; // or any other default value
  }
};

async function loadSearchElement() {
  const [solutionTag] = getMetadata('solution').trim().split(',');
  if (solutionTag) {
    window.headlessSolutionProductKey = solutionTag;
  }
  searchElementPromise =
    searchElementPromise ?? import('../../scripts/search/search.js').then((mod) => mod.default ?? mod);
  return searchElementPromise;
}

/**
 * https://www.codemzy.com/blog/random-unique-id-javascript
 * @param {number} length
 */
const randomId = (length = 6) =>
  Math.random()
    .toString(36)
    .substring(2, length + 2);

/**
 * Decorates the brand block
 * @param {HTMLElement} brandBlock
 * */
const brandDecorator = (brandBlock, decoratorOptions) => {
  simplifySingleCellBlock(brandBlock);
  const brandLink = brandBlock.querySelector('a');
  brandBlock.replaceChildren(brandLink);
  updateLinks(brandBlock, (currentHref) => {
    const url = new URL(currentHref, decoratorOptions.navLinkOrigin);
    return url.href;
  });
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
  const shadowRoot = button.getRootNode();
  const profileButton = shadowRoot.querySelector('.profile-toggle');
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
const buildNavItems = (ul, level = 0) => {
  /**
   * @param {HTMLElement} navItem
   */
  const decorateNavItem = async (navItem) => {
    const navItemClasses = ['nav-item'];
    if (level === 0) navItemClasses.push('nav-item-root');
    navItem.classList.add(...navItemClasses);
    const controlName = `content-${level}-${randomId()}`; // unique id
    const [content, secondaryContent] = navItem.querySelectorAll(':scope > ul');

    if (content) {
      // first elment is the first element if it is a <p> tag OR all text nodes untill the first element wrapped in a <p> tag
      // see: UGP-11860
      let firstEl = navItem.firstElementChild;
      if (firstEl?.tagName !== 'P') {
        const textNodes = getFirstChildTextNodes(navItem);
        const allText = textNodes.map((node) => node.textContent).join('');
        if (allText.trim().length !== 0) {
          // if there is text, wrap it in a <p> tag
          firstEl = document.createElement('p');
          textNodes.forEach((node) => firstEl.appendChild(node));
          navItem.prepend(firstEl);
        }
      }

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

        // set new state for nav items
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
      // add language select (visible on mobile only)

      const navItem = ul.appendChild(
        htmlToElement(
          `<li class="nav-item-mobile">
            <p>${decoratorState.languageTitle}</p>
            <ul>
              ${decoratorState.languages.map((l) => `<li><a href="${l.lang}">${l.title}</a></li>`).join('')}
            </ul>
          </li>`,
        ),
      );
      decorateNavItem(navItem);
    };
    addMobileLangSelector();
  }

  [...ul.children].forEach(decorateNavItem);
};

/**
 * Adds the featured products to the nav links
 * @param {HTMLElement} navBlock
 * @param {string} lang
 */
const buildFeaturedProductsNavLinks = async (navBlock, lang) => {
  const productList = await getProducts(lang, 'browse');
  [...navBlock.querySelectorAll('.nav-item')].forEach((navItemEl) => {
    // featured-products property is expected to be present on header.
    if (navItemEl.querySelector(':scope > a[href*="@featured-products"]')) {
      const featuredProductLi = navBlock.querySelector('li.nav-item a[href*="@featured-products"]');
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
};

/**
 * Runs gneral updates on nav links
 * @param {HTMLElement} navBlock
 * @param {string} navLinkOrigin the link origin to be used for relative links
 */
const updateNavLinks = (navBlock, navLinkOrigin) => {
  // add origin to relative links - this is especially useful when we need to
  // configure navLinkOrigin in header. Eg. on community.
  updateLinks(navBlock, (currentHref) => {
    const url = new URL(currentHref, navLinkOrigin);
    return url.href;
  });

  // update community links to use proper host for current environment
  updateLinks(navBlock, (currentHref) => {
    if (currentHref.includes('https://experienceleaguecommunities')) {
      const url = new URL(currentHref);
      url.host = communityHost;
      return url.href;
    }
    return currentHref;
  });
};

/**
 * Decorates the nav block
 * @param {HTMLElement} navBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const navDecorator = async (navBlock, decoratorOptions) => {
  simplifySingleCellBlock(navBlock);
  const navOverlay = document.querySelector('.nav-overlay');
  const navWrapper = htmlToElement('<div class="nav-wrapper"></div>');
  const hamburger = hamburgerButton(navWrapper, navOverlay);

  navWrapper.replaceChildren(...navBlock.children);
  navBlock.appendChild(hamburger);
  navBlock.appendChild(navWrapper);

  // build navItems
  const ul = navWrapper.querySelector(':scope > ul');
  buildNavItems(ul);

  // build featured products nav links
  buildFeaturedProductsNavLinks(navBlock, decoratorOptions.lang).then(() => {
    // this needs to run at the end of navDecorator,
    // it is here since it needs to run after all nav items are built.
    updateNavLinks(navBlock, decoratorOptions.navLinkOrigin);
  });
};

/**
 * Decorates the search block
 * @param {HTMLElement} searchBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const searchDecorator = async (searchBlock, decoratorOptions) => {
  // save this for later use in mobile nav.
  const searchLink = getCell(searchBlock, 1, 1)?.firstChild;
  decoratorState.searchLinkHtml = searchLink.outerHTML;

  // get search placeholder
  const searchPlaceholder = getCell(searchBlock, 2, 1)?.firstChild;
  // build search options
  const searchOptions = getCell(searchBlock, 3, 1)?.firstElementChild?.children || [];
  const options = [...searchOptions].map((option) => option.textContent);

  searchBlock.innerHTML = '';
  const searchWrapper = htmlToElement(
    `<div class="search-wrapper">
      <div class="search-short">
        <a href="${searchLink?.href}" aria-label="Search">
          <span title="Search" class="icon icon-search"></span>
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

  const Search = await loadSearchElement();
  searchBlock.append(searchWrapper);

  const searchItem = new Search({ searchBlock, searchUrl: searchLink?.href });
  searchItem.configureAutoComplete({
    searchOptions: options,
    showSearchSuggestions: true,
  });

  if (decoratorOptions?.community?.active) {
    searchItem.setSelectedSearchOption('Community');
  }
  decorateIcons(searchBlock);
  return searchBlock;
};

/**
 *
 * @param {HTMLHRElement} header
 * @param {DecoratorOptions} decoratorOptions
 */
async function decorateCommunityBlock(header, decoratorOptions) {
  const communityBlock = header.querySelector('nav');
  const communityActionsWrapper = document.createElement('div');
  communityActionsWrapper.classList.add('community-actions');
  communityActionsWrapper.style.display = 'none';
  const messagesMarked = decoratorOptions?.community?.hasMessages ? 'community-action-is-marked' : '';
  const notificationsMarked = decoratorOptions?.community?.hasNotifications ? 'community-action-is-marked' : '';
  const notificationsUrl = decoratorOptions?.community?.notificationsUrl;
  const messagesUrl = decoratorOptions?.community?.messagesUrl;
  // note: data-community-action is used by community code when this header is used community.
  communityActionsWrapper.innerHTML = `  
    <div class="community-action ${notificationsMarked}" data-community-action="notifications">
        <a href="${notificationsUrl}" data-id="notifications" title="notifications">
          <span class="icon icon-bell"></span>
        </a>
    </div>
    <div class="community-action ${messagesMarked}" data-community-action="messages">   
        <a href="${messagesUrl}" data-id="messages" title="messages">
          <span class ="icon icon-emailOutline"></span>
        </a> 
    <div>
`;
  decorateIcons(communityActionsWrapper);
  communityBlock.appendChild(communityActionsWrapper);
  const isSignedIn = await decoratorOptions.isUserSignedIn();
  const languageBlock = header.querySelector('.language-selector');
  if (decoratorOptions?.community?.active) {
    languageBlock.classList.add('community');
    if (isSignedIn) {
      communityActionsWrapper.style.display = 'flex';
    }
  }
}

/**
 * Decorates the language-selector block
 * @param {HTMLElement} languageBlock
 */
const languageDecorator = async (languageBlock, decoratorOptions) => {
  const language = new LanguageBlock({
    position: 'bottom',
    popoverId: 'language-picker-popover-header',
    block: languageBlock,
    languages: decoratorOptions.languages,
    selectedLanguage: decoratorOptions.lang,
    onLanguageChange: decoratorOptions.onLanguageChange,
  });
  decoratorState.languageTitle = language.title;
  decoratorState.languages = language.languages;

  languageBlock.replaceChildren(language);
  return languageBlock;
};

/**
 * Decorates the sign-in block
 * @param {HTMLElement} signInBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const signInDecorator = async (signInBlock, decoratorOptions) => {
  simplifySingleCellBlock(signInBlock);
  const isSignedIn = await decoratorOptions.isUserSignedIn();
  if (isSignedIn) {
    signInBlock.classList.add('signed-in');
    const profileMenuBlock = signInBlock.closest('nav').querySelector('.profile-menu');
    const profileMenu = new ProfileMenu(decoratorOptions, profileMenuBlock);
    signInBlock.replaceChildren(profileMenu);
  } else {
    signInBlock.classList.remove('signed-in');
    signInBlock.firstChild.addEventListener('click', async () => {
      decoratorOptions.onSignIn();
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
  const isSignedIn = await decoratorOptions.isUserSignedIn();
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
 * Decorates the adobe-logo block
 * @param {HTMLElement} adobeLogoBlock
 */
const adobeLogoDecorator = async (adobeLogoBlock) => {
  simplifySingleCellBlock(adobeLogoBlock);
  decorateIcons(adobeLogoBlock);
  adobeLogoBlock.querySelector('a').setAttribute('aria-label', 'Adobe Experience League'); // a11y
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
    decorateIcons(link);
  });
};

/**
 * Main header decorator, calls all the other decorators
 */
class ExlHeader extends HTMLElement {
  isLoaded = false;

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

    const doSignIn = async () => {
      window.adobeIMS.signIn();
    };

    this.decoratorOptions = options;
    options.isUserSignedIn = options.isUserSignedIn || doIsSignedInUSer;
    options.onSignOut = options.onSignOut || doSignOut;
    options.onSignIn = options.onSignIn || doSignIn;
    options.getProfilePicture = options.getProfilePicture || getPPSProfilePicture;
    options.community = options.community ?? { active: false };
    options.community.notificationsUrl = options.community.notificationsUrl || '/t5/notificationfeed/page';
    options.community.messagesUrl = options.community.messagesUrl || '/t5/notes/privatenotespage';
    options.khorosProfileUrl = options.khorosProfileUrl || khorosProfileUrl;
    options.lang = options.lang || getPathDetails().lang || 'en';
    options.navLinkOrigin = options.navLinkOrigin || window.location.origin;

    // yes, even though this is extra, it ensures that these functions remain pure-esque.
    this.navDecorator = navDecorator.bind(this);
    this.adobeLogoDecorator = adobeLogoDecorator.bind(this);
    this.brandDecorator = brandDecorator.bind(this);
    this.searchDecorator = searchDecorator.bind(this);
    this.languageDecorator = languageDecorator.bind(this);
    this.productGridDecorator = productGridDecorator.bind(this);
    this.signInDecorator = signInDecorator.bind(this);
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
    return Promise.allSettled([this.loadCSS(`${window.hlx.codeBasePath}${HEADER_CSS}`)]);
  }

  async decorate() {
    const headerMeta = 'header-fragment';
    const fallback = '/en/global-fragments/header';
    const headerFragment = await fetchGlobalFragment(headerMeta, fallback, this.decoratorOptions.lang);
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

      await decorateCommunityBlock(header, this.decoratorOptions);

      const decorateHeaderBlock = async (className, decorator, options) => {
        const block = nav.querySelector(`:scope > .${className}`);
        block.style.visibility = 'hidden';
        await decorator(block, options);
        block.style.visibility = 'visible';
        this.dispatchEvent(new Event(`${className}-decorated`));
      };

      // Do this first to ensure all links are decorated correctly before they are used.
      decorateLinks(header);
      const logoP = decorateHeaderBlock('adobe-logo', this.adobeLogoDecorator, this.decoratorOptions);
      const brandP = decorateHeaderBlock('brand', this.brandDecorator, this.decoratorOptions);
      let searchP;
      if (!document.body.classList.contains('search')) {
        searchP = decorateHeaderBlock('search', this.searchDecorator, this.decoratorOptions);
      } else {
        nav?.querySelector(`:scope > .search`)?.remove();
      }
      const languageP = decorateHeaderBlock('language-selector', this.languageDecorator, this.decoratorOptions);
      const productGridP = decorateHeaderBlock('product-grid', this.productGridDecorator, this.decoratorOptions);
      const signInP = decorateHeaderBlock('sign-in', this.signInDecorator, this.decoratorOptions);
      const newTabLinkP = decorateNewTabLinks(header);
      await decorateHeaderBlock('nav', this.navDecorator, this.decoratorOptions);

      Promise.allSettled([logoP, brandP, searchP, languageP, productGridP, signInP, newTabLinkP]).then(() => {
        // used when the header is embeded on coimmunity/legacy pages to listen for when the header is completely decorated.
        this.dispatchEvent(new Event('header-decorated'));
      });
    }
  }

  async connectedCallback() {
    this.style.display = 'none';
    await Promise.allSettled([this.loadStyles(), this.decorate()]);
    this.style.display = '';
    // used when the header is embeded on coimmunity/legacy pages.
    this.dispatchEvent(new Event('header-loaded'));
    this.isLoaded = true;
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
