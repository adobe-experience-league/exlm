/**
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const [viewRow, formRow] = block.querySelectorAll(':scope > div');

  const title = viewRow.textContent;
  const formId = formRow.textContent?.trim();
  formRow.innerHTML = '';

  const toggleForm = () => {
    formRow.classList.toggle('hidden');
    viewRow.classList.toggle('hidden');
  };

  // view
  viewRow.classList.add('inline-survey-view');
  const titleEl = document.createElement('h4');
  titleEl.textContent = title;
  viewRow.innerHTML = '';

  const viewFormButton = document.createElement('button');
  viewFormButton.textContent = 'View Form';
  viewFormButton.classList.add('view-form-button');
  viewFormButton.addEventListener('click', toggleForm);

  viewRow.append(titleEl);
  viewRow.append(viewFormButton);

  // form
  formRow.classList.add('inline-survey-form', 'hidden');
  const formHeader = document.createElement('div');
  formHeader.classList.add('inline-survey-form-header');
  formHeader.append(titleEl.cloneNode(true));

  const exitFormButton = document.createElement('button');
  exitFormButton.textContent = 'Exit Form';
  exitFormButton.classList.add('exit-form-button');
  exitFormButton.addEventListener('click', toggleForm);
  formHeader.append(exitFormButton);
  formRow.append(formHeader);

  const formContent = document.createElement('div');
  formContent.id = formId;
  formContent.classList.add('inline-survey-form-content');
  formRow.append(formContent);

  // remove loading element when form content is loaded
  const checkFormContent = setInterval(() => {
    if (formContent.children.length > 0) {
      clearInterval(checkFormContent);
      formRow.querySelector('.inline-survey-loading').remove();
    }
  }, 500);

  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('inline-survey-loading');
  loadingDiv.textContent = 'Loading...';
  formRow.append(loadingDiv);
}
