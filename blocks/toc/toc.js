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
  // TODO: localize the switch label
  return htmlToElement(`
    <div class="toc-header is-sticky">
      <div class="toc-header-content">
        <span class="icon icon-${solutionInfo.class}"></span>
        <h3>${solutionInfo.name}</h3>
      </div>
      <div class="toc-header-actions">
        <div class="spectrum-switch">
          <input type="checkbox" class="spectrum-switch-input" id="custom-switch" />
          <span class="spectrum-switch-switch"></span>
          <label class="spectrum-switch-label" for="custom-switch">Expand all sections</label>
        </div>
      </div>
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
 * Ensure the active element is scrolled into view within an overflowed container,
 * positioning the element at the top of the tocContent.
 * @param {HTMLElement} tocContent - The container with overflow and scroll
 * @param {HTMLElement} element - The element to bring into view
 */
function ensureElementInView(tocContent, element) {
  if (!tocContent || !element) {
    console.error('tocContent or element is null', { tocContent, element }); // eslint-disable-line no-console
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const tocContentRect = tocContent.getBoundingClientRect();
  const scrollPosition = elementRect.top - tocContentRect.top + tocContent.scrollTop;

  tocContent.scrollTop = scrollPosition;
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

/**
 * Activate and expands multiple levels of TOC
 * @param {HTMLElement} el
 * @param {boolean} expandSelf
 */
const activate = (el, expandSelf) => {
  if (!el) return;
  el.classList.add('is-active');
  if (expandSelf) el.setAttribute('aria-expanded', 'true');
  const activeLi = el.closest('li');
  const parentUl = activeLi.closest('ul');
  if (parentUl) {
    parentUl.setAttribute('aria-expanded', 'true');
  }
};

/**
 * Collapse all submenus in the TOC
 * @param {HTMLElement} tocContent - The container of the TOC
 */
function collapseAllSubmenus(tocContent, collapseSelf = true) {
  const toggles = tocContent.querySelectorAll('.toc-toggle');
  
  toggles.forEach((toggle) => {
    toggle.setAttribute('aria-expanded', collapseSelf);

    const submenu = tocContent.querySelector(`#${toggle.getAttribute('aria-controls')}`);
    if (submenu) {
      submenu.setAttribute('aria-hidden', collapseSelf);
    }
  });

  // Prevents active elements to be hidden below the overflow
  const overflowBlock = tocContent.querySelector('.toc-tree');
  const activeElement = tocContent.querySelector('.toc-item.is-active');

  ensureElementInView(overflowBlock, activeElement);
}

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
    // Prevents active elements to be hidden below the overflow
    const overflowBlock = tocContent.querySelector('.toc-tree');
    const activeElement = tocContent.querySelector('.toc-item.is-active');

    ensureElementInView(overflowBlock, activeElement); 
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
  });

const spectrumSwitch = document.querySelector('.spectrum-switch input');

if (spectrumSwitch) {
  spectrumSwitch.addEventListener('change', () => {
    if (spectrumSwitch.checked) {
      collapseAllSubmenus(tocContent, true);
    } else {
      const tocTree = tocContent.querySelector('.toc-tree');
      collapseAllSubmenus(tocTree, false);
      activateCurrentPage(tocContent);
    }
  });
}


  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width:900px)').matches) {
      tocMobileDropdown.setAttribute('aria-expanded', 'false');
    }
  });
}
