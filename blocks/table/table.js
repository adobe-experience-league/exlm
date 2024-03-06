function buildCell(rowIndex, classNames) {
  const cell =
    rowIndex || classNames.contains('no-header') ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

// function removeEmptyChildren(cell) {
//   Array.from(cell.children).forEach((child) => {
//     if (child.textContent === '') {
//       child.remove();
//     }
//   });
// }

function removeLastNChildren(elem, n) {
  const { children } = elem;
  const len = children.length;
  for (let i = len - 1; i >= len - n; i -= 1) {
    elem.removeChild(children[i]);
  }
}

/**
 *
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const thead = document.createElement('thead');
  if (block.classList.contains('no-header')) table.append(tbody);
  else table.append(thead, tbody);

  if (block.classList.contains('with-tfoot')) {
    const tfoot = document.createElement('tfoot');
    table.append(tfoot);
    tfoot.append(block.querySelector('.table > div:last-child'));
    [...tfoot.children].forEach((trDiv) => {
      const tr = document.createElement('tr');
      [...trDiv.children].forEach((tdDiv) => {
        const td = document.createElement('td');
        td.append(...tdDiv.childNodes);
        tr.append(td);
      });
      tfoot.append(tr);
      trDiv.remove();
    });
  }

  const headings = [];
  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (i || block.classList.contains('no-header')) tbody.append(row);
    else thead.append(row);
    [...child.children].forEach((col, j) => {
      const cell = buildCell(i, block.classList);
      if (!block.classList.contains('html-authored')) {
        if (cell.tagName === 'TH') headings.push(col.innerHTML);
        if (cell.tagName === 'TD') cell.setAttribute('data-title', headings[j]);
      }
      cell.append(...col.childNodes);
      row.append(cell);
    });
  });

  [...block.classList].forEach((className) => {
    const data = className.split('-');

    table.querySelectorAll('tr').forEach((cell, i) => {
      if (data[0] === String(i) && data[1] === 'row') {
        removeLastNChildren(cell, cell.children.length - data[2]);
        // removeEmptyChildren(cell);
      }
    });

    table.querySelectorAll('tr, th, td').forEach((cell, i) => {
      if (data[0] === String(i)) {
        if (data[1] === 'colspan') {
          cell.setAttribute('colspan', data[2]);
        }
        if (data[1] === 'rowspan') {
          cell.setAttribute('rowspan', data[2]);
        }
        if (data[1] === 'width') {
          cell.setAttribute('width', data[2]);
        }
        if (data[1] === 'height') {
          cell.setAttribute('height', data[2]);
        }
        if (data[1] === 'align') {
          [, , cell.style.textAlign] = data;
        }
        if (data[1] === 'bgcolor') {
          cell.style.backgroundColor = `#${data[2]}`;
        }
        if (data[1] === 'border') {
          [, , cell.style.border] = data;
        }
      }
    });
  });

  const paragraphs = table.querySelectorAll('p');

  // Loop through each <p> element
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const currentParagraph = paragraphs[i];
    const nextParagraph = paragraphs[i + 1];
    if (nextParagraph.previousElementSibling === currentParagraph) {
      // Check if the next <p> tag has just one character
      if (nextParagraph.textContent.trim().length === 1) {
        // Merge the contents of the next <p> tag into the current <p> tag
        currentParagraph.innerHTML += nextParagraph.innerHTML;

        // Remove the next <p> tag from the DOM
        nextParagraph.parentNode.removeChild(nextParagraph);
      }
    }
  }

  block.innerHTML = '';

  block.append(table);
}
