import ffetch from '../../scripts/ffetch.js';
import {
  getEDSLink,
  getLink,
  getPathDetails,
  createPlaceholderSpan,
  fetchLanguagePlaceholders,
  htmlToElement,
} from '../../scripts/scripts.js';
import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';

function appendMachineTranslatedNotice(block, placeholders) {
  const { lang } = getPathDetails();
  const isMachineTranslated = getMetadata('translation-mechanism')?.trim().toUpperCase() === 'MT';
  if (lang === 'en' || !isMachineTranslated) return;

  const notice = htmlToElement(`
    <div class="browse-breadcrumb-ai-translated">
      <span>${placeholders?.automaticTranslation || 'Automatically translated'}</span>
      <div class="browse-breadcrumb-ai-translated-tooltip-container" tabindex="0">
        <span class="icon icon-info"></span>
        <span class="browse-breadcrumb-ai-translated-tooltip" role="tooltip">${
          placeholders?.changeLanguageTooltip || 'Use the Language Selector to view the English version of this page.'
        }</span>
      </div>
    </div>
  `);
  decorateIcons(notice);
  block.append(notice);
}

export default async function decorate(block) {
  // to avoid dublication when editing
  block.textContent = '';

  // get current page path
  const currentPath = getEDSLink(document.location.pathname);

  // split the path at browse root
  const browseRootName = 'browse';
  const pathParts = currentPath.split(browseRootName);
  // prefix language path
  const browseRoot = `${pathParts[0]}${browseRootName}`;

  // set the root breadcrumb
  const rootCrumbElem = document.createElement('a');
  rootCrumbElem.appendChild(createPlaceholderSpan('browse', 'Browse'));
  rootCrumbElem.setAttribute('href', getLink(browseRoot));
  block.append(rootCrumbElem);

  // get the browse index
  ffetch(`/${getPathDetails().lang}/browse-index.json`)
    .all()
    .then((index) => {
      // build the remaining breadcrumbs
      pathParts[1].split('/').reduce((prevSubPath, nextPathElem) => {
        // create the next crumble sub path
        const nextCrumbSubPath = `${prevSubPath}/${nextPathElem}`;
        // construct full crumb path
        const fullCrumbPath = `${browseRoot}${nextCrumbSubPath}`;
        // has page been published and indexed ?
        const indexEntry = index.find((e) => e.path === fullCrumbPath);
        if (indexEntry) {
          let elem;
          // create crumb element, either 'a' or 'span'
          if (fullCrumbPath !== currentPath) {
            elem = document.createElement('a');
            elem.setAttribute('href', getLink(fullCrumbPath));
          } else {
            elem = document.createElement('span');
          }
          elem.innerText = indexEntry.title;
          // append the a element
          block.append(elem);
        }
        // go to next sub path
        return nextCrumbSubPath;
      });
    })
    .finally(() => {
      fetchLanguagePlaceholders()
        .then((placeholders) => appendMachineTranslatedNotice(block, placeholders))
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Error fetching placeholders:', err);
        });
    });
}
