import { decorateIcons, getMetadata, loadCSS, fetchPlaceholders } from '../lib-franklin.js';
import { createTag, htmlToElement } from '../scripts.js'; // eslint-disable-line import/no-cycle
import { QUALTRICS_LOADED_EVENT_NAME } from './qualtrics/constants.js';
import { embedQualtricsSurveyIntercept } from './qualtrics/qualtrics-embed.js';

// fetch fragment html
const fetchFragment = async (rePath, lang = 'en') => {
  const response = await fetch(`/fragments/${lang}/${rePath}.plain.html`);
  return response.text();
};

const feedbackFragment = fetchFragment('feedback-bar/feedback-bar');

function decorateFirstQuestion(firstQuestion) {
  const newDiv = createTag('div', { class: 'like-btns' });
  const helpFul = firstQuestion
    .querySelector('div:nth-child(1) > div:nth-child(2) > p:nth-child(3)')
    .textContent.trim();
  const notHelpFul = firstQuestion
    .querySelector('div:nth-child(1) > div:nth-child(2) > p:last-child')
    .textContent.trim();
  const wasThisHelpful = firstQuestion.querySelector('div:nth-child(1) > div:nth-child(1) > h3').textContent.trim();
  const thankyouForYourFeedback = firstQuestion
    .querySelector('div:nth-child(2) > div:nth-child(1) > h3')
    .textContent.trim();
  const subTitle = firstQuestion.querySelector('div:nth-child(2) > div:nth-child(4)').textContent.trim();
  const surveyCompletedText = firstQuestion.querySelector('div:nth-child(2) > div:nth-child(3)').textContent.trim();
  const loadingErrorText = firstQuestion
    .querySelector('div:nth-child(1) > div:nth-child(2) > p:first-child')
    .textContent.trim();

  const thumbUpButton = createTag('button', { 'aria-label': 'thumbs up' });
  thumbUpButton.innerHTML = `
    <span class="icon icon-thumb-up"></span>
    <span class="tooltip">${helpFul}</span>
  `;
  newDiv.appendChild(thumbUpButton);

  const thumbDownButton = createTag('button', { 'aria-label': 'thumbs down' });
  thumbDownButton.innerHTML = `
    <span class="icon icon-thumb-down"></span>
    <span class="tooltip">${notHelpFul}</span>
  `;
  newDiv.appendChild(thumbDownButton);

  const errorParagraphs = firstQuestion.querySelectorAll('div > div:nth-child(2) > p');
  errorParagraphs.forEach((p) => p.remove());

  const spinnerIcon = firstQuestion.querySelector('div > div:nth-child(3)');
  spinnerIcon.remove();

  const chevronIcons = firstQuestion.querySelectorAll('div > div:nth-child(4) > p');
  chevronIcons.forEach((p) => p.remove());

  firstQuestion.innerHTML = '';
  firstQuestion.appendChild(document.createElement('h3')).textContent = wasThisHelpful;
  firstQuestion.appendChild(newDiv);
  firstQuestion.appendChild(createTag('div', { class: 'error' }));
  firstQuestion.innerHTML += '<span class="icon icon-chevron"></span>';
  firstQuestion.dataset.updatedTitle = thankyouForYourFeedback;
  firstQuestion.dataset.subtitle = subTitle;
  firstQuestion.dataset.surveyCompletedText = surveyCompletedText;
  firstQuestion.dataset.loadingError = loadingErrorText;

  return firstQuestion;
}

