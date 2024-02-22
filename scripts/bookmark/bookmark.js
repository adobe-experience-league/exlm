import { updateProfile } from '../data-service/profile-service.js';
import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';
import { fetchLanguagePlaceholders } from '../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const renderBookmark = (labelSel, iconSel, id) => {
  iconSel.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (id) {
      if (iconSel.classList.contains('authed')) {
        await updateProfile('bookmarks', id);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelSet}`;
        iconSel.classList.remove('authed');
        sendNotice(`${placeholders.bookmarkUnset}`);
        iconSel.style.pointerEvents = 'none';
        assetInteractionModel(id, 'Bookmark removed');
      } else {
        await updateProfile('bookmarks', id);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        iconSel.classList.add('authed');
        sendNotice(`${placeholders.bookmarkSet}`);
        iconSel.style.pointerEvents = 'none';
        assetInteractionModel(id, 'Bookmarked');
      }

      setTimeout(() => {
        iconSel.style.pointerEvents = 'auto';
      }, 3000);
    }
  });
};

export default renderBookmark;
