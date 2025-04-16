import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getPathDetails, htmlToElement, getConfig } from '../scripts.js';
import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';
import getEmitter from '../events.js';
import { rewriteDocsPath } from '../utils/path-utils.js';

const bookmarksEventEmitter = getEmitter('bookmarks');

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
  const { element, id: idValue, bookmarkPath, tooltips } = config;
  const { lang: languageCode } = getPathDetails();
  const profileData = await defaultProfileClient.getMergedProfile(true);
  let id = bookmarkPath || idValue;
  if (idValue.includes(`/${languageCode}`)) {
    id = idValue.replace(`/${languageCode}`, '');
  }
  const { bookmarks = [] } = profileData;
  const targetBookmarkItem = bookmarks.find((bookmarkIdInfo) => isBookmarkSelected(bookmarkIdInfo, id));
  const newBookmarks = bookmarks.filter((bookmarkIdInfo) => !isBookmarkSelected(bookmarkIdInfo, id));
  if (!targetBookmarkItem) {
    newBookmarks.push(`${id}:${Date.now()}`);
    defaultProfileClient
      .updateProfile('bookmarks', newBookmarks, true)
      .then(() => {
        element.dataset.bookmarked = true;
        bookmarksEventEmitter.set('bookmark_ids', newBookmarks);
        sendNotice(tooltips?.bookmarkToastText);
        assetInteractionModel(id, 'Bookmarked');
      })
      .catch(() => sendNotice(tooltips?.profileNotUpdated, 'error'));
  } else {
    defaultProfileClient
      .updateProfile('bookmarks', newBookmarks, true)
      .then(() => {
        element.dataset.bookmarked = false;
        bookmarksEventEmitter.set('bookmark_ids', newBookmarks);
        sendNotice(tooltips?.removeBookmarkToastText);
        assetInteractionModel(id, 'Bookmark Removed');
      })
      .catch(() => {
        sendNotice(tooltips?.profileNotUpdated, 'error');
      });
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
  const { element, id, bookmarkPath, tooltips } = config;

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

    let isPageBookmarked = bookmarkPath ? await isBookmarked(bookmarkPath) : false;
    if (!isPageBookmarked) isPageBookmarked = id ? await isBookmarked(id) : false;

    element.dataset.bookmarked = isPageBookmarked;
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

/**
 * Sanitizes the user's bookmarks by ensuring all bookmark IDs are valid paths.
 * If a bookmark ID does not start with `/lang`, it fetches the correct path from the article API.
 * Invalid bookmarks (e.g., 404 errors) are removed from the user's profile.
 *
 * @async
 * @function sanitizeBookmarks
 * @returns {Promise<void>} Resolves when the bookmarks have been sanitized and updated in the user's profile.
 * @throws {Error} Logs any errors encountered during the sanitization process.
 *
 */
export async function sanitizeBookmarks() {
  try {
    const profileData = await defaultProfileClient.getMergedProfile();
    const { bookmarks = [] } = profileData;
    let updateProfile = false;

    const sanitizedBookmarks = (
      await Promise.all(
        bookmarks.map(async (bookmarkIdInfo) => {
          const [bookmarkId, timestamp] = bookmarkIdInfo.split(':');

          // If the bookmark ID already starts with /{lang}, no need to fetch the path
          if (bookmarkId.startsWith(`/`)) {
            return `${bookmarkId}:${timestamp}`;
          }
          updateProfile = true;
          try {
            // Fetch the path from the article API
            const response = await fetch(`${getConfig().articleUrl}/${bookmarkId}`);
            if (response.ok) {
              const { data } = await response.json();
              const articlePath = data?.URL;

              // Ensure the path starts with /{lang}
              const sanitizedPath = rewriteDocsPath(articlePath);
              return `${sanitizedPath}:${timestamp}`;
            }

            if (response.status === 404) {
              // Remove the bookmark if it's a 404 (Not Found)
              // eslint-disable-next-line no-console
              console.warn(`Bookmark ID not found in database: ${bookmarkId}, Deleting Bookmark from profile...`);
              return null;
            }

            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch path for bookmark ID: ${bookmarkId},`);
            return `${bookmarkId}:${timestamp}`;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error fetching path for bookmark ID: ${bookmarkId}, This bookmark will be deleted`, error);
            return `${bookmarkId}:${timestamp}`;
          }
        }),
      )
    ).filter((bookmark) => bookmark !== null);

    // Update the profile with sanitized bookmarks
    if (updateProfile) await defaultProfileClient.updateProfile('bookmarks', sanitizedBookmarks, true);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sanitizing bookmarks:', error);
  }
}