function decorateSecondQuestion(secondQuestion) {
  const initialPlaceholder = secondQuestion.querySelector('div:nth-child(1) > div:last-child').textContent.trim();
  const updatedPlaceholder = secondQuestion.querySelector('div:nth-child(1) > div:first-child').textContent.trim();
  const submitText = secondQuestion
    .querySelector('div:nth-child(2) > div:nth-child(1) > p:first-child')
    .textContent.trim();
  const submitFeedbackText = secondQuestion
    .querySelector('div:nth-child(2) > div:nth-child(1) > p:nth-child(2)')
    .textContent.trim();
  const dismissText = secondQuestion
    .querySelector('div:nth-child(2) > div:nth-child(1) > p:last-child')
    .textContent.trim();
  const textarea = createTag('textarea', {
    class: 'input',
    'aria-describedby': 'additional',
    'aria-label': initialPlaceholder,
    placeholder: initialPlaceholder,
    'data-updated-placeholder': updatedPlaceholder,
    disabled: '',
  });
  const newDiv = createTag('div', { class: 'more-question' }, textarea);

  const submitButton = createTag(
    'button',
    {
      disabled: '',
      class: 'submit',
    },
    `<span>${submitText}</span><span class="tooltip">${submitFeedbackText}</span>`,
  );
  const ctaDiv = createTag('div', { class: 'cta' }, submitButton);

  const dismissButton = createTag('button', { class: 'dismiss' }, `<span>${dismissText}</span>`);
  ctaDiv.appendChild(dismissButton);

  const placeholderContent = secondQuestion.querySelector('div > div:nth-child(1)');
  placeholderContent.remove();

  secondQuestion.innerHTML = '';
  secondQuestion.appendChild(newDiv);
  secondQuestion.appendChild(ctaDiv);
}

function decorateHeaderTxtMobile(headerTextMobile) {
  const newSpan = document.createElement('span');
  newSpan.textContent = headerTextMobile.textContent.trim();
  headerTextMobile.innerHTML = '';
  headerTextMobile.appendChild(newSpan);
}

function decorateExpandedCtrl(expandedControls) {
  const newDiv = createTag('div', { class: 'git-buttons' });
  const reportIssueText = expandedControls
    .querySelector('div:first-child > div:first-child > p:first-child')
    .textContent.trim();
  const githubReportText = expandedControls
    .querySelector('div:first-child > div:first-child > p:nth-child(2)')
    .textContent.trim();
  const suggestEditText = expandedControls
    .querySelector('div:first-child > div:nth-child(2) > p:first-child')
    .textContent.trim();
  const githubSuggestText = expandedControls
    .querySelector('div:first-child > div:nth-child(2) > p:nth-child(2)')
    .textContent.trim();
  const anchor = expandedControls.querySelector('div:nth-child(2) > div:first-child > a');
  const aHref = anchor.href.split('_blank')[0];
  const aText = anchor.textContent.trim();

  function createGitButton(iconClass, buttonText, tooltipText) {
    const button = document.createElement('button');
    const iconSpan = document.createElement('span');
    iconSpan.className = `icon ${iconClass}`;
    button.appendChild(iconSpan);
    button.innerHTML += `
      <span class="action-btn">${buttonText}</span>
      <span class="tooltip">${tooltipText}</span>
    `;

    return button;
  }

  const reportButton = createGitButton('icon-bug', reportIssueText, githubReportText);
  const editButton = createGitButton('icon-edit', suggestEditText, githubSuggestText);

  newDiv.appendChild(reportButton);
  newDiv.appendChild(editButton);

  const gitLinks = expandedControls.querySelectorAll('div > div:nth-child(2)');
  gitLinks.forEach((link) => link.remove());

  const newAnchor = createTag(
    'a',
    {
      href: aHref,
      target: anchor.href.includes('_blank') ? '_blank' : '_self',
    },
    aText,
  );

  expandedControls.innerHTML = '';
  expandedControls.appendChild(newDiv);
  expandedControls.appendChild(newAnchor);
}

function decorateCloseBtnEl() {
  return createTag('span', {
    class: 'icon icon-close',
  });
}

function decorateOpenedCtrl(openedControl) {
  const detailedFb = createTag('span');
  const text = openedControl.querySelector('div:nth-child(1) > div').textContent.trim();
  const desktopChevronIcon = htmlToElement('<span class="icon is-desktop icon-chevron"></span>');
  detailedFb.textContent = text;
  openedControl.innerHTML = '';
  openedControl.append(detailedFb);
  openedControl.append(desktopChevronIcon);
}

function hideFeedbackBar(state = true) {
  document.querySelector('.feedback-ui').setAttribute('aria-hidden', state);
}

function toggleFeedbackBar(el, show = false) {
  const secondEl = el.querySelector('.second-question');
  const rightEl = el.querySelector('.right');

  el.setAttribute('aria-expanded', show);
  secondEl.setAttribute('aria-hidden', !show);
  rightEl.setAttribute('aria-hidden', !show);
}

