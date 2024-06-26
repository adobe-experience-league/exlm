/* eslint-disable no-use-before-define */
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { fetchArticleByID } from '../../scripts/data-service/article-data-service.js';
import { CONTENT_TYPES } from '../../scripts/browse-card/browse-cards-constants.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { bookmarksEventEmitter } from '../../scripts/events.js';

const BOOKMARKS_BY_PG_CONFIG = {};
const CARDS_MODEL = {};
const convertToTitleCase = (str) => (str ? str.replace(/\b\w/g, (match) => match.toUpperCase()) : '');

const getBookmarksCount = () => {
  let resultCount = 4;
  if (window.matchMedia('(min-width:900px)').matches) {
    resultCount = 12;
  } else if (window.matchMedia('(min-width:600px)').matches) {
    resultCount = 8;
  }
  return resultCount;
};

const buildCardsShimmer = new BuildPlaceholder(getBookmarksCount());

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export const parse = (model) => {
  const { id, Type = [], Thumbnail, Solution = [], Title, URL, Description, Role = [] } = model;
  const [contentType = 'Course'] = Type;
  const [role] = Role;
  const contentTypeTitleCase = convertToTitleCase(contentType?.toLowerCase());
  const tags = [];
  if (contentType === 'Course') {
    tags.push({ icon: 'user', text: role || '' });
  }
  return {
    id,
    contentType,
    badgeTitle: contentType ? CONTENT_TYPES[contentType.toUpperCase()]?.LABEL : '',
    thumbnail: Thumbnail,
    product: Solution,
    title: Title,
    description: Description,
    tags,
    copyLink: URL,
    bookmarkLink: '',
    viewLink: URL,
    viewLinkText: placeholders[`browseCard${contentTypeTitleCase}ViewLabel`] || 'View',
  };
};

function setupInputBoxListener(block) {
  const filterInputEl = (block || document).querySelector('.bookmarks-pagination input');
  if (filterInputEl) {
    filterInputEl.addEventListener('change', (e) => {
      const { currentPageNumber, totalPageNumbers } = getCurrentPaginationStatus();
      let newPageNum = +e.target.value;
      if (newPageNum < 1) {
        newPageNum = 1;
      } else if (newPageNum >= totalPageNumbers) {
        newPageNum = totalPageNumbers + 1; // pgNum starts from 0 to N-1.
      }
      if (Number.isNaN(newPageNum)) {
        newPageNum = Number.isNaN(currentPageNumber) ? 0 : currentPageNumber + 1;
      }
      e.target.value = newPageNum;
      setCurrentPaginationStatus({ currentPageNumber: newPageNum - 1 /* pgNum starts from 0. */ });
      updatePageNumberStyles();
      const cardWrapper = (block || document).querySelector('.bookmarks-content');
      const { currentPageNumber: updatedPgNum } = getCurrentPaginationStatus();
      renderCards({ pgNum: updatedPgNum, cardWrapper });
    });
  }
}

function onPageChange(e) {
  const isIncrement = e.currentTarget.classList.contains('right-nav-arrow');
  const { currentPageNumber, totalPageNumbers } = getCurrentPaginationStatus();
  let newPgNum;
  if (isIncrement) {
    newPgNum = currentPageNumber >= totalPageNumbers ? totalPageNumbers : currentPageNumber + 1;
  } else {
    newPgNum = currentPageNumber <= 1 ? 0 : currentPageNumber - 1;
  }
  setCurrentPaginationStatus({ currentPageNumber: newPgNum });
  updatePageNumberStyles();
  const cardWrapper = document.querySelector('.bookmarks-content');
  renderCards({ pgNum: newPgNum, cardWrapper });
}

function getCurrentPaginationStatus(block) {
  const bookmarksEl = block ?? document.querySelector('.bookmarks.block');
  return {
    currentPageNumber: +(bookmarksEl.dataset.pgnum || '0'),
    totalPageNumbers: +(bookmarksEl.dataset.totalpgnum || '1'),
  };
}

function setCurrentPaginationStatus({ block, currentPageNumber, totalPageNumbers }) {
  const bookmarksEl = block ?? document.querySelector('.bookmarks.block');
  if (currentPageNumber !== undefined) {
    bookmarksEl.dataset.pgnum = `${currentPageNumber}`;
  }
  if (totalPageNumbers !== undefined) {
    bookmarksEl.dataset.totalpgnum = `${totalPageNumbers}`;
  }
}

