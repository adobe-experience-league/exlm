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
  toClassName,
} from './lib-franklin.js';
import {
  analyticsTrack404,
  analyticsTrackConversion,
  analyticsTrackCWV,
  analyticsTrackError,
  initAnalyticsTrackingQueue,
  setupAnalyticsTrackingWithAlloy,
} from './analytics/lib-analytics.js';

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
  const leftRailSection = document.createElement('div');
  leftRailSection.classList.add('browse-rail', isBrowsePage());
  leftRailSection.append(buildBlock('browse-rail', []));
  main.append(leftRailSection);
}

function addBrowseBreadCrumb(main) {
  // add new section at the top
  const section = document.createElement('div');
  main.prepend(section);
  section.append(buildBlock('browse-breadcrumb', []));
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
 * Decorates links within the specified container element by setting their "target" attribute to "_blank" if they contain "#_target" in the URL.
 *
 * @param {HTMLElement} main - The main container element to search for and decorate links.
 */
export function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.includes('#_blank')) {
      a.setAttribute('target', '_blank');
    } else if (href && !href.startsWith('#')) {
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
 * Check if current page is a MD Docs Page.
 * theme = docs is set in bulk metadata for docs paths.
 */
export function isDocPage() {
  const theme = getMetadata('theme');
  return theme
    .split(',')
    .map((t) => t.toLowerCase())
    .includes('docs');
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
  decorateIcons(main);
  decorateExternalLinks(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    await initAnalyticsTrackingQueue();
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

export const locales = new Map([
  ['de', 'de_DE'],
  ['en', 'en_US'],
  ['es', 'es_ES'],
  ['fr', 'fr_FR'],
  ['it', 'it_IT'],
  ['ja', 'ja_JP'],
  ['ko', 'ko_KO'],
  ['pt-BR', 'pt_BR'],
  ['zh-Hans', 'zh_HANS'],
]);

let imsLoaded;
export async function loadIms() {
  imsLoaded =
    imsLoaded ||
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('IMS timeout')), 5000);
      window.adobeid = {
        client_id: 'ExperienceLeague_Dev',
        scope:
          'AdobeID,additional_info.company,additional_info.ownerOrg,avatar,openid,read_organizations,read_pc,session,account_cluster.read',
        locale: locales.get(document.querySelector('html').lang) || locales.get('en'),
        debug: false,
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
  return imsLoaded;
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  loadIms(); // start it early, asyncronously
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));

  const context = {
    getMetadata,
    toClassName,
  };
  // eslint-disable-next-line import/no-relative-packages
  const { initConversionTracking } = await import('../plugins/rum-conversion/src/index.js');
  await initConversionTracking.call(context, document);
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

export function loadPrevNextBtn() {
  const mainDoc = document.querySelector('main > div:nth-child(1)');
  if (!mainDoc) return;

  const prevPageMeta = document.querySelector('meta[name="prev-page"]');
  const nextPageMeta = document.querySelector('meta[name="next-page"]');
  const prevPageMetaContent = prevPageMeta?.getAttribute('content').trim().split('.html')[0];
  const nextPageMetaContent = nextPageMeta?.getAttribute('content').trim().split('.html')[0];
  const PREV_PAGE = 'Previous page';
  const NEXT_PAGE = 'Next page';

  if (prevPageMeta || nextPageMeta) {
    if (prevPageMetaContent === '' && nextPageMetaContent === '') return;

    const docPagination = createTag('div', { class: 'doc-pagination' });
    const btnGotoLeft = createTag('div', { class: 'btn-goto is-left-desktop' });

    const anchorLeftAttr = {
      href: `${prevPageMetaContent}`,
      class: 'pagination-btn',
    };
    const anchorLeft = createTag('a', anchorLeftAttr);
    const spanLeft = createTag('span', '', PREV_PAGE);

    anchorLeft.append(spanLeft);
    btnGotoLeft.append(anchorLeft);

    const btnGotoRight = createTag('div', {
      class: 'btn-goto is-right-desktop',
    });

    const anchorRightAttr = {
      href: `${nextPageMetaContent}`,
      class: 'pagination-btn',
    };
    const anchorRight = createTag('a', anchorRightAttr);
    const spanRight = createTag('span', '', NEXT_PAGE);

    anchorRight.append(spanRight);
    btnGotoRight.append(anchorRight);

    if (!prevPageMeta || prevPageMetaContent === '') {
      anchorLeft.classList.add('is-disabled');
    }

    if (!nextPageMeta || nextPageMetaContent === '') {
      anchorRight.classList.add('is-disabled');
    }

    docPagination.append(btnGotoLeft, btnGotoRight);
    mainDoc.append(docPagination);
  }
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
  // eslint-disable-next-line import/no-cycle
  if (isDocPage()) window.setTimeout(() => import('./feedback/feedback.js'), 3000);
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

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadRails();
  const setupAnalytics = setupAnalyticsTrackingWithAlloy(document);
  loadDelayed();
  await setupAnalytics;
  loadPrevNextBtn();
}

const cwv = {};

// Forward the RUM CWV cached measurements to edge using WebSDK before the page unloads
window.addEventListener('beforeunload', () => {
  if (!Object.keys(cwv).length) return;
  analyticsTrackCWV(cwv);
});

// Callback to RUM CWV checkpoint in order to cache the measurements
sampleRUM.always.on('cwv', async (data) => {
  if (!data.cwv) return;
  Object.assign(cwv, data.cwv);
});

sampleRUM.always.on('404', analyticsTrack404);
sampleRUM.always.on('error', analyticsTrackError);

// Declare conversionEvent, bufferTimeoutId and tempConversionEvent,
// outside the convert function to persist them for buffering between
// subsequent convert calls
const CONVERSION_EVENT_TIMEOUT_MS = 100;
let bufferTimeoutId;
let conversionEvent;
let tempConversionEvent;
sampleRUM.always.on('convert', (data) => {
  const { element } = data;
  // eslint-disable-next-line no-undef
  if (!element || !alloy) {
    return;
  }

  if (element.tagName === 'FORM') {
    conversionEvent = {
      ...data,
      event: 'Form Complete',
    };

    if (
      conversionEvent.event === 'Form Complete' &&
      // Check for undefined, since target can contain value 0 as well, which is falsy
      (data.target === undefined || data.source === undefined)
    ) {
      // If a buffer has already been set and tempConversionEvent exists,
      // merge the two conversionEvent objects to send to alloy
      if (bufferTimeoutId && tempConversionEvent) {
        conversionEvent = { ...tempConversionEvent, ...conversionEvent };
      } else {
        // Temporarily hold the conversionEvent object until the timeout is complete
        tempConversionEvent = { ...conversionEvent };

        // If there is partial form conversion data,
        // set the timeout buffer to wait for additional data
        bufferTimeoutId = setTimeout(async () => {
          analyticsTrackConversion({ ...conversionEvent });
          tempConversionEvent = undefined;
          conversionEvent = undefined;
        }, CONVERSION_EVENT_TIMEOUT_MS);
      }
    }
    return;
  }

  analyticsTrackConversion({ ...data });
  tempConversionEvent = undefined;
  conversionEvent = undefined;
});

loadPage();

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
