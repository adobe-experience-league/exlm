import ffetch from '../../scripts/ffetch.js';
import {fetchPlaceholders}  from '../../scripts/lib-franklin.js';

export default async function decorate(block) {

  let browseText = 'Browse';

  // get placeholders
  try {
    const placeholders = await fetchPlaceholders();
    browseText = placeholders.browse;
  } catch { /* empty */ }

  let path = document.location.pathname;
  // are we on author
  const suffix = path.endsWith('.html') ? '.html': '';
  // cut of suffix if any
  path = suffix ? path.substring(0,path.indexOf(suffix)): path;
  // split the path at browse root
  const browseRootName = 'browse';
  const pathParts = path.split(browseRootName);
  // the language and instance dependent root path
  const browseRoot = `${pathParts[0]}${browseRootName}`;

  // set the root breadcrumb
  const rootCrumb = document.createElement("a");
  rootCrumb.innerText = browseText;
  rootCrumb.setAttribute('href',`${browseRoot}${suffix}`);
  block.append(rootCrumb);

  // get the browse index
  const index = await ffetch('/browse-index.json').all();

  // build the remaining breadcrumbs
  pathParts[1].split('/').reduce((prevSubPath, nextPathElem) => {
    // create the next sub path
    const nextSubPath = `${prevSubPath}/${nextPathElem}`;
    // construct full crumb path
    let url = `${browseRoot}${nextSubPath}`;
    // has page been published and indexed ?
    const indexEntry = index.find((e) => e.path === url);  
    if (indexEntry) {
      let elem;
      url += suffix;
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