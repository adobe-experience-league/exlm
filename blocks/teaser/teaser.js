function decorateButtons(...buttons) {
  return buttons
    .map((div) => {
      const a = div.querySelector('a');
      if (a) {
        a.classList.add('button');
        if (a.parentElement.tagName === 'EM') a.classList.add('secondary');
        if (a.parentElement.tagName === 'STRONG') a.classList.add('primary');
        return a.outerHTML;
      }
      return '';
    })
    .join('');
}

function generateDefaultTeaser(props, classes) {
  // Extract properties, always same order as in model, empty string if not set
  const [pictureContainer, eyebrow, title, longDescr, shortDescr, firstCta, secondCta] = props;
  const picture = pictureContainer.querySelector('picture');
  const hasShortDescr = shortDescr.textContent.trim() !== '';

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='background'>${picture ? picture.outerHTML : ''}</div>
    <div class='foreground'>
      <div class='text'>
        ${
          eyebrow.textContent.trim() !== ''
            ? `<div class='eyebrow'>${eyebrow.textContent.trim().toUpperCase()}</div>`
            : ``
        }
        <div class='title'>${title.innerHTML}</div>
        <div class='long-description'>${longDescr.innerHTML}</div>
        <div class='short-description'>${hasShortDescr ? shortDescr.innerHTML : longDescr.innerHTML}</div>
        <div class='cta'>${decorateButtons(firstCta, secondCta)}</div>
      </div>
      <div class='spacer'>
      </div>
    </div>
  `);

  // set the mobile background color
  const backgroundColor = [...classes].find((cls) => cls.startsWith('bg-'));
  if (backgroundColor) {
    teaserDOM
      .querySelector('.foreground')
      .style.setProperty('--teaser-background-color', `var(--${backgroundColor.substr(3)})`);
  }

  // add final teaser DOM and classes if used as child component
  return teaserDOM;
}

// eslint-disable-next-line no-unused-vars
function generateDetailedTeaser(props, classes) {
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

/* eslint-disable no-plusplus */
export function generateTeaserDOM(props, classes) {
  // check if we have to render teaser or a detailed teaser
  return [...classes].includes('detailed-teaser')
    ? generateDetailedTeaser(props, classes)
    : generateDefaultTeaser(props, classes);
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const teaserDOM = generateTeaserDOM(props, block.classList);
  block.textContent = '';
  block.append(teaserDOM);
}
