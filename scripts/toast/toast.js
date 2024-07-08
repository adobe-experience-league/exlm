let isNoticeVisible = false;

const noticeTemplate = (info) => {
  const noticeContent = document.createElement('div');
  noticeContent.className = 'exl-toast';
  noticeContent.innerHTML = `<div class="icon-info"></div>
            <div class="exl-toast-content">${info}</div>
            <div class="icon-close"></div>`;
  return noticeContent;
};

// eslint-disable-next-line
export const tooltipTemplate = (sel, label = '', tiptext) => {
  const tooltipContent = `<div class="exl-tooltip">
          <span class="${sel}"></span>
          <span class="exl-tooltip-label">${tiptext}</span></div>
          <span class="exl-link-label">${label}</span>`;
  return tooltipContent;
};

export const sendNotice = (noticelabel) => {
  if (isNoticeVisible) return;

  const sendNoticeContent = noticeTemplate(noticelabel);
  const dialog = document.querySelector('dialog');
  if (dialog && dialog.open) {
    dialog.prepend(sendNoticeContent);
  } else {
    document.body.prepend(sendNoticeContent);
  }
  isNoticeVisible = true;

  const isExlNotice = document.querySelector('.exl-toast');
  if (isExlNotice) {
    document.querySelector('.exl-toast .icon-close').addEventListener('click', () => {
      isExlNotice.remove();
      isNoticeVisible = false;
    });

    setTimeout(() => {
      isExlNotice.remove();
      isNoticeVisible = false;
    }, 3000);
  }
};
