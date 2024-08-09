import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createPlaceholderSpan, htmlToElement } from '../../scripts/scripts.js';
import { decorateBookmark, bookmark } from './actions/playlist-bookmark-action.js';
import info from './actions/playlist-info-action.js';
import copy from './actions/playlist-copy-action.js';
// eslint-disable-next-line no-unused-vars
import { LABELS, Playlist } from './playlist-utils.js';

/**
 * create an icon span (to be used with decorateIcons())
 */
function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

function newActionButton({ labelKey, labelFallback, icons, action, onButtonReady }) {
  const iconSpans = icons.map(iconSpan).join('');
  const label = createPlaceholderSpan(labelKey, labelFallback);
  label.classList.add('playlist-action-label');
  const button = htmlToElement(`<button data-action="${action}">${iconSpans}</button>`);
  button.appendChild(label);
  if (onButtonReady) {
    onButtonReady(button);
  }
  return button;
}

/**
 *
 * @param {HTMLButtonElement} button
 * @param {Playlist}  playlist
 */
export default function decorate(button, playlist) {
  const menu = htmlToElement(`<div class="playlist-action-menu">
      <div class="playlist-actions"></div>
    </div>`);
  const actionDefs = [
    {
      labelKey: LABELS.bookmarkPlaylist,
      labelFallback: 'Bookmark Playlist',
      icons: ['bookmark', 'bookmark-active'],
      action: 'bookmark',
      onClick: bookmark,
      onButtonReady: decorateBookmark,
    },
    {
      labelKey: LABELS.copyPlaylistLink,
      labelFallback: 'Copy Link',
      icons: ['copy-link'],
      action: 'copy',
      onClick: copy,
    },
    {
      labelKey: LABELS.aboutPlaylist,
      labelFallback: 'About Playlist',
      icons: ['info'],
      action: 'info',
      onClick: info,
    },
  ];

  actionDefs.forEach((def) => {
    menu.querySelector('.playlist-actions').append(newActionButton(def));
  });

  decorateIcons(menu);

  const toggleMenu = (force) => {
    const shown = menu.classList.toggle('show', force);
    button.ariaExpanded = shown;
  };
  menu.addEventListener('click', async (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (action) {
      const targetAction = actionDefs.find((def) => def.action === action);
      if (targetAction) {
        const closeMenu = await targetAction.onClick(event, playlist);
        if (closeMenu) {
          toggleMenu(false);
        }
      }
    }
  });

  // inset menu after button
  button.parentNode.insertBefore(menu, button.nextSibling);
  button.addEventListener('click', () => {
    toggleMenu();
  });

  // close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !button.contains(event.target)) {
      toggleMenu(false);
    }
  });
}
