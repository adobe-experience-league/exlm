import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  rewriteDocsPath,
  getLanguageCode,
  createPlaceholderSpan,
  getConfig,
} from '../../scripts/scripts.js';
import getSolutionByName from './toc-solutions.js';

/**
 * fetch toc html from service
 * @param {string} tocID
 * @returns {Promise<string>}
 */
async function fetchToc(tocID) {
  const lang = (await getLanguageCode()) || 'en';
  const { cdnOrigin } = getConfig();
  try {
    const response = await fetch(`${cdnOrigin}/api/action/tocs/${tocID}?lang=${lang}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching toc data', error);
    return null;
  }
}

/**
 * @returns {string} product name from metadata
 */
function getProductName() {
  const productNames = getMetadata('original-solution');
  return productNames.includes(',') ? productNames.split(',')[0].trim() : productNames;
}

function buildProductHeader() {
  const productName = getProductName();
  const solutionInfo = getSolutionByName(productName);
  return htmlToElement(`
    <div class="toc-header is-sticky">
      <span class="icon icon-${solutionInfo.class}"></span>
      <h3>${solutionInfo.name}</h3>
    </div>
  `);
}

function buildTocMobileDropdown() {
  const tocDropdown = htmlToElement(
    `<button type="button" class="toc-dropdown-button" aria-expanded="false" aria-controls="toc-dropdown-popover"></button>`,
  );
  tocDropdown.appendChild(createPlaceholderSpan('tableOfContents', 'Table of Contents'));
  return tocDropdown;
}

/**
 * Collapse sibling submenus of the clicked element
 * @param {HTMLElement} element
 */
function collapseSiblingSubmenus(element) {
  const parentList = element.closest('ul');
  if (parentList) {
    const siblingToggles = parentList.querySelectorAll(':scope > li > .toc-toggle');
    siblingToggles.forEach((toggle) => {
      if (toggle !== element) {
        toggle.setAttribute('aria-expanded', 'false');
        const siblingUl = toggle.nextElementSibling;
        if (siblingUl && siblingUl.tagName === 'UL') {
          siblingUl.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }
}

/**
 * Ensure the active element is scrolled into view
 * @param {HTMLElement} tocContent
 * @param {HTMLElement} element
 */
function ensureElementInView(tocContent, element) {
  const elementTop = element.getBoundingClientRect().top;
  const tocContentTop = tocContent.getBoundingClientRect().top;
  const scrollPosition = elementTop - tocContentTop - 20;

  tocContent.scrollTop += scrollPosition;
}

/**
 * Update TOC content with HTML and set up event listeners
 * @param {string} tocHtml
 * @param {HTMLElement} tocContent
 */
function updateTocContent(tocHtml, tocContent) {
  const tocTree = document.createElement('div');
  tocTree.classList.add('toc-tree');
  tocTree.insertAdjacentHTML('beforeend', tocHtml);
  tocContent.appendChild(tocTree);

  // prepare links and submenus
  let submenuIdCount = 0;
  tocTree.querySelectorAll('a').forEach((anchor) => {
    const anchorHref = anchor.getAttribute('href');
    if (anchorHref.startsWith('#')) {
      submenuIdCount += 1;
      const submenuId = `toc-submenu-${submenuIdCount}`;
      anchor.classList.add('toc-toggle');
      anchor.setAttribute('aria-expanded', 'false');
      anchor.setAttribute('aria-controls', submenuId);
      const siblingUl = anchor.nextElementSibling;
      if (siblingUl && siblingUl.tagName === 'UL') {
        siblingUl.id = submenuId;
        siblingUl.classList.add('toc-submenu');
        siblingUl.setAttribute('aria-hidden', 'true');
      }
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        const isExpanded = anchor.getAttribute('aria-expanded') === 'true';
        anchor.setAttribute('aria-expanded', !isExpanded);
        siblingUl.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');

        if (!isExpanded) {
          // Collapse other submenus at the same level
          collapseSiblingSubmenus(anchor);
        }
        ensureElementInView(tocContent, anchor);
      });
    } else {
      // Rewrite docs path to fix language path
      const rewritePath = rewriteDocsPath(anchorHref);
      anchor.setAttribute('href', rewritePath);
      anchor.classList.add('toc-item');
    }
  });
}

const activate = (el, expandSelf) => {
  if (!el) return;
  el.classList.add('is-active');
  if (expandSelf) {
    el.setAttribute('aria-expanded', 'true');
    const siblingUl = el.nextElementSibling;
    if (siblingUl && siblingUl.tagName === 'UL') {
      siblingUl.setAttribute('aria-hidden', 'false');
    }
  }
};

/**
 * Activate current page in TOC
 * @param {HTMLElement} tocContent
 */
function activateCurrentPage(tocContent) {
  const currentURL = window.location.pathname;
  const activeAnchor = tocContent.querySelector(`a[href="${currentURL}"]`);
  if (activeAnchor) {
    activate(activeAnchor);

    let currentItem = activeAnchor.closest('ul');
    while (currentItem) {
      const parentList = currentItem.closest('ul');
      currentItem = null;
      if (parentList) {
        const toggle = parentList.parentElement.querySelector(':scope > .toc-toggle');
        if (toggle) {
          activate(toggle, true);
        }
        const parentListItem = parentList.closest('li');
        if (parentListItem) {
          currentItem = parentListItem;
        }
      }
    }

    // Ensure the active element is in view
    ensureElementInView(tocContent, activeAnchor);
  }
}

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  const tocID = block.querySelector('.toc > div > div').textContent;
  if (!tocID && document.querySelector('.toc-dropdown')) return;
  block.innerHTML = ''; // start clean
  const themeColor = getMetadata('theme-color');
  block.style.setProperty('--toc-theme-color', themeColor);
  block.classList.add(getSolutionByName(getProductName()).class);

  const tocContent = document.createElement('div');
  tocContent.classList.add('toc-content');
  tocContent.id = 'toc-dropdown-popover';

  const productHeader = buildProductHeader();
  decorateIcons(productHeader, 'solutions/');
  const tocMobileDropdown = buildTocMobileDropdown();

  block.appendChild(tocMobileDropdown);
  tocContent.appendChild(productHeader);
  block.appendChild(tocContent);

  const tocReady = fetchToc(tocID);
  // decorate TOC DOM
  tocReady.then(({ HTML }) => {
    updateTocContent(HTML, tocContent);
    activateCurrentPage(tocContent);
    // click event for TOC dropdown to open solutions
    tocMobileDropdown.addEventListener('click', () => {
      const isExpanded = tocMobileDropdown.getAttribute('aria-expanded') === 'true';
      tocMobileDropdown.setAttribute('aria-expanded', !isExpanded);
    });
    // Prevents active elements to be hidden below the overflow
    const activeElement = tocContent.querySelector('.toc-item.is-active');
    const offset = 100;

    if (activeElement) {
      const activeElementTop = activeElement.getBoundingClientRect().top;
      const tocContentTop = tocContent.getBoundingClientRect().top;
      const scrollPosition = activeElementTop - tocContentTop - offset;

      tocContent.scrollTop = scrollPosition;
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width:900px)').matches) {
      tocMobileDropdown.setAttribute('aria-expanded', 'false');
    }
  });
}
