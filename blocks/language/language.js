import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import { htmlToElement, getPathDetails } from '../../scripts/scripts.js';
import { getCell } from '../header/header-utils.js';

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

const loadStyles = async () => {
  loadCSS(`${window.hlx.codeBasePath}/blocks/language/language.css`);
};

export default class LanguageBlock extends HTMLElement {
  constructor(position, popoverId, block, type) {
    super();
    this.position = position;
    this.popoverId = popoverId;
    this.block = block;
    this.type = type;
  }

  decorateButton = async () => {
    const title = getCell(this.block, 1, 1)?.firstChild.textContent;
    const languageHtml = htmlToElement(`
    <button type="button" class="language-selector-button" aria-haspopup="true" aria-controls="language-picker-popover-${this.type}" aria-label="${title}">
      <span class="icon icon-globegrid"></span>
    </button>        
  `);
    this.appendChild(languageHtml);
  };

  /**
   * Decoration for language popover - shared between header and footer
   */
  buildLanguageBlock = async (languages = defaultLanguages, onLanguageChange = switchLanguage) => {
    const popoverClass =
      this.position === 'top'
        ? 'language-selector-popover language-selector-popover--top'
        : 'language-selector-popover';

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
    this.appendChild(popover);
  };

  async connectedCallback() {
    loadStyles();
    await this.decorateButton();
    await this.buildLanguageBlock();
    decorateIcons(this);
  }
}

customElements.define('language-block', LanguageBlock);
