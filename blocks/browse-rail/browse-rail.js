import ffetch from '../../scripts/ffetch.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import { filterSubPages, convertToMultiMap, convertToULList, sortFirstLevelList } from './browse-rail-utils.js';
import {
  getEDSLink,
  getLink,
  getPathDetails,
  getConfig,
  createPlaceholderSpan,
  htmlToElement,
} from '../../scripts/scripts.js';
import getProducts from '../../scripts/utils/product-utils.js';

const { browseMoreProductsLink } = getConfig();

const unwrapSpan = (span) => span.replaceWith(span.textContent);

// Utility function to toggle visibility of items
function toggleItemVisibility(itemList, startIndex, show) {
  // eslint-disable-next-line no-plusplus
  for (let i = startIndex; i < itemList.length; i++) {
    if (!itemList[i].classList.contains('view-more-less')) {
      itemList[i].classList.toggle('hidden', !show);
    }
  }
}

// Utility function to set link visibility
function setLinkVisibility(block, linkClass, show) {
  const linkElement = block.querySelector(linkClass);
  if (linkElement) {
    linkElement.style.display = show ? 'block' : 'none';
  }
}

// Function to check if current page has sub-pages
function hasDirectLeafNodes(jsonData, currentPage) {
  const prefix = `${currentPage}/`;
  const directLeafNodes = jsonData.filter(
    (item) => item.path.startsWith(prefix) && !item.path.slice(prefix.length).includes('/'),
  );
  return directLeafNodes.length > 0;
}

// Utility Function to get the page path until a specific level
function getPathUntilLevel(originalUrl, levels) {
  const pathSegments = originalUrl.split('/');
  const resultPath = pathSegments.slice(0, levels + 1).join('/');
  return resultPath;
}

// Function to handle "View More" click
function handleViewMoreClick(block, numFeaturedProducts) {
  const itemList = block.querySelectorAll('.products > li > ul > li');
  toggleItemVisibility(itemList, numFeaturedProducts, true);
  setLinkVisibility(block, '.viewMoreLink', false);
  setLinkVisibility(block, '.viewLessLink', true);
}

// Function to handle Toggle functionality for products/sub-pages
function handleToggleClick(block) {
  const toggleElements = block.querySelectorAll('.js-toggle:not(.expanded)');
  if (toggleElements) {
    toggleElements.forEach((toggleElement) => {
      const subMenu = toggleElement.parentElement.querySelector('ul');
      toggleElement.classList.add('expanded');
      toggleElement.addEventListener('click', (event) => {
        event.preventDefault();
        subMenu.style.display = subMenu.style.display === 'block' || subMenu.style.display === '' ? 'none' : 'block';
        toggleElement.classList.toggle('collapsed', subMenu.style.display === 'none');
        toggleElement.classList.toggle('expanded', subMenu.style.display === 'block');
      });
    });
  }
}

// Function to handle "View Less" click
function handleViewLessClick(block, numFeaturedProducts) {
  const itemList = block.querySelectorAll('.products > li > ul > li');
  toggleItemVisibility(itemList, numFeaturedProducts, false);
  setLinkVisibility(block, '.viewMoreLink', true);
  setLinkVisibility(block, '.viewLessLink', false);
}

