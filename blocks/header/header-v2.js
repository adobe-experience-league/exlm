/**
 * IMPORTANT:
 * This header will also be embeded in community and legacy pages so please make
 * sure to test it in those environments as well when you make changes to the header.
 */

import {
  htmlToElement,
  decorateLinks,
  getConfig,
  getPathDetails,
  fetchLanguagePlaceholders,
  fetchGlobalFragment,
} from '../../scripts/scripts.js';
import { isSignedInUser } from '../../scripts/auth/profile.js';
import { isPLEligible } from '../../scripts/utils/premium-learning-utils.js';
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
 * @property {Object} [placeholders] - language placeholders object
 * @property {Promise} [navReadyDeps] - resolves once search/language decorators have run;
 *   set by decorate() and awaited by navDecorator before building the mobile drawer only
 *   (the desktop nav doesn't need it and renders before this resolves)
 */

const HEADER_CSS = `/blocks/header/exl-header-v2.css`;

let searchElementPromise = null;
const { khorosProfileUrl, communityHost } = getConfig();

/**
 * @returns {Promise<string|null>} the profile picture url, or null if unavailable
 */
const getPPSProfilePicture = async () => {
  try {
    const { defaultProfileClient } = await import('../../scripts/auth/profile.js');
    const ppsProfile = await defaultProfileClient.getPPSProfile();
    return ppsProfile?.images['50'] || null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return null;
  }
};

async function loadSearchElement() {
  const [solutionTag] = getMetadata('solution').trim().split(',');
  if (solutionTag) {
    window.headlessSolutionProductKey = solutionTag;
  }
  searchElementPromise = searchElementPromise ?? import('../../scripts/search/search.js');
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
 * Resolves a header link to an absolute url, localizing the site root for non-en langs.
 * @param {string} currentHref
 * @param {string} lang
 * @param {string} origin
 * @returns {string}
 */
const resolveHeaderLink = (currentHref, lang, origin) => {
  const link = currentHref === '/' && lang !== 'en' ? `/${lang}` : currentHref;
  return new URL(link, origin).href;
};

/**
 * Decorates the brand block
 * @param {HTMLElement} brandBlock
 * */
const brandDecorator = (brandBlock, decoratorOptions) => {
  simplifySingleCellBlock(brandBlock);
  const brandLink = brandBlock.querySelector('a');
  brandBlock.replaceChildren(brandLink);
  updateLinks(brandBlock, (currentHref) =>
    resolveHeaderLink(currentHref, decoratorOptions.lang, decoratorOptions.navLinkOrigin),
  );
  return brandBlock;
};

/**
 * Resets a mobile drill-panel toggle's accordion state (aria-expanded + expanded classes).
 * The same toggle carries both the drill-panel's `nav-mobile-panel-open` class (owned by
 * setupMobileDrillPanels) and the accordion's own state (set by toggleExpandContent, which
 * fires on the same click that opens the panel) — closing the panel must clear both so
 * assistive tech doesn't report a visually-closed panel as still expanded.
 * @param {HTMLElement} toggle
 */
function collapseDrillToggle(toggle) {
  toggle.setAttribute('aria-expanded', 'false');
  // navItemContent is a sibling of toggle (both children of the .nav-item), not an
  // ancestor — closest() would never find it.
  toggle.parentElement.querySelector(':scope > .nav-item-content')?.classList.remove('nav-item-content-expanded');
  toggle.parentElement.classList.remove('nav-item-expanded-active');
}

/**
 * Toggles the mobile nav drawer.
 *
 * @param {Element} button - The hamburger button element
 * @param {Element} mobileDrawer - The mobile nav drawer element
 * @param {Element} navOverlay - The overlay element
 */
function toggleMobileNav(button, mobileDrawer, navOverlay) {
  const shadowRoot = button.getRootNode();
  const profileButton = shadowRoot.querySelector('.profile-toggle');
  if (profileButton && profileButton.getAttribute('aria-expanded') === 'true') {
    profileButton.click();
  }
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !isExpanded);
  mobileDrawer.classList.toggle('nav-mobile-drawer-open');
  if (!isExpanded) {
    navOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    navOverlay.classList.add('hidden');
    document.body.removeAttribute('style');
    // reset any open drill-down panels, and their toggles' accordion state, so the drawer
    // reopens at the root in a fully-collapsed, ARIA-consistent state
    mobileDrawer.querySelectorAll('.nav-mobile-panel-open').forEach((p) => p.classList.remove('nav-mobile-panel-open'));
    mobileDrawer
      .querySelectorAll('.nav-mobile-drill-toggle[aria-expanded="true"]')
      .forEach((t) => collapseDrillToggle(t));
  }
}

/**
 * adds hamburger button that controls the mobile nav drawer
 * @param {HTMLElement} mobileDrawer
 * @param {HTMLElement} navOverlay
 * @returns {HTMLButtonElement}
 */
const hamburgerButton = (mobileDrawer, navOverlay) => {
  const drawerId = 'nav-mobile-drawer';
  mobileDrawer.id = drawerId;
  const button = htmlToElement(`
    <button
      class="nav-hamburger"
      aria-label="Navigation menu"
      aria-expanded="false"
      aria-haspopup="true"
      aria-controls="${drawerId}">
      <span class="icon icon-menu"></span>
    </button>`);

  decorateIcons(button);

  button.addEventListener('click', () => {
    toggleMobileNav(button, mobileDrawer, navOverlay);
  });

  registerHeaderResizeHandler(() => {
    if (!isMobile() && button.getAttribute('aria-expanded') === 'true') {
      toggleMobileNav(button, mobileDrawer, navOverlay);
    }
  });

  return button;
};

/**
 * Builds nav items from the provided basic list
 * @param {HTMLUListElement} ul
 * @param {number} level
 * @param {{mobileOnly?: boolean}} opts - `mobileOnly`: skip the resize-reactive hover/click
 *   switching (registerHeaderResizeHandler) and just bind click once. Used for the mobile
 *   drawer's cloned tree, which is only ever reachable via the hamburger (hidden ≥1024px)
 *   and so never needs to react to viewport resize — avoids doubling the number of
 *   permanently-retained resize handlers registered for the desktop tree.
 */
const buildNavItems = (ul, level = 0, opts = {}) => {
  const { mobileOnly = false } = opts;
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
      // a level-0 link with `@tab` in its href opts this dropdown into the tab layout (desktop only).
      // Supported shape only: root `@tab` link -> level-1 tabs -> leaf links. A dropdown nested
      // inside a tab's own content (level-2+) won't be interactive on desktop, since only
      // level-0 togglers keep a click handler there (see the non-mobileOnly branch below) —
      // setupTabDropdowns() warns if it finds this.
      const rootLinkHref = navItem.querySelector(':scope > p > a, :scope > a')?.getAttribute('href') || '';
      const isTabDropdown = level === 0 && rootLinkHref.includes('@tab');

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
        `<button class="${toggleClass}" aria-controls="${controlName}" aria-expanded="false"><span class="nav-item-toggle-text">${firstEl.textContent}</span><span class="icon icon-nav-chevron"></span></button>`,
      );
      decorateIcons(toggler);
      const navItemContent = document.createElement('div');
      navItemContent.append(content);
      navItemContent.setAttribute('id', controlName);
      navItemContent.classList.add('nav-item-content', `nav-item-content-level-${level}`);
      if (secondaryContent && !isTabDropdown) {
        secondaryContent.classList.add('nav-items-secondary');
        navItemContent.append(secondaryContent);
      }
      const children = [toggler, navItemContent];
      navItem.replaceChildren(...children);
      if (isTabDropdown) {
        navItem.classList.add('nav-item-tab');
        navItemContent.classList.add('nav-item-content-tab');
      }
      const currentActiveClass = 'nav-item-expanded-active';
      const itemContentExpanded = 'nav-item-content-expanded';

      const isNotAncestorOfToggler = (parent) =>
        parent && !parent.contains(toggler) && !parent.parentElement.contains(toggler);
      const getAllByClass = (className) => [...toggler.getRootNode().querySelectorAll(`.${className}`)];
      const removeClassFromAll = (className) =>
        getAllByClass(className).forEach((el) => el.classList.remove(className));
      const removeClassFromNonAncestorAll = (className) => {
        getAllByClass(className)
          .filter(isNotAncestorOfToggler)
          .forEach((el) => el.classList.remove(className));
      };

      const resetExpandedAttribute = () => {
        const els = toggler.getRootNode().querySelectorAll('.nav-item-toggle[aria-expanded="true"]');
        if (els && els.length)
          [...els].filter(isNotAncestorOfToggler).forEach((el) => el.setAttribute('aria-expanded', false));
      };

      const setExpandedState = (toggleElement, containerElement, expanded) => {
        // reset state

        // set new state for nav items
        resetExpandedAttribute();
        toggleElement.setAttribute('aria-expanded', expanded);
        // remove active class from all other expanded nav items
        removeClassFromNonAncestorAll(itemContentExpanded);
        removeClassFromAll(currentActiveClass);
        if (expanded) {
          containerElement.classList.add(itemContentExpanded);
          containerElement.parentElement.classList.add(currentActiveClass);
        } else {
          containerElement.classList.remove(itemContentExpanded);
          containerElement.parentElement.classList.remove(currentActiveClass);
        }
      };

      /** @param {Event} e */
      const toggleExpandContent = (e) => {
        const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
        setExpandedState(toggler, navItemContent, !isExpanded);
        if (!isExpanded) {
          const rootItem = e.type === 'mouseenter' ? e.target : toggler.parentElement;
          rootItem.querySelectorAll('.nav-item-content').forEach((childContent) => {
            childContent.classList.add('nav-item-content-expanded');
          });
        }
      };
      if (mobileOnly) {
        // mobile drawer is only ever shown below the 1024px breakpoint (hidden via CSS
        // otherwise), so it always behaves like the resize handler's "mobile" branch —
        // bind click once instead of registering a resize-reactive handler for it too.
        toggler.addEventListener('click', toggleExpandContent);
      } else {
        // listen for page resize, update events accordingly
        registerHeaderResizeHandler(() => {
          if (isMobile()) {
            // if mobile, add click event, remove mouseenter/mouseleave
            toggler.addEventListener('click', toggleExpandContent);
            toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
            toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
          } else {
            // if desktop, root-level items toggle on click; sub-level items have no toggle
            toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
            toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
            if (level === 0) {
              toggler.addEventListener('click', toggleExpandContent);
            } else {
              toggler.removeEventListener('click', toggleExpandContent);
            }
          }
        });
      }
      buildNavItems(content, level + 1, opts);
      if (secondaryContent && isTabDropdown) {
        secondaryContent.classList.add('nav-items-secondary');
        const footerLi = document.createElement('li');
        footerLi.classList.add('nav-items-secondary-li');
        footerLi.append(secondaryContent);
        content.append(footerLi);
      }
    } else {
      navItem.classList.add('nav-item-leaf');
      const firstEl = navItem.firstElementChild;
      if (firstEl?.tagName === 'P' && firstEl.firstElementChild?.tagName === 'A') {
        firstEl.replaceWith(firstEl.firstElementChild);
      }

      const anchor = navItem.querySelector(':scope > a');
      if (!anchor) return;

      let subtitleHTML = null;
      const subtitleP = navItem.querySelector(':scope > p');
      if (subtitleP) {
        subtitleHTML = subtitleP.innerHTML;
        subtitleP.remove();
      } else {
        // Fallback: next text node after <a>
        let node = anchor.nextSibling;
        while (node && node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
          node = node.nextSibling;
        }

        if (node?.nodeType === Node.TEXT_NODE) {
          subtitleHTML = node.textContent.trim();
          node.remove();
        }
      }

      if (subtitleHTML) {
        anchor.appendChild(htmlToElement(`<span class="nav-item-subtitle">${subtitleHTML}</span>`));
      }
    }
  };

  [...ul.children].forEach(decorateNavItem);
};

