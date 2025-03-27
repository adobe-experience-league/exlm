/* eslint-disable no-console */

import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateBlock,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  decorateButtons,
  getMetadata,
  loadScript,
  fetchPlaceholders,
  readBlockConfig,
  createOptimizedPicture,
  toClassName,
} from './lib-franklin.js';

/**
 * please do not import any other modules here, as this file is used in the critical path.
 * Load files async using import() if you must.
 */

const LCP_BLOCKS = ['video-embed', 'marquee', 'article-marquee', 'personalized-content-placeholder']; // add your LCP blocks to the list

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Process current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and /content/exl/global/en/path/to/content.html for both EDS and AEM
 */
export function getPathDetails() {
  const { pathname } = window.location;
  const extParts = pathname.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  // 4 is the index of the language in the path for AEM content paths like  /content/exl/global/en/path/to/content.html
  // 1 is the index of the language in the path for EDS paths like /en/path/to/content
  let lang = isContentPath ? safeLangGet(4) : safeLangGet(1);
  // remove suffix from lang if any
  if (lang.indexOf('.') > -1) {
    lang = lang.substring(0, lang.indexOf('.'));
  }
  if (!lang) lang = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${lang}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/${lang}`) + lang.length + 1) || '';
  return {
    ext,
    prefix,
    suffix,
    lang,
    isContentPath,
  };
}

/**
 * Convert Table to block HTMl
 * @param {HTMLTableElement} table
 */
export function tableToBlock(table) {
  let blockClassNames = '';
  const rows = [];
  [...table.children].forEach((child) => {
    if (child.tagName.toLowerCase() === 'thead') {
      [...child.children].forEach((hRow, hRowIndex) => {
        if (hRowIndex === 0) {
          blockClassNames = hRow.textContent.toLowerCase(); // first header cell in first header row is block class names
        } else {
          rows.push(hRow.children); // all other header rows are rows
        }
      });
    } else if (child.tagName.toLowerCase() === 'tbody') {
      rows.push(...child.children); // all body rows are rows
    }
  });

  // add classes to result block
  const resultBlock = document.createElement('div');
  resultBlock.className = blockClassNames;

  // convert all table rows/cells to div rows/cells
  rows.forEach((row) => {
    const blockRow = document.createElement('div');
    [...row.children].forEach((cell) => {
      const blockCell = document.createElement('div');
      blockCell.append(...cell.childNodes);
      blockRow.appendChild(blockCell);
    });
    resultBlock.appendChild(blockRow);
  });

  return resultBlock;
}

/**
 * Build synthetic blocks nested in the given block.
 * A synthetic block is a table whose first header is the block class names (sort of like the tables in doc authoring)
 * @param {HTMLElement} block
 */
export function buildSyntheticBlocks(main) {
  main.querySelectorAll('div > div > div').forEach((block) => {
    const tables = [...block.querySelectorAll('table')];
    return tables.map((table) => {
      const syntheticBlock = tableToBlock(table);
      const syntheticBlockWrapper = document.createElement('div');
      syntheticBlockWrapper.appendChild(syntheticBlock);
      table.replaceWith(syntheticBlockWrapper);
      decorateBlock(syntheticBlock);
      return syntheticBlock;
    });
  });
}

/** @returns {string[]} */
export function getThemes() {
  return (
    getMetadata('theme')
      ?.split(',')
      ?.map((t) => t.trim()) || []
  );
}

/**
 * Check if any of the page themes match the given regex.
 * @param {RegExp} regex
 */
export function matchesAnyTheme(regex) {
  return getThemes()?.some((t) => t.match(regex)) || false;
}

export const isDocPage = matchesAnyTheme(/docs/);
export const isPerspectivePage = matchesAnyTheme(/articles/);
export const isProfilePage = matchesAnyTheme(/^profile.*/);
export const isBrowsePage = matchesAnyTheme(/^browse-.*/);
export const isSignUpPage = matchesAnyTheme(/^signup.*/);

/**
 * add a section for the left rail when on a browse page.
 */
function addBrowseRail(main) {
  // if there is already editable browse rail stored
  const browseRailSectionFound = [...main.querySelectorAll('.section-metadata')].find((sMeta) =>
    readBlockConfig(sMeta)?.style.split(',').includes('browse-rail-section'),
  );
  if (browseRailSectionFound) return;

  // default: create a dynamic uneditable browse rail
  const leftRailSection = document.createElement('div');
  leftRailSection.classList.add('browse-rail-section', isBrowsePage);
  leftRailSection.append(buildBlock('browse-rail', []));
  main.append(leftRailSection);
}

function addBrowseBreadCrumb(main) {
  if (!main.querySelector('.browse-breadcrumb.block')) {
    // add new section at the top
    const section = document.createElement('div');
    main.prepend(section);
    section.append(buildBlock('browse-breadcrumb', []));
  }
}

/**
 * Add a left rail to the profile page.
 * @param {HTMLElement} main
 *
 */
function addProfileRail(main) {
  const profileRailSection = document.createElement('div');
  profileRailSection.classList.add('profile-rail-section');
  profileRailSection.append(buildBlock('profile-rail', []));
  main.append(profileRailSection);
}

/**
 * Add a mini TOC to the article page.
 * @param {HTMLElement} main
 */
function addMiniToc(main) {
  document.querySelectorAll('.mini-toc').forEach((toc) => toc.remove());
  const tocSection = document.createElement('div');
  tocSection.classList.add('mini-toc-section');
  const miniTocBlock = buildBlock('mini-toc', []);
  tocSection.append(miniTocBlock);
  miniTocBlock.style.display = 'none';
  main.append(tocSection);
}

/**
 * Tabbed layout for Tab section
 * @param {HTMLElement} main
 */
async function buildTabSection(main) {
  let tabIndex = 0;
  let tabContainer;
  let tabFound = false;
  const sections = main.querySelectorAll('main > div');
  sections.forEach((section, i) => {
    const sectionMeta = section.querySelector('.section-metadata > div > div:nth-child(2)');
    if (sectionMeta?.textContent.includes('tab-section')) {
      if (!tabFound) {
        tabIndex += 1;
        tabFound = true;
        const tabs = buildBlock('tabs', []);
        tabs.dataset.tabIndex = tabIndex;
        tabContainer = document.createElement('div');
        tabContainer.classList.add('section');
        if (
          i > 0 &&
          sections[i - 1]
            .querySelector('.section-metadata > div > div:nth-child(2)')
            ?.textContent.includes('article-content-section')
        ) {
          tabContainer.classList.add('article-content-section');
        }
        tabContainer.append(tabs);
        main.insertBefore(tabContainer, section);
      }
      if (
        tabFound &&
        !sections[i + 1]
          ?.querySelector('.section-metadata > div > div:nth-child(2)')
          ?.textContent.includes('tab-section')
      ) {
        tabFound = false;
      }
      section.classList.add(`tab-index-${tabIndex}`);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main, isFragment = false) {
  try {
    buildSyntheticBlocks(main);
    if (!isProfilePage && !isDocPage && !isSignUpPage) {
      buildTabSection(main);
    }
    if (!isFragment) {
      // if we are on a product browse page
      if (isBrowsePage) {
        addBrowseBreadCrumb(main);
        addBrowseRail(main);
      }
      if (isPerspectivePage) {
        addMiniToc(main);
      }
      if (isProfilePage) {
        addProfileRail(main);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * create shadeboxes out of sections with shade-box style
 * @param {Element} main the main container
 */
function buildShadeBoxes(main) {
  main.querySelectorAll('.section.shade-box').forEach((section) => {
    const sbContent = [];
    const row = [];
    [...section.children].forEach((wrapper) => {
      const elems = [];
      [...wrapper.children].forEach((child) => {
        elems.push(child);
      });
      wrapper.remove();
      row.push({ elems });
    });
    sbContent.push(row);
    const sb = buildBlock('shade-box', sbContent);
    const sbWrapper = document.createElement('div');
    sbWrapper.append(sb);
    section.append(sbWrapper);
    decorateBlock(sb);
    section.classList.remove('shade-box');
  });
}

/**
 * Builds synthetic blocks in that rely on section metadata
 * @param {Element} main The container element
 */
function buildSectionBasedAutoBlocks(main) {
  buildShadeBoxes(main);
}

/**
 * Decorates links within the specified container element by setting their "target" attribute to "_blank" if they contain "#_target" in the URL.
 *
 * @param {HTMLElement} main - The main container element to search for and decorate links.
 */
export function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.includes('#_blank')) {
      a.setAttribute('target', '_blank');
    } else if (!href.startsWith('#')) {
      if (a.hostname !== window.location.hostname) {
        a.setAttribute('target', '_blank');
      }
    }
  });
}

/**
 * Adds attributes to <a> tags based on special keys in the URL.
 *
 * If a URL contains '@newtab', it adds target="_blank".
 * Example:
 * <a href="https://example.com@newtab"> → <a href="https://example.com" target="_blank">
 *
 * @param {HTMLElement} block
 */
export const decorateLinks = (block) => {
  block.querySelectorAll('a[href*="@newtab"]').forEach((link) => {
    link.href = link.href.replace('@newtab', '');
    link.setAttribute('target', '_blank');
  });
};

/**
 * see: https://github.com/adobe-experience-league/exlm-converter/pull/208
 * @param {HTMLElement} main
 */
export function decorateAnchors(main) {
  const anchorIcons = [...main.querySelectorAll(`.icon-headding-anchor`)];
  anchorIcons.forEach((icon) => {
    const slugNode = icon.nextSibling;
    const slug = slugNode?.textContent?.trim();
    if (slug) {
      icon.parentElement.id = slug;
      icon.remove();
      slugNode.remove();
    }
  });
}

/**
 * creates an element from html string
 * @param {string} html
 * @returns {HTMLElement}
 */
export function htmlToElement(html) {
  const template = document.createElement('template');
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstElementChild;
}

const encodeHTML = (str) => str.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`);