async function displayAllProducts(block) {
  const { lang } = getPathDetails();
  const productList = await getProducts(lang);

  if (productList.length > 0) {
    const productsUL = document.createElement('ul');
    productsUL.classList.add('products');
    const productsLI = document.createElement('li');
    const productsPlaceholder = createPlaceholderSpan('products', 'Products');
    productsLI.appendChild(productsPlaceholder);
    productsLI.appendChild(htmlToElement('</span><span class="js-toggle"></span>'));

    const ul = document.createElement('ul');
    let otherProductFirstItem = false;
    productList.forEach((item) => {
      const li = document.createElement('li');
      if (!item.featured && !otherProductFirstItem) {
        li.classList.add('other-product-first-item');
        otherProductFirstItem = true;
      }
      li.innerHTML = `<a href="${getLink(item.path)}">${item.title}</a>`;
      ul.appendChild(li);
    });

    productsLI.append(ul);
    productsUL.append(productsLI);
    block.append(productsUL);

    // get number of featured products
    const numFeaturedProducts = productList.filter((elem) => elem.featured).length;
    toggleItemVisibility(ul.children, numFeaturedProducts, false);

    // "View More" and "View Less" links
    if (ul.children.length > numFeaturedProducts) {
      const viewMoreLI = document.createElement('li');
      viewMoreLI.classList.add('left-rail-view-more', 'view-more-less');
      const viewMoreSpan = createPlaceholderSpan('viewMore', '+ View More', (span) => {
        span.textContent = `+ ${span.textContent}`;
      });
      viewMoreSpan.classList.add('viewMoreLink');
      viewMoreLI.appendChild(viewMoreSpan);
      ul.append(viewMoreLI);

      const viewLessLI = document.createElement('li');
      viewLessLI.classList.add('left-rail-view-less', 'view-more-less');
      const viewLessSpan = createPlaceholderSpan('viewLess', '- View Less', (span) => {
        span.textContent = `- ${span.textContent}`;
      });
      viewLessSpan.classList.add('viewLessLink');
      viewLessSpan.style.display = 'none';
      viewLessLI.appendChild(viewLessSpan);
      ul.append(viewLessLI);

      // Event listeners for "View More" and "View Less" links
      block
        .querySelector('.viewMoreLink')
        .addEventListener('click', () => handleViewMoreClick(block, numFeaturedProducts));
      block
        .querySelector('.viewLessLink')
        .addEventListener('click', () => handleViewLessClick(block, numFeaturedProducts));
    }

    // Event listener for toggle
    handleToggleClick(block);
  }
}

/**
 *
 * @param {HTMLElement} block
 * @param {string} currentPagePath
 * @param {*} results
 */
async function displayProductNav(block, currentPagePath, results) {
  // Find the parent page for product sub-pages
  const parentPage = results.find((page) => page.path === getPathUntilLevel(currentPagePath, 3));
  let parentPageTitle = '';
  // Display path and title of the parent page
  if (parentPage) {
    parentPageTitle = parentPage.title;
  }

  const parts = currentPagePath.split('/');
  // Product sub page
  if (parts.length >= 5 && parts[3] === currentPagePath.split('/')[3]) {
    const pagePath = getPathUntilLevel(currentPagePath, 3);
    const subPages = filterSubPages(results, pagePath);
    const resultMultiMap = convertToMultiMap(subPages, currentPagePath.split('/')[3]);
    const htmlList = convertToULList(resultMultiMap);
    block.appendChild(htmlList);
    sortFirstLevelList('.subPages');

    // const subPagesBrowseByLinkText = `${placeholders.all} ${parentPageTitle} ${placeholders.content}`;
    // block.querySelector(
    //   '.browse-by > li',
    // ).innerHTML = `<ul><li><a href="${pagePath}">${subPagesBrowseByLinkText}</a></li></ul>`;

    const browseByLi = block.querySelector('.browse-by > li');
    browseByLi.innerHTML = '';
    const browseBySpan = createPlaceholderSpan('browseBy', 'Browse By');
    browseByLi.append(browseBySpan);

    const ul = document.createElement('ul');
    const li = document.createElement('li');
    ul.append(li);

    const link = document.createElement('a');
    link.setAttribute('href', pagePath);

    const span = document.createElement('span');
    span.appendChild(createPlaceholderSpan('all', 'All', unwrapSpan, unwrapSpan));
    span.appendChild(document.createTextNode(` ${parentPageTitle} `));
    span.appendChild(createPlaceholderSpan('content', 'Content', unwrapSpan, unwrapSpan));
    link.appendChild(span);

    li.append(link);

    browseByLi.append(ul);

    // Hightlight the current page title in the left rail
    const targetElement = block.querySelector(`[href="${currentPagePath}"]`);
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
    } else {
      // In case of no sub-pages, show all products
      await displayAllProducts(block);
    }
  }

  // Event listener for toggle
  handleToggleClick(block);
}

