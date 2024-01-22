/* eslint-disable no-plusplus */
export function generateTeaserDOM(props, isChild) {
  // Extract properties, always same order as in model, empty string if not set
  let classes = null;
  let count = 0;
  const picture = props[count++].innerHTML.trim();
  if (isChild) classes = props[count++].textContent.trim();
  const eyebrow = props[count++].textContent.trim();
  const title = props[count++].textContent.trim();
  const longDescr = props[count++].innerHTML.trim();
  const shortDescr = props[count++];
  const backgroundColor = props[count++].textContent.trim();
  const firstCTA = props[count++].firstElementChild;
  const secondCTA = props[count++].firstElementChild;

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='background'>${picture}</div>
    <div class='foreground'>
      <div class='text'>
        ${eyebrow ? `<div class='eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
        <div class='title'>${title}</div>
        <div class='long-description'>${longDescr}</div>
        <div class='short-description'>${
          shortDescr.textContent.trim() !== '' ? shortDescr.innerHTML.trim() : longDescr
        }</div>
        <div class='cta'>
          ${firstCTA ? firstCTA.outerHTML : ``}
          ${secondCTA ? secondCTA.outerHTML : ``}
        </div>
      </div>
      <div class='spacer'>
      </div>
    </div>
  `);

  // set image description
  if (imageDescr) {
    teaserDOM.querySelector('.background picture img').setAttribute('alt', imageDescr);
  }

  // set the mobile background color
  if (backgroundColor) {
    teaserDOM.querySelector('.foreground').style.setProperty('--teaser-background-color', `var(${backgroundColor})`);
  }

  // add final teaser DOM and classes if used as child component
  return { teaserDOM, classes };
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const { teaserDOM } = generateTeaserDOM(props, false);
  block.textContent = '';
  block.append(teaserDOM);
}
