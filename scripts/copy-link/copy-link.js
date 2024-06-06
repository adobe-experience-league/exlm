import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';

/**
 *
 * @param {Event} event
 * @param {*} textToCopy
 * @param {*} info
 */
export function copyToClipboard({ assetId, text, toastNoticeText }) {
  try {
    navigator.clipboard.writeText(text);
    if (toastNoticeText) {
      sendNotice(toastNoticeText);
    }
    assetInteractionModel(assetId, 'Copy');
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Error copying link to clipboard:', err);
  }
}

const attachCopyLink = (selector, target, info) => {
  if (!selector && !target) return;
  selector.addEventListener('click', (e) => {
    e.preventDefault();
    copyToClipboard({
      assetId: e.currentTarget.dataset.id,
      text: target.startsWith('/') ? `${window.location.origin}${target}` : target,
      toastNoticeText: info,
    });
  });
};

export default attachCopyLink;
