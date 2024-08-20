import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getPathDetails, htmlToElement } from '../scripts.js';
import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';
import { bookmarksEventEmitter } from '../events.js';

function isBookmarkSelected(bookmarkIdInfo, bookmarkId) {
  const { lang: languageCode } = getPathDetails();
  return (
    `${bookmarkIdInfo}`.includes(bookmarkId) || `${bookmarkIdInfo}`.includes(bookmarkId.replace(`/${languageCode}`, ''))
  );
}

/**
 * Checks if a given bookmark ID is present in the user's bookmark list.
 *
 * @param {string} bookmarkId - The bookmark ID to check.
 * @returns {Promise<boolean>} - Returns true if the bookmark exists, otherwise false.
 */
async function isBookmarked(bookmarkId) {
  const profile = await defaultProfileClient.getMergedProfile();
  return profile?.bookmarks.some((bookmarkIdInfo) => isBookmarkSelected(bookmarkIdInfo, bookmarkId));
}

/**
 * Handles the bookmark action by adding or removing a bookmark.
 *
 * @param {Object} config - Configuration object.
 * @param {HTMLElement} config.element - The element representing the bookmark button.
 * @param {string} config.id - Unique identifier for the asset to be bookmarked.
 * @param {string} config.tooltips - tooltips object to be displayed in a toast notification.
 */
export async function bookmarkHandler(config) {
  const { element, id: idValue, tooltips } = config;
  const { lang: languageCode } = getPathDetails();
  const profileData = await defaultProfileClient.getMergedProfile();
  let id = idValue;
  if (idValue.includes(`/${languageCode}`)) {
    id = idValue.replace(`/${languageCode}`, '');
  }
  const { bookmarks = [] } = profileData;
  const targetBookmarkItem = bookmarks.find((bookmarkIdInfo) => isBookmarkSelected(bookmarkIdInfo, id));
  const newBookmarks = bookmarks.filter((bookmarkIdInfo) => !isBookmarkSelected(bookmarkIdInfo, id));
  if (!targetBookmarkItem) {
    newBookmarks.push(`${id}:${Date.now()}`);
    element.dataset.bookmarked = true;
    defaultProfileClient.updateProfile('bookmarks', newBookmarks, true);
    bookmarksEventEmitter.set('bookmark_ids', newBookmarks);
    sendNotice(tooltips?.bookmarkToastText);
    assetInteractionModel(id, 'Bookmarked');
  } else {
    element.dataset.bookmarked = false;
    defaultProfileClient.updateProfile('bookmarks', newBookmarks, true);
    bookmarksEventEmitter.set('bookmark_ids', newBookmarks);
    sendNotice(tooltips?.removeBookmarkToastText);
    assetInteractionModel(id, 'Bookmark Removed');
  }
}

/**
 * Decorates a bookmark button with tooltips and handles sign-in state.
 *
 * @param {Object} config - Configuration object.
 * @param {HTMLElement} config.element - The element representing the bookmark button.
 * @param {string} config.id - Unique identifier for the page/card to be bookmarked.
 * @param {string} config.tooltips - Object for creating the tooltips.
 */
export async function decorateBookmark(config) {
  const { element, id, tooltips } = config;
  const isSignedIn = await isSignedInUser();

  if (isSignedIn) {
    element.dataset.signedIn = true;
    const bookmarkTooltip = htmlToElement(
      `<span class="action-tooltip bookmark-tooltip">${tooltips?.bookmarkTooltip || 'Bookmark Page'}</span>`,
    );
    const removeBookmarkTooltip = htmlToElement(
      `<span class="action-tooltip remove-bookmark-tooltip">${
        tooltips?.removeBookmarkTooltip || 'Remove Bookmark'
      }</span>`,
    );
    element.appendChild(bookmarkTooltip);
    element.appendChild(removeBookmarkTooltip);

    element.dataset.bookmarked = id ? await isBookmarked(id) : false;
  } else {
    const signInToBookmarkTooltip = htmlToElement(
      `<span class="action-tooltip signedin-tooltip">${
        tooltips?.signInToBookmarkTooltip || 'Sign-in to bookmark'
      }</span>`,
    );
    element.appendChild(signInToBookmarkTooltip);
    element.disabled = true;
  }
}
