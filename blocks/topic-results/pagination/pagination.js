import { htmlToElement } from '../../../scripts/scripts.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';

/**
 * Initializes and renders pagination controls according to the XD design.
 * @param {number} totalItems - The total number of items to paginate.
 * @param {number} itemsPerPage - The number of items per page.
 * @param {Function} onPageChange - Callback function to execute when the page changes.
 */
export function initPagination(totalItems, itemsPerPage, onPageChange) {
  // Load the CSS for the pagination component
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/pagination/pagination.css`);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  let currentPage = 1;
  const container = document.createElement('div');
  container.className = 'pagination-container';

  // Define a function to add an event listener to a page item
  function addPageItemEventListener(pageItem, pageNum, updatePaginationDisplay) {
    pageItem.querySelector('button').addEventListener('click', () => {
      // Update the currentPage with the pageNum passed to this function
      currentPage = pageNum;
      onPageChange(currentPage);
      updatePaginationDisplay();
    });
  }

  /**
   * Updates the pagination display based on the current page.
   * This function clears the existing pagination controls and recreates them.
   */
  const updatePaginationDisplay = () => {
    container.innerHTML = '';

    // Create and append the 'Previous' button
    const prevItem = htmlToElement(`
      <li class="pagination__item pagination__item--prev ${currentPage === 1 ? 'disabled' : ''}">
        <button class="pagination__link" aria-label="Previous">Previous</button>
      </li>
    `);
    prevItem.querySelector('button').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        onPageChange(currentPage);
        updatePaginationDisplay();
      }
    });
    container.appendChild(prevItem);

    // Create and append page number buttons
    for (let i = 1; i <= totalPages; i += 1) {
      const pageItem = htmlToElement(`
          <li class="pagination__item ${i === currentPage ? 'pagination__item--active' : ''}">
            <button class="pagination__link" aria-label="Page ${i}">${i}</button>
          </li>
        `);
      // Call the new function instead of creating a function inside the loop
      addPageItemEventListener(pageItem, i, onPageChange, updatePaginationDisplay);
      container.appendChild(pageItem);
    }

    // Create and append the 'Next' button
    const nextItem = htmlToElement(`
        <li class="pagination__item pagination__item--next ${currentPage === totalPages ? 'disabled' : ''}">
          <button class="pagination__link" aria-label="Next">Next</button>
        </li>
      `);
    nextItem.querySelector('button').addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        onPageChange(currentPage);
        updatePaginationDisplay();
      }
    });
    container.appendChild(nextItem);
  };

  // Select the main content section of the page for appending the pagination
  const mainDoc = document.querySelector('main > div.content-section-last');
  if (mainDoc) {
    mainDoc.appendChild(container);
  }

  updatePaginationDisplay();
}

export default initPagination;
