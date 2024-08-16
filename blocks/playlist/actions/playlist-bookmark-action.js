import { assetInteractionModel } from '../../../scripts/analytics/lib-analytics.js';
import { defaultProfileClient, isSignedInUser } from '../../../scripts/auth/profile.js';
import { createPlaceholderSpan, fetchLanguagePlaceholders, getPathDetails } from '../../../scripts/scripts.js';
import { sendNotice } from '../../../scripts/toast/toast.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function getCurrentPlaylistBookmarkPath() {
  return window.location.pathname;
}

async function isBookmarkedPlaylist() {
  const profile = await defaultProfileClient.getMergedProfile();
  const bookmarkId = getCurrentPlaylistBookmarkPath();
  return profile?.bookmarks.find((bookmarkIdInfo) => bookmarkIdInfo.includes(bookmarkId)) || false;
}

async function toggleBookmark() {
  const { lang } = getPathDetails();
  const bookmarkId = getCurrentPlaylistBookmarkPath().replace(`/${lang}`, '');
  const profileData = await defaultProfileClient.getMergedProfile();
  const { bookmarks = [] } = profileData;
  const targetBookmarkItem = bookmarks.find((bookmarkIdInfo) => `${bookmarkIdInfo}`.includes(bookmarkId));
  const newBookmarks = bookmarks.filter((bookmarkIdInfo) => !`${bookmarkIdInfo}`.includes(bookmarkId));
  if (!targetBookmarkItem) {
    // During toggle, remove current bookmark if any (OR) add it to bookmarks
    newBookmarks.push(`${bookmarkId}:${Date.now()}`);
  }
  return defaultProfileClient.updateProfile('bookmarks', newBookmarks, true);
}
/**
 * @param {HTMLButtonElement} bookmarkButton
 */
export async function decorateBookmark(bookmarkButton) {
  const isSignedIn = await isSignedInUser();
  bookmarkButton.dataset.signedIn = isSignedIn;
  bookmarkButton.dataset.bookmarked = false;

  if (!isSignedIn) {
    const signInToBookmarkTooltip = createPlaceholderSpan(
      'userActionSigninBookmarkTooltip',
      'Sign-in to bookmark',
      (span) => {
        span.dataset.signedIn = 'false';
        span.classList.add('playlist-action-tooltip-label');
      },
    );

    bookmarkButton.appendChild(signInToBookmarkTooltip);
    bookmarkButton.disabled = true;
    return;
  }

  const isBookmarked = await isBookmarkedPlaylist();
  bookmarkButton.dataset.bookmarked = isBookmarked;

  const bookmarkTooltip = createPlaceholderSpan('playlistBookmark', 'Bookmark Playlist', (span) => {
    span.dataset.signedIn = 'true';
    span.dataset.bookmarked = 'false';
    span.classList.add('playlist-action-tooltip-label');
  });
  bookmarkTooltip.style.display = 'none';
  bookmarkButton.appendChild(bookmarkTooltip);

  const removeBookmarkTooltip = createPlaceholderSpan('playlistRemoveBookmark', 'Remove Bookmark', (span) => {
    span.dataset.signedIn = 'true';
    span.dataset.bookmarked = 'true';
    span.classList.add('playlist-action-tooltip-label');
  });
  removeBookmarkTooltip.style.display = 'none';
  bookmarkButton.appendChild(removeBookmarkTooltip);
}

/**
 *
 * @param {PointerEvent} event
 * @param {*} playlist
 */
export async function bookmark(event) {
  const button = event.target.closest('button');
  const isBookmarked = button.dataset.bookmarked === 'true';
  await toggleBookmark();

  if (isBookmarked) {
    // bookmark was just removed
    button.dataset.bookmarked = 'false';
    sendNotice(`${placeholders.userActionRemoveBookmarkToastText}`);
    assetInteractionModel(getCurrentPlaylistBookmarkPath(), 'Bookmark removed');
  } else {
    // bookmark was just added
    button.dataset.bookmarked = 'true';
    sendNotice(`${placeholders.userActionBookmarkToastText}`);
    assetInteractionModel(getCurrentPlaylistBookmarkPath(), 'Bookmarked');
  }
  return true;
}
