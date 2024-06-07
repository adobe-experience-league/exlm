import { htmlToElement } from '../../../scripts/scripts.js';

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
 * @param {Event} event
 * @param {Playlist} playlist
 */
export default function info(event, playlist) {
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
