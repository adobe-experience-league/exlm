import { copyToClipboard } from '../../../scripts/user-actions/copy-link.js';
import { fetchLanguagePlaceholders } from '../../../scripts/scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export default function copy() {
  copyToClipboard({
    text: window.location.href,
    toastText: placeholders.userActionCopylinkToastText,
  });
  return true;
}
