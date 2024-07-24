// eslint-disable-next-line import/no-cycle
import { htmlToElement, getPathDetails } from './importedFunctions.js';

const pathDetails = getPathDetails();
/**
 * loads the one and only language fragment.
 */
const loadLanguageFragment = async () => {
  window.languagePromise =
    window.languagePromise ||
    new Promise((resolve) => {
      fetch(`/fragments/en/languages/languages.plain.html`)
        .then((response) => response.text())
        .then((text) => {
          resolve(text);
        });
    });
  return window.languagePromise;
};

export const getLanguagePath = (language) => {
  const { prefix, suffix } = pathDetails;
  return `${prefix}/${language}${suffix}`;
};

/**
 * changes current url to the new language url
 */
const switchLanguage = (language) => {
  const { lang } = pathDetails;
  if (lang !== language) {
    window.location.pathname = getLanguagePath(language);
  }
};

/**
 * Decoration for language popover - shared between header and footer
 */
export const buildLanguagePopover = async (position, popoverId) => {
  const popoverClass =
    position === 'top' ? 'language-selector-popover language-selector-popover--top' : 'language-selector-popover';
  let languagesEl = htmlToElement(await loadLanguageFragment());
  languagesEl = languagesEl.querySelector('ul');
  const languageOptions = languagesEl?.children || [];
  const languages = [...languageOptions].map((option) => ({
    title: option.textContent,
    lang: option?.firstElementChild?.getAttribute('href'),
  }));

  const { lang: currentLang } = getPathDetails();
  const options = languages
    .map((option) => {
      const lang = option.lang?.toLowerCase();
      const selected = currentLang === lang ? 'selected' : '';
      return `<span class="language-selector-label" data-value="${lang}" ${selected}>${option.title}</span>`;
    })
    .join('');
  const popover = htmlToElement(`
    <div class="${popoverClass}" id="${popoverId}" style="display:none">
      ${options}
    </div>`);

  popover.addEventListener('click', (e) => {
    const { target } = e;
    if (target.classList.contains('language-selector-label')) {
      target.setAttribute('selected', 'true');
      const lang = target.getAttribute('data-value');
      switchLanguage(lang);
    }
  });
  return {
    popover,
    languages,
  };
};
