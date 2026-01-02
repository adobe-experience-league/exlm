import { span } from '../../scripts/dom-helpers.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

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

function updateImages(block, width, height) {
  document.querySelectorAll(".columns.block").forEach((colBlock) => {
    colBlock.querySelectorAll('img').forEach((img) => {
      // Update <img> inside <picture> in .columns to new placeholder src, do not add style.
      img.src = `https://placehold.co/${width}x${height}`;
      // Also update all <source> tags in the same <picture> (if any)
      const picture = img.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach((source) => {
          // source.srcset = `https://placehold.co/${width}x${height}`;
          source.srcset = `https://picsum.photos/seed/card1/${width}/${height}`;
        });
      }
    });
  });
}

function createToolbar(block) {
  let toolbar = document.querySelector('.column-toolbar');
  if (toolbar) return toolbar;

  toolbar = document.createElement('div');
  toolbar.classList.add('column-toolbar');

  const widthInput = document.createElement('input');
  widthInput.type = 'number';
  widthInput.value = DEFAULT_WIDTH;
  widthInput.id = 'img-width';

  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.value = DEFAULT_HEIGHT;
  heightInput.id = 'img-height';

  const onSizeChange = () => {
    updateImages(block, widthInput.value, heightInput.value);
  };

  widthInput.addEventListener('input', onSizeChange);
  heightInput.addEventListener('input', onSizeChange);

  const widthLabel = document.createElement('label');
  widthLabel.textContent = 'Width: ';
  widthLabel.appendChild(widthInput);

  const heightLabel = document.createElement('label');
  heightLabel.textContent = 'Height: ';
  heightLabel.appendChild(heightInput);

  const styleSelect = document.createElement('select');
  styleSelect.id = 'style-select';
  styleSelect.innerHTML = `
    <option value="small" selected>Small</option>
    <option value="medium">Medium</option>
    <option value="large">Large</option>
  `;
  styleSelect.addEventListener('change', (e) => {
    document.querySelectorAll(".columns.block").forEach((colBlock) => {
      colBlock.classList.remove('small', 'medium', 'large');
      if (e.target.value) {
        colBlock.classList.add(e.target.value);
      }
    });
  });

  const styleLabel = document.createElement('label');
  styleLabel.textContent = 'Image height: ';
  styleLabel.appendChild(styleSelect);

  toolbar.append(widthLabel, heightLabel, styleLabel);
  document.body.appendChild(toolbar);
  return toolbar;
}

window.addEventListener('resize', updateHeaders);

export default function decorate(block) {
  createToolbar(block);
  updateImages(block, DEFAULT_WIDTH, DEFAULT_HEIGHT);

  document.querySelectorAll(".columns.block").forEach((colBlock, i) => {
    colBlock.classList.add(`columns-block-${i}`);
    colBlock.classList.add('small');
  });

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
      if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '&nbsp;') {
        p.remove();
      }
    });
    block.querySelectorAll('br').forEach((br) => {
      br.remove();
    });
  }
}
