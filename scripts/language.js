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
    lang: 'pt-br',
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

const getLanguagePath = (language) => {
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

export default class LanguageBlock extends HTMLElement {
  constructor(position, popoverId) {
    super();
    this.position = position;
    this.popoverId = popoverId;
  }

  /**
   * Decoration for language popover - shared between header and footer
   */
  buildLanguageBlock = async (languages = defaultLanguages, onLanguageChange = switchLanguage) => {
    const popoverClass =
      this.position === 'top'
        ? 'language-selector-popover language-selector-popover--top'
        : 'language-selector-popover';
    loadCSS(`${window.hlx.codeBasePath}/styles/language.css`);

    const spans = languages.map(
      ({ lang, title }) => `<span class="language-selector-label" data-value="${lang}">${title}</span>`,
    );
    const popover = htmlToElement(
      `<div class="${popoverClass}" id="${this.popoverId}"style="display:none">
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
}

customElements.define('language-block', LanguageBlock);
