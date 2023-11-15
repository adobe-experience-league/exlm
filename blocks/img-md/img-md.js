import { createTag } from '../../scripts/scripts.js';

function imgZoomable(modalImage) {
  function openModal(el) {
    el.classList.add('is-active');
  }

  function closeModal(el) {
    el.classList.remove('is-active');
    el.remove();
  }

  function closeAllModals() {
    (document?.querySelectorAll('.img-modal') || []).forEach((modal) => {
      closeModal(modal);
    });
  }

  function insertModalTemplate() {
    if (!document.querySelector('.img-modal')) {
      const modalTemplate = createTag(
        'div',
        { class: 'img-modal' },
        `<div class="img-modal-background"></div><div class="img-modal-content"><div class="img-container"></div><span class="img-modal-close" aria-label="close"></span></div>`,
      );
      document.body.prepend(modalTemplate);
    }
  }

  modalImage.addEventListener('click', () => {
    insertModalTemplate();
    const modalContent = modalImage.outerHTML;
    const target = document?.querySelector('.img-modal');
    const targetContent = target.querySelector('.img-container');
    targetContent.innerHTML = modalContent;
    openModal(target);

    const modalActions = document.querySelectorAll('.img-modal-background, .img-modal-close');
    if (modalActions.length > 0) {
      modalActions.forEach((close) => {
        const closestModal = close.closest('.img-modal');
        close.addEventListener('click', () => {
          closeModal(closestModal);
        });
      });
    }
  });

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
  let img = block?.querySelector('img');
  if (!img || block.children.length < 2) {
    return;
  }

  const classNames = block.firstElementChild?.firstElementChild?.textContent?.split(' ');
  if (!classNames) {
    return;
  }
  const title = img.dataset.title || img.title;
  img.title = title;
  const picture = block.querySelector('picture');
  if (picture) {
    picture.title = title;
  }
  block.removeChild(block.firstElementChild);
  if (block.firstElementChild?.tagName === 'DIV') {
    const imgElement = picture || block.querySelector('img');
    block.innerHTML = imgElement.outerHTML;
    img = block.querySelector('img');
  }

  classNames.forEach((className) => {
    if (className.includes('w-')) {
      const [width] = className.match(/\d+/g);
      if (width) {
        img.style.width = `${width}px`;
      }
    } else if (className === 'modal-image') {
      block.classList.add(className);
      imgZoomable(block);
    } else if (className.includes('align')) {
      block.classList.add(className);
    }
  });
}