/**
 * Wires hover-driven tab switching for level-0 dropdowns flagged with `@tab` (desktop only).
 * Each level-1 item is a tab in the left column; hovering it shows its content on the right.
 * @param {HTMLElement} navContainer the desktop nav ul
 */
const setupTabDropdowns = (navContainer) => {
  navContainer.querySelectorAll(':scope > .nav-item-tab').forEach((rootItem) => {
    const tabs = [...rootItem.querySelectorAll(':scope > .nav-item-content > ul > .nav-item')];
    if (!tabs.length) return;
    const setActive = (active) => tabs.forEach((tab) => tab.classList.toggle('nav-tab-active', tab === active));
    tabs.forEach((tab) => {
      // give each tab's right pane a heading matching the tab label
      const label = tab.querySelector(':scope > .nav-item-toggle')?.textContent.trim();
      const content = tab.querySelector(':scope > .nav-item-content');
      if (label && content && !content.querySelector(':scope > .nav-tab-heading')) {
        content.prepend(htmlToElement(`<div class="nav-tab-heading">${label}</div>`));
      }
      // @tab dropdowns only support root -> tabs -> leaf links; a link nested inside a
      // tab's own content that itself has a dropdown (a `.nav-item-toggle`) won't be
      // reachable on desktop (see the isTabDropdown comment in decorateNavItem) — warn
      // instead of silently shipping unreachable content.
      if (content?.querySelector(':scope > ul > .nav-item > .nav-item-toggle')) {
        // eslint-disable-next-line no-console
        console.warn(
          `@tab dropdown "${label || 'unknown'}" has a nested dropdown link that won't be reachable on desktop`,
        );
      }
      tab.addEventListener('mouseenter', () => setActive(tab));
    });
    // default to the first tab so the right pane is never empty when the dropdown opens
    setActive(tabs[0]);
  });
};

