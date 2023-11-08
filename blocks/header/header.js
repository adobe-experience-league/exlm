import { createTag } from '../../scripts/scripts.js';

/**
 * Removes all elements in el; except the one child matching the provided selector
 * @param {HTMLElement} el
 * @param {string} selector
 */
export const removeAllButSelector = (el, selector) => {
  const selectedChild = el.querySelector(selector);
  if (selectedChild) {
    el.innerHTML = selectedChild.outerHTML;
  }
};

// fetch fragment html
const fetchContent = async (url) => {
  const response = await fetch(url);
  return response.text();
};

// Desktop Only (1025px onwards)
const isDesktop = window.matchMedia('(min-width: 1025px)');

// Mobile Only (Until 1024px)
const isMobile = window.matchMedia('(max-width: 1024px)');

// Configurable data
const CONFIG = {
  basePath: '/fragments/en',
  topNavPath: '/header/topnav.plain.html',
  learnPath: '/header/learn.plain.html',
  communityPath: '/header/community.plain.html',
  languagePath: '/languages/languages.plain.html',
};

// Get fragement Data
const topNavContent = await fetchContent(
  `${CONFIG.basePath}${CONFIG.topNavPath}`,
);
const languageTabContent = await fetchContent(
  `${CONFIG.basePath}${CONFIG.languagePath}`,
);
const learnTabContent = await fetchContent(
  `${CONFIG.basePath}${CONFIG.learnPath}`,
);
const communityTabContent = await fetchContent(
  `${CONFIG.basePath}${CONFIG.communityPath}`,
);

// Body Tag
const bodyTag = document.querySelector('body');

// Paint header content to DOM
function displayHeaderContent(block) {
  const navAttributes = {
    role: 'navigation',
    class: 'exl-topnav',
    'aria-label': 'Main navigation',
  };

  const navWrapper = createTag('nav', navAttributes);
  navWrapper.innerHTML = topNavContent;
  block.innerHTML = navWrapper.outerHTML;
}

// Prepend curtain wrapper inside Body tag
function exlCurtain() {
  const exlOverlay = createTag('div', { class: 'exl-curtain' });
  bodyTag.prepend(exlOverlay);
}

/**
 * Add Hamburger for Mobile
 * @param {HTMLElement} block
 */
function exlHamburger(block) {
  const hamburgerAttributes = {
    role: 'button',
    class: 'nav-hamburger',
    'aria-label': 'menu',
    'aria-expanded': 'false',
  };
  const hamburgerTextContent =
    '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  const hamburger = createTag('a', hamburgerAttributes, hamburgerTextContent);
  block.prepend(hamburger);

  if (isMobile.matches) {
    hamburger.addEventListener('mousedown', () => {
      hamburger.classList.toggle('is-active');
      bodyTag.classList.toggle('is-shown');
    });
  }
}

// Exl Logo Branding
function exlBrand(block) {
  const exlLogo = block.querySelector('.gnav-brand');
  exlLogo.className = 'exl-brand-container';

  // Remove unwanted Div blocks from logo block
  removeAllButSelector(exlLogo, 'h2');
}

// Decorate Exl Navigation
function decorateExlNavigation(block) {
  const selectors = block.querySelectorAll('.exl-topnav .topnav-item');

  selectors.forEach((selector) => {
    if (selector.classList.contains('large-menu')) {
      selector.className = 'exl-nav-item large-menu';
    } else {
      selector.className = 'exl-nav-item';
    }
  });

  // Wrap only nav items in a parent div block
  const exlNav = createTag('div', { class: 'exl-nav' });
  const exlTopNav = block.querySelector('.exl-topnav');
  const exlTopNavFirstChild = exlTopNav.querySelector('.exl-topnav > div');
  const navItems = exlTopNav.querySelectorAll('.exl-nav-item');
  const profile = exlTopNav.querySelector('.profile');

  navItems.forEach((item) => {
    const h2Tag = item.querySelector('h2');
    if (h2Tag) {
      item.innerHTML = h2Tag.innerHTML;
    }
    exlNav.appendChild(item);
  });

  exlTopNavFirstChild.insertBefore(exlNav, profile);

  // Replace anchor text with Adobe Logo image
  const adobeLogo = block.querySelector('.adobe-logo');
  removeAllButSelector(adobeLogo, 'a');

  // Reposition Sign up Link
  exlTopNavFirstChild.insertBefore(profile, adobeLogo);

  // Move nav action items into a parent div block
  const exlNavActionItems = [
    '.search',
    '.language-selector',
    '.profile',
    '.adobe-logo',
  ];
  const exlNavAction = createTag('div', { class: 'exl-nav-action' });
  exlNavActionItems.forEach((actionitem) => {
    exlNavAction.appendChild(exlTopNav.querySelector(actionitem));
  });

  exlNav.parentNode.insertBefore(exlNavAction, exlNav.nextSibling);
}

