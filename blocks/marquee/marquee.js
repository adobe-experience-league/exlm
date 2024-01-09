import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const props = [...block.querySelectorAll(':scope div > div')];

  const subjectPicture = props[0].innerHTML.trim();
  const subjectImageDescr = props[1].textContent.trim();
  const bgColor = props[2].textContent.trim();
  const eyebrow = props[3].textContent.trim();
  const title = props[4].textContent.trim();
  const longDescr = props[5].innerHTML.trim();
  const firstCTAType = props[6].textContent.trim();
  const firstCTAText = props[7].textContent.trim();
  const firstCTALink = props[8].textContent.trim();
  const secondCTAType = props[9].textContent.trim();
  const secondCTAText = props[10].textContent.trim();
  const secondCTALink = props[11].textContent.trim();

  // Build DOM
  const marqueeDOM = document.createRange().createContextualFragment(`
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${eyebrow ? `<div class='marquee-eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
        <div class='marquee-title'>${title}</div>
        <div class='marquee-long-description'>${longDescr}</div>
        <div class='marquee-cta'>${
          firstCTAText && firstCTALink
            ? `<a class='button ${firstCTAType}' href='${firstCTALink}'>${firstCTAText}</a>`
            : ``
        }${
          secondCTAText && secondCTALink
            ? `<a class='button ${secondCTAType}' href='${secondCTALink}'>${secondCTAText}</a>`
            : ``
        }</div>
      </div>
      ${
        subjectPicture
          ? `<div class='marquee-subject' style="background-color : var(${
              bgColor || '--spectrum-gray-700'
            })">${subjectPicture}</div>`
          : `<div class='marquee-spacer'></div>`
      }
      </div>
    </div>
    <div class='marquee-background'>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1562 571.212"><path fill="#fff" d="M0 1.212h1562v570H0z" data-name="Rectangle 1"></path><path class="bg" fill="var(${
        bgColor || '--spectrum-gray-700'
      })" d="M752.813-1495s115.146 210.072 471.053 309.516 291.355 261.7 291.355 261.7h150.039V-1495Z" data-name="Path 1" transform="translate(-103.26 1495)"></path></svg>
    </div>
  `);

  if (subjectPicture && subjectImageDescr) {
    marqueeDOM.querySelector('.marquee-subject picture img').setAttribute('alt', subjectImageDescr);
  }

  block.textContent = '';
  if (!subjectPicture) {
    block.classList.add('no-subject');
  }

  decorateIcons(marqueeDOM);
  block.append(marqueeDOM);
}
