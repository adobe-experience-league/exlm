import ffetch from '../../scripts/ffetch.js';
import {fetchPlaceholders}  from '../../scripts/lib-franklin.js';

export default async function decorate(block) {

  let browseText = 'Browse';

  // get placeholders
  try {
    const placeholders = await fetchPlaceholders();
    browseText = placeholders.browse;
  } catch { /* empty */ }

  // split the path at browse root
  const browseRootName = 'browse';
  const pathParts = document.location.pathname.split(browseRootName);
  const browseRoot = `${pathParts[0]}${browseRootName}`;

  // set the root breadcrumb
  const rootCrumb = document.createElement("a");
  rootCrumb.innerText = browseText;
  rootCrumb.setAttribute('href',browseRoot);
  block.append(rootCrumb);

  // get the browse index
  const index = await ffetch('/browse-index.json').all();

  // build the remaining breadcrumbs
  pathParts[1].split('/').reduce((prevSubPath, nextPathElem) => {
    // create the next sub path
    const nextSubPath = `${prevSubPath}/${nextPathElem}`;
    // construct full crumb path
    const url = `${browseRoot}${nextSubPath}`;
    // has page been published and indexed ?
    const indexEntry = index.find((e) => e.path === url);  
    if (indexEntry) {
      let elem;
      // create crumb element, either 'a' or 'span'
      if (url !== document.location.pathname) {
        elem = document.createElement('a'); 
        elem.setAttribute('href', url); 
      } else {
        elem = document.createElement('span');
      }
      elem.innerText = indexEntry.title;  
      // append the a element
      block.append(elem);
    } 
    // go to next sub path
    return nextSubPath;
  });
}