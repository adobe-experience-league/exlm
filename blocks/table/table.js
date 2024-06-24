function buildCell(rowIndex, classNames) {
  const cell =
    rowIndex || classNames.contains('no-header') ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

class SortableTable {
  constructor(tableNode) {
    this.tableNode = tableNode;

    this.columnHeaders = tableNode.querySelectorAll('thead th');

    this.sortColumns = [];

    for (let i = 0; i < this.columnHeaders.length; i += 1) {
      const ch = this.columnHeaders[i];
      const button = document.createElement('button');
      button.textContent = ch.textContent;
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      button.append(span);
      ch.innerHTML = button.outerHTML;
      const buttonNode = ch.querySelector('button');
      if (buttonNode) {
        this.sortColumns.push(i);
        buttonNode.setAttribute('data-column-index', i);
        buttonNode.addEventListener('click', this.handleClick.bind(this));
      }
    }

    this.optionCheckbox = document.querySelector('input[type="checkbox"][value="show-unsorted-icon"]');

    if (this.optionCheckbox) {
      this.optionCheckbox.addEventListener('change', this.handleOptionChange.bind(this));
      if (this.optionCheckbox.checked) {
        this.tableNode.classList.add('show-unsorted-icon');
      }
    }
  }

  setColumnHeaderSort(columnIndex) {
    this.columnIndex = columnIndex;
    if (typeof columnIndex === 'string') {
      // TODO: FIX this, no need to disable eslint
      // eslint-disable-next-line no-param-reassign
      columnIndex = parseInt(columnIndex, 10);
    }

    for (let i = 0; i < this.columnHeaders.length; i += 1) {
      const ch = this.columnHeaders[i];
      const buttonNode = ch.querySelector('button');
      if (i === columnIndex) {
        const value = ch.getAttribute('aria-sort');
        if (value === 'descending') {
          ch.setAttribute('aria-sort', 'ascending');
          this.sortColumn(columnIndex, 'ascending', ch.classList.contains('num'));
        } else {
          ch.setAttribute('aria-sort', 'descending');
          this.sortColumn(columnIndex, 'descending', ch.classList.contains('num'));
        }
      } else if (ch.hasAttribute('aria-sort') && buttonNode) {
        ch.removeAttribute('aria-sort');
      }
    }
  }

  sortColumn(columnIndex, sortValue, isNumber) {
    function compareValues(a, b) {
      if (sortValue === 'ascending') {
        if (a.value === b.value) {
          return 0;
        }
        if (isNumber) {
          return a.value - b.value;
        }
        return a.value < b.value ? -1 : 1;
      }
      if (a.value === b.value) {
        return 0;
      }
      if (isNumber) {
        return b.value - a.value;
      }
      return a.value > b.value ? -1 : 1;
    }

    if (typeof isNumber !== 'boolean') {
      // TODO: FIX this, no need to disable eslint
      // eslint-disable-next-line no-param-reassign
      isNumber = false;
    }

    const tbodyNode = this.tableNode.querySelector('tbody');
    const rowNodes = [];
    const dataCells = [];

    let rowNode = tbodyNode.firstElementChild;

    let index = 0;
    while (rowNode) {
      rowNodes.push(rowNode);
      const rowCells = rowNode.querySelectorAll('th, td');
      const dataCell = rowCells[columnIndex];

      const data = {};
      data.index = index;
      data.value = dataCell.textContent.toLowerCase().trim();
      if (isNumber) {
        data.value = parseFloat(data.value);
      }
      dataCells.push(data);
      rowNode = rowNode.nextElementSibling;
      index += 1;
    }

    dataCells.sort(compareValues);

    // remove rows
    while (tbodyNode.firstChild) {
      tbodyNode.removeChild(tbodyNode.lastChild);
    }

    // add sorted rows
    for (let i = 0; i < dataCells.length; i += 1) {
      tbodyNode.appendChild(rowNodes[dataCells[i].index]);
    }
  }

  /* EVENT HANDLERS */

  handleClick(event) {
    const tgt = event.currentTarget;
    this.setColumnHeaderSort(tgt.getAttribute('data-column-index'));
  }

  handleOptionChange(event) {
    const tgt = event.currentTarget;

    if (tgt.checked) {
      this.tableNode.classList.add('show-unsorted-icon');
    } else {
      this.tableNode.classList.remove('show-unsorted-icon');
    }
  }
}

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
        if (cell.tagName === 'TH') headings.push(col.textContent);
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

  block.innerHTML = '';
  block.append(table);
  // TODO: FIX this, no need to disable eslint
  // eslint-disable-next-line no-new
  new SortableTable(table);
}
