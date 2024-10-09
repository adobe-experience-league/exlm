import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { defaultProfileClient } from '../auth/profile.js';
import getEmitter from '../events.js';

const bookmarksEventEmitter = getEmitter('bookmarks');
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

function isBookmarkSelected(bookmarkIdInfo, bookmarkId) {
  const { lang: languageCode } = getPathDetails();
  return (
    `${bookmarkIdInfo}`.includes(bookmarkId) || `${bookmarkIdInfo}`.includes(bookmarkId.replace(`/${languageCode}`, ''))
  );
}

const renderBookmark = (labelSel, iconSel, id) => {
  iconSel.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (id) {
      if (iconSel.classList.contains('authed')) {
        const profileData = await defaultProfileClient.getMergedProfile();
        const { bookmarks = [] } = profileData;
        const bookmarkItems = bookmarks.filter((bookmark) => !isBookmarkSelected(bookmark, id));
        defaultProfileClient.updateProfile('bookmarks', bookmarkItems, true);
        bookmarksEventEmitter.set('bookmark_ids', bookmarkItems);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelSet}`;
        iconSel.classList.remove('authed');
        sendNotice(`${placeholders.bookmarkUnset}`);
        iconSel.style.pointerEvents = 'none';
        assetInteractionModel(id, 'Bookmark removed');
      } else {
        const profileData = await defaultProfileClient.getMergedProfile();
        const { bookmarks = [] } = profileData;
        const bookmarkItems = bookmarks.filter((bookmark) => !isBookmarkSelected(bookmark, id));
        bookmarkItems.push(`${id}:${Date.now()}`);
        defaultProfileClient.updateProfile('bookmarks', bookmarkItems, true);
        bookmarksEventEmitter.set('bookmark_ids', bookmarkItems);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        iconSel.classList.add('authed');
        sendNotice(`${placeholders.bookmarkSet}`);
        iconSel.style.pointerEvents = 'none';
        assetInteractionModel(id, 'Bookmarked');
      }

      setTimeout(() => {
        iconSel.style.pointerEvents = 'auto';
      }, 0);
    }
  });
};

export default renderBookmark;
