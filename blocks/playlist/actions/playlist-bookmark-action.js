import { assetInteractionModel } from '../../../scripts/analytics/lib-analytics.js';
import { defaultProfileClient, isSignedInUser } from '../../../scripts/auth/profile.js';
import { createPlaceholderSpan, fetchLanguagePlaceholders, getPathDetails } from '../../../scripts/scripts.js';
import { sendNotice } from '../../../scripts/toast/toast.js';

const placeholdersPromise = fetchLanguagePlaceholders();

function getCurrentPlaylistBookmarkPath() {
  return window.location.pathname;
}

function getBookmarkId() {
  const { lang } = getPathDetails();
  const bookmarkId = getCurrentPlaylistBookmarkPath().replace(`/${lang}`, '');
  return bookmarkId;
}

async function getAllBookmarks() {
  const profileData = await defaultProfileClient.getMergedProfile();
  const { bookmarks = [] } = profileData;
  return bookmarks;
}

async function getCurrentlyBookmarkedId() {
  const bookmarkId = getBookmarkId();
  const profileData = await defaultProfileClient.getMergedProfile();
  const { bookmarks = [] } = profileData;

  const parsedBokkmarks = bookmarks
    .map((bookmarkIdInfo) => bookmarkIdInfo.split(':'))
    .map(([id, timestamp = 0]) => ({ id, timestamp }));

  const foundBookmark = parsedBokkmarks.find((bookmarkIdInfo) => bookmarkIdInfo?.id === bookmarkId);
  return foundBookmark;
}

async function toggleBookmark() {
  let bookmarks = await getAllBookmarks();
  const foundBookmark = await getCurrentlyBookmarkedId();
  if (foundBookmark) {
    const foundBookmarkId = `${foundBookmark.id}:${foundBookmark.timestamp}`;
    bookmarks = bookmarks.filter((b) => b !== foundBookmarkId);
  } else {
    bookmarks.push(`${getBookmarkId()}:${Date.now()}`);
  }
  return defaultProfileClient.updateProfile('bookmarks', bookmarks, true);
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

  const currentlyBookmarkedId = await getCurrentlyBookmarkedId();
  const isBookmarked = !!currentlyBookmarkedId;
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
  const placeholders = await placeholdersPromise;

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