/**
 * Parse attribute strings like: {color="red" class="highlight"} to object {color: "red", class: "highlight"}
 * @param {string} attrs
 * @returns
 */
const parseInlineAttributes = (attrs) => {
  const result = {};
  attrs
    .split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g) // match spaces only if not within quotes
    .map((attr) => attr.split('='))
    .forEach(([key, value]) => {
      result[key] = value === undefined ? undefined : encodeHTML(value?.replace(/"/g, '') || '');
    });
  return result;
};
/**
 * converts text with attributes to <span> elements with given attributes.
 * eg: [text]{color="red" class="highlight"} => <span color="red" class="highlight">text</span>
 * @param {*} inputStr
 * @returns
 */
export const getDecoratedInlineHtml = (inputStr) => {
  if (!inputStr) return inputStr;
  const regex = /\[([^[\]]*)\]{([^}]+)}/g;
  return inputStr.replace(regex, (match, text, attrs) => {
    const encodedText = encodeHTML(text);
    const attrsObj = parseInlineAttributes(attrs);
    const validAttrs = Object.values(attrsObj).every((v) => v !== undefined);
    if (!validAttrs) return match; // ignore expresssion that have attributes with undefined values
    const newAttrs = Object.entries(attrsObj)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<span ${newAttrs}>${encodedText}</span>`;
  });
};

/**
 * @param {Node} textNode
 */
export function decorateInlineText(textNode) {
  const { textContent } = textNode;
  if (textContent.includes('[') && textContent.includes(']{')) {
    const span = document.createElement('span');
    span.innerHTML = getDecoratedInlineHtml(textContent);
    window.requestAnimationFrame(() => {
      textNode.replaceWith(...span.childNodes);
    });
  }
}

/**
 * decorates the previous image element with attributes defined in the textNode
 * @param {Node} textNode
 */
export function decoratePreviousImage(textNode) {
  // if previous element is image, and textNode contains { and }, decorate the image
  const { previousSibling, textContent } = textNode;
  if (textContent.startsWith('{') && textContent.includes('}')) {
    const isPrecededByPicture = previousSibling?.tagName.toLowerCase() === 'picture';
    const isPrecededByImg = previousSibling?.tagName.toLowerCase() === 'img';
    let picture;
    let img;
    if (isPrecededByPicture) {
      picture = previousSibling;
      img = picture.querySelector('img');
    } else if (isPrecededByImg) {
      img = previousSibling;
    } else return; // only decorate if preceded by picture or img

    const attrsStr = textContent.substring(1, textContent.indexOf('}'));
    textNode.textContent = textContent.substring(textContent.indexOf('}') + 1);
    if (img.src === 'about:error') return; // do not decorate broken images
    const attrsObj = parseInlineAttributes(attrsStr);
    let newPicture = picture;
    if (attrsObj.width) {
      // author defined width
      const { width } = attrsObj;
      const isNumberWithNoUnit = /^\d+$/.test(width);
      if (isNumberWithNoUnit) {
        newPicture = createOptimizedPicture(img.src, img.alt, false, [
          { media: '(min-width: 400px)', width },
          { width },
        ]);
      }
      // set width, if digits only, add px, else set as is
      newPicture.style.width = isNumberWithNoUnit ? `${width}px` : width;
      picture.replaceWith(newPicture);
    }
    if (attrsObj.modal) {
      // modal
      newPicture.addEventListener('click', () => {
        // eslint-disable-next-line import/no-cycle
        const promises = [loadCSS(`${window.hlx.codeBasePath}/styles/image-modal.css`), import('./image-modal.js')];
        Promise.all(promises).then(([, mod]) => mod.default(newPicture.querySelector('img')));
      });
    }
    if (img.hasAttribute('data-title')) {
      newPicture?.querySelector('img')?.setAttribute('title', img?.getAttribute('data-title'));
    }
    Object.entries(attrsObj).forEach(([key, value]) => newPicture.setAttribute(key, value));
  }
}

/**
 * @param {HTMLElement} element
 */
export function decorateInlineAttributes(element) {
  const ignoredElements = ['pre', 'code', 'script', 'style'];
  const isParentIgnored = (node) => ignoredElements.includes(node?.parentElement?.tagName?.toLowerCase());
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, (node) =>
    isParentIgnored(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  );
  while (walker.nextNode()) {
    const { currentNode } = walker;
    decorateInlineText(currentNode);
    decoratePreviousImage(currentNode);
  }
}

/**
 * Helper function that converts an AEM path into an EDS path.
 */
export function getEDSLink(aemPath) {
  return window.hlx.aemRoot ? aemPath.replace(window.hlx.aemRoot, '').replace('.html', '') : aemPath;
}

/** Helper function that adapts the path to work on EDS and AEM rendering */
export function getLink(edsPath) {
  return window.hlx.aemRoot && !edsPath.startsWith(window.hlx.aemRoot) && edsPath.indexOf('.html') === -1
    ? `${window.hlx.aemRoot}${edsPath}.html`
    : edsPath;
}

/** @param {HTMLMapElement} main */
async function buildPreMain(main) {
  const { lang } = getPathDetails();
  const fragmentUrl = getMetadata('fragment');

  if (!fragmentUrl) return;

  const fragmentLangUrl = fragmentUrl.startsWith('/en/') ? fragmentUrl.replace('/en/', `/${lang}/`) : fragmentUrl;
  const fragmentPath = new URL(fragmentLangUrl, window.location).pathname;

  const currentPath = window.location.pathname?.replace('.html', '');
  if (currentPath.endsWith(fragmentPath)) {
    return; // do not load fragment if it is the same as the current page
  }

  if (fragmentUrl) {
    const preMain = htmlToElement(
      `<aside><div><div class="fragment"><a href="${fragmentLangUrl}"></a></div></div></aside>`,
    );
    // add fragment as first section in preMain
    main.before(preMain);
    decorateSections(preMain);
    decorateBlocks(preMain);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, isFragment = false) {
  // docs pages do not use buttons, only links
  if (!isDocPage) {
    decorateButtons(main);
  }
  decorateAnchors(main); // must be run before decorateIcons
  decorateIcons(main);
  decorateInlineAttributes(main);
  decorateExternalLinks(main);
  buildAutoBlocks(main, isFragment);
  decorateSections(main);
  decorateBlocks(main);
  buildSectionBasedAutoBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    buildPreMain(main);
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * get site config
 */
export function getConfig() {
  if (window.exlm && window.exlm.config) {
    return window.exlm.config;
  }

  const HOSTS = [
    {
      env: 'PROD',
      cdn: 'experienceleague.adobe.com',
      authorUrl: 'author-p122525-e1219150.adobeaemcloud.com',
      hlxPreview: 'main--exlm-prod--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-prod--adobe-experience-league.hlx.live',
      community: 'experienceleaguecommunities.adobe.com',
    },
    {
      env: 'STAGE',
      cdn: 'experienceleague-stage.adobe.com',
      authorUrl: 'author-p122525-e1219192.adobeaemcloud.com',
      hlxPreview: 'main--exlm-stage--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-stage--adobe-experience-league.live',
      community: 'experienceleaguecommunities-dev.adobe.com',
    },
    {
      env: 'DEV',
      cdn: 'experienceleague-dev.adobe.com',
      authorUrl: 'author-p122525-e1200861.adobeaemcloud.com',
      hlxPreview: 'main--exlm--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm--adobe-experience-league.hlx.live',
      community: 'experienceleaguecommunities-dev.adobe.com',
    },
  ];

  const baseLocalesMap = new Map([
    ['de', 'de'],
    ['en', 'en'],
    ['ja', 'ja'],
    ['fr', 'fr'],
    ['es', 'es'],
    ['pt-br', 'pt'],
    ['ko', 'ko'],
  ]);

  const communityLangsMap = new Map([
    ...baseLocalesMap,
    ['sv', 'en'],
    ['nl', 'en'],
    ['it', 'en'],
    ['zh-hans', 'en'],
    ['zh-hant', 'en'],
  ]);

  const adobeAccountLangsMap = new Map([
    ...baseLocalesMap,
    ['sv', 'sv'],
    ['nl', 'nl'],
    ['it', 'it'],
    ['zh-hant', 'zh-Hant'],
    ['zh-hans', 'zh-Hans'],
  ]);
  const cookieConsentName = 'OptanonConsent';
  const targetCriteriaIds = {
    mostPopular: 'exl-hp-auth-recs-2',
    recommended: 'exl-hp-auth-recs-1',
    recentlyViewed: 'exl-hp-auth-recs-3',
  };

  const currentHost = window.location.hostname;
  const defaultEnv = HOSTS.find((hostObj) => hostObj.env === 'DEV');
  const currentEnv = HOSTS.find((hostObj) => Object.values(hostObj).includes(currentHost));
  const cdnHost = currentEnv?.cdn || defaultEnv.cdn;
  const communityHost = currentEnv?.community || defaultEnv.community;
  const cdnOrigin = `https://${cdnHost}`;
  const lang = document.querySelector('html').lang || 'en';
  // Locale param for Community page URL
  const communityLocale = communityLangsMap.get(lang) || 'en';
  // Lang param for Adobe account URL
  const adobeAccountLang = adobeAccountLangsMap.get(lang) || 'en';
  const prodAssetsCdnOrigin = 'https://cdn.experienceleague.adobe.com';
  const isProd = currentEnv?.env === 'PROD' || currentEnv?.authorUrl === 'author-p122525-e1219150.adobeaemcloud.com';
  const isStage = currentEnv?.env === 'STAGE' || currentEnv?.authorUrl === 'author-p122525-e1219192.adobeaemcloud.com';
  const ppsOrigin = isProd ? 'https://pps.adobe.io' : 'https://pps-stage.adobe.io';
  const ims = {
    client_id: 'ExperienceLeague',
    environment: isProd ? 'prod' : 'stg1',
    debug: !isProd,
  };

  let launchScriptSrc;
  if (isProd) launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-7a902c4895c3.min.js';
  else if (isStage)
    launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-102059c3cf0a-staging.min.js';
  else launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-caabfb728852-development.js';
  const signUpFlowConfigDate = '2024-08-15T00:00:00.762Z';
  const modalReDisplayDuration = '3'; // in months

  window.exlm = window.exlm || {};
  window.exlm.config = {
    isProd,
    ims,
    currentEnv,
    cdnOrigin,
    cdnHost,
    communityHost,
    prodAssetsCdnOrigin,
    ppsOrigin,
    launchScriptSrc,
    signUpFlowConfigDate,
    modalReDisplayDuration,
    cookieConsentName,
    targetCriteriaIds,
    khorosProfileUrl: `${cdnOrigin}/api/action/khoros/profile-menu-list`,
    khorosProfileDetailsUrl: `${cdnOrigin}/api/action/khoros/profile-details`,
    privacyScript: `${cdnOrigin}/etc.clientlibs/globalnav/clientlibs/base/privacy-standalone.js`,
    profileUrl: `${cdnOrigin}/api/profile?lang=${lang}`,
    JWTTokenUrl: `${cdnOrigin}/api/token?lang=${lang}`,
    coveoTokenUrl: `${cdnOrigin}/api/coveo-token?lang=${lang}`,
    coveoSearchResultsUrl: isProd
      ? 'https://platform.cloud.coveo.com/rest/search/v2'
      : 'https://adobesystemsincorporatednonprod1.org.coveo.com/rest/search/v2',
    coveoOrganizationId: isProd ? 'adobev2prod9e382h1q' : 'adobesystemsincorporatednonprod1',
    coveoToken: 'xxcfe1b6e9-3628-49b5-948d-ed50d3fa6c99',
    liveEventsUrl: `${prodAssetsCdnOrigin}/thumb/upcoming-events.json`,
    adlsUrl: 'https://learning.adobe.com/courses.result.json',
    industryUrl: `${cdnOrigin}/api/industries?page_size=200&sort=Order&lang=${lang}`,
    searchUrl: `${cdnOrigin}/search.html`,
    articleUrl: `${cdnOrigin}/api/articles`,
    solutionsUrl: `${cdnOrigin}/api/solutions?page_size=100`,
    pathsUrl: `${cdnOrigin}/api/paths`,
    // Personlized Home Page Link
    personalizedHomeLink: `/home`,
    // Browse Left nav
    browseMoreProductsLink: `/${lang}/browse`,
    // Machine Translation
    automaticTranslationLink: `/${lang}/docs/contributor/contributor-guide/localization/machine-translation`,
    // Recommended Courses
    recommendedCoursesUrl: `${cdnOrigin}/home?lang=${lang}#dashboard/learning`,
    // Adobe account URL
    adobeAccountURL: isProd
      ? `https://account.adobe.com/?lang=${adobeAccountLang}`
      : `https://stage.account.adobe.com/?lang=${adobeAccountLang}`,
    // Community Account URL
    communityAccountURL: isProd
      ? `https://experienceleaguecommunities.adobe.com/?profile.language=${communityLocale}`
      : `https://experienceleaguecommunities-dev.adobe.com/?profile.language=${communityLocale}`,
    interestsUrl: `${cdnOrigin}/api/interests?page_size=200&sort=Order`,
    // Param for localized Community Profile URL
    localizedCommunityProfileParam: `?profile.language=${communityLocale}`,
  };
  return window.exlm.config;
}

/**
 * one trust configuration setup
 */
function loadOneTrust() {
  window.fedsConfig = window.fedsConfig || {};
  window.fedsConfig.privacy = window.fedsConfig.privacy || {};
  window.fedsConfig.privacy.otDomainId = `7a5eb705-95ed-4cc4-a11d-0cc5760e93db${
    window.location.host.split('.').length === 3 ? '' : '-test'
  }`;
  window.fedsConfig.privacy.footerLinkSelector = '.footer [href="#onetrust"]';
  const { privacyScript } = getConfig();
  return loadScript(privacyScript, {
    async: true,
    defer: true,
  });
}

export const locales = new Map([
  ['de', 'de_DE'],
  ['en', 'en_US'],
  ['es', 'es_ES'],
  ['fr', 'fr_FR'],
  ['it', 'it_IT'],
  ['ja', 'ja_JP'],
  ['ko', 'ko_KO'],
  ['pt-br', 'pt_BR'],
  ['zh-hans', 'zh_HANS'],
  ['zh-hant', 'zh_HANT'],
  ['nl', 'nl_NL'],
  ['sv', 'sv_SE'],
]);

export const URL_SPECIAL_CASE_LOCALES = new Map([
  ['es', 'es-ES'],
  ['pt-br', 'pt-BR'],
  ['zh-hans', 'zh-CN'],
  ['zh-hant', 'zh-TW'],
]);

export async function loadIms() {
  // if adobe IMS was loaded already, return. Especially useful when embedding this code outside this site.
  // eg. embedding header in community which has it's own IMS setup.
  if (!window.imsLoaded && window.adobeIMS) return Promise.resolve();
  const { ims } = getConfig();
  window.imsLoaded =
    window.imsLoaded ||
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('IMS timeout')), 5000);
      window.adobeid = {
        scope:
          'AdobeID,additional_info.company,additional_info.ownerOrg,avatar,openid,read_organizations,read_pc,session,account_cluster.read,pps.read',
        locale: locales.get(document.querySelector('html').lang) || locales.get('en'),
        ...ims,
        onReady: () => {
          // eslint-disable-next-line no-console
          console.log('Adobe IMS Ready!');
          resolve(); // resolve the promise, consumers can now use window.adobeIMS
          clearTimeout(timeout);
        },
        onError: reject,
      };
      loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');
    });
  return window.imsLoaded;
}

