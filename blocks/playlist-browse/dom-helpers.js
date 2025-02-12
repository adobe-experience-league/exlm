import { createPlaceholderSpan, decoratePlaceholders, htmlToElement } from '../../scripts/scripts.js';

/**
 * @typedef {Object} MultiSelectOption
 * @property {string} label
 * @property {string} value
 * @property {boolean} checked
 */

/**
 * @typedef {Object} MultiSelect
 * @property {string} legend
 * @property {MultiSelectOption[]} options
 * @property {(selectedValues: string[]) => void} onSelect
 */

/**
 * @typedef {Object} MultiSelectAPI
 * @property {HTMLElement} fieldset
 * @property {(option: MultiSelectOption) => void} addOption
 */

/**
 * Creates a fieldset of checkboxes to represent a multiselct panel.
 * returns API for adding options and getting selected values.
 * @param {MultiSelect} multiselect
 * @returns {MultiSelectAPI}
 */
export function newMultiSelect({ options = [], onSelect }) {
  let values = [];

  const filterSubOptions = ({ label, labelPlaceholderKey, description, value, checked }) => {
    const option = htmlToElement(` 
      <div class="filter-option">    
          <input type="checkbox"  id="${value}" value="${value}" ${checked ? 'checked' : ''} />
          <label for="${value}">
            <div class="title">
              <span data-placeholder="${labelPlaceholderKey}">${label}</span>
            </div>
            <div class="description">
              <span data-placeholder="${description}"></span>
            </div>
            <span class="icon icon-checked"></span>
          </label>  
      </div>     
      `);
    decoratePlaceholders(option);
    return option;
  };

  const fieldset = htmlToElement(`<fieldset></fieldset>`);

  const addOption = (option) => {
    if (option.checked) values.push(option.value);
    fieldset.append(filterSubOptions(option));
  };

  options.forEach(addOption);

  fieldset.addEventListener('change', (event) => {
    const { value, checked } = event.target;
    if (checked) values.push(value);
    else values = values.filter((v) => v !== value);
    onSelect(values);
  });

  // Clear all selected values
  const onClear = () => {
    values = [];
    fieldset.querySelectorAll('input').forEach((input) => {
      input.checked = false;
    });
  };

  // Remove option from selected values
  const removeOption = (option) => {
    values = values.filter((v) => v !== option);
  };

  return { fieldset, addOption, onClear, removeOption };
}

/**
 * @typedef {Object} ShowHidePanel
 * @property {string} buttonLabel
 * @property {string} buttonClass
 * @property {HTMLElement} panelContent
 * @property {string} panelClass
 * @property {string} hiddenPanelClass
 * @property {boolean} expanded
 */

/**
 * Returns an accessibale button that toggles a panel when clicked.
 * @param {ShowHidePanel} options
 * @returns {HTMLElement}
 */
export function newShowHidePanel({
  buttonLabel,
  buttonClass = 'show-hide-button',
  panelContent,
  panelClass = 'show-hide-panel',
  hiddenPanelClass = 'show-hide-panel-hidden',
  expanded = false,
}) {
  const uniqueId = `panel-${Date.now().toString()}`;
  const button = htmlToElement(`<button aria-controls="${uniqueId}" class="${buttonClass}"></button>`);
  button.append(buttonLabel);
  const panel = htmlToElement(`<div id="${uniqueId}" class="${panelClass}"></div>`);
  panel.append(panelContent);

  const toggle = (isExpanded) => {
    panel.classList.toggle(hiddenPanelClass, !isExpanded);
    button.setAttribute('aria-expanded', isExpanded);
  };
  panel.classList.toggle(hiddenPanelClass, !expanded);
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    toggle(!isExpanded);
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !button.contains(e.target)) toggle(false);
  });

  toggle(expanded);

  const container = htmlToElement('<div></div>');
  container.append(button, panel);
  return container;
}

/**
 * @typedef {Object} Pagination
 * @property {string} previousLabel
 * @property {string} previousClass
 * @property {string} nextLabel
 * @property {string} nextClass
 * @property {string} paginationLabelClass
 * @property {string} ofLabel
 * @property {number} currentPage
 * @property {any[]} items
 * @property {number} itemsPerPage
 * @property {(page: number, items: any[]) => void} onPageChange
 */

/**
 * Returns a pagination element that can be used to navigate through items.
 * @param {Pagination} pagination
 * @returns
 */
export function newPagination({
  previousLabel = createPlaceholderSpan('playlistPreviousLabel', 'Previous'),
  previousClass = 'pagination-previous',
  nextLabel = createPlaceholderSpan('playlistNextLabel', 'Next'),
  nextClass = 'pagination-next',
  paginationLabelClass = 'pagination-label',
  ofLabel = createPlaceholderSpan('playlistOfLabel', 'of'),
  currentPage = 1,
  items = [],
  itemsPerPage = 12,
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
  const pageLabelSpan = htmlToElement(`<span class="${paginationLabelClass}">${calculatePageLabel()}</span>`);

  const prevButton = htmlToElement(`<button class="${previousClass}">${previousLabel}</button>`);
  const nextButton = htmlToElement(`<button class="${nextClass}">${nextLabel}</button>`);

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
