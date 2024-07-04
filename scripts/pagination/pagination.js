import { htmlToElement } from '../scripts.js';
import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/pagination/pagination.css`);

export default class Pagination {
  currentPageNumber = 0;

  totalPageNumbers = 0;

  constructor({ wrapper, identifier, renderItems, pgNumber, totalPages }) {
    this.wrapper = wrapper;
    this.identifier = identifier;
    this.renderItemsFn = renderItems;
    this.currentPageNumber = pgNumber;
    this.totalPageNumbers = totalPages;

    this.pageChangeHandler = this.onPageChange.bind(this);

    this.renderBlock();
    this.setupInputBoxListener();
    this.updatePageNumberStyles();
  }

  renderBlock() {
    const paginationBlock = htmlToElement(`
            <div class="pagination ${this.identifier}-pagination">
                <button class="nav-arrow" aria-label="previous page"></button>
                <input type="text" class="bookmarks-pg-search-input" aria-label="Enter page number" value="${this.currentPageNumber}">
                <span class="pagination-text"></span>
                <button class="nav-arrow right-nav-arrow" aria-label="next page"></button>
            </div>
        `);
    const [leftNavArrow, rightNavArrow] = paginationBlock.querySelectorAll('.nav-arrow');
    leftNavArrow.addEventListener('click', this.pageChangeHandler);
    rightNavArrow.addEventListener('click', this.pageChangeHandler);
    this.wrapper.appendChild(paginationBlock);
  }

  onPageChange(e) {
    const isIncrement = e.currentTarget.classList.contains('right-nav-arrow');
    const { currentPageNumber, totalPageNumbers } = this.getCurrentPaginationStatus();
    let newPgNum;
    if (isIncrement) {
      newPgNum = currentPageNumber >= totalPageNumbers ? totalPageNumbers : currentPageNumber + 1;
    } else {
      newPgNum = currentPageNumber <= 1 ? 0 : currentPageNumber - 1;
    }
    this.setCurrentPaginationStatus({ currentPageNumber: newPgNum });
    this.updatePageNumberStyles();
    this.renderItemsFn({ pgNum: newPgNum, block: this.wrapper });
  }

  getCurrentPaginationStatus() {
    return {
      currentPageNumber: this.currentPageNumber,
      totalPageNumbers: this.totalPageNumbers,
    };
  }

  setCurrentPaginationStatus({ currentPageNumber, totalPageNumbers }) {
    if (currentPageNumber !== undefined) {
      this.currentPageNumber = currentPageNumber;
    }
    if (totalPageNumbers !== undefined) {
      this.totalPageNumbers = totalPageNumbers;
    }
  }

  updatePageNumberStyles() {
    const { currentPageNumber, totalPageNumbers: totalPages } = this.getCurrentPaginationStatus();
    const bookmarksEl = this.wrapper;
    const paginationEl = bookmarksEl.querySelector('.pagination');
    const paginationTextEl = bookmarksEl.querySelector('.pagination-text');
    const paginationBlock = bookmarksEl.querySelector('.pagination');
    const paginationInput = bookmarksEl.querySelector('.bookmarks-pg-search-input');
    const [leftNavArrow, rightNavArrow] = paginationBlock.querySelectorAll('.nav-arrow');
    const leftNavEnabled = currentPageNumber > 0;
    const rightNavEnabled = currentPageNumber < totalPages - 1;
    const paginationText = `of ${totalPages} page${totalPages > 1 ? 's' : ''}`;

    if (totalPages === 1) {
      paginationEl.classList.add('pagination-hidden');
    } else {
      paginationEl.classList.remove('pagination-hidden');
    }

    const applyNavStyles = (navEl, enabled) => {
      const classOp = enabled ? 'remove' : 'add';
      navEl.classList[classOp]('nav-arrow-hidden');
    };
    applyNavStyles(leftNavArrow, leftNavEnabled);
    applyNavStyles(rightNavArrow, rightNavEnabled);
    paginationTextEl.textContent = paginationText;
    paginationInput.value = currentPageNumber + 1;
  }

  setupInputBoxListener() {
    const filterInputEl = this.wrapper.querySelector('.pagination input');
    if (filterInputEl) {
      filterInputEl.addEventListener('change', (e) => {
        const { currentPageNumber, totalPageNumbers } = this.getCurrentPaginationStatus();
        let newPageNum = +e.target.value;
        if (newPageNum < 1) {
          newPageNum = 1;
        } else if (newPageNum >= totalPageNumbers) {
          newPageNum = totalPageNumbers; // pgNum starts from 0 to N-1.
        }
        if (Number.isNaN(newPageNum)) {
          newPageNum = Number.isNaN(currentPageNumber) ? 0 : currentPageNumber + 1;
        }
        e.target.value = newPageNum;
        this.setCurrentPaginationStatus({ currentPageNumber: newPageNum - 1 /* pgNum starts from 0. */ });
        this.updatePageNumberStyles();
        const { currentPageNumber: updatedPgNum } = this.getCurrentPaginationStatus();
        this.renderItemsFn({ pgNum: updatedPgNum, block: this.wrapper });
      });
    }
  }

  static getItemsCount = () => {
    let resultCount = 4;
    if (window.matchMedia('(min-width:900px)').matches) {
      resultCount = 12;
    } else if (window.matchMedia('(min-width:600px)').matches) {
      resultCount = 8;
    }
    return resultCount;
  };
}
