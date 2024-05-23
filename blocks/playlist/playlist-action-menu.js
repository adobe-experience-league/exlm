import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';

/**
 * create an icon span (to be used with decorateIcons())
 */
function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

/**
 *
 * @param {HTMLButtonElement} button
 */
export default function decorate(button) {
  const menu = htmlToElement(`<div class="playlist-action-menu">
    <div class="playlist-actions">
            <div>${iconSpan('bookmark')} Save Playlist</div>
            <div>${iconSpan('copy-link')} Share Playlist</div>
            <div>${iconSpan('info')} About Playlist</div>
        </div>
    </div>`);
  decorateIcons(menu);

  // inset menu after button
  button.parentNode.insertBefore(menu, button.nextSibling);
  button.addEventListener('click', () => {
    menu.classList.toggle('show');
  });
}
