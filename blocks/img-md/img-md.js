/* TODO: This is obselete and should be removed when all pages have been seeded and the old badge is no longer used */

import { htmlToElement } from '../../scripts/scripts.js';

const IMAGE_MODAL_CLASS = 'img-modal';
const IMAGE_MODAL_SELECTOR = `.${IMAGE_MODAL_CLASS}`;

function imgZoomable(clickTargetEl, modalContentHtml) {
  function openModal(el) {
    el.classList.add('is-active');
    // prevent page scroll through modal
    document.body.style.overflow = 'hidden';
  }

  function closeModal(el) {
    el.classList.remove('is-active');
    // reset body overflow
    document.body.style.overflow = '';
    el.remove();
  }

  function closeAllModals() {
    (document?.querySelectorAll(IMAGE_MODAL_SELECTOR) || []).forEach((modal) => {
      closeModal(modal);
    });
  }

  function insertModalTemplate() {
    if (!document.querySelector(IMAGE_MODAL_SELECTOR)) {
      const modalTemplate = htmlToElement(`
        <div class="${IMAGE_MODAL_CLASS}">
          <div class="img-modal-background"></div>
          <div class="img-modal-content">
            <div class="img-container">
            </div><span class="img-modal-close" aria-label="close"></span>
          </div>
        </div>
      `);
      document.body.prepend(modalTemplate);
    }
  }

  clickTargetEl.addEventListener('click', () => {
    insertModalTemplate();
    const target = document?.querySelector(IMAGE_MODAL_SELECTOR);
    const targetContent = target.querySelector('.img-container');
    targetContent.innerHTML = modalContentHtml;
    openModal(target);

    const modalActions = document.querySelectorAll('.img-modal-background, .img-modal-close');
    if (modalActions.length > 0) {
      modalActions.forEach((close) => {
        const closestModal = close.closest(IMAGE_MODAL_SELECTOR);
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

  // needed here to insert as is to modal in case of zoomable image
  const blockHTML = block.innerHTML;

  classNames.forEach((className) => {
    if (className.includes('w-')) {
      const [width] = className.match(/\d+/g);
      if (width) {
        img.style.width = `${width}px`;
      }
    } else if (className === 'modal-image') {
      block.classList.add(className);
      imgZoomable(block, blockHTML);
    } else if (className.includes('align')) {
      block.classList.add(className);
    }
  });
}
