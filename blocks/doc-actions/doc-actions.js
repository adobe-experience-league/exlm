import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, isDocPage, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { pushBrowseCardClickEvent } from '../../scripts/analytics/lib-analytics.js';
import UserActions from '../../scripts/user-actions/user-actions.js';

async function decorateLanguageToggle(block, placeholders) {
  if (
    document.querySelector('meta[name="ht-degree"]') &&
    ((document.querySelector('meta[name="ht-degree"]') || {}).content || '').trim() !== '100%'
  ) {
    const languageToggleElement = createTag(
      'div',
      { class: 'doc-mt-toggle' },
      `<div class="doc-mt-notification">
      <span>${placeholders.automaticTranslation}</span>
      <div class="info-tooltip-container">
        <span class="icon icon-info"></span>
        <span class="action-tooltip">${
          placeholders.changeLanguageTooltip || 'Use the Language Selector to view the English version of this page.'
        }</span>
      </div>
      </div>`,
    );
    // addToDocActions(languageToggleElement, block);
    block.appendChild(languageToggleElement);
    decorateIcons(block);
  }
}

export default async function decorate(block) {
  if (isDocPage) {
    fetchLanguagePlaceholders().then((placeholders) => {
      decorateLanguageToggle(block, placeholders);

      const pageHeading = document.querySelector('main h1')?.textContent?.trim() || document.title;

      const docPageModel = {
        contentType: 'documentation',
        title: pageHeading,
        viewLink: window.location.href,
        product:
          document
            .querySelector('meta[name="solution"]')
            ?.content?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
      };

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
          bookmarkCallback: (linkType, position, action) => {
            const finalLinkType = linkType || pageHeading;
            const finalPosition = position || '';

            pushBrowseCardClickEvent(action, docPageModel, finalLinkType, finalPosition, 'docs');
          },
          copyCallback: (linkType, position) => {
            const finalLinkType = linkType || pageHeading;
            const finalPosition = position || '';

            pushBrowseCardClickEvent('copyLinkBrowseCard', docPageModel, finalLinkType, finalPosition, 'docs');
          },
        });
        userActions.decorate();
      });
    });
  }
}
