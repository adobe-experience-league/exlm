/* eslint-disable no-bitwise */
import {
  sampleRUM,
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
} from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle

const LCP_BLOCKS = ['marquee']; // add your LCP blocks to the list

export const timers = new Map();

// eslint-disable-next-line
export function debounce(id = '', fn = () => void 0, ms = 250) {
  if (id.length > 0) {
    if (timers.has(id)) {
      clearTimeout(timers.get(id));
    }

    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms),
    );
  }
}

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
 * one trust configuration setup
 */
function oneTrust() {
  window.fedsConfig = window.fedsConfig || {};
  window.fedsConfig.privacy = window.fedsConfig.privacy || {};
  window.fedsConfig.privacy.otDomainId = `7a5eb705-95ed-4cc4-a11d-0cc5760e93db${
    window.location.host.split('.').length === 3 ? '' : '-test'
  }`;
  window.fedsConfig.privacy.footerLinkSelector = '.footer [href="#onetrust"]';
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

/**
 * return browse page theme if its browse page otherwise undefined.
 * theme = browse-* is set in bulk metadata for /en/browse paths.
 */
export function isBrowsePage() {
  const theme = getMetadata('theme');
  return theme.split(',').find((t) => t.toLowerCase().startsWith('browse-'));
}

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
  leftRailSection.classList.add('browse-rail-section', isBrowsePage());
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
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildSyntheticBlocks(main);
    // if we are on a product browse page
    if (isBrowsePage()) {
      addBrowseBreadCrumb(main);
      addBrowseRail(main);
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
      if (!href.startsWith('/') && !href.startsWith('http')) {
        a.href = `//${href}`;
      }
    }
  });
}

/**
 * Links that have urls with JSON the hash, the JSON will be translated to attributes
 * eg <a href="https://example.com#{"target":"_blank", "auth-only": "true"}">link</a>
 * will be translated to <a href="https://example.com" target="_blank" auth-only="true">link</a>
 * @param {HTMLElement} block
 */
