import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  rewriteDocsPath,
  getLanguageCode,
  createPlaceholderSpan,
  getConfig,
} from '../../scripts/scripts.js';
import getSolutionByName from './toc-solutions.js';

const MAX_ITEMS = 5;

/**
 * fetch toc html from service
 * @param {string} tocID
 * @param {string} lang
 * @returns
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
    <div class="toc-header">
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
 *
 * @param {string} tocHtml
 * @param {HTMLElement} tocContent
 */
function updateTocContent(tocHtml, tocContent) {
  tocContent.insertAdjacentHTML('beforeend', tocHtml);

  // prepare links and submenus
  let submenuIdCount = 0;
  tocContent.querySelectorAll('a').forEach((anchor) => {
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
      }
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        const isExpanded = anchor.getAttribute('aria-expanded') === 'true';
        anchor.setAttribute('aria-expanded', !isExpanded);
      });
    } else {
      // Rewrite docs path to fix language path
      const rewritePath = rewriteDocsPath(anchorHref);
      anchor.setAttribute('href', rewritePath);
      anchor.classList.add('toc-item');
    }
  });

  tocContent.querySelectorAll('ul').forEach((ul) => {
    // if ul has more than MAX_ITEMS children, add view more link
    const items = Array.from(ul.children).filter((child) => child.tagName === 'LI');
    if (items.length > MAX_ITEMS) {
      const viewMoreLessItem = document.createElement('li');
      viewMoreLessItem.classList.add('toc-view-more-less');
      ul.setAttribute('aria-expanded', 'false');
      const viewMoreSpan = createPlaceholderSpan('viewMore', 'View More');
      viewMoreSpan.className = 'toc-view-more';
      const viewLessSpan = createPlaceholderSpan('viewLess', 'View Less');
      viewLessSpan.className = 'toc-view-less';
      viewMoreLessItem.appendChild(viewMoreSpan);
      viewMoreLessItem.appendChild(viewLessSpan);
      viewMoreLessItem.addEventListener('click', () => {
        const isExpanded = ul.getAttribute('aria-expanded') === 'true';
        ul.setAttribute('aria-expanded', !isExpanded);
      });
      ul.appendChild(viewMoreLessItem);
    }
  });
}

const activate = (el, expandSelf) => {
  if (!el) return;
  el.classList.add('is-active');
  if (expandSelf) el.setAttribute('aria-expanded', 'true');
  const activeLi = el.closest('li');
  const index = [...activeLi.parentElement.children].indexOf(activeLi);
  if (index > MAX_ITEMS - 1) {
    const parentUl = activeLi.closest('ul');
    if (parentUl) {
      parentUl.setAttribute('aria-expanded', 'true');
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
        // get toggle eleemnt index
        if (toggle) {
          activate(toggle, true);
        }
        const parentListItem = parentList.closest('li');
        if (parentListItem) {
          currentItem = parentListItem;
        }
      }
    }
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
  decorateIcons(productHeader, '/solutions');
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
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width:900px)').matches) {
      tocMobileDropdown.setAttribute('aria-expanded', 'false');
    }
  });
}
