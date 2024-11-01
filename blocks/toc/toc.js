import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  rewriteDocsPath,
  getLanguageCode,
  createPlaceholderSpan,
  getConfig,
  matchesAnyTheme,
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

// The TOC additional UI elements
// TODO: Localizable strings, move to a separate file if needed
const tocActions = () => `
  <div class="toc-header-actions">
    <!-- TOC Filter Bar -->
    <div class="toc-filter-wrapper">
      <div class="toc-filter-container">
        <span title="Filter" class="icon icon-icon-filter toc-filter-icon"></span>
        <input autocomplete="off" class="toc-filter-input" type="text" 
          aria-label="Filter by keyword" aria-expanded="false" 
          title="Type to filter" role="textbox" placeholder="Filter by keyword" />
        <span title="Clear" class="icon icon-icon-clear toc-clear-icon"/>
      </div>
    </div>

    <!-- TOC Expand All Switch -->
    <div class="spectrum-switch">
      <input type="checkbox" class="spectrum-switch-input" id="custom-switch" />
      <span class="spectrum-switch-switch"></span>
      <label class="spectrum-switch-label" for="custom-switch">Expand all sections</label>
    </div>
  </div>
`;

function buildProductHeader() {
  const productName = getProductName();
  const solutionInfo = getSolutionByName(productName);
  return htmlToElement(`
    <div class="toc-header is-sticky">
      <div class="toc-header-content">
        <span class="icon icon-${solutionInfo.class}"></span>
        <h3>${solutionInfo.name}</h3>
      </div>
      ${tocActions()}
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

        ensureElementInView(tocTree, anchor);
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
 * Filters TOC items based on the input query without altering the original structure.
 * @param {string} query - The search input value
 */
function tocFilter(query) {
  const tocItems = document.querySelectorAll('.toc-tree li');
  const filterQuery = query.toLowerCase();

  tocItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    let hasMatchingDescendants = false;

    // Recursively check for matches in descendants
    function checkForMatches(element) {
      const childItems = Array.from(element.querySelectorAll('li'));
      childItems.forEach(child => {
        const childText = child.textContent.toLowerCase();
        if (childText.includes(filterQuery)) {
          hasMatchingDescendants = true;
          child.style.display = '';
        } else {
          child.style.display = 'none';
        }
        // Recursive call for deeper nesting
        checkForMatches(child);
      });
    }

    checkForMatches(item); // Start from the current item

    if (text.includes(filterQuery) || hasMatchingDescendants) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }

    // Expand/collapse toggles based on parent/child visibility
    const toggle = item.querySelector('a'); 
    if (toggle) {
      toggle.setAttribute('aria-expanded', hasMatchingDescendants ? 'true' : 'false');
    }
  });
}

/**
 * tocFilterDebounce: Debounce function to prevent multiple filter calls in quick succession
 * @param {Function} func - The filter function
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {Function} - The debounced filter function
 */
function tocFilterDebounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * resetTocToInitialState: Reset the TOC to its initial state after filtering
 * Restores the original structure and collapses all toggles
 * @returns {void}
 */
function resetTocToInitialState() {
  const tocItems = document.querySelectorAll('.toc-tree li');
  const toggles = document.querySelectorAll('.toc-tree a'); 

  tocItems.forEach(item => {
    item.style.display = ''; // Show all items
  });

  toggles.forEach(toggle => {
    toggle.setAttribute('aria-expanded', 'false'); // Collapse all toggles
  });

  // Re-activate the current page in the TOC TODO: replace with a state management?
  activateCurrentPage(document.querySelector('.toc-content')); 
}

/**
 * clearFilter: Clear the filter input and restore the original TOC structure
 * TODO: Refactor to avoid duplication with resetTocToInitialState
 * needed if we use the TOC State Management
 * @returns {void}
 */
function clearFilter() {
  resetTocToInitialState();
}

/**
 * initializeTocFilter: Initialize the TOC filter functionality
 * Adds event listeners for filtering and clearing the filter
 * @returns {void}
 */
function initializeTocFilter() {
  const tocFilterInput = document.querySelector('.toc-filter-input');
  const tocFilterClearIcon = document.querySelector('.toc-clear-icon');

  // Apply the debounced filter function
  const debouncedFilter = tocFilterDebounce((event) => {
    const query = event.target.value;
    tocFilter(query);
  }, 300); // 300ms debounce delay

  // Add input event listener for filtering
  tocFilterInput.addEventListener('input', debouncedFilter);

  // Clear filter on clear icon click
  tocFilterClearIcon.addEventListener('click', () => {
    tocFilterInput.value = '';
    clearFilter(); // Restore the original or user structure
  });
}

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  if (matchesAnyTheme(/kb-article/)) return;
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
  decorateIcons(productHeader.querySelector('.toc-header-content'), '/solutions');
  decorateIcons(productHeader.querySelector('.toc-header-actions'));
  const tocMobileDropdown = buildTocMobileDropdown();

  block.appendChild(tocMobileDropdown);
  tocContent.appendChild(productHeader);
  block.appendChild(tocContent);

  const tocReady = fetchToc(tocID);
  // decorate TOC DOM
  tocReady.then(({ HTML }) => {
    updateTocContent(HTML, tocContent);
    activateCurrentPage(tocContent);
    initializeTocFilter();

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
