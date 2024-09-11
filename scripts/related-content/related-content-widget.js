import { loadCSS } from '../lib-franklin.js';
import BrowseCardsDelegate from '../browse-card/browse-cards-delegate.js';
import { COVEO_SORT_OPTIONS } from '../browse-card/browse-cards-constants.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../scripts.js';
import listPlaceholder from '../placeholders/list-placeholder.js';
import SUPPORTED_TYPES from './supported-types.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/related-content/related-content-widget.css`);

const MAX_RESULTS = 5;

const loc = (
  (placeholders = {}) =>
  (key) => {
    if (key in placeholders) {
      return placeholders[key];
    }

    return key;
  }
)((async () => fetchLanguagePlaceholders())());

function contentIcon(type) {
  const bookmark = htmlToElement('<div class="related-content-icon"></div>');

  if (type in SUPPORTED_TYPES) {
    const info = SUPPORTED_TYPES[type];

    bookmark.appendChild(
      htmlToElement(`
      <div class="related-content-tooltip">
        <div class="tooltip-label-wrapper"> 
          <span class="tooltip-label">${loc(info.label)}</span>
        </div>
        <img src="${window.hlx.codeBasePath}/icons/${info.icon}" />
      </div>
    `),
    );
  }

  return bookmark;
}

function relatedContentWidget() {
  try {
    // Select the right section
    const rightRail = document.querySelector(
      'main > div.section.rail.rail-right > div.rail-content > div.mini-toc-wrapper',
    );

    if (rightRail) {
      // Wrapper element for Related Content
      const wrapper = htmlToElement('<div class="related-content-wrapper"></div>');

      // Create a header
      const header = htmlToElement(
        `<div class="related-content-toggle" aria-expanded="true"><h2>${loc('Related Content')}<h2></div>`,
      );

      rightRail.appendChild(wrapper);

      // Create a placeholder
      const loader = listPlaceholder(5);

      const param = {
        contentType: Object.keys(SUPPORTED_TYPES),
        sortCriteria: COVEO_SORT_OPTIONS.RELEVANCE.toUpperCase(),
        noOfResults: MAX_RESULTS,
      };

      wrapper.appendChild(loader);

      // Fetch the card/widget data
      BrowseCardsDelegate.fetchCardData(param)
        .then((data) => {
          wrapper.removeChild(loader);

          if (data.length > 0) {
            data.length = MAX_RESULTS;

            const list = htmlToElement('<ul class="related-content"></ul>');
            const listItems = data.map((content) => {
              if (content.title && content.viewLink) {
                const li = htmlToElement('<li></li>');
                const icon = contentIcon(content.contentType);
                const title = htmlToElement(`<a href="${content?.viewLink ?? '#'}">${content.title}</a>`);

                li.appendChild(icon);
                li.appendChild(title);

                return li;
              }

              return null;
            });

            wrapper.appendChild(header);
            list.append(...listItems);
            wrapper.appendChild(list);

            // Add toggle functionality
            header.addEventListener('click', (event) => {
              event.preventDefault();

              const isExpanded = header.getAttribute('aria-expanded') === 'true';
              header.setAttribute('aria-expanded', !isExpanded);
            });
          }
        })
        .catch((err) => {
          wrapper.removeChild(loader);

          /* eslint-disable-next-line no-console */
          console.log(err);
        });
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err);
  }
}

export default relatedContentWidget;
