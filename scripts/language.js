// eslint-disable-next-line import/no-cycle
import { loadCSS } from './lib-franklin.js';
import { htmlToElement, getPathDetails } from './scripts.js';

const pathDetails = getPathDetails();
const defaultLanguages = [
  {
    lang: 'de',
    title: 'Deutsch',
  },
  {
    lang: 'fr',
    title: 'Français',
  },
  {
    lang: 'es',
    title: 'Español',
  },
  {
    lang: 'it',
    title: 'Italiano',
  },
  {
    lang: 'ja',
    title: '日本語',
  },
  {
    lang: 'ko',
    title: '한국어',
  },
  {
    lang: 'pt',
    title: 'Português',
  },
  {
    lang: 'ru',
    title: 'Русский',
  },
  {
    lang: 'zh',
    title: '中文',
  },
];

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
export const buildLanguagePopover = async (
  position,
  popoverId,
  languages = defaultLanguages,
  onLanguageChange = switchLanguage,
) => {
  const popoverClass =
    position === 'top' ? 'language-selector-popover language-selector-popover--top' : 'language-selector-popover';
  loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);

  const spans = languages.map(
    ({ lang, title }) => `<span class="language-selector-label" data-value="${lang}">${title}</span>`,
  );
  const popover = htmlToElement(
    `<div class="${popoverClass}" id="${popoverId}"style="display:none">
      ${spans.join('')}
    </div>`,
  );
  popover.addEventListener('click', (e) => {
    const { target } = e;
    if (target.classList.contains('language-selector-label')) {
      target.setAttribute('selected', 'true');
      const lang = target.getAttribute('data-value');
      onLanguageChange(lang);
    }
  });
  return {
    popover,
    languages,
  };
};
