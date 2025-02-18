import decorateCustomButtons from '../../scripts/utils/button-utils.js';

/* eslint-disable no-plusplus */
export default function decorate(block) {
  // get the first and only cell from each row
  // Extract properties, always same order as in model, empty string if not set
  const [pictureContainer, eyebrow, title, description, firstCta, secondCta] = [...block.children].map(
    (row) => row.firstElementChild,
  );
  const picture = pictureContainer.querySelector('picture');

  // Build DOM
  const mediaDOM = document.createRange().createContextualFragment(`
    <div class='image'>${picture ? picture.outerHTML : ''}</div>
    <div class='text'>
      ${
        eyebrow.textContent.trim() !== ''
          ? `<div class='eyebrow'>${eyebrow.textContent.trim().toUpperCase()}</div>`
          : ``
      }
      <div class='title'>${title.innerHTML}</div>
      <div class='description'>${description.innerHTML}</div>
      <div class='cta'>${decorateCustomButtons(firstCta, secondCta)}</div>
    </div>
  `);

  // attach DOM
  block.textContent = '';
  block.append(mediaDOM);
}
