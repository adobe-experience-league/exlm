import { decorateButtons } from "../teaser/teaser.js";

// eslint-disable-next-line no-unused-vars
export function generateDetailedTeaserDOM(props, classes) {
  // Extract properties, always same order as in model, empty string if not set
  const [backImage, eyebrowContent, title, description, subjectImage, firstCta, secondCta] = props;
  const backPicture = backImage.querySelector('picture');
  const subjectPicture = subjectImage.querySelector('picture');
  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='background'>${backPicture ? backPicture.outerHTML : ''}</div>
    <div class='foreground'>
      <div class='text'>
        ${eyebrowContent.innerHTML}
        <div class='title'>${title.innerHTML}</div>
        <div class='long-description'>${description.innerHTML}</div>
        <div class='cta'>${decorateButtons(firstCta, secondCta)}</div>
      </div>
      <div class='spacer'>
        ${subjectPicture ? subjectPicture.outerHTML : ''}
      </div>
    </div>
  `);
  // add final teaser DOM and classes if used as child component
  return teaserDOM;
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const teaserDOM = generateDetailedTeaserDOM(props, block.classList);
  block.textContent = '';
  block.append(teaserDOM);
}
