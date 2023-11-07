export default function decorate(block) {
  // 1. extract properties (always same order as in model)
  const image = block.querySelector('div:nth-child(1) > div').innerHTML.trim();
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
  const firstCTANewTab = block
    .querySelector('div:nth-child(11) > div')
    .textContent.trim();
  const secondCTAType = block
    .querySelector('div:nth-child(12) > div')
    .textContent.trim();
  const secondCTAText = block
    .querySelector('div:nth-child(13) > div')
    .textContent.trim();
  const secondCTALink = block
    .querySelector('div:nth-child(14) > div')
    .textContent.trim();
  const secondCTANewTab = block
    .querySelector('div:nth-child(15) > div')
    .textContent.trim();

  // 2. build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='teaser'>
      <div class='text'>
        ${
          eyebrow
            ? `<div itemprop='eyebrow' itemtype='text' class='eyebrow'>${eyebrow}</div>`
            : ''
        }
        <div itemprop='title' itemtype='text' class='title'>${title}</div>
        <div itemprop='longDescr' itemtype='text' class='long-description'>${longDescr}</div>
        <div itemprop='shortDescr' itemtype='text' class='short-description'>${shortDescr}</div>
        <div class='cta'>
          ${
            firstCTAText !== '' && firstCTALink !== ''
              ? `<a itemprop='cta1Text' itemtype='text' class='button ${firstCTAType}' ${
                  firstCTANewTab === 'true' ? `target='_blank'` : ''
                } 
            href='${firstCTALink}'>${firstCTAText}</a>`
              : ``
          }
          ${
            secondCTAText !== '' && secondCTALink !== ''
              ? `<a itemprop='cta2Text' itemtype='text' class='button ${secondCTAType}' ${
                  secondCTANewTab === 'true' ? `target='_blank'` : ''
                } 
           href='${secondCTALink}'>${secondCTAText}</a>`
              : ``
          }
        </div>
      </div>
      <div class='image'>
          ${image}
      </div>
    </div>
  `);

  // add the image description
  if (imageDescr) {
    teaserDOM
      .querySelector('.image picture img')
      .setAttribute('alt', imageDescr);
  }

  // set the mobile background
  teaserDOM
    .querySelector('.teaser')
    .style.setProperty('--teaser-background-color', `var(${backgroundColor})`);

  // 3. add DOM
  block.textContent = '';
  block.append(teaserDOM);
}
