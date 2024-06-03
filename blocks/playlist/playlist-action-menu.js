import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { copyToClipboard } from '../../scripts/copy-link/copy-link.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createPlaceholderSpan, fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';
// eslint-disable-next-line no-unused-vars
import { Playlist } from './mpc-util.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * @param {HTMLElement} content
 * @returns {HTMLDialogElement} modal
 */
function createModal(contentEl, show) {
  let modal = document.querySelector('.playlist-modal');
  if (!modal) {
    modal = htmlToElement(`<dialog class="playlist-modal">
        <button autofocus class="playlist-modal-close"><span aria-label="close"></button>
        <div class="playlist-modal-content"></div>
      </dialog>`);
    document.body.prepend(modal);
    document.body.style.overflow = 'hidden';
    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
    modal.addEventListener('click', (event) => event.target === modal && modal.close());
    modal.querySelector('button').addEventListener('click', () => modal.close());
    document.addEventListener('keydown', (event) => event.code === 'Escape' && modal.close());
  }
  // remove existing content
  const content = modal.querySelector('.playlist-modal-content');
  content.innerHTML = '';
  // add new content
  content.appendChild(contentEl);
  if (show) modal.showModal();
  return modal;
}

/**
 * create an icon span (to be used with decorateIcons())
 */
function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

async function bookmark() {
  const signedIn = await isSignedInUser();
  if (!signedIn) {
    return false;
  }
  defaultProfileClient.updateProfile('bookmarks', window.location.href);
  return true;
}

function copy() {
  copyToClipboard({
    text: window.location.href,
    toastNoticeText: placeholders.toastSet,
  });
  return true;
}

/**
 * @param {Event} event
 * @param {Playlist} playlist
 */
function info(event, playlist) {
  // eslint-disable-next-line no-console
  createModal(
    htmlToElement(`
  <div>
    <h3>${playlist.title}</h3>
    <p>${playlist.description}<p>
  </div>
  `),
    true,
  );
  return true;
}

/**
 * @param {HTMLButtonElement} bookmarkButton
 */
export async function decorateBookmark(bookmarkButton) {
  const tooltip = createPlaceholderSpan('bookmarkUnauthTipText', 'Sign-in to bookmark', (span) => {
    span.classList.add('exl-tooltip-label');
  });

  bookmarkButton.appendChild(tooltip);

  // const isSignedIn = await isSignedInUser();
  // if (isSignedIn) {
  //   bookmarkButton.appendChild(authBookmark);
  //   const bookmarkAuthedToolTipLabel = authBookmark.querySelector('.exl-tooltip-label');
  //   const bookmarkAuthedToolTipIcon = authBookmark.querySelector('.bookmark-icon');
  //   loadJWT().then(async () => {
  //     defaultProfileClient.getMergedProfile().then(async (data) => {
  //       if (data.bookmarks.includes(bookmarkId)) {
  //         bookmarkAuthedToolTipIcon.classList.add('authed');
  //         bookmarkAuthedToolTipLabel.innerHTML = placeholders.bookmarkAuthLabelRemove;
  //       }
  //     });

  //     renderBookmark(bookmarkAuthedToolTipLabel, bookmarkAuthedToolTipIcon, bookmarkId);
  //   });
  // } else {
  //   bookmarkButton.appendChild(unAuthBookmark);
  // }
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
      labelKey: 'bookmarkPlaylist',
      labelFallback: 'Bookmark Playlist',
      icons: ['bookmark', 'bookmark-active'],
      action: 'bookmark',
      onClick: bookmark,
      onButtonReady: decorateBookmark,
    },
    {
      labelKey: 'copyPlaylistLink',
      labelFallback: 'Copy Link',
      icons: ['copy-link'],
      action: 'copy',
      onClick: copy,
    },
    {
      labelKey: 'aboutPlaylist',
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