function updatePageNumberStyles(block) {
  const { currentPageNumber, totalPageNumbers: totalPages } = getCurrentPaginationStatus(block);
  const bookmarksEl = block ?? document.querySelector('.bookmarks.block');
  const paginationEl = bookmarksEl.querySelector('.bookmarks-pagination');
  const paginationTextEl = bookmarksEl.querySelector('.bookmarks-pagination-text');
  const paginationBlock = bookmarksEl.querySelector('.bookmarks-pagination');
  const paginationInput = bookmarksEl.querySelector('.bookmarks-pg-search-input');
  const [leftNavArrow, rightNavArrow] = paginationBlock.querySelectorAll('.nav-arrow');
  const leftNavEnabled = currentPageNumber > 0;
  const rightNavEnabled = currentPageNumber < totalPages - 1;
  const paginationText = `of ${totalPages} page${totalPages > 1 ? 's' : ''}`;

  if (totalPages === 1) {
    paginationEl.classList.add('bookmarks-pagination-hidden');
  } else {
    paginationEl.classList.remove('bookmarks-pagination-hidden');
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

async function renderCards({ pgNum, cardWrapper }) {
  cardWrapper.innerHTML = '';
  buildCardsShimmer.add(cardWrapper.parentElement);
  cardWrapper.style.display = 'none';
  const bookmarkIds = BOOKMARKS_BY_PG_CONFIG[pgNum];
  const bookmarkPromises = bookmarkIds.map((bookmarkId) => fetchArticleByID(bookmarkId));
  const cardResponse = await Promise.all(bookmarkPromises);
  const cardsData = cardResponse.filter(Boolean).map((card) => {
    const parsedCard = parse(card);
    if (!CARDS_MODEL[parsedCard.id]) {
      CARDS_MODEL[parsedCard.id] = parsedCard;
    }
    return parsedCard;
  });

  cardsData.forEach((cardData) => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('bookmarks-card');
    buildCard(cardWrapper, cardDiv, cardData);
    cardWrapper.appendChild(cardDiv);
  });
  buildCardsShimmer.remove();
  cardWrapper.style.display = '';
}

const prepareBookmarksPaginationConfig = () => {
  const resultsPerPage = getBookmarksCount();
  const bookmarks = bookmarksEventEmitter.get('bookmark_ids') ?? [];
  const sortedBookmarks = bookmarks.sort((a, b) => {
    const [, currentTimeStamp = '0'] = a.split(':');
    const [, nextTimeStamp = '0'] = b.split(':');
    return +currentTimeStamp - +nextTimeStamp;
  });
  const bookmarkIds = sortedBookmarks.map((bookmarkIdInfo) => {
    const [bookmarkId] = bookmarkIdInfo.split(':');
    return bookmarkId;
  });
  Object.keys(BOOKMARKS_BY_PG_CONFIG).forEach((key) => {
    delete BOOKMARKS_BY_PG_CONFIG[key];
  });

  bookmarkIds.reduce((acc, curr, index) => {
    const pgIndex = index === 0 ? 0 : Math.floor(index / resultsPerPage);
    if (!acc[pgIndex]) {
      acc[pgIndex] = [];
    }
    acc[pgIndex].push(curr);
    return acc;
  }, BOOKMARKS_BY_PG_CONFIG);
};

export default async function decorateBlock(block) {
  const [headerWrapper, order] = block.children;
  const header = headerWrapper.firstElementChild?.firstElementChild;
  const headerHTML = header.outerHTML;
  const orderText = order.textContent;
  block.innerHTML = '';

  const profileData = await defaultProfileClient.getMergedProfile();
  const { bookmarks = [] } = profileData;
  if (bookmarks.length === 0) {
    block.classList.add('bookmarks-empty');
    return;
  }
  const clonedBookmarkIds = structuredClone(bookmarks);
  bookmarksEventEmitter.set('bookmark_ids', clonedBookmarkIds);

  const content = htmlToElement(`
        <div>
            <div class="bookmarks-header">
                <div>${headerHTML}</div>
                <div>${orderText}</div>
            </div>
            <div class="bookmarks-content"></div>
        </div>
    `);

  block.appendChild(content);
  const cardWrapper = block.querySelector('.bookmarks-content');
  const resultsPerPage = getBookmarksCount();
  const pgNum = 0;
  const totalPages = Math.ceil(bookmarks.length / resultsPerPage);

  bookmarksEventEmitter.on('dataChange', async () => {
    const bookmarkItems = bookmarksEventEmitter.get('bookmark_ids') ?? [];
    const { currentPageNumber } = getCurrentPaginationStatus();
    const totalPagesCount = Math.ceil(bookmarkItems.length / resultsPerPage);
    let newPgNum;
    if (bookmarkItems.length === 0) {
      cardWrapper.innerHTML = '';
      block.classList.add('bookmarks-empty');
      newPgNum = 0;
    } else {
      newPgNum = currentPageNumber >= totalPagesCount ? totalPagesCount - 1 : currentPageNumber;
      prepareBookmarksPaginationConfig();
      await renderCards({ block, pgNum: newPgNum, cardWrapper });
    }
    setCurrentPaginationStatus({ block, currentPageNumber: newPgNum, totalPageNumbers: totalPagesCount });
    updatePageNumberStyles(block);
  });
  prepareBookmarksPaginationConfig();
  await renderCards({ block, pgNum, cardWrapper });

  const paginationBlock = htmlToElement(`
        <div class="bookmarks-pagination">
            <button class="nav-arrow" aria-label="previous page"></button>
            <input type="text" class="bookmarks-pg-search-input" aria-label="Enter page number" value="${pgNum}">
            <span class="bookmarks-pagination-text"></span>
            <button class="nav-arrow right-nav-arrow" aria-label="next page"></button>
        </div>
    `);

  const [leftNavArrow, rightNavArrow] = paginationBlock.querySelectorAll('.nav-arrow');
  leftNavArrow.addEventListener('click', onPageChange);
  rightNavArrow.addEventListener('click', onPageChange);
  block.appendChild(paginationBlock);
  setupInputBoxListener(block);
  setCurrentPaginationStatus({ block, currentPageNumber: pgNum, totalPageNumbers: totalPages });
  updatePageNumberStyles(block);
}
