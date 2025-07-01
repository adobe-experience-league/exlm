import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, isDocPage, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';
import UserActions from '../../scripts/user-actions/user-actions.js';

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
      <div class="info-tooltip-container">
        <span class="icon icon-info"></span>
        <span class="action-tooltip">${
          placeholders.changeLanguageTooltip || 'Use the Language Selector to view the English version of this page.'
        }</span>
      </div>
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
