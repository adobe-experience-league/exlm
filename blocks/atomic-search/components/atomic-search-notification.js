import { waitFor, CUSTOM_EVENTS } from './atomic-search-utils.js';
import { htmlToElement } from '../../../scripts/scripts.js';
import renderTriggerNotifications from './atomic-search-notification-render.js';

let isListenerAdded = false;

/**
 * Replace Coveo's encoded trigger HTML with styled custom nodes.
 * Idempotent: always clears previous custom triggers before appending so
 * RESULT_FOUND → commonActionHandler (and multi-fire QUERY_CHANGED) cannot stack duplicates.
 */
export function renderAtomicTriggerNotifications(baseElement) {
  if (!baseElement) return;
  const shadowElement = baseElement.shadowRoot;
  if (!shadowElement?.firstElementChild) return;

  const notificationParent = shadowElement.querySelector('[part="notifications"]');
  if (!notificationParent) return;

  renderTriggerNotifications(notificationParent, htmlToElement);
}

export default function atomicNotificationHandler(baseElement) {
  if (!baseElement) return;
  const shadowElement = baseElement.shadowRoot;
  if (!shadowElement?.firstElementChild) {
    waitFor(() => {
      atomicNotificationHandler(baseElement);
    });
    return;
  }

  renderAtomicTriggerNotifications(baseElement);

  if (!isListenerAdded) {
    const onSearchQueryChange = () => {
      renderAtomicTriggerNotifications(baseElement);
    };
    document.addEventListener(CUSTOM_EVENTS.SEARCH_QUERY_CHANGED, onSearchQueryChange);
    document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, onSearchQueryChange);
    isListenerAdded = true;
  }
}
