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
} from './lib-franklin.js';
import { isMobileResolution } from './utilities.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (
    h1 &&
    picture &&
    h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

function hideMobileLayoutToggle(e) {
  const wrapper = document.querySelector('.rail-mobile-wrapper-visible');
  if (wrapper && (!e.target || (e.target && !wrapper.contains(e.target)))) {
    wrapper.classList.remove('rail-mobile-wrapper-visible');
    document.removeEventListener('click', hideMobileLayoutToggle);
  }
}

function buildMobileToggle(leftRail) {
  leftRail.classList.add('rail-mobile-section', 'rail-section');
  let mobileRailButton = leftRail.querySelector('.rail-mobile-button');
  if (mobileRailButton) {
    return;
  }
  const leftRailContents = leftRail.innerHTML;
  const originalWrapper = leftRail.querySelector('.rail-mobile-wrapper');
  const wrapper = originalWrapper || document.createElement('div');
  wrapper.classList.add('rail-mobile-wrapper');
  mobileRailButton = document.createElement('button');
  mobileRailButton.classList.add('rail-mobile-button');
  mobileRailButton.innerText = 'Table of Contents';
  mobileRailButton.addEventListener('click', (e) => {
    if (!wrapper.classList.contains('rail-mobile-wrapper-visible')) {
      wrapper.classList.add('rail-mobile-wrapper-visible');
      e.stopPropagation();
      document.addEventListener('click', hideMobileLayoutToggle);
    }
  });
  if (!originalWrapper) {
    wrapper.innerHTML = leftRailContents;
    leftRail.innerHTML = '';
    leftRail.appendChild(wrapper);
  }
  leftRail.appendChild(mobileRailButton);
}

function attachToggleLayoutEvent({
  toggleElement,
  railElement,
  main,
  isLeftSection,
}) {
  railElement.classList.add('rail-events-attached');
  toggleElement.addEventListener('click', () => {
    const MIN_RAIL_WIDTH = '40px';
    const MAX_RAIL_WIDTH = '20%';
    let leftSectionWidth;
    let rightSectionWidth;
    if (toggleElement.classList.contains('rail-section-toggler-expanded')) {
      toggleElement.classList.remove('rail-section-toggler-expanded');
      railElement.classList.remove('rail-section-expanded');
      if (isLeftSection) {
        leftSectionWidth = MIN_RAIL_WIDTH;
        rightSectionWidth = main.children[2]?.classList?.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
      } else {
        leftSectionWidth = main.children[0]?.classList?.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
        rightSectionWidth = MIN_RAIL_WIDTH;
      }
    } else {
      toggleElement.classList.add('rail-section-toggler-expanded');
      railElement.classList.add('rail-section-expanded');
      if (isLeftSection) {
        leftSectionWidth = MAX_RAIL_WIDTH;
        rightSectionWidth = main.children[2].classList.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
      } else {
        leftSectionWidth = main.children[0].classList.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
        rightSectionWidth = MAX_RAIL_WIDTH;
      }
    }
    main.style.gridTemplateColumns = `${leftSectionWidth} 1fr ${rightSectionWidth}`;
  });
}

function createToggleLayoutSection(main, railElement, isLeftSection = true) {
  const secondaryClassName = isLeftSection
    ? 'rail-section-left'
    : 'rail-section-right';
  railElement.classList.add(
    'rail-section',
    secondaryClassName,
    'rail-section-expanded',
  );
  const originalWrapper = railElement.querySelector('.rail-section-wrapper');
  const wrapperElement = originalWrapper || document.createElement('div');
  wrapperElement.classList.add('rail-section-wrapper');
  if (!originalWrapper) {
    const railChildren = railElement.innerHTML;
    wrapperElement.innerHTML = railChildren;
    railElement.replaceChildren(wrapperElement);
  }
  const originalToggleElement = railElement.querySelector(
    '.rail-section-toggler',
  );
  if (originalToggleElement) {
    return;
  }
  const toggleElement = document.createElement('div');
  toggleElement.classList.add(
    'rail-section-toggler',
    'rail-section-toggler-expanded',
  );
  toggleElement.innerHTML = '<span class="icon icon-rail"></span>';
  railElement.appendChild(toggleElement);
  attachToggleLayoutEvent({ toggleElement, railElement, main, isLeftSection });
}