const loadMartech = async (headerPromise, footerPromise) => {
  // start datalayer work early
  // eslint-disable-next-line import/no-cycle
  const libAnalyticsPromise = import('./analytics/lib-analytics.js');
  libAnalyticsPromise.then((libAnalyticsModule) => {
    const { pushPageDataLayer, pushLinkClick, pageName } = libAnalyticsModule;
    const { lang } = getPathDetails();
    pushPageDataLayer(lang)
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error getting pageLoadModel:', e));
    localStorage.setItem('prevPage', pageName(lang));

    Promise.allSettled([headerPromise, footerPromise]).then(() => {
      const linkClicked = document.querySelectorAll('a,.view-more-less span, .language-selector-popover span');
      const clickHandler = (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'SPAN') pushLinkClick(e);
      };
      linkClicked.forEach((e) => e.addEventListener('click', clickHandler));
    });
  });

  // load one trust
  const oneTrustPromise = loadOneTrust();

  // load launch
  const { launchScriptSrc } = getConfig();
  loadScript(launchScriptSrc, {
    async: true,
  });

  // footer and one trust loaded, add event listener to open one trust popup,
  Promise.all([footerPromise, oneTrustPromise]).then(() => {
    document.querySelector('[href="#onetrust"]').addEventListener('click', (e) => {
      e.preventDefault();
      window.adobePrivacy.showConsentPopup();
    });
  });
};

