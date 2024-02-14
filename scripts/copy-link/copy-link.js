import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';

const attachCopyLink = (selector, target, info) => {
  if (!selector && !target) return;
  selector.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      const link = target.startsWith('/') ? `${window.location.origin}${target}` : target;
      navigator.clipboard.writeText(link);
      sendNotice(info);
      assetInteractionModel(e.currentTarget.dataset.id, 'Copy');
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error('Error copying link to clipboard:', err);
    }
  });
};

export default attachCopyLink;
