import { span } from '../../scripts/dom-helpers.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
/**
 * Updates the headers of the columns based on the window width.
 */
function updateHeaders() {
  const columns = document.querySelector('.columns');
  const headerCells = columns.querySelector('div:first-child').children;
  const rows = columns.querySelectorAll('div:not(:first-child)');

  if (window.innerWidth < 600) {
    rows.forEach((row) => {
      row.querySelectorAll('div').forEach((cell, index) => {
        if (!cell.querySelector('.header-label')) {
          const headerLabel = span({ class: 'header-label' }, headerCells[index].textContent);
          const cellContent = span({ class: 'cell-content' }, cell.textContent);
          cell.textContent = '';
          cell.appendChild(headerLabel);
          cell.appendChild(cellContent);
        }
      });
    });
  } else {
    // Remove the header labels if they exist and restore cell content
    rows.forEach((row) => {
      row.querySelectorAll('div').forEach((cell) => {
        const headerLabel = cell.querySelector('.header-label');
        const cellContent = cell.querySelector('.cell-content');
        if (headerLabel && cellContent) {
          cell.textContent = cellContent.textContent;
        }
      });
    });
  }
}

window.addEventListener('resize', updateHeaders);

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const buttonType = col.querySelector('strong:first-of-type, em:first-of-type, a:first-of-type');
      if (buttonType) {
        const buttonTypeWrapper = buttonType.closest('div');
        if (buttonTypeWrapper && buttonTypeWrapper.children.length === 1) {
          // when a column has a single button with a type
          const pTag = document.createElement('p');
          buttonType.parentNode.insertBefore(pTag, buttonType);
          pTag.appendChild(buttonType);
          pTag.classList.add('button-container');
          // when button is primary - strong tag gets generated
          const anchorInsideStrong = pTag.querySelector('strong a');
          // when button is secondary - em tag gets generated
          const anchorInsideEm = pTag.querySelector('em a');
          if (anchorInsideStrong) {
            anchorInsideStrong.classList.add('button', 'primary');
          }
          if (anchorInsideEm) {
            anchorInsideEm.classList.add('button', 'secondary');
          }
        }
      }
    });
  });
  updateHeaders();
  // Remove empty <p> tags
  if (UEAuthorMode) {
    block.querySelectorAll('p').forEach((p) => {
      if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '&bnsp;') {
        p.remove();
      }
    });
    block.querySelectorAll('br').forEach((br) => {
      br.remove();
    });
  }
}
