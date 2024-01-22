import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { tocsUrl } from '../../scripts/urls.js';
import TocDataService from '../../scripts/data-service/tocs-data-service.js';

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

  toggleItemVisibility(targetUL.children, 5, false); // Hide items initially

  // "View More" and "View Less" links
  const viewMoreDiv = document.createElement('div');
  viewMoreDiv.classList.add('left-rail-view-more', 'view-more-less');
  viewMoreDiv.innerHTML = `<span class="viewMoreLink"> ${placeholders.viewMore}</span>`;
  targetUL.append(viewMoreDiv);

  const viewLessDiv = document.createElement('div');
  viewLessDiv.classList.add('left-rail-view-less', 'view-more-less');
  viewLessDiv.innerHTML = `<span class="viewLessLink" style="display: none;"> ${placeholders.viewLess}</span>`;
  targetUL.append(viewLessDiv);

  // Check if there are less than 11 items, and hide the "View More" link accordingly
  const liElements = targetUL.children;
  if (liElements && liElements.length <= 5) {
    setLinkVisibility(viewMoreDiv, '.viewMoreLink', false);
  }

  // Event listeners for "View More" and "View Less" links
  viewMoreDiv.addEventListener('click', () => handleViewMoreClick(targetUL, viewMoreDiv, viewLessDiv));
  viewLessDiv.addEventListener('click', () => handleViewLessClick(targetUL, viewMoreDiv, viewLessDiv));
}

const handleTocsService = async (tocID) => {
  const tocsService = new TocDataService(tocsUrl);
  const tocs = await tocsService.fetchDataFromSource(tocID);

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

    // decorate TOC DOM
    div.innerHTML = html;
    block.append(div);
    block.parentElement.setAttribute('theme-color', themeColor);
    block.classList.add(productName.replace(/\s/g, ''));
    const ul = document.createElement('ul');
    ul.id = 'product';
    const li = document.createElement('li');
    li.innerHTML = `<span class="product-icon"></span><h3>${productName}</h3>`;
    ul.append(li);
    block.prepend(ul);
    const parentUL = block.querySelector('.toc > div > ul');
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
    const targetElement = block.querySelector(`a[href="${currentURL}"]`);
    if (targetElement) {
      targetElement.classList.add('is-active');
    }

    // Toggle functionality for TOC Block
    const toggleElements = block.querySelectorAll('.js-toggle');
    if (toggleElements) {
      toggleElements.forEach((toggleElement) => {
        const subMenu = toggleElement.parentElement.querySelector('ul');
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
