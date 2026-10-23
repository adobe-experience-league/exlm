/**
 * Replace Coveo native trigger nodes with styled custom notifications.
 * Pure DOM helper (inject htmlToElement) so Node unit tests import the same path production uses.
 *
 * @param {ParentNode} notificationParent Shadow host `[part="notifications"]`
 * @param {(html: string) => Element | null} htmlToElement
 */
export default function renderTriggerNotifications(notificationParent, htmlToElement) {
  if (!notificationParent || typeof htmlToElement !== 'function') return;

  notificationParent.querySelectorAll('[part="trigger-notification"]').forEach((ele) => {
    ele.remove();
  });

  const notifications = notificationParent.querySelectorAll('[part="notification"]');
  const seen = new Set();

  notifications.forEach((notification) => {
    notification.querySelector('[part="icon"]')?.remove();
    const triggerContent = notification.querySelector('[part="text"]')?.textContent?.trim();
    if (!triggerContent) return;

    // Duplicate of a payload we already converted — hide native, do not append again.
    if (seen.has(triggerContent)) {
      notification.style.display = 'none';
      return;
    }

    const triggerHTML = htmlToElement(triggerContent);
    // Conversion failed — leave the native visible as the fallback message.
    if (!triggerHTML) return;

    seen.add(triggerContent);
    triggerHTML.part = 'trigger-notification';
    if (triggerHTML.firstElementChild) {
      triggerHTML.firstElementChild.part = 'trigger-span';
    }
    triggerHTML.querySelectorAll('a').forEach((link) => {
      link.part = 'notification-link';
    });
    notificationParent.append(triggerHTML);
    notification.style.display = 'none';
  });
}
