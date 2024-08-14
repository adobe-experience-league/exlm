// eslint-disable-next-line import/no-cycle
import { loadCSS } from './lib-franklin.js';
import { htmlToElement, getPathDetails, fetchFragment } from './scripts.js';

const pathDetails = getPathDetails();

/**
 * @typedef {Object} languageDecorator
 * @property {boolean} isCommunity
 * @property {string} position
 * @property {string} popoverId
 * @property {boolean} lang
 */

export const getLanguagePath = (language) => {
  const { prefix, suffix } = pathDetails;
  return `${prefix}/${language}${suffix}`;
};

/**
 * changes current url to the new language url
 */
const switchLanguage = (lang, languageDecorator) => {
  if (pathDetails.lang !== lang) {
    if (languageDecorator.isCommunity) {
      fetch(`${window.location.origin}/api/ads?lang=${lang}&page_size=12`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            const url = new URL(window.location.href);
            url.searchParams.set('profile.language', lang);
            window.location.href = url.href;
          }
        });
    } else {
      window.location.pathname = getLanguagePath(lang);
    }
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
const buildLanguagePopover = async (languageDecorator) => {
  loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);
  const popoverClass =
    languageDecorator.position === 'top'
      ? 'language-selector-popover language-selector-popover--top'
      : 'language-selector-popover';
  let languagesEl;
  if (languageDecorator.isCommunity) {
    languagesEl = htmlToElement(
      `<div><ul>${communityLang.map((l) => `<li><a href="${l.legend}">${l.title}</a></li>`).join('')}</ul><div>`,
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

  const currentLang = pathDetails.lang;
  const options = languages
    .map((option) => {
      const lan = option.lang?.toLowerCase();
      const selected = currentLang === lan ? 'selected' : '';
      return `<span class="language-selector-label" data-value="${lan}" ${selected}>${option.title}</span>`;
    })
    .join('');
  const popover = htmlToElement(`
    <div class="${popoverClass}" id="${languageDecorator.popoverId}" style="display:none">
      ${options}
    </div>`);

  popover.addEventListener('click', (e) => {
    const { target } = e;
    if (target.classList.contains('language-selector-label')) {
      target.setAttribute('selected', 'true');
      const lang = target.getAttribute('data-value');
      switchLanguage(lang, languageDecorator);
    }
  });
  return {
    popover,
    languages,
  };
};

export class LanguageBlock {
  /**
   * @param {languageDecorator} languageDecorator
   */
  constructor(languageDecorator = {}) {
    languageDecorator.lang = languageDecorator.lang || pathDetails.lang || 'en';
    languageDecorator.isCommunity = languageDecorator.decoratorOptions
      ? languageDecorator.decoratorOptions.isCommunity ?? languageDecorator.isCommunity ?? false
      : languageDecorator.isCommunity ?? false;
    this.languageDecorator = languageDecorator;
    this.languagePopover = buildLanguagePopover(languageDecorator);
  }
}
