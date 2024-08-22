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
    lang: 'en',
    title: 'English',
  },
  {
    lang: 'es',
    title: 'Español',
  },
  {
    lang: 'fr',
    title: 'Français',
  },
  {
    lang: 'it',
    title: 'Italiano',
  },
  {
    lang: 'nl',
    title: 'Nederlands',
  },
  {
    lang: 'pt',
    title: 'Português',
  },
  {
    lang: 'sv',
    title: 'Svenska',
  },
  {
    lang: 'zh-hans',
    title: '中文 (简体)',
  },
  {
    lang: 'zh-hant',
    title: '中文 (繁體)',
  },
  {
    lang: 'ja',
    title: '日本語',
  },
  {
    lang: 'ko',
    title: '한국어',
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
const buildLanguageBlock = async ( 
  options,
  languages = defaultLanguages,
  onLanguageChange = switchLanguage,
) => {
  const popoverClass =
    options.position === 'top' ? 'language-selector-popover language-selector-popover--top' : 'language-selector-popover';
  loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);

  const spans = languages.map(
    ({ lang, title }) => `<span class="language-selector-label" data-value="${lang}">${title}</span>`,
  );
  const popover = htmlToElement(
    `<div class="${popoverClass}" id="${options.popoverId}"style="display:none">
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
    languages
  };
};

export class LanguageBlock  extends HTMLElement {

  constructor(options = {}) {
  super();
    this.options = options;
    this.popoverId = options.popoverId;
    this.position = options.position;
    this.languagePopover = buildLanguageBlock(options);   
  } 

}

customElements.define('language-block', LanguageBlock);
