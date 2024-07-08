import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import { decorateIcons, loadCSS } from '../lib-franklin.js';
import { decorateBookmark, bookmarkHandler } from './bookmark.js';
import { copyHandler, decorateCopyLink } from './copy-link.js';

await loadCSS(`${window.hlx.codeBasePath}/scripts/user-actions/user-actions.css`);

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/**
 * UserActions component to handle user action buttons like bookmark and copy link.
 *
 * @param {Object} config - Configuration object.
 * @param {HTMLElement} config.container - The container element to which user actions will be appended.
 * @param {string} config.id - Page id.
 * @param {string} config.link - The link to be copied.
 * @param {Object} config.bookmarkConfig - Bookmark configuration for label and icons.
 * @param {Object} config.copyConfig - Copy configuration for label and icons.
 * @param {Function} config.callback - Callback function to be called on button click.
 *
 * @returns {Object} - Object with a decorate method to render user actions.
 */
const UserActions = (config) => {
  const { container, id, link, bookmarkConfig, copyConfig, callback } = config;

  /**
   * Renders an icon as an HTML string.
   *
   * @param {string} icon - Icon name.
   * @returns {string} - HTML string for the icon.
   */
  const renderIcon = (icon) => `<span class="icon icon-${icon}"></span>`;

  /**
   * Adds an action button to the user actions.
   *
   * @param {Object} param - Action parameters.
   * @param {string} param.name - Action name.
   * @param {Array<string>} param.icons - List of icon names.
   * @param {Array<string>} param.label - Display label.
   * @param {Function} param.onButtonReady - Callback function called when button is ready.
   * @param {Function} param.onButtonClick - Callback function called when button is clicked.
   *
   * @returns {HTMLElement} - The action button element.
   */
  const addAction = ({ name, icons, label, onButtonReady, onButtonClick }) => {
    const iconSpans = icons.map(renderIcon).join('');
    const labelElement = label ? `<label>${label}</label>` : '';
    const button = htmlToElement(`<button class="${name}">${iconSpans} ${labelElement}</button>`);
    decorateIcons(button);
    if (onButtonReady) {
      onButtonReady(button);
    }
    if (onButtonClick) {
      button.addEventListener('click', (event) => {
        if (event.target === 'button' || event.target.closest('button')) {
          onButtonClick(button);
          if (callback) {
            callback();
          }
        }
      });
    }
    return button;
  };

  /**
   * Decorates the container with user action buttons.
   */
  const decorate = async () => {
    const actions = htmlToElement(`<div class="user-actions"></div>`);
    const actionDefinitions = [];

    if (bookmarkConfig !== false) {
      actionDefinitions.push({
        name: 'bookmark',
        icons: bookmarkConfig?.icons || ['bookmark', 'bookmark-active'],
        label: bookmarkConfig?.label,
        onButtonReady: (element) =>
          decorateBookmark({
            element,
            id,
            tooltips: {
              bookmarkTooltip: placeholders?.userActionBookmarkTooltip || 'Bookmark page',
              removeBookmarkTooltip: placeholders?.userActionRemoveBookmarkTooltip || 'Remove Bookmark',
              signInToBookmarkTooltip: placeholders?.userActionSigninBookmarkTooltip || 'Sign-in to bookmark',
            },
          }),
        onButtonClick: (element) =>
          bookmarkHandler({
            element,
            id,
            tooltips: {
              bookmarkToastText:
                placeholders?.userActionBookmarkToastText || 'Success! This is bookmarked to your profile.',
              removeBookmarkToastText:
                placeholders?.userActionRemoveBookmarkToastText ||
                'Success! This is no longer bookmarked to your profile.',
            },
          }),
      });
    }

    if (copyConfig !== false) {
      actionDefinitions.push({
        name: 'copy-link',
        icons: copyConfig?.icons || ['copy'],
        label: copyConfig?.label,
        onButtonReady: (element) =>
          decorateCopyLink({
            element,
            tooltip: {
              copyTooltip: placeholders?.userActionCopylinkTooltip || 'Copy link URL',
            },
          }),
        onButtonClick: () =>
          copyHandler({
            id,
            link,
            tooltip: {
              copyToastText: placeholders?.userActionCopylinkToastText || 'URL copied',
            },
          }),
      });
    }

    if (actionDefinitions.length) {
      actionDefinitions.forEach((def) => {
        actions.append(addAction(def));
      });
      container.appendChild(actions);
    }
  };

  return {
    decorate,
  };
};

export default UserActions;
