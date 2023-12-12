import { decorateIcons } from '../lib-franklin.js';

export function htmlToElement(html) {
  const template = document.createElement('template');
  const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = trimmedHtml;
  return template.content.firstElementChild;
}

function toggleDropdown(el) {
  const dropdownOptions = el.querySelector('.dropdown-content');
  const isDropDownOpen = dropdownOptions.style.display === 'block';

  if (isDropDownOpen) {
    dropdownOptions.style.display = 'none';
    el.classList.remove('open');
  } else {
    dropdownOptions.style.display = 'block';
    el.classList.add('open');
  }
}

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
    <div class="dropdown">
      <button>${options.name}</button>
      <div class="dropdown-content">
        ${options.items.map((item, index) => generateCheckboxItem(item, index, id)).join('')}
      </div>
    </div>
`);

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
];

const dropdownOptions = [roleOptions, contentTypeOptions];

function handleDropdownClick(el) {
  const btn = el.querySelector(':scope > button');
  btn.addEventListener('click', () => toggleDropdown(el));
}

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
    if (options.selected !== 0) btnEl.textContent = `${options.name} (${options.selected})`;
    if (options.selected === 0) btnEl.textContent = `${options.name}`;
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
      <div class="browse-tags">
        <span>${tag.name} :</span>
        <span>${tag.value}</span>
        <span class="icon icon-close"></span>
      </div>
    `;
  }

  tags.forEach(renderTag);
  tagEl = `<div class="browse-tags-container">${tagEl}</div>`;
  return htmlToElement(tagEl);
}

function constructMultiSelectDropdown(target, options, index) {
  const dropdownEl = constructDropdownEl(options, index);
  target.append(dropdownEl);
  handleDropdownClick(dropdownEl);
  handleCheckboxClick(dropdownEl, options);
  return dropdownEl;
}

export default function decorateBrowseFiler() {
  const bf = document.querySelector('#browse-filters'); // will get rid when actual block PR is merged
  dropdownOptions.forEach((options, index) => {
    constructMultiSelectDropdown(bf, options, index + 1);
  });
  bf.append(renderTags());
  decorateIcons(bf);
}
