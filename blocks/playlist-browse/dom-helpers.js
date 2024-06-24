import { htmlToElement } from '../../scripts/scripts.js';

/**
 * Accessible multi-select panel
 * @param {*} param0
 * @returns
 */
export function newMultiSelect({ legend, options = [], onSelect }) {
  let values = [];

  const newLi = ({ label, value, checked }) =>
    htmlToElement(`
      <li>
        <label>
          <input type="checkbox" value="${value}" ${checked ? 'checked' : ''} />
          ${label}
        </label>
      </li>`);
  const ul = htmlToElement('<ul></ul>');

  const addOption = (option) => {
    if (option.checked) values.push(option.value);
    ul.append(newLi(option));
  };

  options.forEach(addOption);

  const fieldset = htmlToElement(`<fieldset><legend>${legend}</legend></fieldset>`);
  fieldset.append(ul);

  fieldset.addEventListener('change', (event) => {
    const { value, checked } = event.target;
    if (checked) values.push(value);
    else values = values.filter((v) => v !== value);
    onSelect(values);
  });

  return { fieldset, addOption };
}

/**
 * Simple show/hide panel
 * @param {*} options
 * @returns
 */
export function newShowHidePanel({ buttonLabel, panelContent, expanded = false }) {
  const uniqueId = `panel-${Date.now().toString()}`;
  const button = htmlToElement(
    `<button aria-expanded="${expanded}" aria-controls="${uniqueId}">${buttonLabel}</button>`,
  );
  const panel = htmlToElement(`<div id="${uniqueId}"></div>`);
  panel.append(panelContent);
  panel.style.display = expanded ? 'block' : 'none';
  button.addEventListener('click', () => {
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    button.setAttribute('aria-expanded', !isVisible);
  });
  const container = htmlToElement('<div></div>');
  container.append(button, panel);
  return container;
}

/**
 * Simple pagination
 * @param {*} param0
 * @returns
 */
export function newPagination({
  previousLabel = 'Previous',
  nextLabel = 'Next',
  ofLabel = 'of',
  currentPage = 1,
  items = [],
  itemsPerPage = 18,
  onPageChange,
}) {
  const numberOfPages = Math.ceil(items.length / itemsPerPage);
  let page = currentPage;

  const getPageItems = (pageCount) => {
    const start = (pageCount - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  };

  const calculatePageLabel = () => `${page} ${ofLabel} ${numberOfPages}`;
  const pageLabelSpan = htmlToElement(`<span>${calculatePageLabel()}</span>`);

  const prevButton = htmlToElement(`<button>${previousLabel}</button>`);
  const nextButton = htmlToElement(`<button>${nextLabel}</button>`);

  const update = () => {
    prevButton.disabled = page === 1;
    nextButton.disabled = page === numberOfPages;
    pageLabelSpan.innerHTML = calculatePageLabel();
    onPageChange(page, getPageItems(page));
  };

  prevButton.addEventListener('click', () => {
    if (page > 1) {
      page -= 1;
    }
    update();
  });

  nextButton.addEventListener('click', () => {
    if (page < numberOfPages) {
      page += 1;
    }
    update();
  });

  update();

  const paginationContainer = htmlToElement('<div></div>');
  paginationContainer.append(prevButton, pageLabelSpan, nextButton);
  const pagination = htmlToElement('<div></div>');
  pagination.append(paginationContainer);
  return pagination;
}
