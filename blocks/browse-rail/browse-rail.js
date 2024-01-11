import ffetch from '../../scripts/ffetch.js';
import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';
import {
  isVisible,
  createListItem,
  toggleItemVisibility,
  setLinkVisibility,
  hasDirectLeafNodes,
  getPathUntilLevel,
  filterSubPages,
  convertToMultiMap,
  convertToULList,
  sortFirstLevelList,
} from './browse-rail-utils.js';

let placeholders = {};
try {
  placeholders = await fetchPlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

// Function to handle "View More" click
function handleViewMoreClick() {
  const itemList = document.querySelectorAll('.products > li > ul > li');
  toggleItemVisibility(itemList, 12, true);
  setLinkVisibility('viewMoreLink', false);
  setLinkVisibility('viewLessLink', true);
}

// Function to handle "View Less" click
function handleViewLessClick() {
  const itemList = document.querySelectorAll('.products > li > ul > li');
  toggleItemVisibility(itemList, 12, false);
  setLinkVisibility('viewMoreLink', true);
  setLinkVisibility('viewLessLink', false);
}

// Main function to decorate the block
export default async function decorate(block) {
  const theme = getMetadata('theme');
  const label = getMetadata('og:title');

  const results = await ffetch('/browse-index.json').all();
  const currentPagePath = window.location.pathname;
  // Find the parent page for product sub-pages
  const parentPage = results.find((page) => page.path === getPathUntilLevel(currentPagePath, 3));
  let parentPageTitle = '';
  let parentPagePath = '';
  // Display path and title of the parent page
  if (parentPage) {
    parentPageTitle = parentPage.title;
    parentPagePath = parentPage.path;
  }

  // For Browse All Page
  if (theme === 'browse-all') {
    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    browseByLI.innerHTML = `<a href="#">${placeholders.browseBy}</a><ul><li><a href="#" class="is-active">${placeholders.browseAllContent}</a></li></ul>`;
    browseByUL.append(browseByLI);
    block.append(browseByUL);

    // Products
    const directChildNodes = results.filter((item) => {
      const pathParts = item.path.split('/');
      return pathParts.length === 4 && pathParts[2] === currentPagePath.split('/')[2];
    });

    if (directChildNodes.length > 0) {
      const productsUL = document.createElement('ul');
      productsUL.classList.add('products');
      const productsLI = document.createElement('li');
      productsLI.innerHTML = `<a href="#">${placeholders.products}</a><span class="js-toggle"></span>`;

      const ul = document.createElement('ul');
      const sortedResults = directChildNodes.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return titleA.localeCompare(titleB);
      });

      sortedResults.forEach((item) => {
        const li = createListItem(item);
        ul.appendChild(li);
      });

      productsLI.append(ul);
      productsUL.append(productsLI);
      block.append(productsUL);

      // Check if there are less than 12 items, and hide the "View More" link accordingly
      const liElements = ul.getElementsByTagName('li');
      if (liElements && liElements.length <= 12) {
        document.getElementById('viewMoreLink').style.display = 'none';
      }

      toggleItemVisibility(ul.children, 12, false);

      // "View More" and "View Less" links
      const viewMoreDiv = document.createElement('div');
      viewMoreDiv.classList.add('left-rail-view-more');
      viewMoreDiv.innerHTML = `<a id="viewMoreLink"> + ${placeholders.viewMore}</a>`;
      ul.append(viewMoreDiv);

      const viewLessDiv = document.createElement('div');
      viewLessDiv.classList.add('left-rail-view-less');
      viewLessDiv.innerHTML = `<a id="viewLessLink" style="display: none;"> - ${placeholders.viewLess}</a>`;
      ul.append(viewLessDiv);

      // Event listeners for "View More" and "View Less" links
      document.getElementById('viewMoreLink').addEventListener('click', handleViewMoreClick);
      document.getElementById('viewLessLink').addEventListener('click', handleViewLessClick);
    }
  }

  // For Browse Product Pages
  if (theme !== 'browse-all') {
    // Add "Browse more products" link
    const browseMoreProducts = document.createElement('div');
    browseMoreProducts.classList.add('browse-more-products');
    browseMoreProducts.innerHTML = `<a href="/en/browse">${placeholders.browseMoreProducts}</a>`;
    block.append(browseMoreProducts);

    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    const browseByLinkText = `${placeholders.all} ${label} ${placeholders.content}`;
    browseByLI.innerHTML = `<a href="#">${placeholders.browseBy}</a><ul><li><a href="#" class="is-active">${browseByLinkText}</a></li></ul>`;
    browseByUL.append(browseByLI);
    block.append(browseByUL);

    // For Products and sub-pages
    const parts = currentPagePath.split('/');
    // Product sub page
    if (parts.length >= 5 && parts[3] === currentPagePath.split('/')[3]) {
      const pagePath = getPathUntilLevel(currentPagePath, 3);
      const subPages = filterSubPages(results, pagePath);
      const resultMultiMap = convertToMultiMap(subPages, currentPagePath.split('/')[3]);
      const htmlList = convertToULList(resultMultiMap);
      block.appendChild(htmlList);
      sortFirstLevelList('.subPages');
      const browseByLinkText = `${placeholders.all} ${parentPageTitle} ${placeholders.content}`;
      document.querySelector(
        '.browse-by > li',
      ).innerHTML = `<a href="#">${placeholders.browseBy}</a><ul><li><a href="${parentPagePath}">${browseByLinkText}</a></li></ul>`;

      // Hightlight the current page title in the left rail
      const targetElement = document.querySelector(`[href="${currentPagePath}"]`);
      if (targetElement) {
        targetElement.classList.add('is-active');
      }
    } else {
      // Product page
      const result = hasDirectLeafNodes(results, currentPagePath);
      if (result) {
        const subPages = filterSubPages(results, currentPagePath);
        const resultMultiMap = convertToMultiMap(subPages, currentPagePath.split('/')[3]);
        const htmlList = convertToULList(resultMultiMap);

        block.appendChild(htmlList);
        sortFirstLevelList('.subPages');
      }
    }

    // Topics
    const browseTopicsContainer = document.querySelector('.browse-topics-container');
    if (browseTopicsContainer !== null) {
      const ulElement = document.createElement('ul');
      // Get all the topic elements inside the container
      const topicElements = browseTopicsContainer.querySelectorAll('.browse-topics.topic');
      if (topicElements.length > 0) {
        topicElements.forEach((topicElement) => {
          if (isVisible(topicElement)) {
            const liElement = document.createElement('li');
            liElement.innerHTML = `<a href="#">${topicElement.textContent}</a>`;
            ulElement.appendChild(liElement);
          }
        });

        const topicsUL = document.createElement('ul');
        topicsUL.classList.add('topics');
        const topicsLI = document.createElement('li');
        // Topics heading for product sub-pages
        if (parts.length >= 5 && parts[3] === currentPagePath.split('/')[3]) {
          topicsLI.innerHTML = `<a href="#">${parentPageTitle} ${placeholders.topics}</a><span class="js-toggle"></span>`;
        } else {
          topicsLI.innerHTML = `<a href="#">${label} ${placeholders.topics}</a><span class="js-toggle"></span>`;
        }
        topicsLI.append(ulElement);
        topicsUL.append(topicsLI);
        block.append(topicsUL);
      }
    }
  }
  // Toggle functionality for products/sub-pages/topics
  const toggleElements = document.querySelectorAll('.js-toggle');
  block.querySelector('.js-toggle').classList.add('expanded');
  toggleElements.forEach((toggleElement) => {
    const subMenu = toggleElement.parentElement.querySelector('ul');

    toggleElement.addEventListener('click', (event) => {
      event.preventDefault();
      subMenu.style.display = subMenu.style.display === 'block' || subMenu.style.display === '' ? 'none' : 'block';
      toggleElement.classList.toggle('collapsed', subMenu.style.display === 'none');
      toggleElement.classList.toggle('expanded', subMenu.style.display === 'block');
    });
  });
}
