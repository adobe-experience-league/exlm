import { loadBlocks, decorateIcons } from '../../scripts/lib-franklin.js';
import {
  createTag,
  isDocPage,
  htmlToElement,
  decorateMain,
  fetchLanguagePlaceholders,
  getConfig,
} from '../../scripts/scripts.js';
import { assetInteractionModel } from '../../scripts/analytics/lib-analytics.js';
import UserActions from '../../scripts/user-actions/user-actions.js';

const { automaticTranslationLink } = getConfig();

async function getTranslatedDocContent() {
  const docPath = `/en/${window.location.pathname.replace(/^(?:[^/]*\/){2}\s*/, '')}`;
  const docResponse = await fetch(`${docPath}.plain.html`);
  const translatedDoc = await docResponse.text();
  const docElement = htmlToElement(`<div>${translatedDoc}</div>`);
  const sections = [...docElement.children].slice(0, -2);
  const mainContent = document.createElement('div');
  mainContent.append(...sections);
  decorateMain(mainContent);
  await loadBlocks(mainContent);
  return mainContent;
}

async function toggleContent(isChecked, docContainer) {
  window.exl = window.exl || {};

  if (isChecked && !window.exl.translatedDocElement) {
    window.exl.translatedDocElement = await getTranslatedDocContent();
  }
  if (isChecked) {
    const docActionsMobile = docContainer.querySelector('.doc-actions-mobile');
    if (docActionsMobile) {
      const createdByEl = window.exl.translatedDocElement.querySelector('.article-metadata-createdby-wrapper');
      const articleMetaDataEl = window.exl.translatedDocElement.querySelector('.article-metadata-wrapper');
      if (articleMetaDataEl.nextSibling === createdByEl) {
        createdByEl.appendChild(docActionsMobile);
      } else if (articleMetaDataEl) {
        articleMetaDataEl.appendChild(docActionsMobile);
      }
    }
    docContainer.replaceWith(window.exl.translatedDocElement);
  } else {
    const dc = document.querySelector('main > div:first-child');
    const docActionsMobile = window.exl.translatedDocElement.querySelector('.doc-actions-mobile');
    if (docActionsMobile) {
      const createdByEl = docContainer.querySelector('.article-metadata-createdby-wrapper');
      const articleMetaDataEl = docContainer.querySelector('.article-metadata-wrapper');
      if (articleMetaDataEl.nextSibling === createdByEl) {
        createdByEl.appendChild(docActionsMobile);
      } else if (articleMetaDataEl) {
        articleMetaDataEl.appendChild(docActionsMobile);
      }
    }
    dc.replaceWith(docContainer);
  }
}

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
      <input type="checkbox"><a href="${automaticTranslationLink}" target="_blank"><span class="icon icon-info"></span></a>
      </div>
      <div class="doc-mt-feedback">
        <span class="prompt">${placeholders.automaticTranslationFeedback}</span>
        <div class="doc-mt-feedback-radio">
          <label class="radio"><input type="radio" name="helpful-translation" value="yes">${placeholders.automaticTranslationFeedbackYes}</label>
          <label class="radio"><input type="radio" name="helpful-translation" value="no">${placeholders.automaticTranslationFeedbackNo}</label>
        </div>
      </div>`,
    );
    // addToDocActions(languageToggleElement, block);
    block.appendChild(languageToggleElement);
    decorateIcons(block);
    const desktopAndMobileLangToggles = document.querySelectorAll(
      '.doc-mt-toggle .doc-mt-checkbox input[type="checkbox"]',
    );
    const docContainer = document.querySelector('main > div:first-child');

    [...desktopAndMobileLangToggles].forEach((langToggle) => {
      if (!langToggle.parentElement.classList.contains('listener')) {
        langToggle.addEventListener('change', async (e) => {
          const { checked } = e.target;
          await toggleContent(checked, docContainer);
          assetInteractionModel(null, `automatic translation ${e.target.checked ? 'off' : 'on'}`);
        });
        langToggle.parentElement.classList.add('listener');
      }
    });

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
