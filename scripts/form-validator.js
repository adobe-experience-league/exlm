/**
 * Class representing a form validator.
 * @class
 */
export default class FormValidator {
  /**
   * Creates an instance of FormValidator.
   * @param {HTMLFormElement} form - The form element to be validated.
   * @param {Object} [placeholders={}] - Placeholder values for error messages.
   * @param {Object} [options={}] - Additional options for validation.
   */
  constructor(form, placeholders = {}, options = {}) {
    this.form = form;
    this.placeholders = placeholders;
    this.options = options;
    this.isValidForm = true;
  }

  /**
   * Validates the form based on the specified options.
   * Uses aggregate rules if provided, otherwise validates individual fields.
   * @returns {boolean} - Returns true if the form is valid, otherwise false.
   */
  validate() {
    this.isValidForm = true;
    if (this.options?.aggregateRules) {
      this.aggregateRules();
    } else {
      this.validateFields();
    }
    return this.isValidForm;
  }

  /**
   * Validates individual fields within the form.
   * Displays error messages for invalid fields based on data attributes or default placeholders.
   */
  validateFields() {
    const inputs = this.form.querySelectorAll('input[type="text"], select, textarea');
    inputs.forEach((input) => {
      // Clear previous error messages
      const errorElement = input.nextElementSibling;
      if (errorElement && errorElement.classList.contains('form-field-error')) {
        errorElement.remove();
      }

      // Get error message from data attribute
      const errorMessage = input.getAttribute('data-error-message');

      // Validate field
      if (input.hasAttribute('required') && !input.value.trim()) {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'form-field-error';
        errorSpan.textContent = errorMessage || this.placeholders?.formFieldRequiredError || 'Field is required.';
        input.parentNode.insertBefore(errorSpan, input.nextSibling);
        this.isValidForm = false;
      }
    });
  }

  /**
   * Validates groups of elements based on aggregate rules.
   * Displays an error message if the group is invalid.
   * @param {Object} [options.aggregateRules] - Aggregate rules for group validation.
   */
  aggregateRules() {
    const checkboxGroup = this.options?.aggregateRules?.checkBoxGroup;
    const { groupName, errorContainer } = checkboxGroup;
    if (errorContainer) {
      errorContainer.classList.toggle('hidden', true);
    }

    if (checkboxGroup) {
      const checkboxes = groupName
        ? this.form.querySelectorAll(`input[name="${groupName}"]`)
        : this.form.querySelectorAll('input[type="checkbox"]');
      const isGroupValid = Array.from(checkboxes).some((checkbox) => checkbox.checked);
      if (!isGroupValid) {
        this.isValidForm = false;
        if (errorContainer) {
          errorContainer.classList.toggle('hidden', false);
        }
      }
    }
  }
}