/**
 * Update the layout structure dynamically based on window dimensions
 * Triggered from window resize event
 */
function handleLayoutResize() {
  const main = document.querySelector('main');
  const isMobile = isMobileResolution();
  const [leftRail, content, rightRail] = main.children;
  if (isMobile && main.classList.contains('three-col-layout')) {
    main.classList.remove('three-col-layout');
    content.classList.remove('content-section');
    rightRail.classList.add('rail-hidden');
    const mRailWrapper = main.querySelector('.rail-section-wrapper');
    if (mRailWrapper) {
      mRailWrapper.classList.add('rail-mobile-wrapper');
      mRailWrapper.classList.remove('rail-section-wrapper');
    }
    buildMobileToggle(leftRail);
  } else if (!isMobile && !main.classList.contains('three-col-layout')) {
    main.classList.add('three-col-layout');
    content.classList.add('content-section');
    leftRail.classList.remove('rail-mobile-section');
    rightRail.classList.remove('rail-hidden', 'rail-mobile-section');
    leftRail.classList.add('rail-section-left', 'rail-section-expanded');
    rightRail.classList.add('rail-section-right', 'rail-section-expanded');
    const mRailWrapper = main.querySelector('.rail-mobile-wrapper');
    if (mRailWrapper) {
      mRailWrapper.classList.remove('rail-mobile-wrapper');
      mRailWrapper.classList.add('rail-section-wrapper');
    }
    main.style.gridTemplateColumns = '';
    createToggleLayoutSection(main, leftRail, true);
    createToggleLayoutSection(main, rightRail, false);
    decorateIcons(main);
  }
}

/**
 * Builds three column grid layout with left/right toggle section
 * @param {Element} main The container element
 */
function buildLayout(main) {
  // Get all child div elements
  const childDivs = main?.children;

  // Ensure there are at least 3 child divs
  if (childDivs?.length !== 3) {
    return;
  }
  window.addEventListener('resize', handleLayoutResize);
  const [leftRail, content, rightRail] = main.children;

  const isMobileRes = isMobileResolution();
  if (isMobileRes) {
    if (rightRail) {
      rightRail.classList.add('rail-hidden');
    }
    if (leftRail) {
      buildMobileToggle(leftRail);
    }
    return;
  }

  // Set CSS styles for the layout
  main.classList.add('three-col-layout');
  content.classList.add('content-section');
  createToggleLayoutSection(main, leftRail, true);
  createToggleLayoutSection(main, rightRail, false);
  decorateIcons(main);
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost'))
      sessionStorage.setItem('fonts-loaded', 'true');
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
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildSyntheticBlocks(main);
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
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  /**
   * Franklin converts paragraphs containing a single
   * link as buttons. This is not the behaviour we need.
   * The original decorateButtons function is however
   * retained and will be revisited during button specific
   * decoration.
   */
  // decorateButtons(main);
  decorateIcons(main);
  decorateExternalLinks(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  buildLayout(main);
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
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
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

export function loadPrevNextBtn() {
  const mainDoc = document.querySelector('main >div:nth-child(2)');
  if (!mainDoc) return;

  const prevPageMeta = document.querySelector('meta[name="prev-page"]');
  const nextPageMeta = document.querySelector('meta[name="next-page"]');
  const prevPageMetaContent = prevPageMeta
    ?.getAttribute('content')
    .trim()
    .split('.html')[0];
  const nextPageMetaContent = nextPageMeta
    ?.getAttribute('content')
    .trim()
    .split('.html')[0];
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
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
  loadPrevNextBtn();
}

loadPage();
