import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
// eslint-disable-next-line no-unused-vars
import { Playlist } from './mpc-util.js';

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

function bookmark() {
  // eslint-disable-next-line no-console
  console.log('bookmark');
}

function copy() {
  // copy current window path
  navigator.clipboard.writeText(window.location.href);
  // eslint-disable-next-line no-console
  console.log('copy');
}

/**
 * @param {Playlist} playlist
 */
function info(playlist) {
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
}

/**
 *
 * @param {HTMLButtonElement} button
 * @param {Playlist}  playlist
 */
export default function decorate(button, playlist) {
  const menu = htmlToElement(`<div class="playlist-action-menu">
    <div class="playlist-actions">
            <button data-action="bookmark">${iconSpan('bookmark')}<span>&nbsp;Save Playlist</span></button>
            <button data-action="copy">${iconSpan('copy-link')}<span>&nbsp;Copy Link</span></button>
            <button data-action="info">${iconSpan('info')}<span>&nbsp;&nbsp;About Playlist</span></button>
        </div>
    </div>`);
  decorateIcons(menu);

  const toggleMenu = (force) => {
    const shown = menu.classList.toggle('show', force);
    button.ariaExpanded = shown;
  };

  const actions = {
    bookmark,
    copy,
    info,
  };

  menu.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (action) {
      toggleMenu(false);
      if (actions[action]) {
        actions[action](playlist);
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
