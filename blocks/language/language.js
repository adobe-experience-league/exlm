import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import { htmlToElement, getPathDetails } from '../../scripts/scripts.js';
import { getCell } from '../header/header-utils.js';

/**
 * @typedef {Object} Language
 * @property {string} lang
 * @property {string} title
 * @property {boolean} isCommunity
 */

const pathDetails = getPathDetails();
const defaultLanguages = [
  { lang: 'de', title: 'Deutsch', isCommunity: true },
  { lang: 'en', title: 'English', isCommunity: true },
  { lang: 'es', title: 'Español', isCommunity: true },
  { lang: 'fr', title: 'Français', isCommunity: true },
  { lang: 'it', title: 'Italiano' },
  { lang: 'nl', title: 'Nederlands' },
  { lang: 'pt-br', title: 'Português', isCommunity: true },
  { lang: 'sv', title: 'Svenska' },
  { lang: 'zh-hans', title: '中文 (简体)' },
  { lang: 'zh-hant', title: '中文 (繁體)' },
  { lang: 'ja', title: '日本語', isCommunity: true },
  { lang: 'ko', title: '한국어', isCommunity: true },
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
  /**
   * @param {'top'|'bottom'} position
   * @param {string} popoverId
   * @param {HTMLElement} block
   * @param {Language[]|undefined} languages
   */
  constructor(position, popoverId, block, languages = defaultLanguages) {
    super();
    this.position = position;
    this.popoverId = popoverId;
    this.block = block;
    this.languages = languages;
    this.title = getCell(this.block, 1, 1)?.firstChild.textContent;
    this.isCommunity = this.block.classList.contains('community');
  }

  decorateButton = async () => {
    const languageHtml = htmlToElement(`
    <button type="button" class="language-selector-button" aria-haspopup="true" aria-controls="${this.popoverId}" aria-label="${this.title}">
      <span class="icon icon-globegrid"></span>
    </button>
  `);
    this.appendChild(languageHtml);
  };

  /**
   * Decoration for language popover - shared between header and footer
   */
  buildLanguageBlock = async (onLanguageChange = switchLanguage) => {
    const popoverClass =
      this.position === 'top'
        ? 'language-selector-popover language-selector-popover--top'
        : 'language-selector-popover';

    const { lang: currentLang } = getPathDetails();

    if (this.isCommunity === true) {
      const comLanguages = this.languages.filter((lang) => lang.isCommunity);
      this.languages = comLanguages;
    }
    const spans = this.languages.map((option) => {
      const lang = option.lang?.toLowerCase();
      const { title } = option;
      const selected = currentLang === lang ? 'selected' : '';
      return `<span class="language-selector-label" data-value="${lang}" ${selected}>${title}</span>`;
    });

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
