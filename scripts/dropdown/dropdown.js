import { loadCSS } from '../lib-franklin.js';
import { htmlToElement } from '../scripts.js';

function closeAllDropdowns() {
  document.querySelectorAll('.custom-filter-dropdown.open').forEach((dropdown) => {
    dropdown.classList.remove('open');
    dropdown.children[1].style.display = 'none';
  });
}

function handleClickEvents(id) {
  if (document.getElementsByClassName(id).length === 1) {
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.custom-filter-dropdown')) {
        closeAllDropdowns();
      }

      if (event.target.closest('.custom-filter-dropdown > button')) {
        const button = event.target.closest('.custom-filter-dropdown > button');
        const dropdown = button.parentElement;

        if (dropdown.classList.contains('open')) {
          dropdown.classList.remove('open');
          button.nextElementSibling.style.display = 'none';
        } else {
          closeAllDropdowns();
          dropdown.classList.add('open');
          button.nextElementSibling.style.display = 'block';
        }
      }

      if (event.target.closest('.custom-checkbox')) {
        if (event.target.value) {
          const dropdown = event.target.closest('.custom-filter-dropdown');
          const button = dropdown.children[0];

          dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
            if (event.target.value !== checkbox.value) checkbox.checked = false;
          });

          if (event.target.value === dropdown.dataset.selected) {
            dropdown.dataset.selected = dropdown.dataset.filterType;
            button.children[0].textContent = dropdown.dataset.filterType;
          } else {
            dropdown.dataset.selected = event.target.value;
            button.children[0].textContent = event.target.dataset.label;
          }

          if (dropdown.classList.contains('open')) {
            dropdown.classList.remove('open');
            button.nextElementSibling.style.display = 'none';
          }
        }
      }
    });
  }
}

export default class Dropdown {
  constructor(parentFormElement, defaultValues, optionsArrays, id) {
    this.parentFormElement = parentFormElement;
    this.defaultValues = defaultValues;
    this.optionsArrays = optionsArrays;
    this.id = id;

    this.dropdowns = [];

    loadCSS(`${window.hlx.codeBasePath}/scripts/dropdown/dropdown.css`);

    this.initFormElements();
    handleClickEvents(this.parentFormElement.classList[0]);
  }

  initFormElements() {
    this.parentFormElement.addEventListener('submit', (event) => event.preventDefault());

    this.optionsArrays.forEach((options, index) => {
      const defaultValue = this.defaultValues[index];
      const dropdown = document.createElement('div');
      dropdown.classList.add(`${defaultValue}-dropdown`, 'custom-filter-dropdown');
      dropdown.dataset.filterType = defaultValue;

      dropdown.appendChild(
        htmlToElement(`
                    <button>
          		        <span>${defaultValue}</span>
          		        <span class="icon icon-chevron"></span>
          	        </button>
                    `),
      );

      const dropdownContent = document.createElement('div');
      dropdownContent.classList.add('filter-dropdown-content');
      dropdown.appendChild(dropdownContent);

      options.forEach((item, itemIndex) => {
        const dropdownitem = htmlToElement(
          ` <div class="custom-checkbox">
                    <input type="checkbox" id="option-${this.id}-${index + 1}-${itemIndex + 1}" value="${
                      item.value || item.title
                    }" data-label="${item.title}">
                    <label for="option-${this.id}-${index + 1}-${itemIndex + 1}">
                        <span class="title">${item.title}</span>
                        ${item.description ? `<span class="description">${item.description}</span>` : ''}
                        <span class="icon icon-checked"></span>
                    </label>
                    </div>`,
        );
        dropdownContent.appendChild(dropdownitem);
      });
      this.dropdowns.push(dropdown);
      this.parentFormElement.appendChild(dropdown);
    });
  }
}
