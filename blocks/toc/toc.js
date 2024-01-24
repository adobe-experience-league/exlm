import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { tocUrl } from '../../scripts/urls.js';
import TocDataService from '../../scripts/data-service/tocs-data-service.js';
import { htmlToElement } from '../../scripts/scripts.js';
import getSolutionName from './toc-solutions.js';

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
    if(!itemList[i].classList.contains('view-more-less')){
    itemList[i].classList.toggle('hidden', !show);
    }
  }
}

// Utility function to set link visibility
function setLinkVisibility(linkElement, show) {
  if (linkElement) {
    linkElement.style.display = show ? 'inline-flex' : 'none';
  }
}

// Function to handle "View More" click
function handleViewMoreClick(targetUL, viewMoreLI, viewLessLI) {
  toggleItemVisibility(targetUL.children, 5, true); // Start from index 5 to show more items
  setLinkVisibility(viewMoreLI, false);
  setLinkVisibility(viewLessLI, true);
}

// Function to handle "View Less" click
function handleViewLessClick(targetUL, viewMoreLI, viewLessLI) {
  toggleItemVisibility(targetUL.children, 5, false); // Start from index 5 to hide more items
  setLinkVisibility(viewMoreLI, true);
  setLinkVisibility(viewLessLI, false);
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
  const viewMoreLI = document.createElement('li');
  viewMoreLI.classList.add('left-rail-view-more', 'view-more-less');
  viewMoreLI.innerHTML = `<span class="viewMoreLink"> ${placeholders.viewMore}</span>`;
  targetUL.append(viewMoreLI);

  const viewLessLI = document.createElement('li');
  viewLessLI.classList.add('left-rail-view-less', 'view-more-less');
  viewLessLI.style.display = 'none';
  viewLessLI.innerHTML = `<span class="viewLessLink"> ${placeholders.viewLess}</span>`;
  targetUL.append(viewLessLI);

  // Check if there are less than 5 items, hide the "View More" link accordingly
  const liElements = targetUL.children;
  if (liElements && liElements.length <= 5) {
    setLinkVisibility(viewMoreLI, false);
  }

  // Event listeners for "View More" and "View Less" links
  viewMoreLI.addEventListener('click', () => handleViewMoreClick(targetUL, viewMoreLI, viewLessLI));
  viewLessLI.addEventListener('click', () => handleViewLessClick(targetUL, viewMoreLI, viewLessLI));
}

const handleTocsService = async (tocID) => {
  const tocsService = new TocDataService(tocUrl);
  const tocs = await tocsService.fetchDataFromSource(tocID);

  if (!tocs) {
    throw new Error('An error occurred');
  }

  return tocs;
};

function addClassesToAncestors(element, classNameToAdd, classNameToRemove) {
  let currentElement = element;

  while (currentElement) {
    if (currentElement.tagName === 'LI') {
      const link = currentElement.querySelector('a.js-toggle');
      const sublist = currentElement.querySelector('ul');

      if (link) {
        link.classList.add(classNameToAdd);
        if (classNameToRemove) {
          // Use setTimeout to remove the class after a short delay
          setTimeout(() => {
            link.classList.remove(classNameToRemove);
          }, 10);
        }
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
        addClassesToAncestors(currentItemLi, 'is-open', 'collapsed');
      }
    }

    // Toggle functionality for TOC Block
    const toggleElements = block.querySelectorAll('.js-toggle');
    if (toggleElements) {
      toggleElements.forEach((toggleElement) => {
        const subMenu = toggleElement.parentElement.parentElement.querySelector('ul');
        // View more and view less
        if (subMenu.children.length >= 5) {
          viewMoreviewLess(subMenu);
        }

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
