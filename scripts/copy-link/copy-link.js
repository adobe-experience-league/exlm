import { sendNotice } from '../toast/toast.js';

const renderCopyLink = (selector, target, info) => {
  if (selector) {
    selector.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(target);
      sendNotice(info);
    });
  }
};

export default renderCopyLink;
