import { htmlToElement } from '../scripts.js';
import { sendNotice } from '../toast/toast.js';
import { assetInteractionModel } from '../analytics/lib-analytics.js';

/**
 * Copies text to the clipboard and shows a toast notification.
 *
 * @param {Object} params - Parameters for copying to clipboard.
 * @param {string} params.assetId - Page Id.
 * @param {string} params.text - Text to be copied to the clipboard.
 * @param {string} params.toastText - Text to be displayed in a toast notification.
 */
export function copyToClipboard({ assetId = '', text, toastText }) {
  try {
    navigator.clipboard.writeText(text);
    if (toastText) {
      sendNotice(toastText);
    }
    assetInteractionModel(assetId, 'Copy');
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Error copying link to clipboard:', err);
  }
}

/**
 * Handles the copy action by formatting the link and calling copyToClipboard.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.id - Page Id
 * @param {string} config.link - The link to be copied.
 * @param {string} config.tooltip - Tooltip to be displayed in a toast notification.
 */
export function copyHandler(config) {
  const { id, link, tooltip } = config;
  if (link) {
    const text = link.startsWith('/') ? `${window.location.origin}${link}` : link;
    copyToClipboard({
      assetId: id,
      text,
      toastText: tooltip?.copyToastText,
    });
  }
}

/**
 * Adds a tooltip to a given element to indicate a "Copy Link" action.
 *
 * @param {Object} config - The configuration object for the decoration.
 * @param {HTMLElement} config.element - The DOM element to which the tooltip will be appended.
 * @param {Object} config.tooltip - Optional tooltip configuration.
 * @param {string} config.tooltip.copyTooltip - Optional custom text for the copy tooltip. Defaults to 'Copy Link'.
 */
export async function decorateCopyLink(config) {
  const { element, tooltip } = config;
  const copyTooltip = htmlToElement(`<span class="action-tooltip">${tooltip?.copyTooltip || 'Copy Link'}</span>`);
  element.appendChild(copyTooltip);
}
