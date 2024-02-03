import { loadCSS } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { htmlToElement } from './scripts.js';

/**
 * Proccess current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and /content/exl/global/en/path/to/content.html for both EDS and AEM
 */
export const getPathDetails = () => {
  const { pathname } = window.location;
  const extParts = pathname.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1] : '';
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  // 4 is the index of the language in the path for AEM content paths like  /content/exl/global/en/path/to/content.html
  // 1 is the index of the language in the path for EDS paths like /en/path/to/content
  let lang = isContentPath ? safeLangGet(4) : safeLangGet(1);
  // remove suffix from lang if any
  if (lang.indexOf('.') > -1) {
    lang = lang.substring(0, lang.indexOf('.'));
  }
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${lang}`)) || '';
  const suffix = pathname.substring(pathname.indexOf(`/${lang}`) + lang.length + 1) || '';
  return {
    ext,
    prefix,
    suffix,
    lang,
    isContentPath,
  };
};

const pathDetails = getPathDetails();

/**
 * loads the one and only language fragment.
 */
export const loadLanguageFragment = async () => {
  window.languagePromise =
    window.languagePromise ||
    new Promise((resolve) => {
      fetch(`/fragments/en/languages/languages.plain.html`)
        .then((response) => response.text())
        .then((text) => {
          resolve(text);
        });
    });
  loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);
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

  const { lang: currentLang } = getPathDetails();
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