/**
 * Converts @tab dropdowns in the mobile drawer into a recursive slide-in drill-down.
 * Tapping a branch row slides in a full-drawer panel (header: back / title / close) listing
 * its children; the deepest panels show the leaf links. Desktop is unaffected.
 * Panels are driven purely by the `nav-mobile-panel-open` class, so they coexist with the
 * existing accordion handlers (whose class churn is overridden by the panel CSS).
 * @param {HTMLUListElement} mobileUl the mobile drawer's root ul
 */
const setupMobileDrillPanels = (mobileUl) => {
  const buildPanel = (item) => {
    const toggle = item.querySelector(':scope > .nav-item-toggle');
    const content = item.querySelector(':scope > .nav-item-content');
    if (!toggle || !content) return;

    content.classList.add('nav-mobile-panel');
    const header = htmlToElement(
      `<div class="nav-mobile-panel-header">
        <button class="nav-mobile-panel-back" aria-label="Back">
          <span class="icon icon-nav-chevron"></span>
        </button>
        <span class="nav-mobile-panel-title">${toggle.textContent.trim()}</span>
        <button class="nav-mobile-panel-close" aria-label="Close navigation menu">
          <span class="icon icon-close"></span>
        </button>
      </div>`,
    );
    decorateIcons(header);
    content.prepend(header);

    toggle.classList.add('nav-mobile-drill-toggle');
    toggle.addEventListener('click', () => content.classList.add('nav-mobile-panel-open'));
    header.querySelector('.nav-mobile-panel-back').addEventListener('click', () => {
      content.classList.remove('nav-mobile-panel-open');
      collapseDrillToggle(toggle);
    });
    header.querySelector('.nav-mobile-panel-close').addEventListener('click', () => {
      content.getRootNode().querySelector('.nav-hamburger')?.click();
    });

    // recurse into nested branch items (leaf links have no toggle/content and are skipped)
    content.querySelectorAll(':scope > ul > .nav-item').forEach(buildPanel);
  };

  // level 0 stays a normal accordion toggle (inline, scrollable list); slide-in panels
  // begin at level 1 — so process the children of each @tab root, not the root itself.
  mobileUl.querySelectorAll(':scope > .nav-item-tab > .nav-item-content > ul > .nav-item').forEach(buildPanel);
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
 * Builds and returns the mobile nav drawer element.
 * Creates a separate DOM from the desktop nav-wrapper with its own header, body, and footer.
 * @param {HTMLUListElement} ul - cloned source nav ul (not yet decorated)
 * @param {HTMLElement} navBlock
 * @param {DecoratorOptions} decoratorOptions
 * @returns {HTMLElement}
 */
const buildMobileNavDrawer = (ul, navBlock, decoratorOptions) => {
  // Mobile-specific items added before buildNavItems so decorateNavItem processes them
  if (!document.body.classList.contains('search')) {
    const mobileSearchLi = htmlToElement(`<li class="nav-item-mobile">${decoratorState.searchLinkHtml}</li>`);
    ul.appendChild(mobileSearchLi);
    mobileSearchLi.querySelector('a')?.addEventListener('click', (e) => {
      decoratorState.headerSearchIconClick?.(e);
    });
  }
  if (decoratorState.languages?.length) {
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
  buildNavItems(ul, 0, { mobileOnly: true });
  setupMobileDrillPanels(ul);

  // Drawer header: logo + brand (left), close button (right)
  const logoBlock = navBlock.closest('nav').querySelector('.adobe-logo');
  const logoClone = logoBlock ? logoBlock.cloneNode(true) : null;
  if (logoClone) logoClone.classList.add('nav-mobile-logo');

  const brandBlock = navBlock.closest('nav').querySelector('.brand');
  const brandClone = brandBlock ? brandBlock.cloneNode(true) : document.createElement('div');
  brandClone.classList.add('nav-mobile-brand');

  const headerBrand = htmlToElement('<div class="nav-mobile-header-brand"></div>');
  if (logoClone) headerBrand.appendChild(logoClone);
  headerBrand.appendChild(brandClone);

  const closeBtn = htmlToElement(
    `<button class="nav-mobile-close" aria-label="Close navigation menu">
      <span class="icon icon-close"></span>
    </button>`,
  );
  decorateIcons(closeBtn);

  const drawerHeader = htmlToElement('<div class="nav-mobile-header"></div>');
  drawerHeader.append(headerBrand, closeBtn);

  // Drawer body: scrollable nav items
  const drawerBody = htmlToElement('<div class="nav-mobile-body"></div>');
  drawerBody.appendChild(ul);

  // Drawer footer: profile info or sign-in button (populated async)
  const drawerFooter = htmlToElement('<div class="nav-mobile-footer"></div>');

  const drawer = htmlToElement('<div class="nav-mobile-drawer"></div>');
  drawer.append(drawerHeader, drawerBody, drawerFooter);

  // Append to header-wrapper (sibling of .header) — mobile has its own standalone CSS
  const shadowRoot = navBlock.getRootNode();
  const headerWrapper = shadowRoot.querySelector?.('.header-wrapper');
  if (headerWrapper) headerWrapper.appendChild(drawer);

  // Close button delegates to the hamburger so toggleMobileNav handles all state
  closeBtn.addEventListener('click', () => {
    closeBtn.getRootNode().querySelector('.nav-hamburger')?.click();
  });

  // Populate footer based on sign-in state
  // Wrapped in Promise.resolve() because, unlike the `await decoratorOptions.isUserSignedIn()`
  // calls elsewhere in this file, this one can't use `await` (buildMobileNavDrawer isn't async
  // since it must return the drawer synchronously) — so it needs explicit tolerance for
  // legacy/community embeds whose isUserSignedIn doesn't return a real Promise.
  Promise.resolve(decoratorOptions.isUserSignedIn()).then(async (signedIn) => {
    if (signedIn) {
      let profilePicSrc = null;
      let displayName = '';
      let userEmail = '';
      try {
        profilePicSrc = await decoratorOptions.getProfilePicture();
      } catch (e) {
        /* ignore */
      }
      try {
        const { defaultProfileClient } = await import('../../scripts/auth/profile.js');
        const profileData = await defaultProfileClient.getIMSProfile();
        displayName = profileData?.displayName || '';
        userEmail = profileData?.email || '';
      } catch (e) {
        /* ignore */
      }
      const avatarHtml = profilePicSrc
        ? `<img class="nav-mobile-profile-picture" src="${profilePicSrc}" alt="profile picture" />`
        : `<span class="icon icon-profile"></span>`;
      drawerFooter.innerHTML = `
        <div class="nav-mobile-profile">
          ${avatarHtml}
          <div class="nav-mobile-profile-info">
            <span class="nav-mobile-profile-name">${displayName}</span>
            <span class="nav-mobile-profile-email">${userEmail}</span>
          </div>
        </div>`;
      if (!profilePicSrc) decorateIcons(drawerFooter);
    } else {
      const signInBtn = htmlToElement('<button class="nav-mobile-signin button">Sign In</button>');
      signInBtn.addEventListener('click', () => decoratorOptions.onSignIn());
      drawerFooter.appendChild(signInBtn);
    }
  });

  return drawer;
};

/**
 * Decorates the nav block
 * @param {HTMLElement} navBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const navDecorator = async (navBlock, decoratorOptions) => {
  simplifySingleCellBlock(navBlock);
  const navOverlay = document.querySelector('.nav-overlay');

  // Clone the source ul for mobile BEFORE moving it to the desktop nav-wrapper
  const sourceUl = navBlock.querySelector(':scope > ul');
  const mobileUl = sourceUl ? sourceUl.cloneNode(true) : document.createElement('ul');

  // Desktop nav-wrapper
  const navWrapper = htmlToElement('<div class="nav-wrapper"></div>');
  navWrapper.replaceChildren(...navBlock.children);
  navBlock.appendChild(navWrapper);

  // Build desktop nav items
  const desktopUl = navWrapper.querySelector(':scope > ul');
  buildNavItems(desktopUl);
  setupTabDropdowns(desktopUl);

  // The desktop nav is ready now — show it without waiting on the search/language
  // decorators, which only the mobile drawer (built below) actually needs. decorateHeaderBlock
  // re-sets visibility to 'visible' again once this whole function resolves, which is harmless.
  navBlock.style.visibility = 'visible';
  await decoratorOptions.navReadyDeps;

  // The desktop nav above is already visible and fully usable. Isolate the rest (mobile
  // drawer, hamburger, outside-click handling) in its own try/catch so a failure here —
  // e.g. an unexpected DOM shape in a community/legacy embed — can't reject navDecorator's
  // promise and skip updateNavLinks below, leaving a visible-but-unnormalized desktop nav.
  let mobileDrawer;
  try {
    // Build separate mobile drawer and attach it to header-wrapper
    mobileDrawer = buildMobileNavDrawer(mobileUl, navBlock, decoratorOptions);

    // Hamburger button references the mobile drawer
    const hamburger = hamburgerButton(mobileDrawer, navOverlay);
    navBlock.insertBefore(hamburger, navWrapper);

    // Close expanded root nav items when clicking anywhere outside that item on desktop —
    // scoped per-item (not just outside the whole header) so clicking a sibling header
    // control (search, sign-in, language selector, profile/product toggle) also closes it.
    //
    // This needs two listeners because of shadow-DOM event retargeting: a listener on
    // `document` (outside the shadow tree) always sees `e.target` as `shadowRoot.host` for
    // any click that originated inside the shadow tree — so a per-toggle containment check
    // there is always false, closing a dropdown on the very click that just opened it. The
    // fine-grained "clicked a different in-header control" check has to live on a listener
    // *inside* the shadow tree, where `e.target` is still the real element clicked.
    const shadowRoot = navBlock.getRootNode();
    if (shadowRoot?.host) {
      shadowRoot.addEventListener('click', (e) => {
        if (isMobile()) return;
        shadowRoot.querySelectorAll('.nav-item-toggle-root[aria-expanded="true"]').forEach((t) => {
          if (!t.parentElement.contains(e.target)) t.click();
        });
      });
      // Click entirely outside the header (light DOM) — e.target is retargeted to
      // shadowRoot.host for in-header clicks, so this only ever fires for real outside clicks.
      shadowRoot.host.ownerDocument.addEventListener('click', (e) => {
        if (isMobile() || shadowRoot.host.contains(e.target)) return;
        shadowRoot.querySelectorAll('.nav-item-toggle-root[aria-expanded="true"]').forEach((t) => t.click());
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error building mobile nav drawer/outside-click handling; desktop nav remains usable', err);
  }

  // TODO: Remove isSignedInUser call and move signedIn check to isPLEligible function once cyclic dependency is resolved.
  isSignedInUser()
    .then((signedIn) => isPLEligible(signedIn))
    .then((isMember) => {
      if (isMember) {
        const placeholders = decoratorOptions.placeholders ?? {};
        const premiumLearningLabel = placeholders?.premiumLearningHeaderLabel || 'Premium Learning';
        const { premiumHomeUrl } = getConfig();
        const plItem = htmlToElement(
          `<li class="nav-item nav-item-root nav-item-leaf">
            <a href="${premiumHomeUrl}" title="${premiumLearningLabel}">${premiumLearningLabel}</a>
          </li>`,
        );
        desktopUl.appendChild(plItem);
        const mobileNavUl = mobileDrawer?.querySelector('.nav-mobile-body > ul');
        if (mobileNavUl) {
          const firstMobileItem = mobileNavUl.querySelector('.nav-item-mobile');
          const plMobileItem = plItem.cloneNode(true);
          if (firstMobileItem) {
            mobileNavUl.insertBefore(plMobileItem, firstMobileItem);
          } else {
            mobileNavUl.appendChild(plMobileItem);
          }
        }
      }
    })
    .catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error('Error checking Premium Learning membership in header:', err);
    });

  updateNavLinks(navBlock, decoratorOptions.navLinkOrigin);
};

/**
 * Decorates the search block
 * @param {HTMLElement} searchBlock
 * @param {DecoratorOptions} decoratorOptions
 */
const searchDecorator = async (searchBlock, decoratorOptions) => {
  const placeholders = decoratorOptions.placeholders ?? {};
  // save this for later use in mobile nav.
  const searchLink = getCell(searchBlock, 1, 1)?.firstChild;
  decoratorState.searchLinkHtml = searchLink?.outerHTML ?? '';

  // build search options (used for default / contextual content-type filter on redirect)
  const searchOptions = getCell(searchBlock, 3, 1)?.firstElementChild?.children || [];
  const options = [...searchOptions].map((option) => option.textContent);

  searchBlock.innerHTML = '';
  const searchWrapper = htmlToElement(
    `<div class="search-short">
        <a href="${searchLink?.href || '#'}" aria-label="Search">
          <span title="${placeholders?.search || 'Search'}" class="icon icon-search"></span>
        </a>
      </div>`,
  );

  const searchModule = await loadSearchElement();
  const { redirectToSearchPage, getHeaderSearchFilterValue } = searchModule;
  const filterValue = getHeaderSearchFilterValue(options, {
    preferCommunity: Boolean(decoratorOptions?.community?.active),
  });
  const searchUrl = searchLink?.href;

  if (searchUrl) {
    decoratorState.headerSearchIconClick = (e) => {
      e.preventDefault();
      redirectToSearchPage(searchUrl, '', filterValue);
    };
    searchWrapper.querySelector('.search-short a')?.addEventListener('click', decoratorState.headerSearchIconClick);
  } else {
    decoratorState.headerSearchIconClick = null;
  }

  searchBlock.append(searchWrapper);
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
        <span class="icon icon-emailOutline"></span>
      </a>
    </div>
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
    productToggle.setAttribute('aria-expanded', 'false');
    productToggle.setAttribute('aria-label', 'Product Grid');
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
    productGridBlock.remove();
  }
  return productGridBlock;
};

/**
 * Decorates the adobe-logo block
 * @param {HTMLElement} adobeLogoBlock
 */
const adobeLogoDecorator = async (adobeLogoBlock, decoratorOptions) => {
  simplifySingleCellBlock(adobeLogoBlock);
  decorateIcons(adobeLogoBlock);
  adobeLogoBlock.querySelector('a').setAttribute('aria-label', 'Adobe Experience League'); // a11y
  updateLinks(adobeLogoBlock, (currentHref) =>
    resolveHeaderLink(currentHref, decoratorOptions.lang, decoratorOptions.navLinkOrigin),
  );
  return adobeLogoBlock;
};

/** @param {HTMLElement} block  */
const decorateNewTabLinks = (block) => {
  const links = block.querySelectorAll('a[target="_blank"]');
  links.forEach((link) => {
    link.setAttribute('rel', 'noopener noreferrer');
    // insert after the first child node (fall back to append for empty anchors)
    const icon = htmlToElement('<span class="icon icon-link-out"></span>');
    if (link.firstChild) {
      link.firstChild.after(icon);
    } else {
      link.append(icon);
    }
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

    const doSignOut = async () => {
      const { signOut } = await import('../../scripts/auth/profile.js');
      return signOut();
    };

    const doSignIn = async () => {
      window.adobeIMS.signIn();
    };

    this.decoratorOptions = options;
    options.isUserSignedIn = options.isUserSignedIn || isSignedInUser;
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
    const fallback = '/en/global-fragments/header-v2';
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

      try {
        this.decoratorOptions.placeholders = await fetchLanguagePlaceholders(this.decoratorOptions.lang);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching placeholders:', err);
        this.decoratorOptions.placeholders = {};
      }

      const decorateHeaderBlock = async (className, decorator, options) => {
        try {
          const block = nav.querySelector(`:scope > .${className}`);
          if (!block) return;
          block.style.visibility = 'hidden';
          await decorator(block, options);
          block.style.visibility = 'visible';
          this.dispatchEvent(new Event(`${className}-decorated`));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`Error decorating header block: ${className}`, err);
        }
      };

      // Do this first to ensure all links are decorated correctly before they are used.
      decorateLinks(header);
      const logoP = decorateHeaderBlock('adobe-logo', this.adobeLogoDecorator, this.decoratorOptions);
      const brandP = decorateHeaderBlock('brand', this.brandDecorator, this.decoratorOptions);
      let searchP;
      if (!document.body.classList.contains('search')) {
        searchP = await decorateHeaderBlock('search', this.searchDecorator, this.decoratorOptions);
      } else {
        nav?.querySelector(`:scope > .search`)?.remove();
      }
      const languageP = decorateHeaderBlock('language-selector', this.languageDecorator, this.decoratorOptions);
      const productGridP = decorateHeaderBlock('product-grid', this.productGridDecorator, this.decoratorOptions);
      const signInP = decorateHeaderBlock('sign-in', this.signInDecorator, this.decoratorOptions);
      const newTabLinkP = decorateNewTabLinks(header);
      // Only the mobile drawer (built inside navDecorator, after the visible desktop nav)
      // consumes decoratorState set by the search and language decorators — navDecorator
      // awaits this itself right before building the drawer, so the desktop nav doesn't
      // wait on it too.
      this.decoratorOptions.navReadyDeps = Promise.allSettled([searchP, languageP]);
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

customElements.define('exl-header-v2', ExlHeader);

/**
 * Create header web component and attach to the DOM
 * @param {HTMLHeadElement} headerBlock
 */
export default async function decorate(headerBlock, options = {}) {
  // marks the semantic <header> so global styles (see styles/styles.css) can differ for v2
  headerBlock.parentElement?.classList.add('header-v2');
  const exlHeader = new ExlHeader(options);
  headerBlock.replaceChildren(exlHeader);
}
