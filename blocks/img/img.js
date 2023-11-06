import { createTag } from '../../scripts/scripts.js';

function imgZoomable() {
  const modalImage = Array.from(document?.querySelectorAll('.img.modal-image'));

  // Functions to open and close a modal
  function openModal(el) {
    el.classList.add('is-active');
  }

  function closeModal(el) {
    el.classList.remove('is-active');
    el.remove();
  }

  function closeAllModals() {
    (document?.querySelectorAll('.modal') || []).forEach((modal) => {
      closeModal(modal);
    });
  }

  function insertModalTemplate() {
    if (!document.querySelector('.modal')) {
      const modalTemplate = createTag(
        'div',
        { class: 'modal' },
        `<div class="modal-background"></div><div class="modal-content"><div class="img-container"></div><span class="modal-close" aria-label="close"></span></div>`,
      );
      document.body.prepend(modalTemplate);
    }
  }

  // Add a click event on images to open a specific modal
  modalImage.forEach((img) => {
    img.addEventListener('click', () => {
      insertModalTemplate();
      const modalContent = img.outerHTML;
      const target = document?.querySelector('.modal');
      const targetContent = target.querySelector('.img-container');
      targetContent.innerHTML = modalContent;
      openModal(target);

      // Add a click event on various child elements to close the parent modal
      const modalActions = document.querySelectorAll(
        '.modal-background, .modal-close',
      );
      if (modalActions.length > 0) {
        modalActions.forEach((close) => {
          const closestModal = close.closest('.modal');
          close.addEventListener('click', () => {
            closeModal(closestModal);
          });
        });
      }
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      closeAllModals();
    }
  });
}

/**
 * decorates the image element block
 * @param {Element} block the image element
 */
export default async function decorate(block) {
  const img = block?.querySelector('img');
  if (!img) {
    return;
  }
  const title = img.dataset.title || img.title;
  img.title = title;

  const picture = block.querySelector('picture');
  if (picture) {
    picture.title = title;
  }

  if (block.className.includes('w-')) {
    const [width] = block.className.match(/\d+/g);
    if (width) {
      img.style.width = `${width}px`;
    }
  }

  imgZoomable();
}
