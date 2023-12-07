/* eslint-disable no-plusplus */
export default function decorate(block) {
  // get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);

  // Extract properties, always same order as in model, empty string if not set
  let count = 0;
  const picture = props[count++].innerHTML.trim();
  const imageDescr = props[count++].textContent.trim();
  const eyebrow = props[count++].textContent.trim();
  const title = props[count++].textContent.trim();
  const description = props[count++].innerHTML.trim();
  const firstCTAType = props[count++].textContent.trim();
  const firstCTAText = props[count++].textContent.trim();
  const firstCTALink = props[count++].textContent.trim();
  const secondCTAType = props[count++].textContent.trim();
  const secondCTAText = props[count++].textContent.trim();
  const secondCTALink = props[count++].textContent.trim();

  // Build DOM
  const mediaDOM = document.createRange().createContextualFragment(`
    <div class='image'>${picture}</div>
    <div class='text'>
      ${eyebrow ? `<div class='eyebrow'>${eyebrow.toUpperCase()}</div>` : ``}
      <div class='title'>${title}</div>
      <div class='description'>${description}</div>
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
  `);

  // set image description
  if (imageDescr) {
    mediaDOM.querySelector('.image picture img').setAttribute('alt', imageDescr);
  }

  // attach DOM
  block.textContent = '';
  block.append(mediaDOM);
}
