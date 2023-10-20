function buildCell(rowIndex) {
  const cell = rowIndex
    ? document.createElement('td')
    : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

/**
 *
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);
  const headings = [];
  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (i) tbody.append(row);
    else thead.append(row);
    [...child.children].forEach((col, j) => {
      const cell = buildCell(i);
      if (cell.tagName === 'TH') headings.push(col.innerHTML);
      if (cell.tagName === 'TD') cell.setAttribute('data-title', headings[j]);
      cell.append(...col.childNodes);
      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);
}
