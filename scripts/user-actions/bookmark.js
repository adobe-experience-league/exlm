import { defaultProfileClient, isSignedInUser } from '../auth/profile.js';
import { getPathDetails, htmlToElement, getConfig } from '../scripts.js';
import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';
import getEmitter from '../events.js';
import { rewriteDocsPath } from '../utils/path-utils.js';
import { getPLAccessToken } from '../utils/premium-learning-utils.js';

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
 * @param {Object} config.trackingInfo - Tracking configuration.
 * @param {Function} config.callback - Optional callback function to be called after bookmark action.
 */
export async function bookmarkHandler(config) {
  const { element, id: idValue, bookmarkPath, tooltips, trackingInfo, linkType, position, callback } = config;

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
        // DEPRECATION: assetInteractionModel removed for browse-cards - using pushBrowseCardClickEvent via callback instead
        if (!callback) {
          assetInteractionModel(id, 'Bookmarked', { trackingInfo });
        }
        if (callback) callback(linkType, position);
      })
      .catch(() => sendNotice(tooltips?.profileNotUpdated, 'error'));
  } else {
    defaultProfileClient
      .updateProfile('bookmarks', newBookmarks, true)
      .then(() => {
        element.dataset.bookmarked = false;
        bookmarksEventEmitter.set('bookmark_ids', newBookmarks);
        sendNotice(tooltips?.removeBookmarkToastText);
        // DEPRECATION: assetInteractionModel removed for browse-cards - using pushBrowseCardClickEvent via callback instead
        if (!callback) {
          assetInteractionModel(id, 'Bookmark Removed', { trackingInfo });
        }
        if (callback) callback(linkType, position);
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

// ========== PREMIUM LEARNING BOOKMARKS ==========

/**
 * Fetches PL bookmarks or checks if a specific item is bookmarked
 * @param {string} [loId] - Optional learning object ID to check
 * @returns {Promise<Object|boolean>} Returns full response data if no loId, or boolean if loId provided
 */
export async function fetchPremiumLearningBookmarks(loId = null) {
  try {
    const { plApiBaseUrl } = getConfig();
    const token = getPLAccessToken();

    if (!token) return loId ? false : { data: [], included: [] };

    const response = await fetch(
      `${plApiBaseUrl}/learningObjects?include=instances&page[limit]=10&filter.loTypes=course,learningProgram&filter.bookmarks=true&sort=name&filter.ignoreEnhancedLP=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.api+json',
        },
      },
    );

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch PL bookmarks:', response.status);
      return loId ? false : { data: [], included: [] };
    }

    const data = await response.json();

    // If loId provided, return true/false
    if (loId) {
      const bookmarks = data?.data || [];
      return bookmarks.some((bookmark) => bookmark.id === loId);
    }

    // Otherwise return full response data for adaptor processing
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching PL bookmarks:', error);
    return loId ? false : { data: [], included: [] };
  }
}

/**
 * Decorates a PL bookmark button (reuses decorateBookmark logic for consistency)
 *
 * @param {Object} config
 * @param {HTMLElement} config.element - Bookmark button element
 * @param {string} config.loId - Learning object ID
 * @param {Object} config.tooltips - Tooltip texts
 */
export async function decoratePremiumLearningBookmark(config) {
  const { element, loId, tooltips } = config;
  const token = getPLAccessToken();

  element.dataset.plBookmark = 'true';
  element.dataset.signedIn = !!token;

  if (!token) {
    element.dataset.bookmarked = 'false';
    const signInTooltip = htmlToElement(
      `<span class="action-tooltip signedin-tooltip">${
        tooltips?.signInToBookmarkTooltip || 'Sign in to bookmark'
      }</span>`,
    );
    element.appendChild(signInTooltip);
    element.disabled = true;
    return;
  }

  // Check if already bookmarked
  const plBookmarked = await fetchPremiumLearningBookmarks(loId);
  element.dataset.bookmarked = String(plBookmarked);

  const bookmarkTooltip = htmlToElement(
    `<span class="action-tooltip bookmark-tooltip">${tooltips?.bookmarkTooltip || 'Bookmark'}</span>`,
  );
  const removeBookmarkTooltip = htmlToElement(
    `<span class="action-tooltip remove-bookmark-tooltip">${
      tooltips?.removeBookmarkTooltip || 'Remove Bookmark'
    }</span>`,
  );
  element.appendChild(bookmarkTooltip);
  element.appendChild(removeBookmarkTooltip);
}

/**
 * Handles PL bookmark toggle (add/remove) - separate from profile bookmarks
 *
 * @param {Object} config
 * @param {HTMLElement} config.element - Bookmark button element
 * @param {string} config.loId - Learning object ID (e.g., "course:559757")
 * @param {Object} config.tooltips - Toast notification texts
 * @param {Function} config.callback - Optional callback after action
 */
export async function premiumLearningBookmarkHandler(config) {
  const { element, loId, tooltips, callback } = config;

  const token = getPLAccessToken();
  if (!token) {
    sendNotice(tooltips?.signInRequired || 'Please sign in to bookmark', 'error');
    return;
  }

  const isCurrentlyBookmarked = element.dataset.bookmarked === 'true';
  const { plApiBaseUrl } = getConfig();

  try {
    const method = isCurrentlyBookmarked ? 'DELETE' : 'POST';
    const response = await fetch(`${plApiBaseUrl}/learningObjects/${loId}/bookmark`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.api+json',
      },
    });

    if (response.ok) {
      element.dataset.bookmarked = String(!isCurrentlyBookmarked);
      const message = isCurrentlyBookmarked
        ? tooltips?.removeBookmarkToastText || 'Bookmark removed'
        : tooltips?.bookmarkToastText || 'Successfully bookmarked';
      sendNotice(message);
      // DEPRECATION: assetInteractionModel removed for PL browse-cards - using pushBrowseCardClickEvent via callback instead
      if (!callback) {
        assetInteractionModel(loId, isCurrentlyBookmarked ? 'Bookmark Removed' : 'Bookmarked');
      }

      // Emit event to trigger UI updates in pl-bookmarks block
      const plBookmarksEventEmitter = getEmitter('pl-bookmarks');
      plBookmarksEventEmitter.emit('bookmark_changed', {
        loId,
        bookmarked: !isCurrentlyBookmarked,
        timestamp: Date.now(),
      });

      if (callback) callback();
    } else {
      throw new Error(`Failed to update bookmark: ${response.status}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error handling PL bookmark:', error);
    sendNotice(tooltips?.profileNotUpdated || 'Failed to update bookmark', 'error');
  }
}
