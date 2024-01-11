import ffetch from '../../scripts/ffetch.js';
import { fetchPlaceholders } from '../../scripts/lib-franklin.js';
import { getEDSLink, getLink } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // fallback text
  let browseText = 'Browse';

  // get placeholders
  try {
    const placeholders = await fetchPlaceholders();
    browseText = placeholders.browse;
  } catch {
    /* empty */
  }

  // get current page path
  const currentPath = getEDSLink(document.location.pathname);

  // split the path at browse root
  const browseRootName = 'browse';
  const pathParts = currentPath.split(browseRootName);
  // prefix language path
  const browseRoot = `${pathParts[0]}${browseRootName}`;

  // set the root breadcrumb
  const rootCrumbElem = document.createElement('a');
  rootCrumbElem.innerText = browseText;
  rootCrumbElem.setAttribute('href', getLink(browseRoot));
  block.append(rootCrumbElem);

  // get the browse index
  const index = await ffetch('/browse-index.json').all();

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
}
