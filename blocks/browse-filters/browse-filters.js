import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createTag, htmlToElement } from '../../scripts/scripts.js';
import { roleOptions, contentTypeOptions, expTypeOptions, getObjectByName } from './browse-filter-utils.js';
import initiateCoveoHeadlessSearch from '../../scripts/search/coveo-headless-poc.js';

const isBrowseProdPage = getMetadata('browse product');
// const isBrowseAllPage = getMetadata('browse all');
const dropdownOptions = [roleOptions, contentTypeOptions];
const tags = [];

if (isBrowseProdPage) dropdownOptions.push(expTypeOptions);

/**
 * Generate HTML for a single checkbox item.
 *
 * @param {Object} item - Item with title and description.
 * @param {number} index - Index of the item in the array.
 * @return {string} - HTML string for the checkbox item.
 */
function generateCheckboxItem(item, index, id) {
  return `
      <div class="custom-checkbox">
          <input type="checkbox" id="option${id}${index + 1}" value="${item.title}">
          <label for="option${id}${index + 1}">
              <span class="title">${item.title}</span>
              <span class="description">${item.description}</span>
              <span class="icon icon-checked"></span>
          </label>
      </div>
  `;
}

const constructDropdownEl = (options, id) =>
  htmlToElement(`
    <div class="filter-dropdown filter-input" data-filter-type="${options.name}">
      <button>
        ${options.name}
        <span class="icon icon-chevron"></span>
      </button>
      <div class="filter-dropdown-content">
        ${options.items.map((item, index) => generateCheckboxItem(item, index, id)).join('')}
      </div>
    </div>
`);

function appendToForm(block, target) {
  const formEl = block.querySelector('.browse-filters-form');
  formEl.append(target);
}

function renderTags() {
  let tagEl = '';

  function renderTag(tag) {
    tagEl += `
      <button class="browse-tags">
        <span>${tag.name}</span>
        <span> : </span>
        <span>${tag.value}</span>
        <span class="icon icon-close"></span>
      </button>
    `;
  }

  tags.forEach(renderTag);
  tagEl = `<div class="browse-tags-container">${tagEl}</div>`;
  return htmlToElement(tagEl);
}

function appendTag(block, tag) {
  const tagsContainer = block.querySelector('.browse-tags-container');
  const tagEl = htmlToElement(`
    <button class="browse-tags">
      <span>${tag.name}</span>
      <span> : </span>
      <span>${tag.value}</span>
      <span class="icon icon-close"></span>
    </button>
  `);
  tagsContainer.append(tagEl);
  decorateIcons(tagEl);
}

function removeFromTags(block, value) {
  const tagsContainer = block.querySelector('.browse-tags-container');
  [...tagsContainer.children].forEach((tag) => {
    if (tag.textContent.includes(value)) {
      tag.remove();
    }
  });
}

function updateCountAndCheckedState(block, name, value) {
  const tagRole = block.querySelector(`.filter-dropdown[data-filter-type="${name}"]`);
  const btnEl = tagRole.querySelector(':scope > button');
  const ddOptions = [...tagRole.querySelector('.filter-dropdown-content').children];
  const ddObject = getObjectByName(dropdownOptions, name);
  ddObject.selected = 0;

  function syncCheckedState(option) {
    const selected = option.querySelector(`input[type="checkbox"][value="${value}"]`);
    if (selected) selected.checked = false;
    if (option.querySelector('input[type="checkbox"]').checked) {
      ddObject.selected += 1;
    }
  }

  ddOptions.forEach((option) => {
    syncCheckedState(option);
  });

  if (ddObject.selected !== 0) btnEl.firstChild.textContent = `${name} (${ddObject.selected})`;
  if (ddObject.selected === 0) btnEl.firstChild.textContent = `${name}`;
}

function handleTagsClick(block) {
  block.addEventListener('click', (event) => {
    const isTag = event.target.closest('.browse-tags');
    if (isTag) {
      const name = isTag.querySelector('span:nth-child(1)').textContent.trim();
      const value = isTag.querySelector('span:nth-child(3)').textContent.trim();
      removeFromTags(block, value);
      // TODO: Update checked state and numbers
      updateCountAndCheckedState(block, name, value);
    }
  });
}

function handleCheckboxClick(block, el, options) {
  const checkboxes = el.querySelectorAll('.custom-checkbox input[type="checkbox"]');
  const btnEl = el.querySelector(':scope > button');

  // Function to handle checkbox state changes
  function handleCheckboxChange(event) {
    const checkbox = event.target;
    const label = checkbox.closest('.custom-checkbox').querySelector('label');
    const name = checkbox.closest('.filter-dropdown').dataset.filterType;
    const isChecked = checkbox.checked;

    if (isChecked) {
      options.selected += 1;
      appendTag(block, {
        name,
        value: checkbox.value,
      });

      if (window.headlessCategoryFacet) {
        const value = label.querySelector('.title')?.textContent;
        // eslint-disable-next-line no-console
        console.log('------> value: ', value);
        const action = window.headlessCategoryFacet.toggleSelectCategoryFacetValue({
          facetId: '@el_contenttype',
          selection: {
            numberOfResults: 10,
            path: [],
            children: [],
            state: 'selected',
            value: 'Tutorial',
          },
        });
        window.headlessSearchEngine.dispatch(action);
      }
    } else {
      options.selected -= 1;
      removeFromTags(block, checkbox.value);
    }
    if (options.selected !== 0) btnEl.firstChild.textContent = `${options.name} (${options.selected})`;
    if (options.selected === 0) btnEl.firstChild.textContent = `${options.name}`;
  }

  // Attach event listener to each checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });
}

