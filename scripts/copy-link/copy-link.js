import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';

const attachCopyLink = (selector, target, info) => {
  if (selector) {
    selector.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(target);
      sendNotice(info);
      assetInteractionModel(e.currentTarget.dataset.id, 'Copy');
    });
  }
};

export default attachCopyLink;
