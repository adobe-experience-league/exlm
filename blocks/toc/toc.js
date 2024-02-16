import { getMetadata } from '../../scripts/lib-franklin.js';
import { tocUrl } from '../../scripts/urls.js';
import TocDataService from '../../scripts/data-service/toc-data-service.js';
import { htmlToElement, fetchLanguagePlaceholders, rewriteDocsPath, getLanguageCode } from '../../scripts/scripts.js';
import getSolutionName from './toc-solutions.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// HTML for Tablet&Mobile view dropdown right-rail
const constructSolutionsDropdownEl = htmlToElement(`
    <div class="toc-dropdown is-hidden-desktop">
      <button type="button" class="toc-dropdown-button" aria-expanded="false" aria-controls="toc-dropdown-popover">
        <span class="toc-dropdown-label">${placeholders.tableOfContents}</span>
      </button>
    </div>
`);

// Toggle list items
function toggleColumn(block) {
  const toggleElements = block.querySelectorAll('.js-toggle');
  if (toggleElements) {
    toggleElements.forEach((toggleElement) => {
      const subMenu = toggleElement.parentElement.parentElement.querySelector('ul');
      subMenu.classList.add('is-hidden');
      toggleElement.classList.add('collapsed');
      toggleElement.addEventListener('click', (event) => {
        event.preventDefault();
        subMenu.classList.toggle('is-hidden');
        toggleElement.classList.toggle('collapsed');
      });
    });
  }
}

// Utility function to toggle visibility of items
function toggleItemVisibility(items, showAll, limit) {
  items.forEach((item, index) => {
    item.classList.remove('is-hidden', 'is-visible');
    if (!showAll && index >= limit) {
      item.classList.add('is-hidden');
    } else {
      item.classList.add('is-visible');
    }
  });
}

// Function to handle "View Less" click
function handleViewMoreClick(ev, items, limit) {
  ev.preventDefault();
  if (ev.currentTarget) {
    const clickElement = ev.currentTarget.querySelector('span');
    const getViewLinkText = clickElement.classList.contains('plus');
    clickElement.textContent = getViewLinkText ? placeholders?.viewLess : placeholders?.viewMore;
    clickElement.classList.toggle('plus');
    clickElement.classList.toggle('minus');
    toggleItemVisibility(items, getViewLinkText, limit);
  }
}

async function viewMoreviewLess(list, items, limit) {
  let viewMoreLessItem = list.querySelector('.view-more-less');

  if (items.length > limit) {
    if (!viewMoreLessItem) {
      viewMoreLessItem = document.createElement('li');
      viewMoreLessItem.classList.add('view-more-less');
      viewMoreLessItem.innerHTML = `<span class="plus">${placeholders.viewMore}</span>`;
      viewMoreLessItem.addEventListener('click', (ev) => handleViewMoreClick(ev, items, limit));
      list.appendChild(viewMoreLessItem);
    }

    const isAllVisible = Array.from(items).every((item) => item.classList.contains('is-visible'));

    const viewLinkDiv = viewMoreLessItem.querySelector('span');
    if (isAllVisible) {
      viewLinkDiv.textContent = placeholders?.viewLess;
      viewLinkDiv.classList.remove('plus');
      viewLinkDiv.classList.add('minus');
    } else {
      viewLinkDiv.textContent = placeholders?.viewMore;
      viewLinkDiv.classList.remove('minus');
      viewLinkDiv.classList.add('plus');
    }
  }
}