function decorateFeedback(el) {
  const leftEl = createTag('div', { class: 'left' });
  const rightEl = createTag('div', { class: 'right' });
  const container = createTag('div', {
    role: 'dialog',
    class: 'feedback-ui',
    'aria-label': 'feedback bar',
    'aria-hidden': 'false',
    'aria-expanded': 'false',
  });

  // Qualtrics expects a <dx-docs-feedback /> element with a .qualtrics-feedback child element
  const qualtricsElContainer = createTag('dx-docs-feedback', { class: 'qualtrics-feedback-container' });
  const qualtricsEl = el.querySelector('.qualtrics-feedback');
  qualtricsElContainer.appendChild(qualtricsEl);
  const firstEl = el.querySelector('.first-question');
  const secondEl = el.querySelector('.second-question');
  secondEl.setAttribute('aria-hidden', true);
  const openedCtrlEl = el.querySelector('.opened-controls');
  const headerTxtMobileEl = el.querySelector('.header-text-mobile');
  const expandedCtrlEl = el.querySelector('.expanded-controls');

  decorateFirstQuestion(firstEl);
  decorateSecondQuestion(secondEl);
  decorateOpenedCtrl(openedCtrlEl);
  decorateHeaderTxtMobile(headerTxtMobileEl);
  decorateExpandedCtrl(expandedCtrlEl);
  const closeBtnEl = decorateCloseBtnEl();

  closeBtnEl.addEventListener('click', () => hideFeedbackBar());

  leftEl.append(qualtricsElContainer, firstEl, secondEl);
  rightEl.append(openedCtrlEl, headerTxtMobileEl, expandedCtrlEl);
  rightEl.setAttribute('aria-hidden', true);
  container.append(closeBtnEl, leftEl, rightEl);

  return container;
}

function handleFeedbackToggle(el) {
  const chevrons = el.querySelectorAll('.icon-chevron');

  chevrons.forEach((chevron) => {
    chevron.addEventListener('click', () => {
      const isExpanded = el.getAttribute('aria-expanded') === 'true';

      if (isExpanded) toggleFeedbackBar(el, false);
      else toggleFeedbackBar(el, true);
    });
  });
}

function goToEditPage() {
  try {
    const gitEditUrl = getMetadata('git-edit');
    window.open(gitEditUrl, '_blank');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Couldn't retrieve suggest page URL.", err);
  }
}

function goToReportIssuePage() {
  try {
    const gitUrl = getMetadata('git-issue');
    const gitFilename = getMetadata('git-filename');
    const feedbackurl = new URL(gitUrl);

    feedbackurl.searchParams.set('body', `Issue in .${gitFilename}`);
    window.open(feedbackurl.href, '_blank');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Couldn't retrieve suggest page URL.", err);
  }
}

function handleGithubBtns(el) {
  const reportBtn = el.querySelector('.git-buttons > button:nth-child(1)');
  const suggestBtn = el.querySelector('.git-buttons > button:nth-child(2)');

  suggestBtn.addEventListener('click', goToEditPage);
  reportBtn.addEventListener('click', goToReportIssuePage);
}

function handleIntersection(entries) {
  const fb = document.querySelector('.feedback-ui');

  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      hideFeedbackBar(true);
      toggleFeedbackBar(fb, false);
    } else {
      hideFeedbackBar(false);
    }
  });
}

function handleFeedbackBarVisibilityOnScroll() {
  const options = {
    threshold: 0.05,
  };

  const observer = new IntersectionObserver(handleIntersection, options);
  const footerEl = document.querySelector('footer');
  if (footerEl) observer.observe(footerEl);
}

function handleClosingFeedbackBar(el) {
  el.querySelector('.cta .dismiss').addEventListener('click', () => hideFeedbackBar());
}

function showFeedbackBar() {
  return getMetadata('id');
}

function showQualtricsLoadingError(el) {
  const firstQuestionEl = el.querySelector('.first-question');
  const { loadingError } = firstQuestionEl.dataset;
  const errorEl = el.querySelector('.error');
  errorEl.setAttribute('aria-hidden', false);
  errorEl.textContent = loadingError;
}