// Update Search content
function decorateSearchContent(block) {
  const search = block.querySelector('.exl-topnav .search');
  const searchFirstChild = block.querySelector('.search > div:nth-child(1)');
  const searchSecondChild = block.querySelector('.search > div:nth-child(2)');
  const searchContent = `<a href="https://experienceleague.adobe.com/search.html" class="exl-search-link">Search</a><span class="exl-search-icon"></span><input autocomplete="off" class="exl-search-input" type="text" role="combobox" placeholder="Search Experience League"><button id="dropdownButton" type="button" class="exl-dropdown-picker" aria-haspopup="true"><span class="exl-picker-label">All</span><img src="https://experienceleague.adobe.com/assets/img/chevron_down.svg" height="20" class="exl-icon" aria-hidden="true" /></button>`;

  searchFirstChild.innerHTML = searchContent;
  searchSecondChild.className = 'search-popover';

  const exlDropdownPicker = search.querySelector('.exl-dropdown-picker');
  const exlSearchPopover = search.querySelector('.search-popover');
  const exlDropdownArrow = search.querySelector('.exl-icon');
  if (exlDropdownPicker) {
    exlDropdownPicker.addEventListener('mousedown', () => {
      exlSearchPopover.classList.toggle('show');
      exlDropdownArrow.classList.toggle('arrow');
    });
  }

  document.addEventListener(
    'click',
    (event) => {
      if (event.target.matches('.search') || !event.target.closest('.search')) {
        exlSearchPopover.classList.remove('show');
        exlDropdownArrow.classList.remove('arrow');
      }
    },
    false,
  );
}

// Update language selector content
function manageLocale(block) {
  const languageDiv = createTag('div', {
    class: 'language-dropdown',
    'data-id': 'lang-menu',
  });
  const languageSelector = block.querySelector('.language-selector');

  removeAllButSelector(languageSelector, 'a');
  languageDiv.innerHTML = languageTabContent;
  removeAllButSelector(languageDiv, 'ul');
  languageSelector.appendChild(languageDiv);

  const langAnchor = languageSelector.querySelector('a');
  if (CONFIG.basePath.indexOf('en' !== -1)) {
    languageDiv.querySelector('li:nth-child(2) > a').classList.add('selected');
  }

  if (isDesktop.matches) {
    languageSelector.addEventListener('mouseover', () => {
      languageSelector.classList.add('active');
    });

    languageSelector.addEventListener('mouseout', () => {
      languageSelector.classList.remove('active');
    });
  } else if (isMobile.matches) {
    langAnchor.innerHTML = 'Change region';
    languageSelector.addEventListener('mousedown', (e) => {
      e.preventDefault();
      langAnchor.removeAttribute('href');
      languageDiv.removeAttribute('style');
      languageSelector.classList.toggle('active');
    });
  }
}

/**
 * Decoration Sub navigation content
 * @param {HTMLElement} block
 */
function decorateSubNavigation(block) {
  const exlNavItems = block.querySelectorAll('.exl-nav .exl-nav-item');
  const exlNavWithLargeMenu = block.querySelectorAll(
    '.exl-nav .exl-nav-item.large-menu',
  );

  exlNavItems.forEach((navitem) => {
    const navitemLink = navitem.querySelector('a');
    const subNavigationWrapper = createTag('div', {
      class: 'exl-subnav-wrapper',
    });

    if (
      navitem.classList.contains('large-menu') &&
      navitemLink.innerText.trim().toLowerCase() === 'learn'
    ) {
      subNavigationWrapper.innerHTML = learnTabContent;
      navitem.appendChild(subNavigationWrapper);
    } else if (
      navitem.classList.contains('large-menu') &&
      navitemLink.innerText.trim().toLowerCase() === 'community'
    ) {
      subNavigationWrapper.innerHTML = communityTabContent;
      navitem.appendChild(subNavigationWrapper);
    }
  });

  exlNavWithLargeMenu.forEach((largemenu) => {
    const largemenuHeadings = largemenu.querySelectorAll('h5');
    const largemenuAnchor = largemenu.querySelector('a');
    if (isDesktop.matches) {
      largemenu.addEventListener('mouseover', () => {
        block.classList.add('exl-overlay');
        largemenuAnchor.classList.add('active');
      });

      largemenu.addEventListener('mouseout', () => {
        block.classList.remove('exl-overlay');
        largemenuAnchor.classList.remove('active');
      });
    } else if (isMobile.matches) {
      largemenuAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        largemenuAnchor.removeAttribute('href');
        largemenuAnchor.nextElementSibling.removeAttribute('style');
        largemenu.classList.toggle('is-expanded');
      });

      largemenuHeadings.forEach((heading) => {
        heading.addEventListener('click', () => {
          heading.parentElement.parentElement.parentElement.classList.toggle(
            'show',
          );
        });
      });
    }
  });

  // Assign redirects to sub menu anchor links
  const subMenuAnchorLinks = block.querySelectorAll('.exl-subnav-wrapper a');

  subMenuAnchorLinks.forEach((submenuanchor) => {
    if (submenuanchor.getAttribute('href').indexOf('#_blank') !== -1) {
      submenuanchor.classList.add('redirect');
    }
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  displayHeaderContent(block);
  exlCurtain();
  exlHamburger(block);
  exlBrand(block);
  decorateExlNavigation(block);
  decorateSearchContent(block);
  manageLocale(block);
  decorateSubNavigation(block);
}