// Items to show initially and highlight the current page
function initializeItemsToShow(block, currentURL) {
  const getTocRootList = block.querySelector('.toc-right-rail-content>div>ul');
  const currentActiveElement = getTocRootList.querySelector(`a[href="${currentURL}"]`);
  if (currentActiveElement) {
    currentActiveElement.classList.add('is-active');
  }
  function activateListItem(list) {
    const items = Array.from(list.children).filter((child) => child.tagName === 'LI');
    const isItemActiveAfterLimit = items.slice(5).some((li) => li.querySelector('.is-active'));

    toggleItemVisibility(items, isItemActiveAfterLimit, 5);

    if (items.length > 5 || (list === getTocRootList && items.length > 5)) {
      viewMoreviewLess(list, items, 5);
    }
    return isItemActiveAfterLimit;
  }
  activateListItem(getTocRootList);

  const nestedLists = Array.from(getTocRootList.querySelectorAll('ul'));
  nestedLists.forEach((nestedList) => activateListItem(nestedList));

  if (currentActiveElement) {
    let currentItem = currentActiveElement.closest('li');
    while (currentItem) {
      currentItem.querySelector('a').classList.add('is-open', 'is-collapsed');
      const parentList = currentItem.closest('ul');
      if (parentList && parentList !== getTocRootList) {
        const parentListItem = parentList.closest('li');
        if (parentListItem) {
          parentListItem.querySelector('a').classList.add('is-collapsed');
          currentItem = parentListItem;
        } else {
          currentItem = null;
        }
      } else {
        currentItem = null;
      }
    }
  }
}

const handleTocService = async (tocID, lang) => {
  const tocsService = new TocDataService(tocUrl);
  const tocs = await tocsService.fetchDataFromSource(tocID, lang);

  if (!tocs) {
    throw new Error('An error occurred');
  }

  return tocs;
};

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('toc-right-rail-content');

  // Fetch TOC data
  const currentURL = window.location.pathname;
  const langCode = await getLanguageCode();
  const tocID = block.querySelector('.toc > div > div').textContent;
  if (tocID !== '' && !document.querySelector('.toc-dropdown')) {
    const resp = await handleTocService(tocID, langCode);
    block.innerHTML = '';
    block.style.visibility = 'visible';
    const div = document.createElement('div');
    const html = resp ? resp?.HTML : '';
    let productName = '';
    const productNames = getMetadata('original-solution');

    if (productNames.includes(',')) {
      productName = productNames.split(',')[0].trim();
    } else {
      productName = productNames;
    }
    const themeColor = getMetadata('theme-color');
    const solutionInfo = getSolutionName(productName);
    // decorate TOC DOM
    div.innerHTML = html;

    block.parentElement.setAttribute('theme-color', themeColor);
    block.classList.add(solutionInfo.class);
    const ul = document.createElement('ul');
    ul.id = 'product';
    const li = document.createElement('li');
    li.innerHTML = `<span class="product-icon"></span><h3>${solutionInfo.name}</h3>`;
    ul.append(li);

    contentDiv.appendChild(ul);
    contentDiv.appendChild(div);

    // Toc dropdow, visible only on mobile
    block.appendChild(constructSolutionsDropdownEl);
    // click event for TOC dropdown to open solutions
    const tocMobileButton = block.querySelector('.toc-dropdown-button');
    tocMobileButton.addEventListener('click', () => {
      const isExpanded = tocMobileButton.getAttribute('aria-expanded') === 'true';
      tocMobileButton.setAttribute('aria-expanded', !isExpanded);
      contentDiv.classList.toggle('toc-wrapper-expanded');
    });
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width:900px)').matches && contentDiv.classList.contains('toc-wrapper-expanded')) {
        contentDiv.classList.remove('toc-wrapper-expanded');
      }
    });

    block.appendChild(contentDiv);

    const anchors = block.querySelectorAll('.toc a');
    anchors.forEach((anchor) => {
      const pTag = document.createElement('p');
      anchor.parentNode.replaceChild(pTag, anchor);
      pTag.appendChild(anchor);

      const anchorHref = anchor.getAttribute('href');
      if (anchorHref.startsWith('#')) {
        anchor.classList.add('js-toggle');
      } else {
        // Rewrite docs path to fix language path
        const rewritePath = rewriteDocsPath(anchorHref);
        anchor.setAttribute('href', rewritePath);
      }
    });

    // Toggle functionality for TOC Block
    toggleColumn(block);
    initializeItemsToShow(block, currentURL);
    const ActiveEl = block.querySelectorAll('.js-toggle.is-collapsed.is-open');
    if (ActiveEl != null) {
      ActiveEl.forEach((el) => {
        el.click();
      });
    }
  }
}
