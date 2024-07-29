export const tooltipTemplate = (sel, label = '', tiptext = '') => {
  const tooltipContent = `<div class="exl-tooltip">
          <span class="${sel}"></span>
          <span class="exl-tooltip-label">${tiptext}</span></div>
          <span class="exl-link-label">${label}</span>`;
  return tooltipContent;
};

const noticeTemplate = (info, status) => {
  const noticeContent = document.createElement('div');
  noticeContent.className = `exl-toast exl-toast-${status}`;
  noticeContent.innerHTML = `<div class="icon-info"></div>
            <div class="exl-toast-content">${info}</div>
            <div class="icon-close"></div>`;
  return noticeContent;
};

export const sendNotice = (message, type = 'success') => {
  const existingToast = document.querySelector('.exl-toast');
  if (existingToast) existingToast.remove();

  const notificationElement = noticeTemplate(message, type);
  const dialogElement = document.querySelector('dialog');
  if (dialogElement && dialogElement.open) {
    dialogElement.prepend(notificationElement);
  } else {
    document.body.prepend(notificationElement);
  }

  notificationElement.querySelector('.icon-close').addEventListener('click', () => {
    notificationElement.remove();
  });

  setTimeout(() => {
    notificationElement.remove();
  }, 3000);
};
