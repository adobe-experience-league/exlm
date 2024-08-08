/* eslint-disable no-use-before-define */
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { fetchArticleByID } from '../../scripts/data-service/article-data-service.js';
import BuildPlaceholder from '../../scripts/browse-card/browse-card-placeholder.js';
import { bookmarksEventEmitter } from '../../scripts/events.js';
import { getCardData, convertToTitleCase } from '../../scripts/browse-card/browse-card-utils.js';
import Pagination from '../../scripts/pagination/pagination.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';

const BOOKMARKS_BY_PG_CONFIG = {};
const CARDS_MODEL = {};

const buildCardsShimmer = new BuildPlaceholder(Pagination.getItemsCount());

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export const parse = (model) => {
  const { id, Type = [], Thumbnail, Solution = [], Title, URL, Description, Role = [], viewLinkText } = model;
  if (viewLinkText) {
    // Already parsed as part of getCardData. No need to parse again.
    if (!model.badgeTitle) {
      model.badgeTitle = model.contentType;
    }
    return model;
  }
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

async function renderCards({ pgNum, block }) {
  const { lang: languageCode } = getPathDetails();
  const wrapper = (block || document).querySelector('.bookmarks-content');
  wrapper.innerHTML = '';
  buildCardsShimmer.add(wrapper.parentElement);
  wrapper.style.display = 'none';
  const bookmarkIds = BOOKMARKS_BY_PG_CONFIG[pgNum];
  const bookmarkPromises = bookmarkIds.map((bookmarkId) => {
    if (bookmarkId.startsWith('/')) {
      const url = bookmarkId.includes(`/${languageCode}`)
        ? `${window.hlx.codeBasePath}${bookmarkId}`
        : `/${languageCode}${window.hlx.codeBasePath}${bookmarkId}`;
      return getCardData(url, placeholders);
    }
    return fetchArticleByID(bookmarkId);
  });
  const cardResponse = await Promise.all(bookmarkPromises);

  const cardsData = cardResponse.map((card, index) => {
    if (!card) {
      const data = {
        id: bookmarkIds[index],
        description:
          placeholders.bookmarkLoadFailureText || 'There has been an error retrieving this bookmarked content.',
        title: '',
        failedToLoad: true,
      };
      CARDS_MODEL[bookmarkIds[index]] = data;
      return data;
    }
    const parsedCard = parse(card);
    if (parsedCard.id && !CARDS_MODEL[parsedCard.id]) {
      CARDS_MODEL[parsedCard.id] = parsedCard;
    }
    return parsedCard;
  });

  cardsData.forEach((cardData) => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('bookmarks-card');
    buildCard(wrapper, cardDiv, cardData);
    wrapper.appendChild(cardDiv);
  });
  buildCardsShimmer.remove();
  wrapper.style.display = '';
}

const prepareBookmarksPaginationConfig = () => {
  const resultsPerPage = Pagination.getItemsCount();
  const bookmarks = bookmarksEventEmitter.get('bookmark_ids') ?? [];
  const sortedBookmarks = bookmarks.sort((a, b) => {
    const [, currentTimeStamp = '0'] = a.split(':');
    const [, nextTimeStamp = '0'] = b.split(':');
    return +nextTimeStamp - +currentTimeStamp;
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
  const isSignedIn = await isSignedInUser();
  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    const { bookmarks = [] } = profileData;
    if (bookmarks.length === 0) {
      block.classList.add('bookmarks-empty');
      return;
    }
    const clonedBookmarkIds = structuredClone(bookmarks);
    bookmarksEventEmitter.set('bookmark_ids', clonedBookmarkIds);

    const wrapper = block.querySelector('.bookmarks-content');
    const resultsPerPage = Pagination.getItemsCount();
    const pgNum = 0;
    const totalPages = Math.ceil(bookmarks.length / resultsPerPage);
    const pagination = new Pagination({
      wrapper: block,
      identifier: 'bookmarks',
      renderItems: renderCards,
      pgNumber: pgNum,
      totalPages,
    });

    bookmarksEventEmitter.on('dataChange', async () => {
      const bookmarkItems = bookmarksEventEmitter.get('bookmark_ids') ?? [];
      const { currentPageNumber } = pagination.getCurrentPaginationStatus();
      const totalPagesCount = Math.ceil(bookmarkItems.length / resultsPerPage);
      let newPgNum;
      if (bookmarkItems.length === 0) {
        wrapper.innerHTML = '';
        block.classList.add('bookmarks-empty');
        newPgNum = 0;
      } else {
        newPgNum = currentPageNumber >= totalPagesCount ? totalPagesCount - 1 : currentPageNumber;
        prepareBookmarksPaginationConfig();
        await renderCards({ block, pgNum: newPgNum });
      }
      pagination.setCurrentPaginationStatus({ currentPageNumber: newPgNum, totalPageNumbers: totalPagesCount });
      pagination.updatePageNumberStyles();
    });
    prepareBookmarksPaginationConfig();

    await renderCards({ block, pgNum });
  }
}
