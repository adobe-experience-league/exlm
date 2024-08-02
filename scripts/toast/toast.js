// eslint-disable-next-line import/no-cycle
import { htmlToElement } from '../scripts.js';

/**
 * Create toast message HTML
 * @param {string} message
 * @param {'success'|'error'} type
 * @returns
 */
const newToastElement = (message, type) => {
  const el = htmlToElement(`
    <div class="exl-toast exl-toast-${type}">
      <div class="icon-info"></div>
      <div class="exl-toast-content">${message}</div>
      <div class="icon-close"></div>
    <div>`);
  el.querySelector('.icon-close').addEventListener('click', () => el.remove());
  return el;
};

/**
 * Show a toast message
 * @param {string} message
 * @param {'success'|'error'} type
 * @param {number} duration
 */
// eslint-disable-next-line import/prefer-default-export
export const sendNotice = (message, type = 'success', duration = 3000) => {
  // Remove existing toast
  document.querySelector('.exl-toast')?.remove();
  // add new toast
  const toastEl = newToastElement(message, type);
  const dialogElement = document.querySelector('dialog');
  if (dialogElement && dialogElement.open) {
    dialogElement.prepend(toastEl);
  } else {
    document.body.prepend(toastEl);
  }
  // Remove toast after duration
  setTimeout(() => toastEl.remove(), duration);
};
