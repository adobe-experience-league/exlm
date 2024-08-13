// eslint-disable-next-line import/no-cycle
import { loadCSS } from './lib-franklin.js';
import { htmlToElement, getPathDetails, fetchFragment } from './scripts.js';

const pathDetails = getPathDetails();

/**
 * @typedef {Object} DecoratorOptions
 * @property {boolean} isCommunity
 */

export const getLanguagePath = (language, decoratorOptions) => {
  const { prefix, suffix } = pathDetails;
  if (decoratorOptions.isCommunity) {
    return language;
  }
  return `${prefix}/${language}${suffix}`;
};

/**
 * changes current url to the new language url
 */
const switchLanguage = (language, decoratorOptions) => {
  const { lang } = pathDetails;
  if (lang !== language) {
    window.location.pathname = getLanguagePath(language, decoratorOptions);
  }
};

const communityLang = [
  { legend: 'de', title: 'Deutsch' },
  { legend: 'en', title: 'English' },
  { legend: 'es', title: 'Español' },
  { legend: 'fr', title: 'Français' },
  { legend: 'ja', title: '日本語' },
  { legend: 'pt-br', title: 'Português' },
  { legend: 'ko', title: '한국어' },
];
/**
 * Decoration for language popover - shared between header and footer
 */
export const buildLanguagePopover = async (position, popoverId, decoratorOptions) => {
  loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);
  const popoverClass =
    position === 'top' ? 'language-selector-popover language-selector-popover--top' : 'language-selector-popover';
  let languagesEl;
  if (decoratorOptions.isCommunity) {
    languagesEl = htmlToElement(
      `<div><ul>${communityLang
        .map((lang) => `<li><a href="${lang.legend}">${lang.title}</a></li>`)
        .join('')}</ul><div>`,
    );
  } else {
    languagesEl = htmlToElement(await fetchFragment('languages/languages', 'en'));
  }
  const newLanguagesEl = languagesEl.querySelector('ul');
  const languageOptions = newLanguagesEl?.children || [];
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
      switchLanguage(lang, decoratorOptions);
    }
  });
  return {
    popover,
    languages,
  };
};
