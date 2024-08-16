import { loadCSS } from '../lib-franklin.js';
import { htmlToElement } from '../scripts.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/dropdown/dropdown.css`);

export const DROPDOWN_VARIANTS = {
  DEFAULT: 'default',
  ANCHOR: 'anchor-menu',
};

export default class Dropdown {
  /**
   * Constructor for initializing dropdown using parent form element, default values, options arrays, and id.
   *
   * @param {HTMLFormElement} parentFormElement - Parent form element
   * @param {Array} defaultValues - Array of Dropdown default value
   * @param {Array} optionsArrays -  Array of options list
   * @param {Number} id - Unique dropdown id
   * @param {String} variant - Dropdown variant
   */
  constructor(parentFormElement, defaultValue, optionsArray, variant = DROPDOWN_VARIANTS.DEFAULT) {
    this.parentFormElement = parentFormElement;
    this.defaultValue = defaultValue;
    this.optionsArray = optionsArray;
    this.id = document.querySelectorAll('.custom-filter-dropdown').length;
    this.variant = variant;
    this.initFormElements();
    this.handleClickEvents();
  }

  /**
   * handleOnChange - A function that sets up an event listener for the change event on a dropdown element and calls the provided callback with the selected data.
   *
   * @param {function} callback - The callback function to be called with the selected data from the dropdown.
   * @return {void}
   */
  handleOnChange(callback) {
    this.dropdown.addEventListener('change', () => {
      callback(this.dropdown.dataset.selected);
    });
  }

  /**
   * Closes all open dropdowns.
   *
   */
  static closeAllDropdowns() {
    document.querySelectorAll('.custom-filter-dropdown.open').forEach((dropdown) => {
      dropdown.classList.remove('open');
      dropdown.children[1].style.display = 'none';
    });
  }

  /**
   * Updates the dropdown value based on the given value.
   *
   * @param {type} value - The value to update the dropdown with.
   * @return {type} - No return value.
   */
  updateDropdownValue(value) {
    this.dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.value === value) {
        this.dropdown.dataset.selected = value;
        const label = this.dropdown.querySelector('button > span');
        label.innerText = checkbox.dataset.label;
        checkbox.checked = true;
      }
    });
  }

  /**
   * Handle click events and perform specific actions based on the event target.
   */
  handleClickEvents() {
    if (!Dropdown.isClickHandlerAdded) {
      document.removeEventListener('click', this.constructor.handleDocumentClick); // Remove the existing listener if any
      document.addEventListener('click', this.constructor.handleDocumentClick); // Add the new listener
      Dropdown.isClickHandlerAdded = true;
    }
  }

  /**
   * Event handler for document click events
   * @param {Event} event - The click event
   */
  static handleDocumentClick(event) {
    if (!event.target.closest('.custom-filter-dropdown')) {
      Dropdown.closeAllDropdowns();
    }

    if (event.target.closest('.custom-filter-dropdown > button')) {
      const button = event.target.closest('.custom-filter-dropdown > button');
      const dropdown = button.parentElement;

      if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        button.nextElementSibling.style.display = 'none';
      } else {
        Dropdown.closeAllDropdowns();
        dropdown.classList.add('open');
        button.nextElementSibling.style.display = 'block';
      }
    }

    if (event.target.closest('.custom-checkbox')) {
      if (event.target.value) {
        const dropdown = event.target.closest('.custom-filter-dropdown');
        const { variant } = dropdown.dataset;
        const button = dropdown.children[0];

        dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
          if (event.target.value !== checkbox.value) checkbox.checked = false;
        });

        const updateButtonText = variant !== DROPDOWN_VARIANTS.ANCHOR;
        let buttonText;
        if (event.target.value === dropdown.dataset.selected) {
          dropdown.dataset.selected = dropdown.dataset.filterType;
          buttonText = dropdown.dataset.filterType;
          dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
            if (dropdown.dataset.selected === checkbox.value) checkbox.checked = true;
          });
        } else {
          dropdown.dataset.selected = event.target.value;
          buttonText = event.target.dataset.label;
        }

        if (updateButtonText) {
          button.children[0].textContent = buttonText;
        }

        if (dropdown.classList.contains('open')) {
          dropdown.classList.remove('open');
          button.nextElementSibling.style.display = 'none';
        }
      }
    }
  }

  /**
   * Initialize form elements.
   */
  initFormElements() {
    this.parentFormElement.addEventListener('submit', (event) => event.preventDefault());

    const dropdown = document.createElement('div');
    dropdown.classList.add('custom-filter-dropdown');
    dropdown.dataset.filterType = this.defaultValue;
    dropdown.dataset.variant = this.variant;
    this.dropdown = dropdown;

    dropdown.appendChild(
      htmlToElement(`
                <button>
          		    <span>${this.defaultValue}</span>
          		    <span class="icon icon-chevron"></span>
          	    </button>
              `),
    );

    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('filter-dropdown-content');
    dropdown.appendChild(dropdownContent);

    this.optionsArray.forEach((item, itemIndex) => {
      const dropdownitem = htmlToElement(
        ` <div class="custom-checkbox">
                    <input type="checkbox" id="option-${this.id}-${itemIndex + 1}" value="${
                      item.value || item.title
                    }" data-label="${item.title}">
                    <label for="option-${this.id}-${itemIndex + 1}">
                        ${
                          this.variant === DROPDOWN_VARIANTS.ANCHOR
                            ? `<a class="title" href=${item.value} >${item.title}</a>`
                            : `<span class="title">${item.title}</span>`
                        }
                        ${item.description ? `<span class="description">${item.description}</span>` : ''}
                        <span class="icon icon-checked"></span>
                    </label>
                    </div>`,
      );
      dropdownContent.appendChild(dropdownitem);
    });

    this.parentFormElement.appendChild(dropdown);
  }
}

// Static property to check if the click handler has been added
Dropdown.isClickHandlerAdded = false;