function handleFeedbackIcons(el) {
  const feedbackIcon = el.querySelectorAll('.like-btns > button');
  const firstQuestionElement = el.querySelector('.first-question');
  const secondQuestionElement = el.querySelector('.second-question');
  const moreQuestion = secondQuestionElement.querySelector('.second-question > .more-question');
  const textArea = moreQuestion.querySelector('.more-question > textarea');
  const title = el.querySelector('.first-question > h3');

  [...feedbackIcon].forEach((icon) => {
    icon.addEventListener('click', () => {
      const textarea = el.querySelector('.more-question > textarea');
      textarea.disabled = false;
      toggleFeedbackBar(el, true);
      firstQuestionElement.classList.add('answered');
      const iconVariation = icon.getAttribute('aria-label').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
      const qualtricsIcon = el.querySelector(`.QSI__EmbeddedFeedbackContainer_SVGButton[title="${iconVariation}"]`);

      if (qualtricsIcon && icon) {
        qualtricsIcon.click();

        if (textArea) {
          textArea.placeholder = textArea.getAttribute('data-updated-placeholder');
        }

        const { updatedTitle, subtitle } = firstQuestionElement.dataset;
        title.textContent = updatedTitle;
        const subtitleElement = createTag('p', { class: 'subtitle' }, subtitle);
        moreQuestion.insertAdjacentElement('beforebegin', subtitleElement);
      } else {
        console.log('Qualtrics feedback malformed.'); // eslint-disable-line no-console
        showQualtricsLoadingError(el);
        toggleFeedbackBar(el, false);
      }
    });
  });
}

function handleFeedbackSubmit(el) {
  const submitButton = el.querySelector('button.submit');
  const textArea = el.querySelector('.more-question > textarea');
  const secondQuestionElement = el.querySelector('.second-question');
  const firstQuestionElement = el.querySelector('.first-question');

  textArea.addEventListener('input', () => {
    submitButton.disabled = textArea.value === '';
  });

  submitButton.addEventListener('click', () => {
    const qualtricsSubmitButton = el.querySelector('.QSI__EmbeddedFeedbackContainer_TextButton');
    const qualtricsTextArea = el.querySelector('.QSI__EmbeddedFeedbackContainer_OpenText');

    if (qualtricsTextArea && qualtricsSubmitButton) {
      qualtricsTextArea.click();
      qualtricsTextArea.value = textArea.value || '';

      // Qualtrics pulls the value off the element referenced in an InputEvent
      qualtricsTextArea.dispatchEvent(new InputEvent('input'));

      // There is also a race condition — sometimes the form can be submitted before the value is validated in the InputEvent.
      setTimeout(() => {
        toggleFeedbackBar(el, false);
        qualtricsSubmitButton.click();
        secondQuestionElement.classList.add('complete');
        const { surveyCompletedText } = firstQuestionElement.dataset;
        const surveyCompletedElement = createTag('p', { class: 'subtitle' }, surveyCompletedText);
        firstQuestionElement.insertAdjacentElement('afterend', surveyCompletedElement);
      }, 300);
    } else {
      console.log('Qualtrics text feedback malformed.'); // eslint-disable-line no-console
      showQualtricsLoadingError(el);
      toggleFeedbackBar(el, false);
    }
  });
}

export default async function loadFeedbackUi() {
  const placeholders = await fetchPlaceholders();

  if (!showFeedbackBar()) return;

  loadCSS(`${window.hlx.codeBasePath}/scripts/feedback/feedback.css`);

  let feedbackHtml = await feedbackFragment;
  feedbackHtml = htmlToElement(feedbackHtml);

  const body = document.querySelector('body');
  const fb = decorateFeedback(feedbackHtml);
  decorateIcons(fb);
  body.append(fb);
  handleFeedbackToggle(fb);
  handleClosingFeedbackBar(fb);
  handleGithubBtns(fb);
  handleFeedbackBarVisibilityOnScroll();

  try {
    embedQualtricsSurveyIntercept(placeholders.feedbackSurveyId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Couldn't embed Qualtrics survey intercept.", err);
    showQualtricsLoadingError(fb);
    toggleFeedbackBar(fb, false);
  }

  function interceptLoaded() {
    // wait for Qualtrics to load
    // eslint-disable-next-line no-undef
    if (QSI.API) {
      handleFeedbackIcons(fb);
      handleFeedbackSubmit(fb);
    }
  }

  window.addEventListener(QUALTRICS_LOADED_EVENT_NAME, interceptLoaded, false);
}

loadFeedbackUi();
