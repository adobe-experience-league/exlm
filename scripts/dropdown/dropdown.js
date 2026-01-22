import { loadCSS, decorateIcons } from '../lib-franklin.js';
import { htmlToElement } from '../scripts.js';

export const DROPDOWN_VARIANTS = {
  DEFAULT: 'default',
  ANCHOR: 'anchor-menu',
  MULTISELECT: 'multi-select',
};

await loadCSS(`${window.hlx.codeBasePath}/scripts/dropdown/dropdown.css`);

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
  constructor(parentFormElement, defaultValue, optionsArray, variant = DROPDOWN_VARIANTS.DEFAULT, id = null) {
    this.parentFormElement = parentFormElement;
    this.defaultValue = defaultValue;
    this.optionsArray = optionsArray;
    this.id = id || document.querySelectorAll('.custom-filter-dropdown').length;
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
    let count = 0;
    this.dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
      count = checkbox.checked ? count + 1 : count;
      if (checkbox.value === value) {
        const label = this.dropdown.querySelector('button > span');
        checkbox.checked = true;
        this.dropdown.dataset.selected = value;
        if (this.variant === DROPDOWN_VARIANTS.MULTISELECT) {
          label.innerText = count > 0 ? `${this.defaultValue} (${count})` : this.defaultValue;
        } else {
          label.innerText = checkbox.dataset.label;
        }
      }
    });
  }

  /**
   * Updates multiple dropdown values based on a value-to-boolean mapping object.
   * Only works for MULTISELECT variant dropdowns.
   *
   * @param {Object} valueStates - Object mapping values to boolean states
   */
  updateDropdownValues(valueStates) {
    if (this.variant !== DROPDOWN_VARIANTS.MULTISELECT) {
      return;
    }

    Object.entries(valueStates).forEach(([value, checked]) => {
      const checkbox = this.dropdown.querySelector(`input[type="checkbox"][value="${value}"]`);
      if (checkbox) {
        checkbox.checked = checked;
      }
    });

    const checkedCheckboxes = this.dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]:checked');
    const selectedValues = Array.from(checkedCheckboxes).map((cb) => cb.value);
    this.dropdown.dataset.selected = selectedValues.join(',');

    this.updateButtonText(selectedValues.length);
  }

  /**
   * Resets the dropdown to its initial state
   * Clears all selections, resets button text, and clears internal state
   * @return {void}
   */
  reset() {
    if (!this.dropdown) return;

    // Reset internal state
    this.dropdown.dataset.selected = '';

    // Reset button label to default value
    const buttonLabel = this.dropdown.querySelector('button > span.custom-filter-dropdown-name');
    if (buttonLabel) {
      buttonLabel.textContent = this.defaultValue;
    }

    // Uncheck all checkboxes
    const checkboxes = this.dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkbox.checked = false;
      }
    });

    // Close dropdown if open
    if (this.dropdown.classList.contains('open')) {
      this.dropdown.classList.remove('open');
      const dropdownContent = this.dropdown.querySelector('.filter-dropdown-content');
      if (dropdownContent) {
        dropdownContent.style.display = 'none';
      }
    }
  }

  /**
   * Gets currently selected values from the dropdown
   * @returns {string[]} Array of selected option values
   */
  getSelectedValues() {
    if (!this.dropdown) return [];

    const selectedValues = this.dropdown.dataset.selected
      ? this.dropdown.dataset.selected.split(',').filter(Boolean)
      : [];

    return selectedValues;
  }

  /**
   * Updates button text based on selection count
   * @param {number} selectionCount - Number of selected items
   */
  updateButtonText(selectionCount) {
    const buttonLabel = this.dropdown.querySelector('button > span.custom-filter-dropdown-name');
    if (!buttonLabel) return;

    if (this.variant === DROPDOWN_VARIANTS.MULTISELECT) {
      buttonLabel.textContent = selectionCount > 0 ? `${this.defaultValue} (${selectionCount})` : this.defaultValue;
    } else if (selectionCount > 0) {
      const selectedValue = this.dropdown.dataset.selected;
      const checkbox = this.dropdown.querySelector(`input[type="checkbox"][value="${selectedValue}"]`);
      if (checkbox) {
        buttonLabel.textContent = checkbox.dataset.label;
      } else {
        buttonLabel.textContent = this.defaultValue;
      }
    } else {
      buttonLabel.textContent = this.defaultValue;
    }
  }

  /**
   * Removes the dropdown from DOM and cleans up
   */
  remove() {
    if (this.dropdown?.parentElement) {
      this.dropdown.parentElement.removeChild(this.dropdown);
    }
    this.dropdown = null;
  }

  /**
   * Updates dropdown options dynamically without recreating the dropdown
   * Preserves selected state for options that still exist
   * @param {Array} newOptionsArray - New array of options to display
   */
  updateOptions(newOptionsArray) {
    if (!this.dropdown) return;

    if (!newOptionsArray?.length) {
      this.remove();
      return;
    }

    const currentSelected = this.getSelectedValues();

    const wasOpen = this.dropdown.classList.contains('open');
    const dropdownContent = this.dropdown.querySelector('.filter-dropdown-content');
    if (!dropdownContent) return;

    this.optionsArray = newOptionsArray;

    this.renderOptions(dropdownContent);

    const availableValues = newOptionsArray.map((opt) => opt.value || opt.title);
    const validSelections = currentSelected.filter((val) => availableValues.includes(val));

    if (validSelections.length > 0) {
      validSelections.forEach((selectedValue) => {
        const checkbox = dropdownContent.querySelector(`input[type="checkbox"][value="${selectedValue}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });

      this.dropdown.dataset.selected = validSelections.join(',');
      this.updateButtonText(validSelections.length);
    } else {
      this.dropdown.dataset.selected = '';
      this.updateButtonText(0);
    }

    if (wasOpen) {
      this.dropdown.classList.add('open');
      dropdownContent.style.display = 'block';
    }
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

        if (variant !== DROPDOWN_VARIANTS.MULTISELECT) {
          dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
            if (event.target.value !== checkbox.value) checkbox.checked = false;
          });

          if (dropdown.classList.contains('open')) {
            dropdown.classList.remove('open');
            button.nextElementSibling.style.display = 'none';
          }
        }

        const updateButtonText = variant !== DROPDOWN_VARIANTS.ANCHOR;
        let buttonText;
        if (variant === DROPDOWN_VARIANTS.MULTISELECT) {
          const selectedValues = dropdown.dataset.selected ? dropdown.dataset.selected.split(',') : [];
          if (selectedValues.includes(event.target.value)) {
            selectedValues.splice(selectedValues.indexOf(event.target.value), 1);
            dropdown.dataset.selected = selectedValues.join(',');
            buttonText =
              selectedValues.length > 0
                ? `${dropdown.dataset.filterType} (${selectedValues.length})`
                : dropdown.dataset.filterType;
          } else {
            selectedValues.push(event.target.value);
            dropdown.dataset.selected = selectedValues.join(',');
            buttonText =
              selectedValues.length > 0
                ? `${dropdown.dataset.filterType} (${selectedValues.length})`
                : dropdown.dataset.filterType;
          }
        } else {
          const selectedValue = dropdown.dataset.selected;
          if (event.target.value === selectedValue) {
            dropdown.dataset.selected = dropdown.dataset.filterType;
            buttonText = dropdown.dataset.filterType;
            dropdown.querySelectorAll('.custom-checkbox input[type="checkbox"]').forEach((checkbox) => {
              if (dropdown.dataset.selected === checkbox.value) checkbox.checked = true;
            });
          } else {
            dropdown.dataset.selected = event.target.value;
            buttonText = event.target.dataset.label;
          }
        }

        if (updateButtonText) {
          button.children[0].textContent = buttonText;
        }
      }
    }
  }

  /**
   * Renders options into the dropdown content container
   * Extracted to avoid duplication between initFormElements() and updateOptions()
   * @param {HTMLElement} dropdownContent - The dropdown content container element
   */
  renderOptions(dropdownContent) {
    dropdownContent.innerHTML = '';

    this.optionsArray.forEach((item, itemIndex) => {
      const dropdownItem = htmlToElement(
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
      decorateIcons(dropdownItem);
      dropdownContent.appendChild(dropdownItem);
    });
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
          		    <span class="custom-filter-dropdown-name">${this.defaultValue}</span>
          		    <span class="icon icon-chevron"></span>
          	    </button>
              `),
    );
    decorateIcons(dropdown);

    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('filter-dropdown-content');
    dropdown.appendChild(dropdownContent);

    this.renderOptions(dropdownContent);

    this.parentFormElement.appendChild(dropdown);
  }
}

// Static property to check if the click handler has been added
Dropdown.isClickHandlerAdded = false;