export const decorateLinks = (block) => {
  const links = block.querySelectorAll('a');
  links.forEach((link) => {
    const decodedHref = decodeURIComponent(link.getAttribute('href'));
    const firstCurlyIndex = decodedHref.indexOf('{');
    const lastCurlyIndex = decodedHref.lastIndexOf('}');
    if (firstCurlyIndex > -1 && lastCurlyIndex > -1) {
      // everything between curly braces is treated as JSON string.
      const optionsJsonStr = decodedHref.substring(firstCurlyIndex, lastCurlyIndex + 1);
      const fixedJsonString = optionsJsonStr.replace(/'/g, '"'); // JSON.parse function expects JSON strings to be formatted with double quotes
      const parsedJSON = JSON.parse(fixedJsonString);
      Object.entries(parsedJSON).forEach(([key, value]) => {
        link.setAttribute(key.trim(), value);
      });
      // remove the JSON string from the hash, if JSON string is the only thing in the hash, remove the hash as well.
      const endIndex = decodedHref.charAt(firstCurlyIndex - 1) === '#' ? firstCurlyIndex - 1 : firstCurlyIndex;
      link.href = decodedHref.substring(0, endIndex);
    }
  });
};

/**
 * Check if current page is a MD Docs Page.
 * theme = docs is set in bulk metadata for docs paths.
 * @param {string} type The type of doc page - example: docs-solution-landing,
 *                      docs-landing, docs (optional, default value is docs)
 */
export function isDocPage(type = 'docs') {
  const theme = getMetadata('theme');
  return theme
    .split(',')
    .map((t) => t.toLowerCase().trim())
    .includes(type);
}

/**
 * Check if current page is a MD Docs Article Page.
 * theme = docs is set in bulk metadata for docs paths.
 * @param {string} type The type of doc page - docs (optional, default value is docs)
 */
export const isDocArticlePage = (type = 'docs') => {
  const theme = getMetadata('theme');
  return theme?.toLowerCase().trim() === type;
};

/**
 * set attributes needed for the docs pages grid to work properly
 * @param {Element} main the main element
 */
function decorateContentSections(main) {
  const contentSections = main.querySelectorAll('.section:not(.toc-container, .mini-toc-container)');
  contentSections.forEach((row, i) => {
    if (i === 0) {
      row.classList.add('content-section-first');
    }
    if (i === contentSections.length - 1) {
      row.classList.add('content-section-last');
    }
  });

  main.style.setProperty('--content-sections-count', contentSections.length);
}

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
 *
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
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const { currentNode } = walker;
    decorateInlineText(currentNode);
    decoratePreviousImage(currentNode);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // docs pages do not use buttons, only links
  if (!isDocPage()) {
    decorateButtons(main);
  }
  decorateAnchors(main); // must be run before decorateIcons
  decorateIcons(main);
  decorateInlineAttributes(main);
  decorateExternalLinks(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  buildSectionBasedAutoBlocks(main);
  decorateContentSections(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  const { lang } = getPathDetails();
  document.documentElement.lang = lang || 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
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

export const isHelixDomain = () => ['hlx.page', 'hlx.live'].some((sfx) => window.location.hostname.endsWith(sfx));

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
      hlxPreview: 'main--exlm-prod--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-prod--adobe-experience-league.hlx.live',
    },
    {
      env: 'STAGE',
      cdn: 'experienceleague-stage.adobe.com',
      hlxPreview: 'main--exlm-stage--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm-stage--adobe-experience-league.live',
    },
    {
      env: 'DEV',
      cdn: 'experienceleague-dev.adobe.com',
      hlxPreview: 'main--exlm--adobe-experience-league.hlx.page',
      hlxLive: 'main--exlm--adobe-experience-league.hlx.live',
    },
  ];

  const currentHost = window.location.hostname;
  const defaultEnv = HOSTS.find((hostObj) => hostObj.env === 'DEV');
  const currentEnv = HOSTS.find((hostObj) => Object.values(hostObj).includes(currentHost));
  const cdnHost = currentEnv?.cdn || defaultEnv.cdn;
  const cdnOrigin = `https://${cdnHost}`;
  const lang = document.querySelector('html').lang || 'en';
  const prodAssetsCdnOrigin = 'https://cdn.experienceleague.adobe.com';
  const isProd = currentEnv?.env === 'PROD';
  const isStage = currentEnv?.env === 'STAGE';
  const ppsOrigin = isProd ? 'https://pps.adobe.io' : 'https://pps-stage.adobe.io';
  const ims = {
    client_id: 'ExperienceLeague',
    environment: isProd ? 'prod' : 'stg1',
    debug: !isProd,
  };

  let launchScriptSrc;
  if (isProd) launchScriptSrc = 'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-43baf8381f4b.min.js';
  else if (isStage)
    launchScriptSrc = 'https://assets.adobedtm.com/a7d65461e54e/6e9802a06173/launch-dbb3f007358e-staging.min.js';
  else launchScriptSrc = 'https://assets.adobedtm.com/d4d114c60e50/9f881954c8dc/launch-caabfb728852-development.js';

  window.exlm = window.exlm || {};
  window.exlm.config = {
    ims,
    currentEnv,
    cdnOrigin,
    cdnHost,
    prodAssetsCdnOrigin,
    ppsOrigin,
    launchScriptSrc,
    khorosProfileUrl: `${cdnOrigin}/api/action/khoros/profile-menu-list`,
    privacyScript: `${cdnOrigin}/etc.clientlibs/globalnav/clientlibs/base/privacy-standalone.js`,
    profileUrl: `${cdnOrigin}/api/profile?lang=${lang}`,
    JWTTokenUrl: `${cdnOrigin}/api/token?lang=${lang}`,
    coveoTokenUrl: `${cdnOrigin}/api/coveo-token?lang=${lang}`,
    coveoSearchResultsUrl: 'https://platform.cloud.coveo.com/rest/search/v2',
    liveEventsUrl: `${prodAssetsCdnOrigin}/thumb/upcoming-events.json`,
    adlsUrl: 'https://learning.adobe.com/catalog.result.json',
    searchUrl: `${cdnOrigin}/search.html`,
    articleUrl: `${cdnOrigin}/api/articles/`,
    solutionsUrl: `${cdnOrigin}/api/solutions?page_size=100`,
    pathsUrl: `${cdnOrigin}/api/paths`,
    // Browse Left nav
    browseMoreProductsLink: `/${lang}/browse`,
    // Machine Translation
    automaticTranslationLink: `/${lang}/docs/contributor/contributor-guide/localization/machine-translation`,
    // Recommended Courses
    recommendedCoursesUrl: `${cdnOrigin}/home?lang=${lang}#dashboard/learning`,
  };
  return window.exlm.config;
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

export async function loadIms() {
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
  const { privacyScript, launchScriptSrc } = getConfig();
  oneTrust();

  const oneTrustPromise = loadScript(privacyScript, {
    async: true,
    defer: true,
  });

  const launchPromise = loadScript(launchScriptSrc, {
    async: true,
  });

  // eslint-disable-next-line import/no-cycle
  const libAnalyticsPromise = import('./analytics/lib-analytics.js');

  Promise.all([launchPromise, libAnalyticsPromise, headerPromise, footerPromise, oneTrustPromise]).then(
    // eslint-disable-next-line no-unused-vars
    ([launch, libAnalyticsModule, headPr, footPr]) => {
      const { lang } = getPathDetails();
      const { pageLoadModel, linkClickModel, pageName } = libAnalyticsModule;
      document.querySelector('[href="#onetrust"]').addEventListener('click', (e) => {
        e.preventDefault();
        window.adobePrivacy.showConsentPopup();
      });
      pageLoadModel(lang)
        .then((data) => {
          window.adobeDataLayer.push(data);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Error getting pageLoadModel:', e);
        });
      localStorage.setItem('prevPage', pageName(lang));
      const linkClicked = document.querySelectorAll('a,.view-more-less span, .language-selector-popover span');
      linkClicked.forEach((linkElement) => {
        linkElement.addEventListener('click', (e) => {
          if (e.target.tagName === 'A' || e.target.tagName === 'SPAN') {
            linkClickModel(e);
          }
        });
      });
    },
  );
};

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);
  loadIms(); // start it early, asyncronously

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  const headerPromise = loadHeader(doc.querySelector('header'));
  const footerPromise = loadFooter(doc.querySelector('footer'));
  // disable martech if martech=off is in the query string, this is used for testing ONLY
  if (window.location.search?.indexOf('martech=off') === -1) loadMartech(headerPromise, footerPromise);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  sampleRUM('lazy');
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
 * Copies all meta tags to window.EXL_META
 * These are consumed by Qualtrics to pass additional data along with the feedback survey.
 */
