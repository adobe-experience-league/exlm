import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  // Extract properties
  // always same order as in model, empty string if not set
  const props = [...block.querySelectorAll(':scope div > div')];

  const backgroundPicture = props[0].innerHTML.trim();
  const backgroundImageDescr = props[1].textContent.trim();
  const subjectPicture = props[2].innerHTML.trim();
  const subjectImageDescr = props[3].textContent.trim();

  // To be tracked as part of https://jira.corp.adobe.com/browse/EXLM-485
  // eslint-disable-next-line
  const mobileBgColor = props[4].textContent.trim();

  const eyebrow = props[5].textContent.trim();
  const title = props[6].textContent.trim();
  const longDescr = props[7].innerHTML.trim();
  const firstCTAType = props[8].textContent.trim();
  const firstCTAText = props[9].textContent.trim();
  const firstCTALink = props[10].textContent.trim();
  const secondCTAType = props[11].textContent.trim();
  const secondCTAText = props[12].textContent.trim();
  const secondCTALink = props[13].textContent.trim();

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='marquee-foreground'>
      <div class='marquee-text'>
        ${eyebrow ? `<div class='marquee-eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
        <div class='marquee-title'>${title}</div>
        <div class='marquee-long-description'>${longDescr}</div>
        <div class='marquee-cta'>${
          firstCTAText && firstCTALink
            ? `<a class='button ${firstCTAType}' href='${firstCTALink}'><span class="icon icon-play"></span>${firstCTAText}</a>`
            : ``
        }${
          secondCTAText && secondCTALink
            ? `<a class='button ${secondCTAType}' href='${secondCTALink}'>${secondCTAText}</a>`
            : ``
        }</div>
      </div>
      ${subjectPicture ? `<div class='marquee-subject'>${subjectPicture}</div>` : `<div class='marquee-spacer'></div>`}
      </div>
    </div>
    <div class='marquee-background'">${backgroundPicture}</div>
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
  if (!subjectPicture) {
    block.classList.add('no-subject');
  }
  decorateIcons(teaserDOM);
  block.append(teaserDOM);
}