/**
 * based on `template`/`theme` metadata, loads the corresponding CSS theme files
 */
async function loadThemes() {
  const toClassNames = (classes) =>
    classes
      ?.split(',')
      ?.map((c) => toClassName(c.trim()))
      .filter(Boolean) || [];
  const metaToClassNames = (metaName) => toClassNames(getMetadata(metaName));
  const themeNames = [...metaToClassNames('template'), ...metaToClassNames('theme')];
  if (themeNames.length === 0) return Promise.resolve();
  return Promise.allSettled(themeNames.map((theme) => loadCSS(`${window.hlx.codeBasePath}/styles/theme/${theme}.css`)));
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  const preMain = doc.body.querySelector(':scope > aside');
  loadIms(); // start it early, asyncronously
  await loadThemes();
  if (preMain) await loadBlocks(preMain);
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  const headerPromise = loadHeader(doc.querySelector('header'));
  const footerPromise = loadFooter(doc.querySelector('footer'));
  // disable martech if martech=off is in the query string, this is used for testing ONLY
  if (window.location.search?.indexOf('martech=off') === -1) loadMartech(headerPromise, footerPromise);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Helper function to create DOM elements
 * @param {string} tag DOM element to be created
 * @param {array} attributes attributes to be added
 */
export function createTag(tag, attributes, html) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

/** load and execute the default export of the given js module path */
async function loadDefaultModule(jsPath) {
  try {
    const mod = await import(jsPath);
    if (mod.default) await mod.default();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load module for ${jsPath}`, error);
  }
}

/**
 * Custom - Loads the right and left rails for doc pages only.
 */
async function loadRails() {
  if (isDocPage) {
    loadCSS(`${window.hlx.codeBasePath}/scripts/rails/rails.css`);
    loadDefaultModule('./rails/rails.js');
  }
}

/**
 * Custom - Loads and builds layout for articles page
 */
export async function loadArticles() {
  if (isPerspectivePage) {
    loadCSS(`${window.hlx.codeBasePath}/scripts/articles/articles.css`);
    loadDefaultModule('./articles/articles.js');
  }
}

async function showSignupDialog() {
  const isSignedIn = window?.adobeIMS?.isSignedInUser();
  if (!isSignedIn) return;

  const urlParams = new URLSearchParams(window.location.search);
  const { isProd, signUpFlowConfigDate, modalReDisplayDuration } = getConfig();

  if (!isProd && urlParams.get('signup-wizard') === 'on') {
    // eslint-disable-next-line import/no-cycle
    import('./signup-flow/signup-flow-dialog.js').then((mod) => mod.default.init());
    return;
  }

  const { default: initSignupFlowHandler } = await import('./signup-flow/signup-flow-handler.js');
  await initSignupFlowHandler(signUpFlowConfigDate, modalReDisplayDuration);
}

/** fetch first path, if non 200, fetch the second */
export async function fetchWithFallback(path, fallbackPath) {
  const response = await fetch(path);
  if (response.ok) return response;
  return fetch(fallbackPath);
}

/** fetch fragment relative to /fragments/{lang} */
export async function fetchFragment(rePath, lang) {
  const path = `${window.hlx.codeBasePath}/fragments/${lang}/${rePath}.plain.html`;
  const fallback = `${window.hlx.codeBasePath}/fragments/en/${rePath}.plain.html`;
  const response = await fetchWithFallback(path, fallback);
  return response.text();
}

/** fetch fragment relative to /${lang}/global-fragments/ */
export async function fetchGlobalFragment(metaName, fallback, lang) {
  const fragmentPath = getMetadata(metaName);
  const fragmentUrl = fragmentPath?.startsWith('/en/') ? fragmentPath.replace('/en/', `/${lang}/`) : fallback;
  const path = `${window.hlx.codeBasePath}${fragmentUrl}.plain.html`;
  const fallbackPath = `${window.hlx.codeBasePath}${fallback}.plain.html`;
  const response = await fetchWithFallback(path, fallbackPath);
  return response.text();
}

/* fetch language specific placeholders, fallback to english */
export async function fetchLanguagePlaceholders(lang) {
  const langCode = lang || getPathDetails()?.lang || 'en';
  try {
    // Try fetching placeholders with the specified language
    return await fetchPlaceholders(`${window.hlx.codeBasePath}/${langCode}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching placeholders for lang: ${langCode}. Will try to get en placeholders`, error);
    // Retry without specifying a language (using the default language)
    try {
      return await fetchPlaceholders(`${window.hlx.codeBasePath}/en`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
  }
  return {}; // default to empty object
}

export async function getLanguageCode() {
  if (window.languageCode) return window.languageCode;
  window.languageCode = new Promise((resolve, reject) => {
    const { lang } = getPathDetails();
    fetch(`${window.hlx.codeBasePath}/languages.json`)
      .then((response) => response.json())
      .then((languages) => {
        const langMap = languages.data;
        const langObj = langMap.find((item) => item.key === lang);
        const langCode = langObj ? langObj.value : lang;
        window.languageCode = langCode;
        resolve(langCode);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching language code:', error);
        reject(error);
      });
  });
  return window.languageCode;
}

/**
 * @param {string} placeholderKey the camelcase key of the placeholder
 * @param {string} fallbackText the text to display if the placeholder is not found.
 * @param {function} onResolved callback function to execute when the placeholder is resolved
 * @param {function} onRejected callback function to execute when the placeholder is rejected/error
 * @returns {HTMLSpanElement}
 */
export function createPlaceholderSpan(placeholderKey, fallbackText, onResolved, onRejected, lang) {
  const span = document.createElement('span');
  span.setAttribute('data-placeholder', placeholderKey);
  span.setAttribute('data-placeholder-fallback', fallbackText);
  span.style.setProperty('--placeholder-width', `${fallbackText.length}ch`);
  fetchLanguagePlaceholders(lang)
    .then((placeholders) => {
      if (placeholders[placeholderKey]) {
        span.textContent = placeholders[placeholderKey];
        span.setAttribute('data-placeholder-resolved-key', placeholderKey);
      } else {
        span.textContent = fallbackText;
        span.setAttribute('data-placeholder-resolved-fallback-text', 'fallback');
      }
      span.removeAttribute('data-placeholder');
      span.removeAttribute('data-placeholder-fallback');
      span.style.removeProperty('--placeholder-width');
      if (onResolved) onResolved(span);
    })
    .catch(() => {
      span.textContent = fallbackText;
      if (onRejected) onRejected(span);
    });
  return span;
}

/**
 * decorates placeholder spans in a given element
 * @param {HTMLElement} element
 * @param {string} lang
 */
export function decoratePlaceholders(element, lang) {
  const placeholdersEls = [...element.querySelectorAll('[data-placeholder]')];
  placeholdersEls.forEach((el) => {
    el.replaceWith(createPlaceholderSpan(el.dataset.placeholder, el.textContent, undefined, undefined, lang));
  });
}

function formatPageMetaTags(inputString) {
  return inputString
    .replace(/exl:[^/]*\/*/g, '')
    .split(',')
    .map((part) => part.trim());
}

function decodeAemPageMetaTags() {
  const solutionMeta = document.querySelector(`meta[name="coveo-solution"]`);
  const roleMeta = document.querySelector(`meta[name="role"]`);
  const levelMeta = document.querySelector(`meta[name="level"]`);
  const featureMeta = document.querySelector(`meta[name="feature"]`);
  const cqTagsMeta = document.querySelector(`meta[name="cq-tags"]`);

  const solutions = solutionMeta ? formatPageMetaTags(solutionMeta.content) : [];
  const features = featureMeta ? formatPageMetaTags(featureMeta.content) : [];
  const roles = roleMeta ? formatPageMetaTags(roleMeta.content) : [];
  const experienceLevels = levelMeta ? formatPageMetaTags(levelMeta.content) : [];
  let decodedSolutions = [];
  decodedSolutions = solutions.map((solution) => {
    // In case of sub-solutions. E.g. exl:solution/campaign/standard
    const parts = solution.split('/');
    const decodedParts = parts.map((part) => atob(part));

    // If it's a sub-solution, create a version meta tag
    if (parts.length > 1) {
      const versionMeta = document.createElement('meta');
      versionMeta.name = 'version';
      versionMeta.content = atob(parts.slice(1).join('/'));
      document.head.appendChild(versionMeta);

      // If there are multiple parts, join them with ";"
      const product = atob(parts[0]);
      const version = atob(parts[1]);
      return `${product}|${product} ${version}`;
    }

    return decodedParts[0];
  });

  const decodedFeatures = features
    .map((feature) => {
      const parts = feature.split('/');
      if (parts.length > 1) {
        const product = atob(parts[0]);
        if (!decodedSolutions.includes(product)) {
          decodedSolutions.push(product);
        }
        const featureTag = atob(parts[1]);
        return `${featureTag}`;
      }
      decodedSolutions.push(atob(parts[0]));
      return '';
    })
    .filter((feature) => feature !== '');

  const decodedRoles = roles.map((role) => atob(role));
  const decodedLevels = experienceLevels.map((level) => atob(level));

  if (solutionMeta) {
    solutionMeta.content = decodedSolutions.join(';');
  }
  if (featureMeta) {
    featureMeta.content = decodedFeatures.join(',');
  }
  if (roleMeta) {
    roleMeta.content = decodedRoles.join(',');
  }
  if (levelMeta) {
    levelMeta.content = decodedLevels.join(',');
  }
  if (cqTagsMeta) {
    const segments = cqTagsMeta.content.split(', ');
    const decodedCQTags = segments.map((segment) =>
      segment
        .split('/')
        .map((part, index) => (index > 0 ? atob(part) : part))
        .join('/'),
    );
    cqTagsMeta.content = decodedCQTags.join(', ');
  }
}

/**
 * Fetch Json with fallback.
 */
export async function fetchJson(url, fallbackUrl) {
  return fetch(url)
    .then((response) => (!response.ok && fallbackUrl ? fetch(fallbackUrl) : response))
    .then((response) => (response.ok ? response.json() : null))
    .then((json) => json?.data || []);
}

export function getCookie(cookieName) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length + 1);
    }
  }
  return null;
}

function createDocColumns() {
  if (!isDocPage) return;
  // wrap main content in a div - UGP-11165
  const main = document.querySelector('main');
  const mainSections = [...main.children].slice(0, -2); // ignore last two sections: toc and mini-toc
  const mainContent = document.createElement('div');
  // insert mainContent as first child of main
  main.prepend(mainContent);
  mainSections.forEach((section) => {
    mainContent.append(section);
  });
  // create last section, used for elements that should be at the bottom of the page
  const lastSection = createTag('div', { class: 'section last', 'data-section-status': 'initialized' });
  mainContent.append(lastSection);
}

/**
 * @returns {HTMLDivElement} the last section of the document, was added by createDocColumns
 */
export function getLastDocsSection() {
  return document.querySelector('main > div > div.section.last');
}

/** handles a set of 1-1 redirects */
function handleRedirects() {
  const redirects = ['/#feedback:/home#feedback'].map((p) => p.split(':').map((s) => new URL(s, window.location.href)));
  const redirect = redirects.find(([from]) => window.location.href === from.href);
  if (redirect) window.location.href = redirect[1].href;
}

export async function loadFragment(fragmentURL) {
  if (!fragmentURL) return null;

  const fragmentLink = fragmentURL.startsWith('/content')
    ? fragmentURL.replace(/^\/content\/[^/]+\/global/, '')
    : fragmentURL;

  const fragmentPath = new URL(fragmentLink, window.location).pathname;
  const currentPath = window.location.pathname?.replace('.html', '');

  if (currentPath.endsWith(fragmentPath)) {
    return null;
  }

  const fragmentEl = htmlToElement(`<div><div><div class="fragment"><a href="${fragmentLink}"></a></div></div></div>`);

  decorateSections(fragmentEl);
  decorateBlocks(fragmentEl);
  await loadBlocks(fragmentEl);

  return fragmentEl;
}

async function loadPage() {
  handleRedirects();
  await loadEager(document);
  createDocColumns();
  loadRails();
  loadArticles();
  await loadLazy(document);
  loadDelayed();
  await showSignupDialog();

  if (isDocPage) {
    // load prex/next buttons
    loadDefaultModule(`${window.hlx.codeBasePath}/scripts/prev-next-btn.js`);

    // discoverability
    const params = new URLSearchParams(window.location.search);
    const hasDiscoverability = Boolean(params.get('discoverability'));
    if (hasDiscoverability) {
      loadDefaultModule(`${window.hlx.codeBasePath}/scripts/tutorial-widgets/tutorial-widgets.js`);
      loadDefaultModule(`${window.hlx.codeBasePath}/scripts/related-content/related-content-widget.js`);
    }
  }
}

// load the page unless DO_NOT_LOAD_PAGE is set - used for existing EXLM pages POC
(async () => {
  if (window.hlx.DO_NOT_LOAD_PAGE) return;

  // For AEM Author mode, decode the tags value
  if (window.hlx.aemRoot || window.location.href.includes('.html')) {
    decodeAemPageMetaTags();
  }

  const { lang } = getPathDetails();
  document.documentElement.lang = lang || 'en';
  const isMainPage = window?.location.pathname === '/' || window?.location.pathname === `/${lang}`;

  const isUserSignedIn = async () => {
    await loadIms();
    return window?.adobeIMS?.isSignedInUser();
  };

  const handleProfilePage = async () => {
    if (window.location.href.includes('.html')) {
      loadPage();
    } else {
      const signedIn = await isUserSignedIn();
      if (signedIn) {
        loadPage();
        const mod = await import('./adobe-target/adobe-target.js');
        const defaultAdobeTargetClient = mod.default;
        const isTargetSupported = await defaultAdobeTargetClient.checkTargetSupport();
        if (isTargetSupported) {
          defaultAdobeTargetClient.mapComponentsToTarget();
        }
      } else {
        await window?.adobeIMS?.signIn();
      }
    }
  };

  const handleMainPage = async () => {
    try {
      const signedIn = await isUserSignedIn();
      const { personalizedHomeLink } = getConfig() || {};
      if (signedIn && personalizedHomeLink) {
        window.location.pathname = `${lang}${personalizedHomeLink}`;
        return;
      }
    } catch (error) {
      console.error('Error during redirect process:', error);
    }
    loadPage();
  };

  if (isProfilePage) {
    await handleProfilePage();
  } else if (isMainPage) {
    await handleMainPage();
  } else {
    loadPage();
  }
})();
