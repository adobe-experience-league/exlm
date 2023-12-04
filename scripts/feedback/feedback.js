import { decorateIcons, getMetadata, loadCSS } from '../lib-franklin.js';
import { convertTextToHTML, createTag, htmlToElement } from './utils.js';

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
  firstQuestion.innerHTML += '<span class="icon icon-chevron"></span>';

  return firstQuestion;
}

function decorateSecondQuestion(secondQuestion) {
  const textareaText = secondQuestion.querySelector('div:nth-child(1) > div:last-child').textContent.trim();
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
    'aria-label': textareaText,
    placeholder: textareaText,
    disabled: '',
  });
  const newDiv = createTag('div', { class: 'more-question' }, textarea);

  const submitButton = createTag(
    'button',
    {
      disabled: '',
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

  const qualtricsEl = el.querySelector('.qualtrics-feedback');
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

  leftEl.append(qualtricsEl, firstEl, secondEl);
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

export default async function loadFeedbackUi() {
  if (!showFeedbackBar()) return;

  loadCSS(`${window.hlx.codeBasePath}/scripts/feedback/feedback.css`);

  let feedbackHtml = convertTextToHTML(await feedbackFragment);
  feedbackHtml = htmlToElement(feedbackHtml);

  const body = document.querySelector('body');
  const fb = decorateFeedback(feedbackHtml);
  decorateIcons(fb);
  body.append(fb);
  handleFeedbackToggle(fb);
  handleClosingFeedbackBar(fb);
  handleGithubBtns(fb);
  handleFeedbackBarVisibilityOnScroll();
}

loadFeedbackUi();
