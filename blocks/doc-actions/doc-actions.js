import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, isDocPage, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';
import UserActions from '../../scripts/user-actions/user-actions.js';

const { automaticTranslationLink } = getConfig();

async function decorateLanguageToggle(block, placeholders) {
  if (
    document.querySelector('meta[name="ht-degree"]') &&
    ((document.querySelector('meta[name="ht-degree"]') || {}).content || '').trim() !== '100%'
  ) {
    const languageToggleElement = createTag(
      'div',
      { class: 'doc-mt-toggle' },
      `<div class="doc-mt-checkbox">
      <span>${placeholders.automaticTranslation}</span>
      <a href="${automaticTranslationLink}" target="_blank">
        <span class="icon icon-info"></span>
        <span class="action-tooltip">${
          placeholders.changeLanguageTooltip ||
          'To translate the page into English, choose English from the language switcher.'
        }</span>
      </a>
      </div>
      <div class="doc-mt-feedback">
        <span class="prompt">${placeholders.automaticTranslationFeedback}</span>
        <div class="doc-mt-feedback-radio">
          <label class="radio"><input type="radio" name="helpful-translation" value="yes">${
            placeholders.automaticTranslationFeedbackYes
          }</label>
          <label class="radio"><input type="radio" name="helpful-translation" value="no">${
            placeholders.automaticTranslationFeedbackNo
          }</label>
        </div>
      </div>`,
    );
    // addToDocActions(languageToggleElement, block);
    block.appendChild(languageToggleElement);
    decorateIcons(block);

    const desktopAndMobileRadioFeedback = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-feedback input[type="radio"]',
    );
    [...desktopAndMobileRadioFeedback].forEach((radio) => {
      radio.addEventListener('click', async (e) => {
        assetInteractionModel(null, `helpful-translation - ${e.target.value}`);
      });
    });
  }
}

export default async function decorate(block) {
  if (isDocPage) {
    fetchLanguagePlaceholders().then((placeholders) => {
      decorateLanguageToggle(block, placeholders);
      const docActionMobileElement = document.querySelector('.doc-actions-mobile');
      [block, docActionMobileElement].forEach((container) => {
        const userActions = UserActions({
          container,
          id: ((document.querySelector('meta[name="id"]') || {}).content || '').trim(),
          link: window.location.href,
          bookmarkPath: new URL(window.location.href).pathname,
          bookmarkConfig: {
            label: placeholders?.userActionBookmarkLabel || 'Bookmark',
          },
          copyConfig: {
            label: placeholders?.userActionCopylinkLabel || 'Copy link',
            icons: ['copy-link'],
          },
        });
        userActions.decorate();
      });
    });
  }
}
