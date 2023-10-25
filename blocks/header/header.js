const isDesktop = window.matchMedia('(min-width: 1025px)');
const isMobile = window.matchMedia('(max-width: 1024px)');

// Configurable data
const CONFIG = {
  icon: {
    aLogo:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 133.46 118.11" alt="Adobe, Inc."><defs><style>.cls-1{fill:#fa0f00;}</style></defs><polygon class="cls-1" points="84.13 0 133.46 0 133.46 118.11 84.13 0"></polygon><polygon class="cls-1" points="49.37 0 0 0 0 118.11 49.37 0"></polygon><polygon class="cls-1" points="66.75 43.53 98.18 118.11 77.58 118.11 68.18 94.36 45.18 94.36 66.75 43.53"></polygon></svg>',
  },
  basePath: '/fragments/en',
  topNavPath: '/header/topnav.plain.html',
  learnPath: '/header/learn.plain.html',
  communityPath: '/header/community.plain.html',
  languagePath: '/languages/languages.plain.html',
};

// Utility function for http call
const getHTMLData = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    const responseData = response.text();
    return responseData;
  }
  throw new Error(`${url} not found`);
};

// Utility function for removing Extra Divs within div block
const removeExtraDivs = (sel, tag) => {
  const tagType = sel.querySelector(tag);
  if (tagType) {
    sel.innerHTML = tagType.outerHTML;
  }
};

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const topNavContent = await getHTMLData(
    `${CONFIG.basePath}${CONFIG.topNavPath}`,
  );

  const navWrapper = document.createElement('nav');
  navWrapper.className = 'exl-topnav';
  navWrapper.setAttribute('aria-label', 'Main navigation');
  navWrapper.setAttribute('role', 'navigation');

  navWrapper.innerHTML = topNavContent;
  block.innerHTML = navWrapper.outerHTML;

  const wrapper = block.closest('.header');
  const exlLogo = wrapper.querySelector('.gnav-brand');
  exlLogo.className = 'exl-brand-container';

  // Remove extra Div blocks from logo block
  removeExtraDivs(exlLogo, 'h2');

  // Assign slector identifier only to specific nav elements
  const selectors = wrapper.querySelectorAll('.exl-topnav .topnav-item');

  selectors.forEach((selector) => {
    if (selector.classList.contains('large-menu')) {
      selector.className = 'exl-nav-item large-menu';
    } else {
      selector.className = 'exl-nav-item';
    }
  });

  // Wrap only nav items in a parent div block
  const exlNav = document.createElement('div');
  exlNav.className = 'exl-nav';

  const exlTopNav = wrapper.querySelector('.exl-topnav');
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

  // Add Hamburger for Mobile
  const hamburger = document.createElement('a');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('role', 'button');
  hamburger.setAttribute('aria-label', 'menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = `<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>`;
  exlTopNavFirstChild.insertBefore(hamburger, exlLogo);

  // Update Search content
  const search = block.querySelector('.exl-topnav .search');
  const searchFirstChild = exlTopNav.querySelector(
    '.search > div:nth-child(1)',
  );
  const searchSecondChild = exlTopNav.querySelector(
    '.search > div:nth-child(2)',
  );
  const searchContent = `<span class="exl-search-icon"><svg focusable="false" enable-background="new 0 0 20 20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Search" class="exl-search-svg"><title>Search</title><g fill="currentColor"><path class="exl-magnifier-circle-svg" d="m8.368 16.736c-4.614 0-8.368-3.754-8.368-8.368s3.754-8.368 8.368-8.368 8.368 3.754 8.368 8.368-3.754 8.368-8.368 8.368m0-14.161c-3.195 0-5.793 2.599-5.793 5.793s2.599 5.793 5.793 5.793 5.793-2.599 5.793-5.793-2.599-5.793-5.793-5.793"></path><path d="m18.713 20c-.329 0-.659-.126-.91-.377l-4.552-4.551c-.503-.503-.503-1.318 0-1.82.503-.503 1.318-.503 1.82 0l4.552 4.551c.503.503.503 1.318 0 1.82-.252.251-.581.377-.91.377"></path></g></svg></span><input autocomplete="off" class="exl-search-input" type="text" role="combobox" placeholder="Search Experience League"><button id="dropdownButton" type="button" class="exl-dropdown-picker" aria-haspopup="true"><span class="exl-picker-label">All</span><img src="https://experienceleague.adobe.com/assets/img/chevron_down.svg" height="20" class="exl-icon" aria-hidden="true" /></button>`;

  searchFirstChild.innerHTML = searchContent;
  searchSecondChild.className = 'search-popover';
  search.querySelector('.exl-search-input').style.background =
    CONFIG.icon.search;

  const exlDropdownPicker = search.querySelector('.exl-dropdown-picker');
  const exlSearchPopover = search.querySelector('.search-popover');
  const exlDropdownArrow = search.querySelector('.exl-icon');
  if (exlDropdownPicker) {
    exlDropdownPicker.addEventListener('mousedown', () => {
      exlSearchPopover.classList.toggle('show');
      exlDropdownArrow.classList.toggle('arrow');
    });
  }

  // Update language selector content
  const languageDiv = document.createElement('div');
  languageDiv.className = 'language-dropdown';
  languageDiv.setAttribute('data-id', 'lang-menu');

  const languageSelector = wrapper.querySelector('.language-selector');
  removeExtraDivs(languageSelector, 'a');

  // fetch language selector content
  const languageTabContent = await getHTMLData(
    `${CONFIG.basePath}${CONFIG.languagePath}`,
  );
  languageDiv.innerHTML = languageTabContent;
  removeExtraDivs(languageDiv, 'ul');
  languageSelector.appendChild(languageDiv);

  // Replace anchor text with Adobe Logo image
  const adobeLogo = wrapper.querySelector('.adobe-logo');
  removeExtraDivs(adobeLogo, 'a');
  adobeLogo.querySelector('a').innerHTML = CONFIG.icon.aLogo;

  // Reposition Sign Link
  exlTopNavFirstChild.insertBefore(profile, adobeLogo);

  // fetch Sub navigation content
  const subNavContentObj = {
    learnTabContent: await getHTMLData(`${CONFIG.basePath}${CONFIG.learnPath}`),
    communityTabContent: await getHTMLData(
      `${CONFIG.basePath}${CONFIG.communityPath}`,
    ),
  };

  const exlNavItems = wrapper.querySelectorAll('.exl-nav .exl-nav-item');
  const exlNavWithLargeMenu = wrapper.querySelectorAll(
    '.exl-nav .exl-nav-item.large-menu',
  );

  exlNavItems.forEach((navitem) => {
    const navitemLink = navitem.querySelector('a');
    const subNavigationWrapper = document.createElement('div');
    subNavigationWrapper.className = 'exl-subnav-wrapper';
    if (
      navitem.classList.contains('large-menu') &&
      navitemLink.innerText.trim().toLowerCase() === 'learn'
    ) {
      subNavigationWrapper.innerHTML = subNavContentObj.learnTabContent;
      navitem.appendChild(subNavigationWrapper);
    } else if (
      navitem.classList.contains('large-menu') &&
      navitemLink.innerText.trim().toLowerCase() === 'community'
    ) {
      subNavigationWrapper.innerHTML = subNavContentObj.communityTabContent;
      navitem.appendChild(subNavigationWrapper);
    } else if (
      !navitem.classList.contains('large-menu') &&
      navitemLink.innerText.trim().toLowerCase() === 'sign up'
    ) {
      navitemLink.setAttribute('id', 'topnav-signup');
    }
  });

  if (isDesktop) {
    exlNavWithLargeMenu.forEach((largemenu) => {
      const largemenuAnchor = largemenu.querySelector('a');
      largemenu.addEventListener('mouseover', () => {
        wrapper.classList.add('exl-overlay');
        largemenuAnchor.classList.add('active');
        largemenuAnchor.nextElementSibling.style.display = 'block';
      });

      largemenu.addEventListener('mouseout', () => {
        wrapper.classList.remove('exl-overlay');
        largemenuAnchor.classList.remove('active');
        largemenuAnchor.nextElementSibling.style.display = 'none';
      });
    });
  }
  if (isMobile) {
    exlNavWithLargeMenu.forEach((largemenu) => {
      largemenu.addEventListener('mousedown', (event) => {
        event.target.removeAttribute('href');
        largemenu.classList.toggle('is-expanded');
      });
    });

    hamburger.addEventListener('mousedown', () => {
      hamburger.classList.toggle('is-active');
      document.querySelector('body').classList.toggle('is-shown');
    });
  }
}
