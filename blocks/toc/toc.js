import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { tocUrl } from '../../scripts/urls.js';
import TocDataService from '../../scripts/data-service/tocs-data-service.js';
import { htmlToElement } from '../../scripts/scripts.js';
import getSolutionName from './solutions.js';

const constructSolutionsDropdownEl = htmlToElement(`
    <div class="toc-dropdown is-hidden-desktop">
      <button type="button" class="toc-dropdown-button" aria-expanded="false" aria-controls="toc-dropdown-popover">
        <span class="toc-dropdown-label">Table of contents</span>
      </button>
    </div>
`);

// Utility function to toggle visibility of items
function toggleItemVisibility(itemList, startIndex, show) {
  // eslint-disable-next-line no-plusplus
  for (let i = startIndex; i < itemList.length; i++) {
    itemList[i].classList.toggle('hidden', !show);
  }
}

// Utility function to set link visibility
function setLinkVisibility(block, linkClass, show) {
  const linkElement = block.querySelector(linkClass);
  if (linkElement) {
    linkElement.style.display = show ? 'inline-flex' : 'none';
  }
}

// Function to handle "View More" click
function handleViewMoreClick(targetUL, viewMoreDiv, viewLessDiv) {
  toggleItemVisibility(targetUL.children, 5, true); // Start from index 5 to show more items
  setLinkVisibility(viewMoreDiv, '.viewMoreLink', false);
  setLinkVisibility(viewLessDiv, '.viewLessLink', true);
}

// Function to handle "View Less" click
function handleViewLessClick(targetUL, viewMoreDiv, viewLessDiv) {
  toggleItemVisibility(targetUL.children, 5, false); // Start from index 5 to hide more items
  setLinkVisibility(viewMoreDiv, '.viewMoreLink', true);
  setLinkVisibility(viewLessDiv, '.viewLessLink', false);
}

async function viewMoreviewLess(targetUL) {
  let placeholders = {};
  try {
    placeholders = await fetchPlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  toggleItemVisibility(targetUL.children, 5, false);

  // "View More" and "View Less" links
  const viewMoreDiv = document.createElement('div');
  viewMoreDiv.classList.add('left-rail-view-more', 'view-more-less');
  viewMoreDiv.innerHTML = `<span class="viewMoreLink"> ${placeholders.viewMore}</span>`;
  targetUL.append(viewMoreDiv);

  const viewLessDiv = document.createElement('div');
  viewLessDiv.classList.add('left-rail-view-less', 'view-more-less');
  viewLessDiv.innerHTML = `<span class="viewLessLink" style="display: none;"> ${placeholders.viewLess}</span>`;
  targetUL.append(viewLessDiv);

  // Check if there are less than 5 items, hide the "View More" link accordingly
  const liElements = targetUL.children;
  if (liElements && liElements.length <= 5) {
    setLinkVisibility(viewMoreDiv, '.viewMoreLink', false);
  }

  // Event listeners for "View More" and "View Less" links
  viewMoreDiv.addEventListener('click', () => handleViewMoreClick(targetUL, viewMoreDiv, viewLessDiv));
  viewLessDiv.addEventListener('click', () => handleViewLessClick(targetUL, viewMoreDiv, viewLessDiv));
}

const handleTocsService = async (tocID) => {
  const tocsService = new TocDataService(tocUrl);
  const tocs = await tocsService.fetchDataFromSource(tocID);

  if (!tocs) {
    throw new Error('An error occurred');
  }

  return tocs;
};

function addClassesToAncestors(element, className) {
  let currentElement = element;

  while (currentElement) {
    if (currentElement.tagName === 'LI') {
      const link = currentElement.querySelector('a');
      const sublist = currentElement.querySelector('ul');

      if (link) {
        link.classList.add(className);
        link.classList.remove('collapsed');
      }

      if (sublist) {
        sublist.style.display = 'block';
      }
    }
    currentElement = currentElement.parentElement;
  }
}

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('toc-right-rail-content');

  // fetch toc content
  const tocID = block.querySelector('.toc > div > div').textContent;
  if (tocID !== '') {
    const resp = await handleTocsService(tocID);
    block.innerHTML = '';
    const div = document.createElement('div');
    const html = resp ? resp?.HTML : '';
    let productName = '';
    const productNames = getMetadata('original-solution');
    if (productNames.includes(',')) {
      const productNamesArray = productNames.split(',');
      productName = productNamesArray[0].trim();
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
    const parentUL = block.querySelector('.toc > div > div > ul');
    viewMoreviewLess(parentUL);

    const currentURL = window.location.pathname;
    const regex = /\/(\w{2})\//;
    const match = currentURL.match(regex);
    let locale = '';

    if (match && match[1]) {
      // eslint-disable-next-line prefer-destructuring
      locale = match[1];
    }

    const anchors = block.querySelectorAll('.toc a');
    anchors.forEach((anchor) => {
      const pTag = document.createElement('p');
      anchor.parentNode.replaceChild(pTag, anchor);
      pTag.appendChild(anchor);
      const currentHref = anchor.getAttribute('href');
      const extensionRegex = /\.html\?lang=\w{2}$/;
      // Remove ".html?lang=en" part from the href
      const newHref = currentHref.replace(extensionRegex, '');

      if (anchor.getAttribute('href').startsWith('#')) {
        anchor.classList.add('js-toggle');
        // View more and view less
        const targetUL = anchor.parentElement.parentElement.querySelector('ul');
        viewMoreviewLess(targetUL);
      } else {
        anchor.setAttribute('href', `/${locale}${newHref}`);
      }
    });

    // Add is-active class to the highlighted section
    const activeElement = block.querySelector(`a[href="${currentURL}"]`);
    if (activeElement) {
      activeElement.classList.add('is-active');
      const currentItemLi = activeElement.closest('li');

      if (currentItemLi) {
        addClassesToAncestors(currentItemLi, 'is-open');
      }
    }

    // Toggle functionality for TOC Block
    const toggleElements = block.querySelectorAll('.js-toggle');
    if (toggleElements) {
      toggleElements.forEach((toggleElement) => {
        const subMenu = toggleElement.parentElement.parentElement.querySelector('ul');
        toggleElement.classList.add('collapsed');
        toggleElement.addEventListener('click', (event) => {
          event.preventDefault();
          subMenu.style.display = subMenu.style.display === 'none' || subMenu.style.display === '' ? 'block' : 'none';
          toggleElement.classList.toggle('expanded', subMenu.style.display === 'block');
          toggleElement.classList.toggle('collapsed', subMenu.style.display === 'none');
        });
      });
    }
  }
}
