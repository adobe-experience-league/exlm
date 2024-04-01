import { createOptimizedPicture } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { htmlToElement } from './scripts.js';

/**
 * @param {HTMLImageElement} picture
 */
export default function showImageModal(img) {
  let modal = document.querySelector('.image-modal');
  if (!modal) {
    modal = htmlToElement(`<dialog class="image-modal">
        <button autofocus class="image-modal-close"><span aria-label="close"></button>
        <div class="image-modal-content"></div>
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
  const content = modal.querySelector('.image-modal-content');
  content.innerHTML = '';
  // add new content
  const picture = createOptimizedPicture(img.src, img.alt);
  content.appendChild(picture);
  modal.showModal();
}