function addMetaTagsToWindow() {
  window.EXL_META = {};

  document.querySelectorAll('meta').forEach((tag) => {
    if (
      typeof tag.name === 'string' &&
      tag.name.length > 0 &&
      typeof tag.content === 'string' &&
      tag.content.length > 0
    ) {
      window.EXL_META[tag.name] = tag.content;
    }
  });

  window.EXL_META.lang = document.documentElement.lang;
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
  // eslint-disable-next-line import/no-cycle
  addMetaTagsToWindow();
}

/**
 * Custom - Loads the right and left rails for doc pages only.
 */
async function loadRails() {
  if (isDocPage()) {
    loadCSS(`${window.hlx.codeBasePath}/scripts/rails/rails.css`);
    const mod = await import('./rails/rails.js');
    if (mod.default) {
      await mod.default();
    }
  }
}

function showBrowseBackgroundGraphic() {
  if (isBrowsePage()) {
    const main = document.querySelector('main');
    main.classList.add('browse-background-img');
  }
}

/**
 * Helper function that converts an AEM path into an EDS path.
 */
export function getEDSLink(aemPath) {
  return window.hlx.aemRoot ? aemPath.replace(window.hlx.aemRoot, '').replace('.html', '') : aemPath;
}

/**
 * Helper function that adapts the path to work on EDS and AEM rendering
 */
