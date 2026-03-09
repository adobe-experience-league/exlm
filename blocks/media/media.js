import decorateCustomButtons from '../../scripts/utils/button-utils.js';

/* eslint-disable no-plusplus */
export function generateMediaDOM(props) {
  // Extract properties, always same order as in model, empty string if not set
  const [pictureContainer, eyebrow, title, description, firstCta, secondCta] = props;
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

  return mediaDOM;
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const mediaDOM = generateMediaDOM(props);
  block.textContent = '';
  block.append(mediaDOM);
}