function displayManualNav(manualNav, block) {
  // get root ul
  const rootUL = manualNav.querySelector('ul');
  rootUL.classList.add('subPages');

  // every li entry that is not a link gets a span
  [...rootUL.querySelectorAll('li')]
    .filter((li) => li.firstChild.nodeName === '#text')
    .forEach((li) => {
      const span = document.createElement('span');
      span.appendChild(li.firstChild);
      li.insertBefore(span, li.firstChild);
    });

  // set class for li with sub pages, add collapse icon
  [...rootUL.querySelectorAll('li')]
    .filter((li) => li.querySelector('ul'))
    .forEach((li) => {
      li.classList.add('hasSubPages');
      const toggleIcon = document.createElement('span');
      toggleIcon.classList.add('js-toggle');
      li.querySelector('ul').before(toggleIcon);
    });

  // add manual nav to rail
  block.append(rootUL);
}

// Main function to decorate the block
export default async function decorate(block) {
  // get any defined manual navigation
  const [manualNav] = block.querySelectorAll(':scope div > div');

  // to avoid dublication when editing
  block.textContent = '';

  const theme = getMetadata('theme');

  // For Browse All Page
  if (theme === 'browse-all') {
    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    const browseBySpan = createPlaceholderSpan('browseBy', 'Browse By');
    const browseAllContentSpan = createPlaceholderSpan('browseAllContent', 'Browse All Content');
    browseAllContentSpan.classList.add('is-active');
    const ul = document.createElement('ul');
    const li = document.createElement('li');
    ul.append(li);
    li.append(browseAllContentSpan);

    browseByLI.appendChild(browseBySpan);
    browseByLI.appendChild(ul);
    browseByUL.append(browseByLI);
    block.append(browseByUL);
    // Show All Products
    if (manualNav) {
      displayManualNav(manualNav, block);
    } else {
      displayAllProducts(block);
    }
  }

  // For Browse Product Pages
  if (theme !== 'browse-all') {
    const results = await ffetch(`/${getPathDetails().lang}/browse-index.json`).all();
    const currentPagePath = getEDSLink(window.location.pathname);
    const label = getMetadata('og:title');
    // Add "Browse more products" link
    const browseMoreProducts = document.createElement('div');
    browseMoreProducts.classList.add('browse-more-products');
    const browseMoreProductsSpan = createPlaceholderSpan('browseMoreProducts', 'Browse more products');
    const link = document.createElement('a');
    link.setAttribute('href', browseMoreProductsLink);
    link.appendChild(browseMoreProductsSpan);
    browseMoreProducts.appendChild(link);
    block.append(browseMoreProducts);

    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');

    const browseBySpan = createPlaceholderSpan('browseBy', 'Browse By');
    browseByLI.append(browseBySpan);
    browseByUL.append(browseByLI);

    const ul = document.createElement('ul');
    const li = document.createElement('li');

    const activeSpan = document.createElement('span');
    activeSpan.classList.add('is-active');
    activeSpan.append(createPlaceholderSpan('all', 'All', unwrapSpan, unwrapSpan));
    activeSpan.append(` ${label} `);
    activeSpan.append(createPlaceholderSpan('content', 'Content', unwrapSpan, unwrapSpan));

    ul.append(li);
    li.append(activeSpan);
    browseByLI.append(ul);

    block.append(browseByUL);

    // For Products and sub-pages
    if (manualNav) {
      displayManualNav(manualNav, block);
    } else {
      // dynamically create sub page nav or if empty show products list
      await displayProductNav(block, currentPagePath, results);
    }
  }
  handleToggleClick(block);
}
