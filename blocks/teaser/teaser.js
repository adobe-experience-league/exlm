/* eslint-disable no-plusplus */
export function generateTeaserDOM(props, classes) {
  // Extract properties, always same order as in model, empty string if not set
  const [picture, eyebrow, title, longDescr, shortDescr, firstCta, secondCta] = props;
  const ctaHtml = [firstCta, secondCta]
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
  const hasShortDescr = shortDescr.textContent.trim() !== '';

  // Build DOM
  const teaserDOM = document.createRange().createContextualFragment(`
    <div class='background'>${picture.innerHTML}</div>
    <div class='foreground'>
      <div class='text'>
        ${eyebrow ? `<div class='eyebrow'>${eyebrow.textContent.trim()}</div>` : ``}
        <div class='title'>${title.innerHTML}</div>
        <div class='long-description'>${longDescr.innerHTML}</div>
        <div class='short-description'>${hasShortDescr ? shortDescr.innerHTML : longDescr.innerHTML}</div>
        <div class='cta'>${ctaHtml}</div>
      </div>
      <div class='spacer'>
      </div>
    </div>
  `);

  // set the mobile background color
  const backgroundColor = [...classes].map((cls) => cls.trim()).find((cls) => cls.startsWith('bg-'));
  if (backgroundColor) {
    teaserDOM
      .querySelector('.foreground')
      .style.setProperty('--teaser-background-color', `var(--${backgroundColor.substr(3)})`);
  }

  // add final teaser DOM and classes if used as child component
  return teaserDOM;
}

export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  const teaserDOM = generateTeaserDOM(props, block.classList);
  block.textContent = '';
  block.append(teaserDOM);
}