export function getLink(edsPath) {
  return window.hlx.aemRoot && !edsPath.startsWith(window.hlx.aemRoot) && edsPath.indexOf('.html') === -1
    ? `${window.hlx.aemRoot}${edsPath}.html`
    : edsPath;
}

export const removeExtension = (pathStr) => {
  const parts = pathStr.split('.');
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join('.');
};

// Convert the given String to Pascal Case
export const toPascalCase = (name) => `${(name || '').charAt(0).toUpperCase()}${name.slice(1)}`;

export function rewriteDocsPath(docsPath) {
  const PROD_BASE = 'https://experienceleague.adobe.com';
  const url = new URL(docsPath, PROD_BASE);
  if (!url.pathname.startsWith('/docs') || url.pathname.startsWith('/docs/courses/')) {
    return docsPath; // not a docs path, return as is
  }
  // eslint-disable-next-line no-use-before-define
  const { lang } = getPathDetails();
  const language = url.searchParams.get('lang') || lang;
  url.searchParams.delete('lang');
  let pathname = `${language.toLowerCase()}${url.pathname}`;
  pathname = removeExtension(pathname); // new URLs are extensionless
  url.pathname = pathname;
  return url.toString().replace(PROD_BASE, ''); // always remove PROD_BASE if exists
}

export async function fetchWithFallback(path, fallbackPath) {
  const response = await fetch(path);
  if (response.ok) return response;
  return fetch(fallbackPath);
}

export async function fetchFragment(rePath, lang = 'en') {
  const path = `/fragments/${lang}/${rePath}.plain.html`;
  const fallback = `/fragments/en/${rePath}.plain.html`;
  const response = await fetchWithFallback(path, fallback);
  return response.text();
}

export async function fetchLanguagePlaceholders() {
  const { lang } = getPathDetails();
  try {
    // Try fetching placeholders with the specified language
    return await fetchPlaceholders(`/${lang}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching placeholders for lang: ${lang}. Will try to get en placeholders`, error);
    // Retry without specifying a language (using the default language)
    try {
      return await fetchPlaceholders('/en');
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
    fetch('/languages.json')
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
 * THIS IS TEMPORARY FOR SUMMIT
 */
function handleHomePageHashes() {
  // home page AND #feedback hash
  const { pathname, search = '', hash = '' } = window.location;
  if (pathname === '/') {
    if (hash === '#feedback' || hash === '#dashboard/profile') {
      window.location.href = `/home${search}${hash}`;
      return true;
    }
  }
  return false;
}

/**
 * @param {string} placeholderKey
 * @param {string} fallbackText
 * @returns
 */
export function createPlaceholderSpan(placeholderKey, fallbackText, onResolved) {
  const span = document.createElement('span');
  span.setAttribute('data-placeholder', placeholderKey);
  span.setAttribute('data-placeholder-fallback', fallbackText);
  span.style.setProperty('--placeholder-width', `${fallbackText.length}ch`);
  fetchLanguagePlaceholders()
    .then((placeholders) => {
      span.textContent = placeholders[placeholderKey] || fallbackText;
      span.removeAttribute('data-placeholder');
      span.removeAttribute('data-placeholder-fallback');
      span.style.removeProperty('--placeholder-width');
      if (onResolved) onResolved(span);
    })
    .catch(() => {
      span.textContent = fallbackText;
    });
  return span;
}

async function loadPage() {
  // THIS IS TEMPORARY FOR SUMMIT.
  if (handleHomePageHashes()) return;
  // END OF TEMPORARY FOR SUMMIT.
  await loadEager(document);
  await loadLazy(document);
  loadRails();
  loadDelayed();
  showBrowseBackgroundGraphic();
  loadDefaultModule(`${window.hlx.codeBasePath}/scripts/prev-next-btn.js`);
}

// load the page unless DO_NOT_LOAD_PAGE is set - used for existing EXLM pages POC
if (!window.hlx.DO_NOT_LOAD_PAGE) {
  loadPage();
}
