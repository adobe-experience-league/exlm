// eslint-disable-next-line import/no-cycle
import { decorateIcons } from '../lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch {
  placeholders = {};
}

const iconMapping = {
  info: 'info-filled-light',
  success: 'check-circle',
  error: 'warning-light',
};

/**
 * Create toast message HTML
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @returns
 */
const newToastElement = (message, type, icon) => {
  const el = htmlToElement(`
    <div class="exl-toast exl-toast-${type}">
      <div class="exl-toast-icon">
        <span class="icon icon-${icon}"></span>
      </div>
      <div class="exl-toast-content">${message}</div>
      <div class="icon-close"></div>
    <div>`);
  el.querySelector('.icon-close').addEventListener('click', () => el.remove());
  decorateIcons(el);
  return el;
};

/**
 * Show a toast message
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @param {number} duration
 */
export const sendNotice = (message, type = 'success', duration = 3000, icon = iconMapping[type]) => {
  // Remove existing toast
  document.querySelector('.exl-toast')?.remove();
  // add new toast
  const toastEl = newToastElement(message, type, icon);
  const dialogElement = document.querySelector('dialog');
  if (dialogElement && dialogElement.open) {
    dialogElement.prepend(toastEl);
  } else {
    document.body.prepend(toastEl);
  }
  // Remove toast after duration
  setTimeout(() => toastEl.remove(), duration);
};

export const sendProfileSaveError = async () => {
  sendNotice(
    placeholders?.profileSaveFailed || "Your changes weren't saved. Please refresh the page and try again.",
    'error',
    3000,
    'close-white',
  );
};
