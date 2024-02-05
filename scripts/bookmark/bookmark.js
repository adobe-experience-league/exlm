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
  if (id) {
    iconSel.addEventListener('click', async () => {
      if (iconSel.classList.contains('authed')) {
        await updateProfile('bookmarks', id);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelSet}`;
        iconSel.classList.remove('authed');
        sendNotice(`${placeholders.bookmarkUnset}`);
        iconSel.style.pointerEvents = 'none';
      } else {
        await updateProfile('bookmarks', id);
        labelSel.innerHTML = `${placeholders.bookmarkAuthLabelRemove}`;
        iconSel.classList.add('authed');
        sendNotice(`${placeholders.bookmarkSet}`);
        iconSel.style.pointerEvents = 'none';
      }

      setTimeout(() => {
        iconSel.style.pointerEvents = 'auto';
      }, 3000);
      assetInteractionModel(id, 'Bookmark');
    });
  }
};

export default renderBookmark;
