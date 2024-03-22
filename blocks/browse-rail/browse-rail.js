import ffetch from '../../scripts/ffetch.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import { filterSubPages, convertToMultiMap, convertToULList, sortFirstLevelList } from './browse-rail-utils.js';
import { getEDSLink, getLink, getPathDetails, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';

const { browseMoreProductsLink } = getConfig();

/**
 * Helper function thats returns a list of all products
 * - below <lang>/browse/<product-page>
 * - To get added, the product page must be published
 * - Product pages listed in <lang>/browse/top-products are put at the the top
 *   in the order they appear in top-products
 * - the top product list can point to sub product pages
 */
export async function getProducts() {
  // get language
  const { lang } = getPathDetails();
  // load the <lang>/top-product list
  const Products = await ffetch(`/${lang}/top-products.json`).all();
  // get all indexed pages below <lang>/browse
  const publishedPages = await ffetch(`/${lang}/browse-index.json`).all();
  let featured = true;

  // add all published top products to final list
  const finalProducts = Products.filter((product) => {
    // if separator is reached
    if (product.path.startsWith('-')) {
      featured = false;
      return false;
    }

    // check if product is in published list
    const found = publishedPages.find((elem) => elem.path === product.path);
    if (found) {
      // keep original title if no nav title is set
      if (!product.title) product.title = found.title;
      // set featured flag
      product.featured = featured;
      // remove it from publishedProducts list
      publishedPages.splice(publishedPages.indexOf(found), 1);
      return true;
    }
    return false;
  });

  // if no separator was found , add the remaining products alphabetically
  if (featured) {
    // for the rest only keep main product pages (<lang>/browse/<main-product-page>)
    const publishedMainProducts = publishedPages
      .filter((page) => page.path.split('/').length === 4)
      // sort alphabetically
      .sort((productA, productB) => productA.path.localeCompare(productB.path));
    // append remaining published products to final list
    finalProducts.push(...publishedMainProducts);
  }

  return finalProducts;
}

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
  const directLeafNodes = jsonData.filter(
    (item) =>
      item.path.startsWith(currentPage) &&
      item.path !== currentPage &&
      !item.path.substring(currentPage.length + 1).includes('/'),
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

// Function to handle "View Less" click
function handleViewLessClick(block, numFeaturedProducts) {
  const itemList = block.querySelectorAll('.products > li > ul > li');
  toggleItemVisibility(itemList, numFeaturedProducts, false);
  setLinkVisibility(block, '.viewMoreLink', true);
  setLinkVisibility(block, '.viewLessLink', false);
}

async function displayAllProducts(block, placeholders) {
  const productList = await getProducts();

  if (productList.length > 0) {
    const productsUL = document.createElement('ul');
    productsUL.classList.add('products');
    const productsLI = document.createElement('li');
    productsLI.innerHTML = `<span>${placeholders.products}</span><span class="js-toggle"></span>`;

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
      viewMoreLI.innerHTML = `<span class="viewMoreLink"> + ${placeholders.viewMore}</span>`;
      ul.append(viewMoreLI);

      const viewLessLI = document.createElement('li');
      viewLessLI.classList.add('left-rail-view-less', 'view-more-less');
      viewLessLI.innerHTML = `<span class="viewLessLink" style="display: none;"> - ${placeholders.viewLess}</span>`;
      ul.append(viewLessLI);

      // Event listeners for "View More" and "View Less" links
      block
        .querySelector('.viewMoreLink')
        .addEventListener('click', () => handleViewMoreClick(block, numFeaturedProducts));
      block
        .querySelector('.viewLessLink')
        .addEventListener('click', () => handleViewLessClick(block, numFeaturedProducts));
    }
  }
}

async function displayProductNav(block, currentPagePath, results, placeholders) {
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
    const subPagesBrowseByLinkText = `${placeholders.all} ${parentPageTitle} ${placeholders.content}`;
    block.querySelector(
      '.browse-by > li',
    ).innerHTML = `<span>${placeholders.browseBy}</span><ul><li><a href="${pagePath}">${subPagesBrowseByLinkText}</a></li></ul>`;

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
      await displayAllProducts(block, placeholders);
    }
  }
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

  const label = getMetadata('og:title');
  const placeholders = await fetchLanguagePlaceholders();
  const results = await ffetch(`/${getPathDetails().lang}/browse-index.json`).all();
  const currentPagePath = getEDSLink(window.location.pathname);

  // For Browse All Page
  if (theme === 'browse-all') {
    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    browseByLI.innerHTML = `<span>${placeholders.browseBy}</span><ul><li><span class="is-active">${placeholders.browseAllContent}</span></li></ul>`;
    browseByUL.append(browseByLI);
    block.append(browseByUL);
    // Show All Products
    if (manualNav) {
      displayManualNav(manualNav, block);
    } else {
      await displayAllProducts(block, placeholders);
    }
  }

  // For Browse Product Pages
  if (theme !== 'browse-all') {
    // Add "Browse more products" link
    const browseMoreProducts = document.createElement('div');
    browseMoreProducts.classList.add('browse-more-products');
    browseMoreProducts.innerHTML = `<a href="${browseMoreProductsLink}">${placeholders.browseMoreProducts}</a>`;
    block.append(browseMoreProducts);

    // Browse By
    const browseByUL = document.createElement('ul');
    browseByUL.classList.add('browse-by');
    const browseByLI = document.createElement('li');
    const browseByLinkText = `${placeholders.all} ${label} ${placeholders.content}`;
    browseByLI.innerHTML = `<span>${placeholders.browseBy}</span><ul><li><span class="is-active">${browseByLinkText}</span></li></ul>`;
    browseByUL.append(browseByLI);
    block.append(browseByUL);

    // For Products and sub-pages
    if (manualNav) {
      displayManualNav(manualNav, block);
    } else {
      // dynamically create sub page nav or if empty show products list
      await displayProductNav(block, currentPagePath, results, placeholders);
    }
  }

  // Toggle functionality for products/sub-pages
  const toggleElements = block.querySelectorAll('.js-toggle');
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
