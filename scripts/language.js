import { loadCSS } from './lib-franklin.js';
import { htmlToElement } from './scripts.js';

let languagePromise = null;
export const loadLanguageFragment = async () => {
  languagePromise =
    languagePromise ||
    new Promise((resolve) => {
      fetch(`/fragments/en/languages/languages.plain.html`)
        .then((response) => response.text())
        .then((text) => {
          resolve(text);
        });
    });
  loadCSS('/styles/language.css');
  return languagePromise;
};

export const getCurrentLanguage = () => {
  // first part of url is the language
  const url = window.location.pathname;
  const parts = url.split('/');
  return parts.length > 0 ? url.split('/')[1] : 'en';
};

export const isIndex = () => {
  const url = window.location.pathname;
  return url === '/';
};

export const getLanguagePath = (language) => {
  if (isIndex()) {
    return `/${language}`;
  }
  return window.location.pathname.replace(getCurrentLanguage(), language);
};

export const switchLanguage = async (language) => {
  const currentLanguage = getCurrentLanguage();
  if (currentLanguage === language) {
    return;
  }

  if (isIndex()) {
    window.location.pathname = `/${language}`;
  } else {
    window.location.pathname = getLanguagePath(language);
  }
};

export const buildLanguagePopover = async (position) => {
  const popoverId = 'language-picker-popover';
  const popoverClass =
    position === 'top' ? 'language-selector-popover language-selector-popover--top' : 'language-selector-popover';
  let languagesEl = htmlToElement(await loadLanguageFragment());
  languagesEl = languagesEl.querySelector('ul');

  const languageOptions = languagesEl?.children || [];
  const languages = [...languageOptions].map((option) => ({
    title: option.textContent,
    lang: option?.firstElementChild?.getAttribute('href'),
  }));

  const currentLang = getCurrentLanguage();
  const options = languages
    .map((option) => {
      const lang = option.lang?.toLowerCase();
      const selected = currentLang === lang ? 'selected' : '';
      return `<span class="language-selector-label" data-value="${lang}" ${selected}>${option.title}</span>`;
    })
    .join('');
  const popover = htmlToElement(`
    <div class="${popoverClass}" id="${popoverId}">
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
