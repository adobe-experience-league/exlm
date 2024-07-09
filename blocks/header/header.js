import './exl-header.js';

/**
 *
 * @param {HTMLHeadElement} header
 */
export default function decorate(header) {
  // prepare header data/html from header page

  // create header webcomponent
  const exlHeader = document.createElement('exl-header');
  // inject into header block
  header.appendChild(exlHeader);
  // exlHeader.hide();
}
