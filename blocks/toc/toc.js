import { getMetadata, fetchPlaceholders } from '../../scripts/lib-franklin.js';

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
  viewLessDiv.innerHTML = `<span class="viewLessLink" style="display:none"> ${placeholders.viewLess}</span>`;
  targetUL.append(viewLessDiv);

  // Check if there are less than 11 items, and hide the "View More" link accordingly
  const liElements = targetUL.children;
  if (liElements && liElements.length <= 5) {
    // Adjust the condition to 5
    setLinkVisibility(viewMoreDiv, '.viewMoreLink', false);
  }

  // Event listeners for "View More" and "View Less" links
  viewMoreDiv.addEventListener('click', () => handleViewMoreClick(targetUL, viewMoreDiv, viewLessDiv));
  viewLessDiv.addEventListener('click', () => handleViewLessClick(targetUL, viewMoreDiv, viewLessDiv));
}

// Utility function for http call
const getHTMLData = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    const responseData = await response.text();
    return responseData;
  }
  throw new Error(`${url} not found`);
};

/**
 * loads and decorates the toc
 * @param {Element} block The toc block element
 */
export default async function decorate(block) {
  // fetch toc content
  const tocPath = block.querySelector('.toc a').href;
  const tocFragment = `${tocPath}.plain.html`;
  const resp = await getHTMLData(tocFragment);
  if (resp) {
    const html = resp;
    const productName = getMetadata('original-solution');
    const themeColor = getMetadata('theme-color');

    // decorate TOC DOM
    block.innerHTML = html;
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

    // Toggle functionality for toc
    const anchors = block.querySelectorAll('.toc a');
    anchors.forEach((anchor) => {
      if (anchor.getAttribute('href').startsWith('#')) {
        anchor.classList.add('js-toggle');
        // View more and view less
        const targetUL = anchor.parentElement.parentElement.querySelector('ul');
        viewMoreviewLess(targetUL);
      }
    });

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
    // Add is-active class to the highlighted section
    const currentURL = window.location.pathname;
    const targetElement = block.querySelector(`a[href="${currentURL}.html?lang=en"]`);
    if (targetElement) {
      targetElement.classList.add('is-active');
    }
  }
}
