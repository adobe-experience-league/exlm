import ffetch from '../../scripts/ffetch.js';
import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';

const placeholders = await fetchPlaceholders();

// Function to check if the element is visible on page.
function isVisible(element) {
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

// Function to create dynamic list items
function createListItem(item) {
  const li = document.createElement('li');
  li.innerHTML = `<a href="${item.path}">${item.title}</a>`;
  return li;
}

// Function to toggle visibility of items
function toggleItemVisibility(itemList, startIndex, show) {
  // eslint-disable-next-line no-plusplus
  for (let i = startIndex; i < itemList.length; i++) {
    itemList[i].classList.toggle('hidden', !show);
  }
}

// Function to set link visibility
function setLinkVisibility(linkId, show) {
  const linkElement = document.getElementById(linkId);
  if (linkElement) {
    linkElement.style.display = show ? 'block' : 'none';
  }
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

// Function to check if current page has sub-pages
function hasDirectLeafNodes(jsonData, currentPage) {
  const directLeafNodes = jsonData.filter(
    (item) =>
      item.path.startsWith(currentPage) &&
      item.path !== currentPage &&
      !item.path.substring(currentPage.length + 1).includes('/'),
  );

  return directLeafNodes.length > 0;
}

function getPathUntilLevel(originalUrl, levels) {
  const pathSegments = originalUrl.split('/');
  const resultPath = pathSegments.slice(0, levels + 1).join('/');
  return resultPath;
}

// Function to filter sub-pages under a given path
const filterSubPages = (data, basePath) =>
  data.filter((page) => page.path.startsWith(basePath) && page.path !== basePath);

// Function to build a multi-map from the filtered sub-pages
function convertToMultiMap(jsonData, page) {
  const multiMap = new Map();

  jsonData.forEach((item) => {
    const pathSegments = item.path.split('/').filter((segment) => segment !== '');
    const category = pathSegments[pathSegments.indexOf(page) + 1];
    if (!multiMap.has(category)) {
      multiMap.set(category, []);
    }
    if (category !== item.title) {
      multiMap.get(category).push(item);
    }
  });
  return multiMap;
}

// Function to convert multi-map to nested list
function convertToULList(multiMap) {
  const ulList = document.createElement('ul');
  ulList.classList.add('subPages');
  multiMap.forEach((value) => {
    const liItem = document.createElement('li');
    const anchor = document.createElement('a');
    if (value.length > 0) {
      anchor.href = value[0].path;
      anchor.textContent = value[0].title;

      liItem.appendChild(anchor);
    }
    if (value.length > 1) {
      const subUlList = document.createElement('ul');
      liItem.classList.add('hasSubPages');
      value.slice(1).forEach((item) => {
        const subLiItem = document.createElement('li');
        const subAnchor = document.createElement('a');
        subAnchor.href = item.path;
        subAnchor.textContent = item.title;

        subLiItem.appendChild(subAnchor);
        subUlList.appendChild(subLiItem);
      });

      liItem.appendChild(subUlList);
    }
    ulList.appendChild(liItem);
  });

  return ulList;
}

export default async function decorate(block) {
  const theme = getMetadata('theme');
  const label = getMetadata('og:title');

  const results = await ffetch('/browse-index.json').all();
  const currentPagePath = window.location.pathname;

  // For Browse All Page
  if (theme === 'browse-all') {
    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    const browseByLinkText = `${label} content`;
    browseByLI.innerHTML = `<a href="#">${placeholders.browseBy}</a><ul><li><a href="#" class="is-active">${browseByLinkText}</a></li></ul>`;
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
      productsLI.innerHTML = `<a href="#">${placeholders.products}</a>`;

      const ul = document.createElement('ul');
      const sortedResults = directChildNodes.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return titleA.localeCompare(titleB);
      });

      Object.values(sortedResults).forEach((item) => {
        const li = createListItem(item);
        ul.appendChild(li);
      });

      productsLI.append(ul);
      productsUL.append(productsLI);

      block.append(productsUL);
      // Check if there are less than 12 items, and hide the "View More" link accordingly
      if (ul.children.length <= 12) {
        document.getElementById('viewMoreLink').style.display = 'none';
      }

      toggleItemVisibility(ul.children, 12, false);

      // "View More" and "View Less" links
      const viewMoreDiv = document.createElement('div');
      viewMoreDiv.innerHTML = `<a id="viewMoreLink">${placeholders.viewMore}</a>`;
      block.append(viewMoreDiv);

      const viewLessDiv = document.createElement('div');
      viewLessDiv.innerHTML = `<a id="viewLessLink" style="display: none;">${placeholders.viewLess}</a>`;
      block.append(viewLessDiv);

      // Event listeners for "View More" and "View Less" links
      document.getElementById('viewMoreLink').addEventListener('click', handleViewMoreClick);
      document.getElementById('viewLessLink').addEventListener('click', handleViewLessClick);
    }
  }

  // For Browse Product Page
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
    const browseByLinkText = `All ${label} Content`;
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
      document.querySelector(
        '.browse-by > li',
      ).innerHTML = `<a href="#">${placeholders.browseBy}</a><ul><li><a href="${pagePath}">${parts[3]}</a></li></ul>`;
      // document.querySelector('.topics > li').innerHTML = `<a href="#">${parts[3]} ${placeholders.topics}</a>`;
    } else {
      // Product page
      const result = hasDirectLeafNodes(results, currentPagePath);
      if (result) {
        const subPages = filterSubPages(results, currentPagePath);
        const resultMultiMap = convertToMultiMap(subPages, currentPagePath.split('/')[3]);
        const htmlList = convertToULList(resultMultiMap);
        block.appendChild(htmlList);
      }
    }

    // Topics
    const browseTopicsContainer = document.querySelector('.browse-topics-container');
    if (browseTopicsContainer !== null) {
      const ulElement = document.createElement('ul');
      // Get all the topic elements inside the container
      const topicElements = browseTopicsContainer.querySelectorAll('.browse-topics.topic');
      if (topicElements.length > 0) {
        // Loop through each topic element and create a li element for each
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
        topicsLI.innerHTML = `<a href="#">${label} ${placeholders.topics}</a>`;
        topicsLI.append(ulElement);
        topicsUL.append(topicsLI);
        block.append(topicsUL);
      }
    }
  }
}
