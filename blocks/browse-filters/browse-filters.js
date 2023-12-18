import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createTag, htmlToElement } from '../../scripts/scripts.js';

// TODO: Move these constants to a separate file
// TODO: Refactor pending
const roles = [
  {
    title: 'Business User',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Developer',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Administrator',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Business Leader',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

const contentType = [
  {
    title: 'Certification',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Community',
    description: 'Responsible for nothing until there"s an issue.',
  },
  {
    title: 'Courses',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Documentation',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'On-Demand Events',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Troubleshooting',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
  {
    title: 'Tutorials',
    description: 'Responsible for utilizing Adobe solutions to achieve daily job functions and tasks.',
  },
];

const expLevel = [
  {
    title: 'Beginner',
    description: 'I am a beginner',
  },
  {
    title: 'Intermediate',
    description: 'I am an intermediate',
  },
  {
    title: 'Experienced',
    description: 'I have some experience',
  },
];

const roleOptions = {
  name: 'Role',
  items: roles,
  selected: 0,
};

const contentTypeOptions = {
  name: 'Content Type',
  items: contentType,
  selected: 0,
};

const expTypeOptions = {
  name: 'Experience Level',
  items: expLevel,
  selected: 0,
};

const tags = [
  {
    name: 'Content Type',
    value: 'Business User',
  },
  {
    name: 'Role',
    value: 'Developer',
  },
  {
    name: 'Role',
    value: 'Developer',
  },
  {
    name: 'Content Type',
    value: 'Business Leader',
  },
  {
    name: 'Experience Level',
    value: 'Intermediate',
  },
];

const isBrowseProdPage = getMetadata('browse product');
const dropdownOptions = [roleOptions, contentTypeOptions];

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
          <input type="checkbox" id="option${id}${index + 1}" value="option${id}${index + 1}">
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
    <div class="filter-dropdown filter-input">
      <button>
        ${options.name}
        <span class="icon icon-chevron"></span>
      </button>
      <div class="filter-dropdown-content">
        ${options.items.map((item, index) => generateCheckboxItem(item, index, id)).join('')}
      </div>
    </div>
`);

function handleCheckboxClick(el, options) {
  let selectionCount = 0;
  const checkboxes = el.querySelectorAll('.custom-checkbox input[type="checkbox"]');
  const btnEl = el.querySelector(':scope > button');

  // Function to handle checkbox state changes
  function handleCheckboxChange(event) {
    const checkbox = event.target;
    const label = checkbox.closest('.custom-checkbox').querySelector('label');
    const checkboxId = checkbox.id;
    const isChecked = checkbox.checked;

    if (isChecked) {
      selectionCount += 1;
      // eslint-disable-next-line no-console
      console.log(`Checkbox with ID ${checkboxId} is checked. Element clicked:`, label);
    } else {
      selectionCount -= 1;
      // eslint-disable-next-line no-console
      console.log(`Checkbox with ID ${checkboxId} is unchecked. Element clicked:`, label);
    }
    options.selected = selectionCount;
    if (options.selected !== 0) btnEl.firstChild.textContent = `${options.name} (${options.selected})`;
    if (options.selected === 0) btnEl.firstChild.textContent = `${options.name}`;
  }

  // Attach event listener to each checkbox
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });
}

function renderTags() {
  let tagEl = '';

  function renderTag(tag) {
    tagEl += `
      <button class="browse-tags">
        <span>${tag.name} :</span>
        <span>${tag.value}</span>
        <span class="icon icon-close"></span>
      </button>
    `;
  }

  tags.forEach(renderTag);
  tagEl = `<div class="browse-tags-container">${tagEl}</div>`;
  return htmlToElement(tagEl);
}

function appendToForm(block, target) {
  const formEl = block.querySelector('.browse-filters-form');
  formEl.append(target);
}

function appendToFormInputContainer(block, target) {
  const divEl = block.querySelector('.browse-filters-input-container');
  divEl.append(target);
}

function constructMultiSelectDropdown(block, options, index) {
  const dropdownEl = constructDropdownEl(options, index);

  appendToFormInputContainer(block, dropdownEl);
  handleCheckboxClick(dropdownEl, options);
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
  decorateIcons(block);
  handleDropdownToggle();
  onInputSearch(block);
  handleClearFilter(block);
}
