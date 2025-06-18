import { waitFor, CUSTOM_EVENTS } from './atomic-search-utils.js';
import { htmlToElement } from '../../../scripts/scripts.js';

let isListenerAdded = false;
export default function atomicNotificationHandler(baseElement) {
  if (!baseElement) return;
  const shadowElement = baseElement.shadowRoot;
  // If shadow DOM is not ready, retry after a delay
  if (!shadowElement?.firstElementChild) {
    waitFor(() => {
      atomicNotificationHandler(baseElement);
    });
    return;
  }
  const notificationParent = shadowElement?.querySelector('[part="notifications"]');
  if (!notificationParent) return;
  const notifications = notificationParent?.querySelectorAll('[part="notification"]');
  if (!notifications) return;

  notifications.forEach((notification) => {
    notification?.querySelector('[part="icon"]')?.remove();
    // Get notification element text content which contains HTML for the notification
    const triggerContent = notification?.querySelector('[part="text"]')?.textContent?.trim();
    if (!triggerContent) return;
    // Convert text content to HTML element
    const triggerHTML = htmlToElement(triggerContent);
    if (!triggerHTML) return;
    // Set part attributes for styling
    triggerHTML.part = 'trigger-notification';
    triggerHTML.firstElementChild.part = 'trigger-span';
    const links = triggerHTML.querySelectorAll('a');
    if (links) {
      links.forEach((link) => {
        link.part = 'notification-link';
      });
    }
    notificationParent.append(triggerHTML);
    notification.style.display = 'none';
  });

  const onSearchQueryChange = () => {
    // Remove existing trigger notifications
    baseElement?.shadowRoot?.querySelectorAll('[part="trigger-notification"]')?.forEach((ele) => {
      ele.remove();
    });
    // Re-process notifications
    atomicNotificationHandler(baseElement);
  };
  if (!isListenerAdded) {
    document.addEventListener(CUSTOM_EVENTS.SEARCH_QUERY_CHANGED, onSearchQueryChange);
    document.addEventListener(CUSTOM_EVENTS.NO_RESULT_FOUND, onSearchQueryChange);
    isListenerAdded = true;
  }
}
