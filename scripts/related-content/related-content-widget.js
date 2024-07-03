import { loadCSS } from '../lib-franklin.js';
import BrowseCardsDelegate from '../browse-card/browse-cards-delegate.js';
import { COVEO_SORT_OPTIONS } from '../browse-card/browse-cards-constants.js';
import { fetchLanguagePlaceholders, htmlToElement } from '../scripts.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/related-content/related-content-widget.css`);

const loc = ((placeholders) => (key) => {
  if(key in placeholders) {
    return placeholders[key];
  }

  return key;
})((async () => fetchLanguagePlaceholders())());

function contentIcon (type) {
  const bookmark = htmlToElement('<div class="related-content-icon"></div>');

  if(type) {
    const icon = htmlToElement(`<img src="${window.hlx.codeBasePath}/icons/${type}.svg" />`);

    bookmark.appendChild(icon);
  }

  return bookmark;
}

function relatedContentWidget() {
  // Select the right section
  const rightRail = document.querySelector('main > div.section.rail.rail-right > div.rail-content');

  if(rightRail) {
    // Wrapper element for Related Content
    const wrapper = htmlToElement('<div class="related-content-wrapper"></div>');

    // Create a header
    const header = htmlToElement(`<a class="related-content-toggle" aria-expanded="true"><h2>${loc('Related Content')}<h2></a>`);

    // TODO Create a placeholder

    const param = {
      sortCriteria: COVEO_SORT_OPTIONS.RELEVANCE.toUpperCase(),
      noOfResults: 5,
    };

    wrapper.appendChild(header);

    // Fetch the card/widget data
    BrowseCardsDelegate.fetchCardData(param)
      .then((data) => {
        const list = htmlToElement('<ul class="related-content"></ul>');
        const listItems = data.map(content => {
          if(content.title && content.viewLink) {
            const li = htmlToElement('<li></li>');
            const icon = contentIcon(content.contentType);
            const title = htmlToElement(`<a href="${content?.viewLink ?? '#'}">${content.title}</a>`);

            li.appendChild(icon);
            li.appendChild(title);

            return li;
          }

          return null;
        });

        list.append(...listItems);
        wrapper.appendChild(list);
        rightRail.appendChild(wrapper);

        // Add toggle functionality
        header.addEventListener('click',  (event) => {
          event.preventDefault();

          const isExpanded = header.getAttribute('aria-expanded') === 'true';
          header.setAttribute('aria-expanded', !isExpanded);
        });
      })
      .catch((err) => {
        /* eslint-disable-next-line no-console */
        console.log(err);
      });
  }
}

export default relatedContentWidget;