export default function decorate(block) {
  // Extract properties (always same order as in model)
  const pictureElem = block.querySelector('div:nth-child(1) > div picture');
  const imageDescr = block
    .querySelector('div:nth-child(2) > div')
    .textContent.trim();
  const eyebrow = block
    .querySelector('div:nth-child(3) > div')
    .textContent.trim()
    .toUpperCase();
  const title = block
    .querySelector('div:nth-child(4) > div')
    .textContent.trim();
  const longDescr = block.querySelector('div:nth-child(5) > div').innerHTML;
  const shortDescr = block.querySelector('div:nth-child(6) > div').innerHTML;
  const backgroundColor = block
    .querySelector('div:nth-child(7) > div')
    .textContent.trim();
  const firstCTAType = block
    .querySelector('div:nth-child(8) > div')
    .textContent.trim();
  const firstCTAText = block
    .querySelector('div:nth-child(9) > div')
    .textContent.trim();
  const firstCTALink = block
    .querySelector('div:nth-child(10) > div')
    .textContent.trim();
  const secondCTAType = block
    .querySelector('div:nth-child(11) > div')
    .textContent.trim();
  const secondCTAText = block
    .querySelector('div:nth-child(12) > div')
    .textContent.trim();
  const secondCTALink = block
    .querySelector('div:nth-child(13) > div')
    .textContent.trim();

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='foreground'>
      <div class='text'>
        <div class='eyebrow'>${eyebrow}</div>
        <div class='title'>${title}</div>
        <div class='long-description'>${longDescr}</div>
        <div class='short-description'>${
          shortDescr === '' ? shortDescr : longDescr
        }</div>
        <div class='cta'>${
          firstCTAText !== '' && firstCTALink !== ''
            ? `<a class='button ${firstCTAType}' href='${firstCTALink}'>${firstCTAText}</a>`
            : ``
        }${
          secondCTAText !== '' && secondCTALink !== ''
            ? `<a class='button ${secondCTAType}' href='${secondCTALink}'>${secondCTAText}</a>`
            : ``
        }
        </div>
      </div>
      <div class='spacer'>
      </div>
    </div>
    <div class='background'>
    </div>
  `);

  // add image
  if (pictureElem) {
    teaserDOM.querySelector('.background').append(pictureElem);
  }

  // add the image description
  if (imageDescr) {
    teaserDOM
      .querySelector('.background picture img')
      .setAttribute('alt', imageDescr);
  }

  // set the mobile background color
  block.style.setProperty(
    '--teaser-background-color',
    `var(${backgroundColor})`,
  );

  // add final teaser DOM
  block.textContent = '';
  block.append(teaserDOM);
}
