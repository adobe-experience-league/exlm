import { getLastDocsSection, htmlToElement } from '../../../scripts/scripts.js';
import { loadCSS } from '../../../scripts/lib-franklin.js';

let currentPage = 0;
const maxVisiblePages = 5;

function getTotalPages(totalItems, itemsPerPage) {
  return Math.min(Math.ceil(totalItems / itemsPerPage), 100);
}

/**
 * Creates a page number button.
 * @param {number} pageNum - The page number.
 * @param {boolean} isActive - Whether this page is currently active.
 * @returns {HTMLElement} The created button element.
 */
function createPageButton(pageNum, isActive) {
  return htmlToElement(`
    <li class="pagination-item ${isActive ? 'pagination-item-active' : ''}">
      <input type="button" class="pagination-link pagination-num" value="${pageNum}" aria-label="Page ${pageNum}">
    </li>
  `);
}

/**
 * Creates the previous or next button.
 * @param {string} type - Either 'prev' or 'next'.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 * @returns {HTMLElement} The created button element.
 */
function createNavButton(type, isDisabled) {
  const label = type === 'prev' ? 'Previous' : 'Next';
  return htmlToElement(`
    <li class="pagination-item pagination-item-${type} ${isDisabled ? 'disabled' : ''}">
      <input type="button" class="pagination-link" value="${label}" aria-label="${label}">
    </li>
  `);
}

/**
 * Calculates the range of pages to display.
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {number} maxVisiblePages - The maximum number of visible page buttons.
 * @returns {[number, number]} The start and end page numbers to display.
 */
function calculatePageRange(totalItems, itemsPerPage) {
  const totalPages = getTotalPages(totalItems, itemsPerPage);
  let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  return [startPage, endPage];
}

function updatePaginationDisplay(container, totalItems, itemsPerPage) {
  const totalPages = getTotalPages(totalItems, itemsPerPage);
  container.innerHTML = '';

  const prevButton = createNavButton('prev', currentPage === 0);
  container.appendChild(prevButton);

  const [startPage, endPage] = calculatePageRange(totalItems, itemsPerPage);

  for (let i = startPage; i <= endPage; i += 1) {
    const pageButton = createPageButton(i, i === currentPage + 1);
    container.appendChild(pageButton);
  }

  const nextButton = createNavButton('next', currentPage >= totalPages - 1);
  container.appendChild(nextButton);
}

function handlePageChange(newPage, onPageChange, totalItems, itemsPerPage) {
  const totalPages = getTotalPages(totalItems, itemsPerPage);
  if (newPage >= 0 && newPage <= totalPages) {
    currentPage = newPage;
    onPageChange(currentPage);
    updatePaginationDisplay(document.querySelector('.pagination-container'), totalItems, itemsPerPage);
  }
}

/**
 * Initializes and renders pagination controls.
 * @param {number} totalItems - The total number of items to paginate.
 * @param {number} itemsPerPage - The number of items per page.
 * @param {Function} onPageChange - Callback function to execute when the page changes.
 */
export function initPagination(totalItems, itemsPerPage, onPageChange) {
  loadCSS(`${window.hlx.codeBasePath}../blocks/topic-results/pagination/pagination.css`);

  currentPage = 0;

  let container = document.querySelector('.pagination-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'pagination-container';
    const mainDoc = getLastDocsSection();
    if (mainDoc) {
      mainDoc.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }

  container.addEventListener('click', (e) => {
    if (e.target.type === 'button') {
      const newPage = e.target.value;
      if (newPage === 'Previous') {
        handlePageChange(currentPage - 1, onPageChange, totalItems, itemsPerPage);
      } else if (newPage === 'Next') {
        handlePageChange(currentPage + 1, onPageChange, totalItems, itemsPerPage);
      } else {
        handlePageChange(parseInt(newPage, 10) - 1, onPageChange, totalItems, itemsPerPage);
      }
    }
  });
  updatePaginationDisplay(container, totalItems, itemsPerPage);
}

export default initPagination;
