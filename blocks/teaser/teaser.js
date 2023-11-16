export function generateTeaserDOM(props) {
  // Extract properties, always same order as in model, empty string if not set
  const picture = props[0].innerHTML.trim();
  const imageDescr = props[1].textContent.trim();
  const eyebrow = props[2].textContent.trim();
  const title = props[3].textContent.trim();
  const longDescr = props[4].innerHTML.trim();
  const shortDescr = props[5];
  const backgroundColor = props[6].textContent.trim();
  const firstCTAType = props[7].textContent.trim();
  const firstCTAText = props[8].textContent.trim();
  const firstCTALink = props[9].textContent.trim();
  const secondCTAType = props[10].textContent.trim();
  const secondCTAText = props[11].textContent.trim();
  const secondCTALink = props[12].textContent.trim();

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
        <div class='cta'>${
          firstCTAText && firstCTALink
            ? `<a class='button ${firstCTAType}' href='${firstCTALink}'>${firstCTAText}</a>`
            : ``
        }${
          secondCTAText && secondCTALink
            ? `<a class='button ${secondCTAType}' href='${secondCTALink}'>${secondCTAText}</a>`
            : ``
        }</div>
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

  // add final teaser DOM
  return teaserDOM;
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const teaserDOM = generateTeaserDOM(props);
  block.textContent = '';
  block.append(teaserDOM);
}
