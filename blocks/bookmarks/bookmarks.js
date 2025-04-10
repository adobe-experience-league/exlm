/* eslint-disable no-use-before-define */
import { buildCard } from '../../scripts/browse-card/browse-card.js';
import { htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';
import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { fetchArticleByID } from '../../scripts/data-service/article-data-service.js';
import BrowseCardShimmer from '../../scripts/browse-card/browse-card-shimmer.js';
import getEmitter from '../../scripts/events.js';
import { getCardData, convertToTitleCase } from '../../scripts/browse-card/browse-card-utils.js';
import { CONTENT_TYPES } from '../../scripts/data-service/coveo/coveo-exl-pipeline-constants.js';
import sanitizeBookmarks from '../../scripts/sanitize-bookmarks.js';

const BATCH_SIZE = 6;
const bookmarksEventEmitter = getEmitter('bookmarks');

const buildCardsShimmer = new BrowseCardShimmer();
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export const parse = (model) => {
  const { 'Full Meta': fullMeta = '', viewLinkText, id, Thumbnail, URL, Role = [], Solution = [] } = model;

  const fullMetaJson = parseFullMeta(fullMeta);

  if (viewLinkText) {
    // Already parsed as part of getCardData. No need to parse again.
    if (!model.badgeTitle) {
      model.badgeTitle = model.contentType;
    }
    return model;
  }
  const contentType = fullMetaJson.type || '';
  const title = fullMetaJson.title || model.Title;
  const description = fullMetaJson.description || model.Description;
  const [role] = Role;
  const contentTypeTitleCase = convertToTitleCase(contentType.toLowerCase());

  const tags = contentType === 'Playlist' ? [{ icon: 'user', text: role || '' }] : [];

  return {
    id,
    contentType,
    badgeTitle: CONTENT_TYPES[contentType.toUpperCase()]?.LABEL || '',
    thumbnail: Thumbnail,
    product: Solution,
    title,
    description,
    tags,
    copyLink: URL,
    bookmarkLink: '',
    viewLink: URL,
    viewLinkText: placeholders[`browseCard${contentTypeTitleCase}ViewLabel`] || 'View',
  };
};

// Function to parse Full Meta
function parseFullMeta(metaString) {
  const lines = metaString.split('\n');
  const jsonObject = {};
  lines.forEach((line) => {
    const [key, value] = line.split(': ').map((item) => item.trim());
    if (key) {
      jsonObject[key] = value;
    }
  });
  return jsonObject;
}

async function renderCards(block) {
  const bookmarks = bookmarksEventEmitter.get('bookmark_ids') ?? [];

  block.querySelector('.bookmarks-content')?.remove();

  buildCardsShimmer.updateCount(bookmarks.length);
  buildCardsShimmer.addShimmer(block.firstElementChild);
  buildCardsShimmer.shimmerContainer.classList.add('bookmarks-content');

  const { lang: languageCode } = getPathDetails();
  const wrapper = (block || document).querySelector('.bookmarks-content');

  const sortedBookmarks = structuredClone(bookmarks).sort((a, b) => {
    const [, currentTimeStamp = '0'] = a.split(':');
    const [, nextTimeStamp = '0'] = b.split(':');
    return +nextTimeStamp - +currentTimeStamp;
  });

  const bookmarkIds = sortedBookmarks.map((bookmarkIdInfo) => {
    const [bookmarkId] = bookmarkIdInfo.split(':');
    return bookmarkId;
  });

  async function processBatch(bookmarkBatch) {
    const bookmarkPromises = bookmarkBatch.map((bookmarkId) => {
      if (bookmarkId.startsWith('/')) {
        const url = bookmarkId.includes(`/${languageCode}`)
          ? `${window.hlx.codeBasePath}${bookmarkId}`
          : `/${languageCode}${window.hlx.codeBasePath}${bookmarkId}`;
        return getCardData(url, placeholders);
      }
      return fetchArticleByID(bookmarkId);
    });

    const cardResponses = await Promise.all(bookmarkPromises);

    cardResponses.forEach(async (cardResponse) => {
      if (!cardResponse) {
        wrapper.lastElementChild.remove();
      } else {
        const parsedCard = parse(cardResponse);
        const cardDiv = wrapper.querySelector('.browse-card-shimmer-wrapper');
        cardDiv.innerHTML = '';
        cardDiv.className = '';
        cardDiv.classList.add('bookmarks-card');
        await buildCard(wrapper, cardDiv, parsedCard);
      }
    });
  }

  async function processBookmarksInBatches(bookmarksIds) {
    for (let i = 0; i < bookmarksIds.length; i += BATCH_SIZE) {
      const batch = bookmarksIds.slice(i, i + BATCH_SIZE);
      // eslint-disable-next-line no-await-in-loop
      await processBatch(batch);
    }
  }

  processBookmarksInBatches(bookmarkIds);
}

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

    bookmarksEventEmitter.on('dataChange', async () => {
      const bookmarkItems = bookmarksEventEmitter.get('bookmark_ids') ?? [];
      if (bookmarkItems.length === 0) {
        block.querySelector('.bookmarks-content').innerHTML = '';
        block.classList.add('bookmarks-empty');
      } else {
        await renderCards(block);
      }
    });
    await renderCards(block);
    // Remove once all bookmarks are converted into path.
    sanitizeBookmarks();
  }
}
