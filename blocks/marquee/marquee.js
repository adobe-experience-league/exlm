export default function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const props = [...block.querySelectorAll(':scope div > div')];

  const backgroundPicture = props[0].innerHTML.trim();
  const backgroundImageDescr = props[1].textContent.trim();
  const subjectPicture = props[2].innerHTML.trim();
  const subjectImageDescr = props[3].textContent.trim();

  const eyebrow = props[4].textContent.trim();
  const title = props[5].textContent.trim();
  const longDescr = props[6].innerHTML.trim();
  const firstCTAType = props[7].textContent.trim();
  const firstCTAText = props[8].textContent.trim();
  const firstCTALink = props[9].textContent.trim();
  const secondCTAType = props[10].textContent.trim();
  const secondCTAText = props[11].textContent.trim();
  const secondCTALink = props[12].textContent.trim();

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='foreground'>
      <div class='text'>
        ${eyebrow ? `<div class='eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
        <div class='title'>${title}</div>
        <div class='long-description'>${longDescr}</div>
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
      ${subjectPicture ? `<div class='subject'>${subjectPicture}</div>` : `<div class='spacer'></div>`}
      </div>
    </div>
    <div class='background'>${backgroundPicture}</div>
  `);

  // set image description
  if (backgroundImageDescr) {
    teaserDOM.querySelector('.background picture img').setAttribute('alt', backgroundImageDescr);
  }

  if (subjectPicture && subjectImageDescr) {
    teaserDOM.querySelector('.foreground .subject picture img').setAttribute('alt', subjectImageDescr);
  }

  // add final teaser DOM
  block.textContent = '';
  block.append(teaserDOM);
}