function appendToFormInputContainer(block, target) {
  const divEl = block.querySelector('.browse-filters-input-container');
  divEl.append(target);
}

function constructMultiSelectDropdown(block, options, index) {
  const dropdownEl = constructDropdownEl(options, index);

  appendToFormInputContainer(block, dropdownEl);
  handleCheckboxClick(block, dropdownEl, options);
  return dropdownEl;
}

function constructFilterInputContainer(block) {
  const divEl = createTag('div', { class: 'browse-filters-input-container' });
  appendToForm(block, divEl);
}

function appendFormEl(block) {
  const formEl = createTag('form', { class: 'browse-filters-form' });
  block.append(formEl);

  formEl.addEventListener('submit', (event) => event.preventDefault());
}

function addLabel(block) {
  const labelEl = createTag('label', { class: 'browse-filters-label' }, 'Filters');
  appendToFormInputContainer(block, labelEl);
}

function constructKeywordSearchEl(block) {
  const searchEl = htmlToElement(`
    <div class="filter-input filter-input-search">
      <span class="icon icon-search"></span>
      <input type="search" placeholder="Keyword search">
    </div>
  `);
  appendToFormInputContainer(block, searchEl);
}

function toggleSectionsBelow(block, show) {
  const parent = block.closest('.section');
  if (parent) {
    const siblings = Array.from(parent.parentNode.children);
    const clickedIndex = siblings.indexOf(parent);

    // eslint-disable-next-line no-plusplus
    for (let i = clickedIndex + 1; i < siblings.length; i++) {
      siblings[i].style.display = show ? 'block' : 'none';
    }
  }
}

function onInputSearch(block) {
  const searchEl = block.querySelector('.filter-input-search input[type="search"]');
  searchEl.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleSectionsBelow(block, false);
      // eslint-disable-next-line no-console
      console.log('add search logic here');
    }
  });
}

function handleClearFilter(block) {
  // show the hidden sections again
  const clearFilterEl = block.querySelector('.browse-filters-clear');
  clearFilterEl.addEventListener('click', () => toggleSectionsBelow(block, true));
}

function constructClearFilterBtn(block) {
  const clearBtn = htmlToElement(`
    <button class="browse-filters-clear">Clear filters</button>
  `);
  appendToFormInputContainer(block, clearBtn);
}

function closeOpenDropdowns() {
  document.querySelectorAll('.filter-dropdown.open')?.forEach((dropdown) => {
    dropdown.classList.remove('open');
    dropdown.querySelector('.filter-dropdown-content').style.display = 'none';
  });
}

/**
 * Handles the toggle behavior for filter dropdowns.
 * Closes open dropdowns if a click occurs outside of the current dropdown.
 * Toggles the display of the clicked dropdown and updates its state.
 *
 * @param {Event} event - The click event.
 */
function handleDropdownToggle() {
  document.addEventListener('click', (event) => {
    const openDropdowns = document.querySelectorAll('.filter-dropdown.open');
    const dropdownEl = event.target.closest('.filter-dropdown');
    const isCurrentDropDownOpen = event.target.closest('.filter-dropdown.open');

    if (openDropdowns && !isCurrentDropDownOpen) closeOpenDropdowns();

    if (dropdownEl && !isCurrentDropDownOpen) {
      dropdownEl.querySelector('.filter-dropdown-content').style.display = 'block';
      dropdownEl.classList.add('open');
    } else {
      closeOpenDropdowns();
    }
  });
}

function decorateBlockTitle(block) {
  const firstChild = block.querySelector('div:first-child');
  const firstChildText = firstChild.querySelector('div > div').textContent;
  const headingEl = createTag('h1', { class: 'browse-filters-title' }, firstChildText);

  const secondChild = block.querySelector('div:nth-child(2)');
  const secondChildText = secondChild.querySelector('div > div').textContent;
  const pEl = createTag('p', { class: 'browse-filters-description' }, secondChildText);

  firstChild.parentNode.replaceChild(headingEl, firstChild);
  secondChild.parentNode.replaceChild(pEl, secondChild);
}

export default function decorate(block) {
  // TODO: Enable once metadata is done
  // if (!isBrowseAllPage || !isBrowseProdPage) return;

  decorateBlockTitle(block);
  appendFormEl(block);
  constructFilterInputContainer(block);
  addLabel(block);
  dropdownOptions.forEach((options, index) => {
    constructMultiSelectDropdown(block, options, index + 1);
  });
  constructKeywordSearchEl(block);
  constructClearFilterBtn(block);
  appendToForm(block, renderTags());
  initiateCoveoHeadlessSearch();
  decorateIcons(block);
  handleDropdownToggle();
  onInputSearch(block);
  handleClearFilter(block);
  handleTagsClick(block);
}
